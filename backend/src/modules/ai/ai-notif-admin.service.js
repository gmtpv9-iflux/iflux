'use strict';

const { query } = require('../../core/database/connection');
const { AppError } = require('../../shared/exceptions/app-error');

async function listPrompts() {
  return (await query('SELECT * FROM ai_prompts ORDER BY code ASC')).rows || [];
}

async function getPrompt(id) {
  const res = await query('SELECT * FROM ai_prompts WHERE id = $1', [id]);
  return res.rows[0] || null;
}

async function createPrompt(input) {
  const code = String(input.code || '').trim();
  const name = String(input.name || '').trim();
  if (!code || !name) throw AppError.badRequest('VALIDATION', 'Thiếu mã hoặc tên');
  const res = await query(
    `INSERT INTO ai_prompts (code, name, body, status)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [code, name, String(input.body || ''), String(input.status || 'draft')]
  );
  return res.rows[0];
}

async function updatePrompt(id, input) {
  const cur = await getPrompt(id);
  if (!cur) throw AppError.notFound('Không tìm thấy prompt');
  const res = await query(
    `UPDATE ai_prompts SET
      name = $2, body = $3, status = $4, updated_at = NOW()
     WHERE id = $1 RETURNING *`,
    [
      id,
      input.name != null ? String(input.name).trim() : cur.name,
      input.body != null ? String(input.body) : cur.body,
      input.status != null ? String(input.status).trim() : cur.status
    ]
  );
  return res.rows[0];
}

async function deletePrompt(id) {
  const res = await query('DELETE FROM ai_prompts WHERE id = $1 RETURNING id', [id]);
  if (!res.rows[0]) throw AppError.notFound('Không tìm thấy prompt');
  return { id };
}

async function listLogs() {
  return (await query('SELECT * FROM ai_log_rows ORDER BY created_at DESC LIMIT 200')).rows || [];
}

async function listCost() {
  return (await query('SELECT * FROM ai_cost_rows ORDER BY day DESC, provider ASC')).rows || [];
}

async function listQuality() {
  return (await query('SELECT * FROM ai_quality_items ORDER BY code ASC')).rows || [];
}

async function updateQuality(id, input) {
  const cur = await query('SELECT * FROM ai_quality_items WHERE id = $1', [id]);
  if (!cur.rows[0]) throw AppError.notFound('Không tìm thấy chỉ số');
  const res = await query(
    `UPDATE ai_quality_items SET
      label = $2, score = $3, note = $4, updated_at = NOW()
     WHERE id = $1 RETURNING *`,
    [
      id,
      input.label != null ? String(input.label).trim() : cur.rows[0].label,
      input.score != null ? Number(input.score) : cur.rows[0].score,
      input.note != null ? String(input.note) : cur.rows[0].note
    ]
  );
  return res.rows[0];
}

async function listCampaigns(channel) {
  return (
    await query('SELECT * FROM notif_campaigns WHERE channel = $1 ORDER BY code ASC', [channel])
  ).rows || [];
}

async function createCampaign(channel, input) {
  const code = String(input.code || '').trim();
  const title = String(input.title || '').trim();
  if (!code || !title) throw AppError.badRequest('VALIDATION', 'Thiếu mã hoặc tiêu đề');
  const res = await query(
    `INSERT INTO notif_campaigns (channel, code, title, body, status)
     VALUES ($1, $2, $3, $4, 'draft') RETURNING *`,
    [channel, code, title, String(input.body || '')]
  );
  return res.rows[0];
}

async function updateCampaign(channel, id, input) {
  const cur = await query('SELECT * FROM notif_campaigns WHERE id = $1 AND channel = $2', [
    id,
    channel
  ]);
  if (!cur.rows[0]) throw AppError.notFound('Không tìm thấy chiến dịch');
  const res = await query(
    `UPDATE notif_campaigns SET
      title = $3, body = $4, updated_at = NOW()
     WHERE id = $1 AND channel = $2 RETURNING *`,
    [
      id,
      channel,
      input.title != null ? String(input.title).trim() : cur.rows[0].title,
      input.body != null ? String(input.body) : cur.rows[0].body
    ]
  );
  return res.rows[0];
}

async function publishCampaign(channel, id) {
  const res = await query(
    `UPDATE notif_campaigns SET status = 'published', published_at = NOW(), updated_at = NOW()
     WHERE id = $1 AND channel = $2 RETURNING *`,
    [id, channel]
  );
  if (!res.rows[0]) throw AppError.notFound('Không tìm thấy chiến dịch');
  await query(
    `INSERT INTO notif_history (channel, title, status) VALUES ($1, $2, 'sent')`,
    [channel, res.rows[0].title]
  );
  return res.rows[0];
}

async function listHistory() {
  return (await query('SELECT * FROM notif_history ORDER BY sent_at DESC LIMIT 200')).rows || [];
}

module.exports = {
  listPrompts,
  getPrompt,
  createPrompt,
  updatePrompt,
  deletePrompt,
  listLogs,
  listCost,
  listQuality,
  updateQuality,
  listCampaigns,
  createCampaign,
  updateCampaign,
  publishCampaign,
  listHistory
};
