'use strict';

const { query } = require('../../core/database/connection');
const { AppError } = require('../../shared/exceptions/app-error');

const STATUSES = new Set(['idle', 'running', 'success', 'failed']);

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
    schedule: row.schedule || '',
    status: row.status || 'idle',
    last_run_at: row.last_run_at,
    last_duration_ms: row.last_duration_ms != null ? Number(row.last_duration_ms) : null,
    last_records: row.last_records != null ? Number(row.last_records) : null,
    description: row.description || '',
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

async function listJobs(filters = {}) {
  const params = [];
  let sql = 'SELECT * FROM data_etl_jobs WHERE 1=1';
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

async function getJob(id) {
  const res = await query('SELECT * FROM data_etl_jobs WHERE id = $1', [id]);
  return mapRow(res.rows[0] || null);
}

async function createJob(input) {
  const name = String((input && input.name) || '').trim();
  if (!name) throw AppError.badRequest('VALIDATION', 'Tên tác vụ bắt buộc');

  let code = String((input && input.code) || '').trim().toLowerCase();
  if (!code) code = slugifyCode(name);
  else code = slugifyCode(code);
  if (!code) throw AppError.badRequest('VALIDATION', 'Mã tác vụ không hợp lệ');

  const status = String((input && input.status) || 'idle');
  if (!STATUSES.has(status)) throw AppError.badRequest('VALIDATION', 'Trạng thái không hợp lệ');

  const dup = await query('SELECT id FROM data_etl_jobs WHERE code = $1', [code]);
  if (dup.rows[0]) throw AppError.conflict('DUPLICATE', 'Mã tác vụ đã tồn tại');

  const res = await query(
    `INSERT INTO data_etl_jobs (code, name, schedule, status, description)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [
      code,
      name,
      String((input && input.schedule) || '').trim(),
      status,
      String((input && input.description) || '').trim()
    ]
  );
  return mapRow(res.rows[0]);
}

async function updateJob(id, input) {
  const current = await getJob(id);
  if (!current) throw AppError.notFound('Không tìm thấy tác vụ ETL');

  const name = input.name != null ? String(input.name).trim() : current.name;
  if (!name) throw AppError.badRequest('VALIDATION', 'Tên tác vụ bắt buộc');

  let status = current.status;
  if (input.status != null) {
    status = String(input.status);
    if (!STATUSES.has(status)) throw AppError.badRequest('VALIDATION', 'Trạng thái không hợp lệ');
  }

  const schedule = input.schedule != null ? String(input.schedule).trim() : current.schedule;
  const description =
    input.description != null ? String(input.description).trim() : current.description;

  const res = await query(
    `UPDATE data_etl_jobs
     SET name = $2, schedule = $3, status = $4, description = $5, updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [id, name, schedule, status, description]
  );
  return mapRow(res.rows[0]);
}

async function deleteJob(id) {
  const current = await getJob(id);
  if (!current) throw AppError.notFound('Không tìm thấy tác vụ ETL');
  await query('DELETE FROM data_etl_jobs WHERE id = $1', [id]);
  return { deleted: true, id };
}

/** Execute = ghi nhận 1 lần chạy (stub engine — enforce quyền execute). */
async function executeJob(id) {
  const current = await getJob(id);
  if (!current) throw AppError.notFound('Không tìm thấy tác vụ ETL');

  await query(
    `UPDATE data_etl_jobs
     SET status = 'running', updated_at = NOW()
     WHERE id = $1`,
    [id]
  );

  const durationMs = 800 + Math.floor(Math.random() * 2200);
  const records = 100 + Math.floor(Math.random() * 900);

  const res = await query(
    `UPDATE data_etl_jobs
     SET status = 'success',
         last_run_at = NOW(),
         last_duration_ms = $2,
         last_records = $3,
         updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [id, durationMs, records]
  );
  return mapRow(res.rows[0]);
}

module.exports = {
  listJobs,
  getJob,
  createJob,
  updateJob,
  deleteJob,
  executeJob
};
