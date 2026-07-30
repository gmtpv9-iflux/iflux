'use strict';

const { query } = require('../../core/database/connection');
const { AppError } = require('../../shared/exceptions/app-error');

function slugifyCode(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 20);
}

function normTickers(list) {
  if (!Array.isArray(list)) return [];
  const out = [];
  const seen = new Set();
  list.forEach(function (t) {
    const x = String(t || '').trim().toUpperCase();
    if (!x || seen.has(x)) return;
    seen.add(x);
    out.push(x);
  });
  return out;
}

function mapRow(row) {
  if (!row) return null;
  const tickers = Array.isArray(row.tickers) ? row.tickers.filter(Boolean) : [];
  return {
    id: row.id,
    code: row.code,
    name: row.name_vi,
    name_vi: row.name_vi,
    divisor: Number(row.divisor),
    status: row.is_active ? 'active' : 'inactive',
    is_active: !!row.is_active,
    tickers: tickers,
    stock_count: Number(row.stock_count) || tickers.length,
    created_at: row.created_at,
    updated_at: row.updated_at || row.created_at
  };
}

const SELECT_BASE = `
  SELECT e.*,
    COALESCE(
      (SELECT array_agg(st.ticker ORDER BY st.ticker)
         FROM stocks st WHERE st.ecosystem_id = e.id),
      ARRAY[]::varchar[]
    ) AS tickers,
    (SELECT COUNT(*)::int FROM stocks st WHERE st.ecosystem_id = e.id) AS stock_count
  FROM ecosystems e
`;

async function listEcosystems(filters = {}) {
  const params = [];
  let sql = SELECT_BASE + ' WHERE 1=1';
  if (filters.q) {
    params.push('%' + String(filters.q).trim().toLowerCase() + '%');
    sql += ` AND (LOWER(e.code) LIKE $${params.length} OR LOWER(e.name_vi) LIKE $${params.length})`;
  }
  if (filters.status === 'active') sql += ' AND e.is_active = TRUE';
  if (filters.status === 'inactive') sql += ' AND e.is_active = FALSE';
  sql += ' ORDER BY e.name_vi ASC';
  const res = await query(sql, params);
  return (res.rows || []).map(mapRow);
}

async function getEcosystem(id) {
  const res = await query(SELECT_BASE + ' WHERE e.id = $1', [id]);
  return mapRow(res.rows[0] || null);
}

async function syncTickers(ecosystemId, tickers) {
  const list = normTickers(tickers);
  await query('UPDATE stocks SET ecosystem_id = NULL WHERE ecosystem_id = $1', [ecosystemId]);
  if (!list.length) return { linked: 0, missing: [] };

  const found = await query(
    'SELECT ticker FROM stocks WHERE ticker = ANY($1::varchar[])',
    [list]
  );
  const foundSet = new Set((found.rows || []).map(function (r) { return r.ticker; }));
  const missing = list.filter(function (t) { return !foundSet.has(t); });
  const linked = list.filter(function (t) { return foundSet.has(t); });
  if (linked.length) {
    await query(
      'UPDATE stocks SET ecosystem_id = $1 WHERE ticker = ANY($2::varchar[])',
      [ecosystemId, linked]
    );
  }
  return { linked: linked.length, missing };
}

async function createEcosystem(input) {
  const name = String((input && (input.name || input.name_vi)) || '').trim();
  if (!name) throw AppError.badRequest('VALIDATION', 'Tên hệ sinh thái bắt buộc');

  let code = String((input && input.code) || '').trim().toLowerCase();
  if (!code) code = slugifyCode(name);
  else code = slugifyCode(code);
  if (!code) throw AppError.badRequest('VALIDATION', 'Mã không hợp lệ');

  const tickers = normTickers(input && input.tickers);
  let divisor = Number(input && input.divisor);
  if (!Number.isFinite(divisor) || divisor < 1) {
    divisor = Math.max(tickers.length, 1);
  }

  let isActive = true;
  if (input && input.status != null) {
    isActive = String(input.status) !== 'inactive';
  } else if (input && input.is_active != null) {
    isActive = !!input.is_active;
  }

  const dup = await query('SELECT id FROM ecosystems WHERE code = $1', [code]);
  if (dup.rows[0]) throw AppError.conflict('DUPLICATE', 'Mã hệ sinh thái đã tồn tại');

  const res = await query(
    `INSERT INTO ecosystems (code, name_vi, divisor, is_active, updated_at)
     VALUES ($1, $2, $3, $4, NOW())
     RETURNING id`,
    [code, name, divisor, isActive]
  );
  const id = res.rows[0].id;
  if (tickers.length) await syncTickers(id, tickers);
  return getEcosystem(id);
}

async function updateEcosystem(id, input) {
  const current = await getEcosystem(id);
  if (!current) throw AppError.notFound('Không tìm thấy hệ sinh thái');

  const name =
    input.name != null || input.name_vi != null
      ? String(input.name != null ? input.name : input.name_vi).trim()
      : current.name;
  if (!name) throw AppError.badRequest('VALIDATION', 'Tên hệ sinh thái bắt buộc');

  let divisor = current.divisor;
  if (input.divisor != null) {
    divisor = Number(input.divisor);
    if (!Number.isFinite(divisor) || divisor < 1) {
      throw AppError.badRequest('VALIDATION', 'Divisor phải ≥ 1');
    }
  }

  let isActive = current.is_active;
  if (input.status != null) isActive = String(input.status) !== 'inactive';
  else if (input.is_active != null) isActive = !!input.is_active;

  await query(
    `UPDATE ecosystems
     SET name_vi = $2, divisor = $3, is_active = $4, updated_at = NOW()
     WHERE id = $1`,
    [id, name, divisor, isActive]
  );

  if (Object.prototype.hasOwnProperty.call(input || {}, 'tickers')) {
    await syncTickers(id, input.tickers);
  }
  return getEcosystem(id);
}

async function setEcosystemStatus(id, active) {
  const current = await getEcosystem(id);
  if (!current) throw AppError.notFound('Không tìm thấy hệ sinh thái');
  await query(
    `UPDATE ecosystems SET is_active = $2, updated_at = NOW() WHERE id = $1`,
    [id, !!active]
  );
  return getEcosystem(id);
}

async function deleteEcosystem(id) {
  const current = await getEcosystem(id);
  if (!current) throw AppError.notFound('Không tìm thấy hệ sinh thái');
  await query('UPDATE stocks SET ecosystem_id = NULL WHERE ecosystem_id = $1', [id]);
  await query('DELETE FROM ecosystems WHERE id = $1', [id]);
  return { deleted: true, id: Number(id) };
}

module.exports = {
  listEcosystems,
  getEcosystem,
  createEcosystem,
  updateEcosystem,
  setEcosystemStatus,
  deleteEcosystem
};
