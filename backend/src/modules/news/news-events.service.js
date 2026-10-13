'use strict';

const { createHash } = require('node:crypto');
const { z } = require('zod');
const { query, getPool } = require('../../core/database/connection');
const { AppError } = require('../../shared/exceptions/app-error');

const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((s) => {
  const d = new Date(s);
  return Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === s;
}, 'Ngày không hợp lệ').nullable().optional();
const evidenceSchema = z.object({
  url: z.string().url().refine((s) => /^https?:\/\//i.test(s), 'Nguồn phải dùng HTTP(S)'),
  label: z.string().trim().min(1).max(160),
  quote: z.string().trim().min(1).max(4000)
}).strict();
const milestoneSchema = z.object({
  title: z.string().trim().min(1).max(240),
  summary: z.string().trim().min(1).max(6000),
  status: z.enum(['announced', 'planned', 'in_progress', 'reported_result', 'completed', 'cancelled', 'corrected']),
  announced_on: day,
  effective_on: day,
  evidence: z.array(evidenceSchema).min(1).max(20),
  metrics: z.array(z.object({
    subject: z.string().min(1), indicator: z.string().min(1), value: z.number().finite().nullable(),
    unit: z.string().min(1), period: z.string().nullable(), basis: z.enum(['actual', 'planned'])
  }).strict()).max(30).default([])
}).strict();
const caseSchema = z.object({
  request_id: z.string().uuid(),
  title: z.string().trim().min(1).max(240),
  event_group: z.number().int().min(1).max(8),
  subject_name: z.string().trim().min(1).max(240),
  tickers: z.array(z.string().trim().toUpperCase().min(1).max(10)).max(20).default([]),
  story_id: z.string().uuid().nullable().optional(),
  milestone: milestoneSchema
}).strict();

async function validateArticleLinks(article) {
  if (article.story_id) {
    const story = await query(`SELECT s.id FROM stories s JOIN topics t ON t.id = s.topic_id
      WHERE s.id = $1 AND s.status = 'active' AND t.confirmed_at IS NOT NULL`, [article.story_id]);
    if (!story.rows.length) throw AppError.badRequest('ARTICLE_STORY_UNCONFIRMED', 'Chỉ gắn Câu chuyện từ Chủ đề đã hình thành');
  }
  const ids = article.event_case_ids || [];
  if (ids.length) {
    const cases = await query('SELECT id, story_id FROM news_event_cases WHERE id = ANY($1::uuid[])', [ids]);
    if (cases.rows.length !== ids.length) throw AppError.badRequest('ARTICLE_EVENT_NOT_FOUND', 'Hồ sơ sự kiện không tồn tại');
    if (cases.rows.some((c) => c.story_id && c.story_id !== article.story_id)) {
      throw AppError.badRequest('ARTICLE_EVENT_STORY_MISMATCH', 'Hồ sơ sự kiện thuộc Câu chuyện khác');
    }
  }
}

async function listCases(storyId) {
  return (await query(`SELECT id, title, event_group, subject_name, tickers, story_id FROM news_event_cases
    WHERE ($1::uuid IS NULL OR story_id = $1) ORDER BY created_at DESC, id DESC LIMIT 100`, [storyId || null])).rows;
}

async function insertMilestone(client, caseId, input, actor) {
  const key = createHash('sha256').update(JSON.stringify([input.title, input.status, input.announced_on || null, input.effective_on || null])).digest('hex');
  const res = await client.query(`INSERT INTO news_event_milestones
    (case_id, idempotency_key, title, summary, status, announced_on, effective_on, evidence, metrics, reviewed_by)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9::jsonb,$10)
    ON CONFLICT (case_id, idempotency_key) DO UPDATE SET evidence =
      (SELECT jsonb_agg(DISTINCT e) FROM jsonb_array_elements(news_event_milestones.evidence || EXCLUDED.evidence) e)
    WHERE news_event_milestones.summary = EXCLUDED.summary AND news_event_milestones.metrics = EXCLUDED.metrics
    RETURNING id`, [caseId, key, input.title, input.summary, input.status, input.announced_on || null,
    input.effective_on || null, JSON.stringify(input.evidence), JSON.stringify(input.metrics), String(actor.id || actor.admin_id || actor.email)]);
  if (!res.rows[0]) throw AppError.badRequest('EVENT_FACT_CONFLICT', 'Mốc đã có dữ kiện khác; cần kiểm tra trước khi cập nhật');
  return res.rows[0];
}

async function createCase(input, actor) {
  const data = caseSchema.parse(input);
  if (!actor || !(actor.id || actor.admin_id || actor.email)) throw AppError.unauthorized('Cần Admin duyệt dữ kiện');
  await validateArticleLinks({ story_id: data.story_id });
  const tickers = [...new Set(data.tickers)];
  if (tickers.length) {
    const rows = await query('SELECT ticker FROM stocks WHERE ticker = ANY($1::text[])', [tickers]);
    if (rows.rows.length !== tickers.length) throw AppError.badRequest('EVENT_TICKER_INVALID', 'Mã liên quan không có trong danh mục');
  }
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const row = (await client.query(`INSERT INTO news_event_cases (request_id, title, event_group, subject_name, tickers, story_id)
      VALUES ($1,$2,$3,$4,$5,$6)
      ON CONFLICT (request_id) DO UPDATE SET request_id = EXCLUDED.request_id
      WHERE news_event_cases.title = EXCLUDED.title AND news_event_cases.event_group = EXCLUDED.event_group
        AND news_event_cases.subject_name = EXCLUDED.subject_name AND news_event_cases.tickers = EXCLUDED.tickers
        AND news_event_cases.story_id IS NOT DISTINCT FROM EXCLUDED.story_id
      RETURNING id`, [data.request_id, data.title, data.event_group, data.subject_name, tickers, data.story_id || null])).rows[0];
    if (!row) throw AppError.badRequest('EVENT_REQUEST_CONFLICT', 'Yêu cầu tạo hồ sơ đã được dùng với dữ liệu khác');
    await insertMilestone(client, row.id, data.milestone, actor);
    await client.query('COMMIT');
    return row;
  } catch (err) { await client.query('ROLLBACK'); throw err; }
  finally { client.release(); }
}

async function addMilestone(caseId, input, actor) {
  if (!actor || !(actor.id || actor.admin_id || actor.email)) throw AppError.unauthorized('Cần Admin duyệt dữ kiện');
  if (!(await query('SELECT id FROM news_event_cases WHERE id = $1', [caseId])).rows.length) throw AppError.notFound('Không tìm thấy hồ sơ sự việc');
  return insertMilestone({ query }, caseId, milestoneSchema.parse(input), actor);
}

async function timelineForStock(ticker) {
  const cases = await query(`SELECT c.id FROM news_event_cases c WHERE $1 = ANY(c.tickers)
    AND EXISTS (SELECT 1 FROM news_posts p WHERE p.status = 'published'
      AND COALESCE(p.payload->'event_case_ids', '[]'::jsonb) ? c.id::text)
    ORDER BY c.created_at DESC LIMIT 50`, [ticker]);
  return timelineForArticle({ status: 'published', event_case_ids: cases.rows.map((r) => r.id) });
}

async function timelineForArticle(article) {
  if (!article.event_case_ids || !article.event_case_ids.length || article.status !== 'published') return [];
  return (await query(`SELECT m.id, m.case_id, m.title, m.summary, m.status, m.announced_on::text,
      m.effective_on::text, m.recorded_at, m.evidence, m.metrics, c.title AS case_title,
      c.subject_name, c.tickers, c.event_group
    FROM news_event_milestones m JOIN news_event_cases c ON c.id = m.case_id
    WHERE c.id = ANY($1::uuid[])
    ORDER BY m.announced_on DESC NULLS LAST, m.recorded_at DESC, m.id DESC LIMIT 50`, [article.event_case_ids])).rows;
}

module.exports = { caseSchema, milestoneSchema, validateArticleLinks, listCases, createCase, addMilestone, timelineForArticle, timelineForStock };
