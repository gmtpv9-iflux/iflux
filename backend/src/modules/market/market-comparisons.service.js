'use strict';

const { z } = require('zod');
const { query } = require('../../core/database/connection');
const { AppError } = require('../../shared/exceptions/app-error');

// Chỉ bật adapter khi đã xác nhận owner/schema/unit. Không nhận SQL hoặc số liệu từ AI.
const METRICS = {
  market_cap: { label: 'Vốn hóa', unit: 'VND', field: 'market_cap', source: 'stocks' },
  shares_outstanding: { label: 'Cổ phiếu lưu hành', unit: 'cổ phiếu', field: 'shares_outstanding', source: 'stocks' },
  pe: { label: 'P/E', unit: 'lần', source: null },
  pb: { label: 'P/B', unit: 'lần', source: null },
  foreign_room: { label: 'Room nước ngoài', unit: null, source: null }
};
const comparisonSchema = z.object({
  metric: z.enum(Object.keys(METRICS)),
  scope: z.object({ type: z.enum(['sector', 'ecosystem', 'story']), id: z.string().min(1).max(160) }).strict(),
  tickers: z.array(z.string().trim().toUpperCase().min(1).max(10)).min(2).max(30),
  purpose: z.string().trim().min(1).max(600)
}).strict().superRefine((v, ctx) => {
  if (new Set(v.tickers).size !== v.tickers.length) ctx.addIssue({ code: 'custom', message: 'Danh sách so sánh có mã trùng' });
});

function metricCatalog() {
  return Object.entries(METRICS).map(([key, m]) => ({ key, label: m.label, unit: m.unit, available: !!m.source }));
}

async function scopeContext(article, spec) {
  const type = spec.scope.type;
  let scope, members;
  if (type === 'story') {
    const res = await query(`SELECT s.id, s.title AS name, s.stock_tags FROM stories s JOIN topics t ON t.id=s.topic_id
      WHERE s.id::text=$1 AND s.status='active' AND t.confirmed_at IS NOT NULL`, [spec.scope.id]);
    scope = res.rows[0]; members = scope && scope.stock_tags;
    if (!scope || String(article.story_id || '') !== String(scope.id)) throw AppError.badRequest('COMPARISON_SCOPE_UNRELATED', 'Câu chuyện so sánh phải là Câu chuyện đã hình thành được gắn với bài');
  } else {
    const table = type === 'sector' ? 'sectors' : 'ecosystems';
    const column = type === 'sector' ? 'sector_id' : 'ecosystem_id';
    const res = await query(`SELECT id, name_vi AS name, code, slug FROM ${table} WHERE id::text=$1 OR slug=$1 OR code=$1`, [spec.scope.id]);
    scope = res.rows[0];
    if (!scope) throw AppError.badRequest('COMPARISON_SCOPE_NOT_FOUND', 'Phạm vi so sánh không có trong danh mục');
    members = (await query(`SELECT ticker FROM stocks WHERE ${column}=$1`, [scope.id])).rows.map((r) => r.ticker);
    const tags = type === 'sector' ? (article.sectors || []) : (article.ecosystems || []);
    const attached = tags.some((v) => [scope.id, scope.code, scope.slug].map(String).includes(String(v))) ||
      (article.tickers || []).some((t) => members.includes(t));
    if (!attached) throw AppError.badRequest('COMPARISON_SCOPE_UNRELATED', 'Phạm vi so sánh phải liên quan thực thể được gắn với bài');
  }
  if (spec.tickers.some((ticker) => !members.includes(ticker))) throw AppError.badRequest('COMPARISON_MEMBERSHIP_INVALID', 'Có mã không thuộc phạm vi so sánh đã chọn');
  return { ...scope, members };
}

async function buildComparison(article) {
  if (!article.comparison) return { data: null, reason: null };
  const spec = comparisonSchema.parse(article.comparison);
  const scope = await scopeContext(article, spec);
  const metric = METRICS[spec.metric];
  if (!metric.source) return { data: null, reason: 'Chỉ tiêu chưa được nối với nguồn dữ liệu doanh nghiệp hiện hữu' };
  const rows = (await query(`SELECT s.ticker, s.name, to_jsonb(s)->>$1 AS value, s.updated_at,
      a.source_code, a.created_at AS field_recorded_at, a.to_value AS audited_value, a.id AS audit_id
    FROM stocks s LEFT JOIN LATERAL (
      SELECT id, source_code, created_at, to_value FROM market_sot_audit
      WHERE entity='stock' AND entity_key=s.ticker AND field_key=$1
        AND result IN ('applied','apply','auto_applied','auto_apply_fill','admin_patch') ORDER BY created_at DESC, id DESC LIMIT 1
    ) a ON true WHERE s.ticker=ANY($2::text[])`, [metric.field, spec.tickers])).rows;
  const byTicker = Object.fromEntries(rows.map((r) => [r.ticker, r]));
  const output = spec.tickers.map((ticker) => {
    const r = byTicker[ticker];
    const value = r && r.value !== null && r.value !== '' ? Number(r.value) : null;
    const usable = Number.isFinite(value) && r && (!r.audit_id || (r.audited_value !== null && Number(r.audited_value) === value));
    return { ticker, name: r && r.name, value: usable ? value : null, unit: metric.unit,
      source_label: 'iFlux Master' + (r && r.source_code ? ' · ' + r.source_code : ''),
      source_updated_at: r && (r.field_recorded_at || r.updated_at) || null,
      timestamp_kind: r && r.field_recorded_at ? 'field_recorded' : 'master_record_updated', source_url: null };
  });
  if (output.filter((r) => r.value !== null).length < 2) return { data: null, reason: 'Chưa đủ hai mã có số liệu và provenance phù hợp; không suy đoán hoặc gọi nguồn ngoài' };
  return { data: { metric: spec.metric, title: metric.label + ' · ' + scope.name,
    scope: { type: spec.scope.type, id: String(scope.id), name: scope.name }, purpose: spec.purpose,
    as_of: new Date().toISOString(), period_end: null, basis: 'current_master', unit: metric.unit,
    chart: true, rows: output }, reason: null };
}

module.exports = { comparisonSchema, metricCatalog, scopeContext, buildComparison };
