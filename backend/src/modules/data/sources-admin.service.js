'use strict';

const { query } = require('../../core/database/connection');
const { AppError } = require('../../shared/exceptions/app-error');

const STATUSES = new Set(['idle', 'connected', 'success', 'failed', 'degraded']);
const TYPES = new Set(['REST', 'WebSocket', 'File', 'DB', 'Other']);

function slugifyCode(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 80);
}

function mapRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    source_type: row.source_type || 'REST',
    type: row.source_type || 'REST',
    status: row.status || 'idle',
    latency_ms: row.latency_ms != null ? Number(row.latency_ms) : null,
    last_check_at: row.last_check_at,
    description: row.description || '',
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

async function listSources(filters = {}) {
  const params = [];
  let sql = 'SELECT * FROM data_sources WHERE 1=1';
  if (filters.q) {
    params.push('%' + String(filters.q).trim().toLowerCase() + '%');
    sql += ` AND (LOWER(code) LIKE $${params.length} OR LOWER(name) LIKE $${params.length})`;
  }
  if (filters.status) {
    params.push(String(filters.status));
    sql += ` AND status = $${params.length}`;
  }
  sql += ' ORDER BY name ASC';
  const res = await query(sql, params);
  return (res.rows || []).map(mapRow);
}

async function getSource(id) {
  const res = await query('SELECT * FROM data_sources WHERE id = $1', [id]);
  return mapRow(res.rows[0] || null);
}

async function createSource(input) {
  const name = String((input && input.name) || '').trim();
  if (!name) throw AppError.badRequest('VALIDATION', 'Tên nguồn bắt buộc');

  let code = String((input && input.code) || '').trim().toLowerCase();
  if (!code) code = slugifyCode(name);
  else code = slugifyCode(code);
  if (!code) throw AppError.badRequest('VALIDATION', 'Mã nguồn không hợp lệ');

  let sourceType = String((input && (input.source_type || input.type)) || 'REST');
  if (!TYPES.has(sourceType)) throw AppError.badRequest('VALIDATION', 'Loại nguồn không hợp lệ');

  const status = String((input && input.status) || 'idle');
  if (!STATUSES.has(status)) throw AppError.badRequest('VALIDATION', 'Trạng thái không hợp lệ');

  const dup = await query('SELECT id FROM data_sources WHERE code = $1', [code]);
  if (dup.rows[0]) throw AppError.conflict('DUPLICATE', 'Mã nguồn đã tồn tại');

  const res = await query(
    `INSERT INTO data_sources (code, name, source_type, status, description)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [code, name, sourceType, status, String((input && input.description) || '').trim()]
  );
  return mapRow(res.rows[0]);
}

async function updateSource(id, input) {
  const current = await getSource(id);
  if (!current) throw AppError.notFound('Không tìm thấy nguồn dữ liệu');

  const name = input.name != null ? String(input.name).trim() : current.name;
  if (!name) throw AppError.badRequest('VALIDATION', 'Tên nguồn bắt buộc');

  let sourceType = current.source_type;
  if (input.source_type != null || input.type != null) {
    sourceType = String(input.source_type != null ? input.source_type : input.type);
    if (!TYPES.has(sourceType)) throw AppError.badRequest('VALIDATION', 'Loại nguồn không hợp lệ');
  }

  let status = current.status;
  if (input.status != null) {
    status = String(input.status);
    if (!STATUSES.has(status)) throw AppError.badRequest('VALIDATION', 'Trạng thái không hợp lệ');
  }

  const description =
    input.description != null ? String(input.description).trim() : current.description;

  const res = await query(
    `UPDATE data_sources
     SET name = $2, source_type = $3, status = $4, description = $5, updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [id, name, sourceType, status, description]
  );
  return mapRow(res.rows[0]);
}

async function deleteSource(id) {
  const current = await getSource(id);
  if (!current) throw AppError.notFound('Không tìm thấy nguồn dữ liệu');
  await query('DELETE FROM data_sources WHERE id = $1', [id]);
  return { deleted: true, id };
}

/** Execute = kiểm tra kết nối (stub) — enforce quyền execute. */
async function executeSource(id) {
  const current = await getSource(id);
  if (!current) throw AppError.notFound('Không tìm thấy nguồn dữ liệu');

  const latency = 20 + Math.floor(Math.random() * 80);
  const res = await query(
    `UPDATE data_sources
     SET status = 'success',
         latency_ms = $2,
         last_check_at = NOW(),
         updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [id, latency]
  );
  return mapRow(res.rows[0]);
}

module.exports = {
  listSources,
  getSource,
  createSource,
  updateSource,
  deleteSource,
  executeSource
};
