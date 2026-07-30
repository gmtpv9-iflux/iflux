'use strict';

const { query } = require('../../core/database/connection');
const { AppError } = require('../../shared/exceptions/app-error');

const STATUSES = new Set(['active', 'warning', 'empty', 'inactive']);

function slugifyId(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}

function mapRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    description: row.description || '',
    website: row.website || '',
    rssIndex: row.rss_index || '',
    rss_index: row.rss_index || '',
    status: row.status || 'active',
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

async function listProviders(filters = {}) {
  const params = [];
  let sql = 'SELECT * FROM community_rss_providers WHERE 1=1';
  if (filters.q) {
    params.push('%' + String(filters.q).trim().toLowerCase() + '%');
    sql += ` AND (LOWER(id) LIKE $${params.length} OR LOWER(name) LIKE $${params.length} OR LOWER(COALESCE(description,'')) LIKE $${params.length})`;
  }
  if (filters.status) {
    params.push(String(filters.status));
    sql += ` AND status = $${params.length}`;
  }
  sql += ' ORDER BY name ASC';
  const res = await query(sql, params);
  return (res.rows || []).map(mapRow);
}

async function getProvider(id) {
  const res = await query('SELECT * FROM community_rss_providers WHERE id = $1', [id]);
  return mapRow(res.rows[0] || null);
}

async function createProvider(input) {
  const name = String((input && input.name) || '').trim();
  if (!name) throw AppError.badRequest('VALIDATION', 'Tên nhà cung cấp bắt buộc');

  let id = String((input && input.id) || '').trim().toLowerCase();
  if (!id) id = slugifyId(name);
  else id = slugifyId(id);
  if (!id) throw AppError.badRequest('VALIDATION', 'ID không hợp lệ');

  const status = String((input && input.status) || 'active');
  if (!STATUSES.has(status)) {
    throw AppError.badRequest('VALIDATION', 'Trạng thái không hợp lệ');
  }

  const existing = await getProvider(id);
  if (existing) throw AppError.conflict('DUPLICATE', 'ID nhà cung cấp đã tồn tại');

  const res = await query(
    `INSERT INTO community_rss_providers (id, name, description, website, rss_index, status)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      id,
      name,
      String((input && input.description) || '').trim(),
      String((input && (input.website || input.website_url)) || '').trim(),
      String((input && (input.rss_index || input.rssIndex)) || '').trim(),
      status
    ]
  );
  return mapRow(res.rows[0]);
}

async function updateProvider(id, input) {
  const current = await getProvider(id);
  if (!current) throw AppError.notFound('Không tìm thấy nhà cung cấp');

  const name = input.name != null ? String(input.name).trim() : current.name;
  if (!name) throw AppError.badRequest('VALIDATION', 'Tên nhà cung cấp bắt buộc');

  let status = current.status;
  if (input.status != null) {
    status = String(input.status);
    if (!STATUSES.has(status)) {
      throw AppError.badRequest('VALIDATION', 'Trạng thái không hợp lệ');
    }
  }

  const description =
    input.description != null ? String(input.description).trim() : current.description;
  const website =
    input.website != null || input.website_url != null
      ? String(input.website != null ? input.website : input.website_url).trim()
      : current.website;
  const rssIndex =
    input.rss_index != null || input.rssIndex != null
      ? String(input.rss_index != null ? input.rss_index : input.rssIndex).trim()
      : current.rssIndex;

  const res = await query(
    `UPDATE community_rss_providers
     SET name = $2,
         description = $3,
         website = $4,
         rss_index = $5,
         status = $6,
         updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [id, name, description, website, rssIndex, status]
  );
  return mapRow(res.rows[0]);
}

async function deleteProvider(id) {
  const current = await getProvider(id);
  if (!current) throw AppError.notFound('Không tìm thấy nhà cung cấp');
  await query('DELETE FROM community_rss_providers WHERE id = $1', [id]);
  return { deleted: true, id };
}

module.exports = {
  listProviders,
  getProvider,
  createProvider,
  updateProvider,
  deleteProvider
};
