'use strict';

const { createHash, randomUUID } = require('node:crypto');
const { query, getPool } = require('../../core/database/connection');
const { AppError } = require('../../shared/exceptions/app-error');
const { SCHEMA_VERSION } = require('../ai/news-ai.contract');
const { createOpenAiProvider } = require('../ai/openai-responses.provider');
const context = require('./news-ai-context.service');

const PROMPT_VERSION = 'news-editorial-v1';
const hash = (v) => createHash('sha256').update(typeof v === 'string' ? v : JSON.stringify(v)).digest('hex');
let runtimeConfig = { NEWS_AI_ENABLED:false };
function configureNewsAi(config) { runtimeConfig = config; }

async function enqueueSource(postId, config = runtimeConfig) {
  if (!config.NEWS_AI_ENABLED) return null;
  const row = (await query("SELECT id,status,payload FROM news_posts WHERE id=$1 AND content_type='article'",[postId])).rows[0];
  if (!row || !['published_rss','pending'].includes(row.status) || !(row.payload.source_id || row.payload.source?.id)) return null;
  const source = context.sourceSnapshot({ ...row.payload,id:row.id });
  const prompt = (await query("SELECT body FROM ai_prompts WHERE code=$1 AND status='active'",[PROMPT_VERSION])).rows[0];
  if (!prompt || !prompt.body.trim()) throw AppError.badRequest('AI_PROMPT_NOT_ACTIVE','Cần đăng ký và bật prompt news-editorial-v1');
  const result = await query(`INSERT INTO news_ai_jobs(source_post_id,input_hash,prompt_hash,prompt_version,prompt_body,schema_version,model,source_snapshot)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8::jsonb)
    ON CONFLICT(source_post_id,input_hash,prompt_hash,schema_version,model) DO UPDATE SET source_post_id=EXCLUDED.source_post_id
    RETURNING id,status`,[postId,hash(source),hash(prompt.body),PROMPT_VERSION,prompt.body,SCHEMA_VERSION,config.NEWS_AI_MODEL || 'gpt-5.4',JSON.stringify(source)]);
  return result.rows[0];
}

async function getJob(id) {
  const row = (await query(`SELECT id,source_post_id,input_hash,prompt_hash,prompt_version,schema_version,model,
    context,extraction,result,review_reasons,calls,status,attempts,next_attempt_at,last_error,created_at,updated_at
    FROM news_ai_jobs WHERE id=$1`,[id])).rows[0];
  if (!row) throw AppError.notFound('Không tìm thấy job AI');
  return row;
}
async function listJobs() {
  return (await query(`SELECT id,source_post_id,status,attempts,last_error,review_reasons,created_at,updated_at
    FROM news_ai_jobs ORDER BY created_at DESC,id DESC LIMIT 100`)).rows;
}
async function retryJob(id) {
  // Chỉ retry lỗi kỹ thuật. Review cần phiên nguồn/prompt mới hoặc xử lý biên tập.
  const res = await query(`UPDATE news_ai_jobs SET status='queued',attempts=0,last_error=NULL,next_attempt_at=NOW(),updated_at=NOW()
    WHERE id=$1 AND status='failed' RETURNING id,status`,[id]);
  if (!res.rows[0]) throw AppError.badRequest('AI_RETRY_STATE','Chỉ xử lý lại job failed');
  return res.rows[0];
}

async function claimJob(config, token) {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    // Serialize quota reservation across worker processes; no network call in this transaction.
    await client.query('SELECT pg_advisory_xact_lock(402731)');
    const job = (await client.query(`WITH picked AS (
      SELECT id FROM news_ai_jobs WHERE attempts < $1 AND
        ((status='queued' AND next_attempt_at<=NOW()) OR (status='running' AND lease_until<NOW()))
        AND (started_at >= date_trunc('day',NOW() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC' OR
          (SELECT COUNT(*) FROM news_ai_jobs WHERE started_at >= date_trunc('day',NOW() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC') < $3)
      ORDER BY created_at,id FOR UPDATE SKIP LOCKED LIMIT 1
    ) UPDATE news_ai_jobs j SET status='running',attempts=attempts+1,lease_token=$2,
      started_at=NOW(),lease_until=NOW()+INTERVAL '15 minutes',updated_at=NOW()
      FROM picked WHERE j.id=picked.id RETURNING j.*`,[config.NEWS_AI_MAX_ATTEMPTS || 3,token,config.NEWS_AI_MAX_JOBS_PER_DAY || 10])).rows[0];
    await client.query('COMMIT');
    return job;
  } catch (err) { await client.query('ROLLBACK'); throw err; }
  finally { client.release(); }
}

async function processOne(config = runtimeConfig, provider) {
  if (!config.NEWS_AI_ENABLED || (!provider && !config.OPENAI_API_KEY)) return { status:'disabled' };
  const maxAttempts = config.NEWS_AI_MAX_ATTEMPTS || 3;
  const token = randomUUID();
  // Lease dài hơn timeout tối đa hai lần gọi; mọi ghi sau gọi API đều có fencing token.
  const job = await claimJob(config,token);
  if (!job) {
    await query(`UPDATE news_ai_jobs SET status='failed',last_error='AI_LEASE_EXHAUSTED',updated_at=NOW()
      WHERE status='running' AND lease_until<NOW() AND attempts >= $1`,[maxAttempts]);
    return { status:'idle' };
  }
  const fence = async (sql, values) => {
    const result = await query(sql + ' WHERE id=$1 AND lease_token=$2 AND status=\'running\' RETURNING id', [job.id,token,...values]);
    if (!result.rows.length) throw Object.assign(new Error('AI_LEASE_LOST'),{code:'AI_LEASE_LOST'});
  };
  const calls = job.calls || [];
  const model = provider || createOpenAiProvider({ ...config,NEWS_AI_MODEL:job.model });
  async function run(stage,input) {
    const start = Date.now();
    const result = await model.run(stage,input,job.prompt_body);
    calls.push({ stage,response_id:result.response_id,model:result.model,usage:result.usage,
      duration_ms:Date.now()-start,cost_usd:null,cost_note:'Chưa cấu hình bảng giá; không ước lượng chi phí thành 0' });
    return result.value;
  }
  try {
    const ctx = job.context || await context.buildExtractContext(job.source_snapshot);
    await fence('UPDATE news_ai_jobs SET context=$3::jsonb,updated_at=NOW()',[JSON.stringify(ctx)]);
    const extraction = job.extraction || await run('extract',ctx);
    await fence('UPDATE news_ai_jobs SET extraction=$3::jsonb,calls=$4::jsonb,updated_at=NOW()',[JSON.stringify(extraction),JSON.stringify(calls)]);
    const checked = context.checkExtraction(extraction,ctx);
    if (checked.reasons.length) {
      await fence("UPDATE news_ai_jobs SET status='needs_review',review_reasons=$3::jsonb,lease_until=NULL,updated_at=NOW()",[JSON.stringify(checked.reasons)]);
      return { id:job.id,status:'needs_review' };
    }
    const composeContext = await context.buildComposeContext(checked,ctx);
    const output = await run('compose',composeContext);
    const preview = context.composePreview(output,composeContext);
    // Luôn review cho đến khi semantic gate + event matching + publish transaction được nghiệm thu.
    const reasons = [...preview.review_reasons,'SEMANTIC_REVIEW_REQUIRED','MEDIA_RIGHTS_REVIEW_REQUIRED'];
    preview.article_input.category_id = job.source_snapshot.category_id;
    preview.comparison_spec = composeContext.comparison ? checked.data.comparison : null;
    preview.event_proposals = checked.data.events;
    preview.compose_context = composeContext;
    await fence("UPDATE news_ai_jobs SET status='needs_review',result=$3::jsonb,review_reasons=$4::jsonb,calls=$5::jsonb,lease_until=NULL,last_error=NULL,updated_at=NOW()",
      [JSON.stringify(preview),JSON.stringify(reasons),JSON.stringify(calls)]);
    return { id:job.id,status:'needs_review' };
  } catch (err) {
    if (err.code==='AI_LEASE_LOST') return { id:job.id,status:'lease_lost' };
    const safeCode = /^AI_[A-Z0-9_]+$/.test(err.code || '') ? err.code : 'AI_VALIDATION_OR_CONTEXT_ERROR';
    const retry = err.retryable===true && job.attempts<maxAttempts;
    await fence(`UPDATE news_ai_jobs SET status=$3,last_error=$4,calls=$5::jsonb,lease_until=NULL,
      next_attempt_at=NOW()+($6 * INTERVAL '1 second'),updated_at=NOW()`,[retry?'queued':'failed',safeCode,JSON.stringify(calls),Math.min(900,30*2**(job.attempts-1))]);
    return { id:job.id,status:retry?'queued':'failed',error:safeCode };
  }
}

async function runNewsAiWorker(config = runtimeConfig) {
  if (!config.NEWS_AI_ENABLED || !config.OPENAI_API_KEY) return { status:'disabled' };
  // Recovery cho nguồn đã lưu nhưng enqueue lỗi hoặc server restart. Hash phiên nguồn chống trùng.
  const sources = (await query(`SELECT p.id FROM news_posts p WHERE p.content_type='article'
    AND p.status IN ('published_rss','pending') AND (p.payload ? 'source_id' OR p.payload->'source' ? 'id')
    AND NOT EXISTS(SELECT 1 FROM news_ai_jobs j WHERE j.source_post_id=p.id)
    ORDER BY p.created_at,p.id LIMIT $1`,[config.NEWS_AI_BATCH_SIZE || 2])).rows;
  for (const source of sources) {
    try { await enqueueSource(source.id,config); } catch (_) { /* Giữ nguyên nguồn; API Admin cho biết cấu hình/context lỗi. */ }
  }
  const results = [];
  for (let i=0;i<(config.NEWS_AI_BATCH_SIZE || 2);i++) results.push(await processOne(config));
  return { status:'processed',results };
}

module.exports = { configureNewsAi,enqueueSource,getJob,listJobs,retryJob,processOne,runNewsAiWorker };
