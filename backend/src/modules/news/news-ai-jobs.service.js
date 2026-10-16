'use strict';

const { createHash, randomUUID } = require('node:crypto');
const { query, getPool } = require('../../core/database/connection');
const { AppError } = require('../../shared/exceptions/app-error');
const { SCHEMA_VERSION } = require('../ai/news-ai.contract');
const { createOpenAiProvider } = require('../ai/openai-responses.provider');
const context = require('./news-ai-context.service');
const aiConfig = require('./news-ai-config.service');
const articles = require('./news-articles.service');

const AI_ACTOR = { id: 'ai-iflux', name: 'AI iFlux', tier_label: 'AI' };

const PROMPT_VERSION = 'news-editorial-v2';
const dayKeyFmt = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' });
const hash = (v) => createHash('sha256').update(typeof v === 'string' ? v : JSON.stringify(v)).digest('hex');
let runtimeConfig = { NEWS_AI_ENABLED:false };
function configureNewsAi(config) { runtimeConfig = config; }

/* Ngân sách/ngày (Owner 2026-10-16): đo bằng TOKEN THÔ, không quy đổi USD/VND — OpenAI không
 * có API trả giá, không bịa số. Admin tự đặt daily_token_budget, 0 = không giới hạn. */
async function getTodayTokenUsage() {
  // Cửa sổ SQL rộng rãi (48h) chỉ để giảm số dòng tải về — mốc "hôm nay" THẬT xác định
  // chính xác bằng dayKeyFmt (giờ VN) ở JS dưới, không dựa vào biên UTC dễ sai lệch ±1 ngày.
  const sinceUtc = new Date(Date.now() - 48 * 3600000).toISOString();
  const rows = (await query(`SELECT calls,created_at FROM news_ai_jobs WHERE created_at >= $1`, [sinceUtc])).rows;
  const todayKey = dayKeyFmt.format(new Date());
  let inTok = 0, outTok = 0;
  rows.forEach((row) => {
    if (!row.created_at || dayKeyFmt.format(new Date(row.created_at)) !== todayKey) return;
    (row.calls || []).forEach((call) => {
      const u = call.usage || {};
      inTok += Number(u.input_tokens || u.prompt_tokens || 0) || 0;
      outTok += Number(u.output_tokens || u.completion_tokens || 0) || 0;
    });
  });
  return inTok + outTok;
}

async function enqueueSource(postId, config = runtimeConfig) {
  if (!config.NEWS_AI_ENABLED) return null;
  const aiCfg = await aiConfig.getConfig();
  if (!aiCfg.enabled) return null;
  const row = (await query("SELECT id,status,payload FROM news_posts WHERE id=$1 AND content_type='article'",[postId])).rows[0];
  if (!row || !['published_rss','pending'].includes(row.status) || !(row.payload.source_id || row.payload.source?.id)) return null;
  const source = context.sourceSnapshot({ ...row.payload,id:row.id });
  const prompt = (await query("SELECT body FROM ai_prompts WHERE code=$1 AND status='active'",[PROMPT_VERSION])).rows[0];
  if (!prompt || !prompt.body.trim()) throw AppError.badRequest('AI_PROMPT_NOT_ACTIVE','Prompt news-editorial-v2 chưa được đăng ký/kích hoạt');
  const model = aiCfg.model || config.NEWS_AI_MODEL || 'gpt-5.4';
  const result = await query(`INSERT INTO news_ai_jobs(source_post_id,input_hash,prompt_hash,prompt_version,prompt_body,schema_version,model,source_snapshot)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8::jsonb)
    ON CONFLICT(source_post_id,input_hash,prompt_hash,schema_version,model) DO UPDATE SET source_post_id=EXCLUDED.source_post_id
    RETURNING id,status`,[postId,hash(source),hash(prompt.body),PROMPT_VERSION,prompt.body,SCHEMA_VERSION,model,JSON.stringify(source)]);
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
  return (await query(`SELECT j.id,j.source_post_id,j.model,j.status,j.attempts,j.last_error,j.review_reasons,j.created_at,j.updated_at,
    p.payload->>'title' AS post_title, p.payload->>'slug' AS post_slug
    FROM news_ai_jobs j LEFT JOIN news_posts p ON p.id = j.source_post_id
    ORDER BY j.created_at DESC,j.id DESC LIMIT 100`)).rows;
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
  const aiCfg = await aiConfig.getConfig();
  if (!aiCfg.enabled) return { status:'disabled' };
  if (aiCfg.daily_token_budget > 0 && (await getTodayTokenUsage()) >= aiCfg.daily_token_budget) {
    return { status:'budget_exceeded' };
  }
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
    preview.article_input.category_id = job.source_snapshot.category_id;
    preview.article_input.source_name = job.source_snapshot.source_name;
    preview.article_input.external_url = job.source_snapshot.url;
    preview.comparison_spec = composeContext.comparison ? checked.data.comparison : null;
    preview.event_proposals = checked.data.events;
    preview.compose_context = composeContext;

    // Auto-publish (Owner 2026-10-16): chỉ khi Admin bật cấu hình VÀ output sạch mọi kiểm tra
    // thật (preview.review_reasons rỗng) — nếu có lỗi nội dung thật (fact/entity/event/ảnh
    // không hợp lệ...) vẫn luôn rơi về needs_review dù đã bật auto-publish.
    if (aiCfg.auto_publish && preview.review_reasons.length === 0) {
      try {
        const published = await articles.updateArticle(
          job.source_post_id,
          Object.assign({}, preview.article_input, { status: 'published' }),
          AI_ACTOR
        );
        await fence("UPDATE news_ai_jobs SET status='published',result=$3::jsonb,review_reasons='[]'::jsonb,calls=$4::jsonb,lease_until=NULL,last_error=NULL,updated_at=NOW()",
          [JSON.stringify(preview),JSON.stringify(calls)]);
        return { id:job.id,status:'published',post_id:published.id };
      } catch (publishErr) {
        // Publish thật lỗi (vd slug/category/so sánh) -> rơi về review, không để job treo im lặng.
        const failReasons = [...preview.review_reasons,'AUTO_PUBLISH_FAILED:' + (publishErr && (publishErr.code || publishErr.message) || 'unknown')];
        await fence("UPDATE news_ai_jobs SET status='needs_review',result=$3::jsonb,review_reasons=$4::jsonb,calls=$5::jsonb,lease_until=NULL,last_error=NULL,updated_at=NOW()",
          [JSON.stringify(preview),JSON.stringify(failReasons),JSON.stringify(calls)]);
        return { id:job.id,status:'needs_review' };
      }
    }

    // Không auto-publish (cấu hình tắt, hoặc có review_reasons thật) -> luôn cần người duyệt.
    const reasons = [...preview.review_reasons,'SEMANTIC_REVIEW_REQUIRED','MEDIA_RIGHTS_REVIEW_REQUIRED'];
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
  if (!(await aiConfig.getConfig()).enabled) return { status:'disabled' };
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

async function getStats(days = 30) {
  const rows = (await query(`SELECT status,model,calls,created_at FROM news_ai_jobs`)).rows;
  const byStatus = {};
  const byModel = {};
  const byDay = {};
  let inputTokens = 0, outputTokens = 0, callCount = 0;
  const windowStart = Date.now() - Math.max(1, days) * 86400000;
  rows.forEach((row) => {
    byStatus[row.status] = (byStatus[row.status] || 0) + 1;
    const modelKey = row.model || 'unknown';
    const m = byModel[modelKey] || (byModel[modelKey] = { jobs: 0, input_tokens: 0, output_tokens: 0 });
    m.jobs += 1;
    const createdAt = row.created_at ? new Date(row.created_at) : null;
    const inWindow = createdAt && createdAt.getTime() >= windowStart;
    const dayKey = createdAt ? dayKeyFmt.format(createdAt) : null;
    const d = (inWindow && dayKey) ? (byDay[dayKey] || (byDay[dayKey] = { date: dayKey, jobs: 0, published: 0, input_tokens: 0, output_tokens: 0 })) : null;
    if (d) { d.jobs += 1; if (row.status === 'published') d.published += 1; }
    (row.calls || []).forEach((call) => {
      const u = call.usage || {};
      const inTok = Number(u.input_tokens || u.prompt_tokens || 0) || 0;
      const outTok = Number(u.output_tokens || u.completion_tokens || 0) || 0;
      inputTokens += inTok; outputTokens += outTok; callCount += 1;
      m.input_tokens += inTok; m.output_tokens += outTok;
      if (d) { d.input_tokens += inTok; d.output_tokens += outTok; }
    });
  });
  const cfg = await aiConfig.getConfig();
  const daily = Object.values(byDay).sort((a, b) => a.date < b.date ? -1 : 1);
  return {
    total_jobs: rows.length,
    by_status: byStatus,
    by_model: byModel,
    articles_published: byStatus.published || 0,
    total_calls: callCount,
    total_input_tokens: inputTokens,
    total_output_tokens: outputTokens,
    total_tokens: inputTokens + outputTokens,
    ai_enabled: !!cfg.enabled,
    daily_token_budget: cfg.daily_token_budget || 0,
    daily_window_days: days,
    daily
  };
}

module.exports = { configureNewsAi,enqueueSource,getJob,listJobs,retryJob,processOne,runNewsAiWorker,getStats };
