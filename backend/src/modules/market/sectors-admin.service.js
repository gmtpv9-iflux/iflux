'use strict';

const { query, getPool } = require('../../core/database/connection');
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
    slug: row.slug || null,
    name: row.name_vi,
    name_vi: row.name_vi,
    description: row.description || null,
    display_order: Number(row.display_order) || 0,
    icon_media_id: row.icon_media_id || null,
    status: row.is_active ? 'active' : 'inactive',
    is_active: !!row.is_active,
    tickers: tickers,
    stock_count: Number(row.stock_count) || tickers.length,
    post_count: Number(row.post_count) || 0,
    created_at: row.created_at,
    updated_at: row.updated_at || row.created_at
  };
}

/* List: stock_count + tickers; post_count via one-pass join (no per-row jsonb_array scan) */
const SELECT_LIST = `
  SELECT s.*,
    COALESCE(
      (SELECT array_agg(st.ticker ORDER BY st.ticker)
         FROM stocks st WHERE st.sector_id = s.id),
      ARRAY[]::varchar[]
    ) AS tickers,
    (SELECT COUNT(*)::int FROM stocks st WHERE st.sector_id = s.id) AS stock_count,
    COALESCE(pc.post_count, 0)::int AS post_count
  FROM sectors s
  LEFT JOIN (
    SELECT key, COUNT(*)::int AS post_count
    FROM (
      SELECT payload->>'sector_id' AS key FROM community_posts
        WHERE payload ? 'sector_id' AND COALESCE(payload->>'sector_id','') <> ''
      UNION ALL
      SELECT payload->>'sector_code' AS key FROM community_posts
        WHERE payload ? 'sector_code' AND COALESCE(payload->>'sector_code','') <> ''
    ) x
    GROUP BY key
  ) pc ON pc.key = s.id::text OR pc.key = s.code
`;

const SELECT_DETAIL = `
  SELECT s.*,
    COALESCE(
      (SELECT array_agg(st.ticker ORDER BY st.ticker)
         FROM stocks st WHERE st.sector_id = s.id),
      ARRAY[]::varchar[]
    ) AS tickers,
    (SELECT COUNT(*)::int FROM stocks st WHERE st.sector_id = s.id) AS stock_count,
    (
      SELECT COUNT(*)::int
      FROM community_posts p
      WHERE (p.payload->>'sector_id')::text = s.id::text
         OR (p.payload->>'sector_code')::text = s.code
         OR EXISTS (
              SELECT 1
              FROM jsonb_array_elements_text(COALESCE(p.payload->'sectors', '[]'::jsonb)) elem
              WHERE elem = s.id::text OR elem = s.code OR elem = COALESCE(s.slug, '')
            )
    ) AS post_count
  FROM sectors s
`;

async function listSectors(filters = {}) {
  const params = [];
  let sql = SELECT_LIST + ' WHERE 1=1';
  if (filters.q) {
    const qStr = String(filters.q).trim().toLowerCase();
    params.push('%' + qStr + '%');
    let qCond = `(LOWER(s.code) LIKE $${params.length} OR LOWER(s.name_vi) LIKE $${params.length} OR LOWER(COALESCE(s.slug, '')) LIKE $${params.length})`;
    if (/^\d+$/.test(qStr)) {
      params.push(Number(qStr));
      qCond += ` OR s.id = $${params.length}`;
    }
    sql += ` AND ${qCond}`;
  }
  if (filters.status === 'active') sql += ' AND s.is_active = TRUE';
  if (filters.status === 'inactive') sql += ' AND s.is_active = FALSE';
  sql += ' ORDER BY s.display_order ASC, s.name_vi ASC';
  const res = await query(sql, params);
  return (res.rows || []).map(mapRow);
}

async function getSector(id) {
  const res = await query(SELECT_DETAIL + ' WHERE s.id = $1', [id]);
  return mapRow(res.rows[0] || null);
}

async function syncTickers(sectorId, tickers) {
  const list = normTickers(tickers);
  await query('UPDATE stocks SET sector_id = NULL WHERE sector_id = $1', [sectorId]);
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
      'UPDATE stocks SET sector_id = $1 WHERE ticker = ANY($2::varchar[])',
      [sectorId, linked]
    );
  }
  return { linked: linked.length, missing };
}

async function createSector(input) {
  const name = String((input && (input.name || input.name_vi)) || '').trim();
  if (!name) throw AppError.badRequest('VALIDATION', 'Tên ngành bắt buộc');

  let code = String((input && input.code) || '').trim().toLowerCase();
  if (!code) code = slugifyCode(name);
  else code = slugifyCode(code);
  if (!code) throw AppError.badRequest('VALIDATION', 'Mã ngành không hợp lệ');

  let isActive = true;
  if (input && input.status != null) {
    isActive = String(input.status) !== 'inactive';
  } else if (input && input.is_active != null) {
    isActive = !!input.is_active;
  }
  const description =
    input && input.description != null ? String(input.description).trim() || null : null;

  const dup = await query('SELECT id FROM sectors WHERE code = $1', [code]);
  if (dup.rows[0]) throw AppError.conflict('DUPLICATE', 'Mã ngành đã tồn tại');

  const res = await query(
    `INSERT INTO sectors (code, name_vi, description, is_active, updated_at)
     VALUES ($1, $2, $3, $4, NOW())
     RETURNING *`,
    [code, name, description, isActive]
  );
  const id = res.rows[0].id;
  const tickers = normTickers(input && input.tickers);
  if (tickers.length) await syncTickers(id, tickers);
  return getSector(id);
}

async function updateSector(id, input) {
  const current = await getSector(id);
  if (!current) throw AppError.notFound('Không tìm thấy ngành');

  const name =
    input.name != null || input.name_vi != null
      ? String(input.name != null ? input.name : input.name_vi).trim()
      : current.name;
  if (!name) throw AppError.badRequest('VALIDATION', 'Tên ngành bắt buộc');

  let isActive = current.is_active;
  if (input.status != null) isActive = String(input.status) !== 'inactive';
  else if (input.is_active != null) isActive = !!input.is_active;

  let description = current.description;
  if (input && Object.prototype.hasOwnProperty.call(input, 'description')) {
    description = input.description != null ? String(input.description).trim() || null : null;
  }

  await query(
    `UPDATE sectors
     SET name_vi = $2, description = $3, is_active = $4, updated_at = NOW()
     WHERE id = $1`,
    [id, name, description, isActive]
  );
  if (Object.prototype.hasOwnProperty.call(input || {}, 'tickers')) {
    await syncTickers(id, input.tickers);
  }
  return getSector(id);
}

async function deleteSector(id) {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');

    const lockRes = await client.query(
      'SELECT id, code, slug FROM sectors WHERE id = $1 FOR UPDATE',
      [id]
    );
    if (!lockRes.rows[0]) {
      throw AppError.notFound('Không tìm thấy ngành');
    }
    const target = lockRes.rows[0];

    const stockRes = await client.query(
      'SELECT COUNT(*)::int AS count FROM stocks WHERE sector_id = $1',
      [id]
    );
    const stockCount = Number(stockRes.rows[0]?.count || 0);

    const postRes = await client.query(
      `SELECT COUNT(*)::int AS count
       FROM community_posts p
       WHERE (p.payload->>'sector_id')::text = $1::text
          OR (p.payload->>'sector_code')::text = $2
          OR EXISTS (
               SELECT 1
               FROM jsonb_array_elements_text(COALESCE(p.payload->'sectors', '[]'::jsonb)) elem
               WHERE elem = $1::text 
                  OR elem = $2
                  OR elem = COALESCE($3, '')
             )`,
      [id, target.code, target.slug]
    );
    const postCount = Number(postRes.rows[0]?.count || 0);
    const referenceCount = stockCount + postCount;

    if (referenceCount > 0) {
      throw AppError.badRequest(
        'HAS_REFERENCES',
        'Danh mục đang có cổ phiếu/bài viết liên kết. Không thể xóa, vui lòng chuyển sang trạng thái Inactive.'
      );
    }

    await client.query('DELETE FROM sectors WHERE id = $1', [id]);
    await client.query('COMMIT');
    return { deleted: true, id: Number(id) };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = {
  listSectors,
  getSector,
  createSector,
  updateSector,
  deleteSector,
  syncTickers
};

