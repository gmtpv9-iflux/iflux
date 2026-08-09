'use strict';

const { query } = require('../../core/database/connection');
const { AppError } = require('../../shared/exceptions/app-error');
const { normalizeCapGroup } = require('./market-cap-group');
const { writeSotAudit } = require('./market-mdm.service');

async function listStocks() {
  const res = await query(
    `SELECT s.ticker, s.name, s.exchange, s.sector_id, sec.name_vi as sector_name, 
            s.ecosystem_id, eco.name_vi as ecosystem_name, s.shares_outstanding, 
            s.slug, s.short_name, s.english_name, 
            s.isin, s.description, s.status,
            s.cap_group, s.market_cap,
            s.created_at, s.updated_at
     FROM stocks s
     LEFT JOIN sectors sec ON s.sector_id = sec.id
     LEFT JOIN ecosystems eco ON s.ecosystem_id = eco.id
     ORDER BY s.ticker ASC`
  );
  return (res.rows || []).map(function (r) {
    return Object.assign({}, r, {
      cap_tier: r.cap_group || null,
      capitalization_group: r.cap_group || null
    });
  });
}

async function createStock(input) {
  const ticker = String(input.ticker || '').trim().toUpperCase();
  const name = String(input.name || '').trim();
  if (!ticker || !name) throw AppError.badRequest('Thiếu ticker/name');
  
  const exchange = input.exchange ? String(input.exchange).trim() : null;
  const status = input.status ? String(input.status).trim() : 'active';
  const sector_id = input.sector_id || null;
  const ecosystem_id = input.ecosystem_id || null;
  const shares_outstanding = input.shares_outstanding || 0;
  const description = input.description ? String(input.description).trim() : null;
  const cap_group = normalizeCapGroup(input.cap_group || input.cap_tier);
  const market_cap =
    input.market_cap != null && Number.isFinite(Number(input.market_cap))
      ? Number(input.market_cap)
      : null;

  const res = await query(
    `INSERT INTO stocks (ticker, name, exchange, status, sector_id, ecosystem_id, shares_outstanding, description, cap_group, market_cap)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [
      ticker,
      name,
      exchange,
      status,
      sector_id,
      ecosystem_id,
      shares_outstanding,
      description,
      cap_group,
      market_cap
    ]
  );
  return res.rows[0];
}

async function updateStock(ticker, input, adminId) {
  const t = String(ticker).toUpperCase();
  const cur = await query('SELECT * FROM stocks WHERE ticker = $1', [t]);
  if (!cur.rows[0]) throw AppError.notFound('Không tìm thấy mã');
  const prev = cur.rows[0];

  const name = input.name !== undefined ? String(input.name).trim() : prev.name;
  const exchange = input.exchange !== undefined ? String(input.exchange).trim() : prev.exchange;
  const status = input.status !== undefined ? String(input.status).trim() : prev.status;
  const sector_id = input.sector_id !== undefined ? input.sector_id : prev.sector_id;
  const ecosystem_id = input.ecosystem_id !== undefined ? input.ecosystem_id : prev.ecosystem_id;
  const shares_outstanding = input.shares_outstanding !== undefined ? input.shares_outstanding : prev.shares_outstanding;
  const description = input.description !== undefined ? (input.description ? String(input.description).trim() : null) : prev.description;
  let cap_group = prev.cap_group;
  if (input.cap_group !== undefined || input.cap_tier !== undefined) {
    cap_group = normalizeCapGroup(input.cap_group != null ? input.cap_group : input.cap_tier);
  }
  let market_cap = prev.market_cap;
  if (input.market_cap !== undefined) {
    market_cap =
      input.market_cap == null || input.market_cap === ''
        ? null
        : Number(input.market_cap);
  }

  const res = await query(
    `UPDATE stocks
     SET name = $2, exchange = $3, status = $4, sector_id = $5, ecosystem_id = $6,
         shares_outstanding = $7, description = $8,
         cap_group = $9, market_cap = $10, updated_at = NOW()
     WHERE ticker = $1 RETURNING *`,
    [
      t,
      name,
      exchange,
      status,
      sector_id,
      ecosystem_id,
      shares_outstanding,
      description,
      cap_group,
      market_cap
    ]
  );

  const fields = [
    ['name', prev.name, name],
    ['exchange', prev.exchange, exchange],
    ['status', prev.status, status],
    ['sector_id', prev.sector_id, sector_id],
    ['ecosystem_id', prev.ecosystem_id, ecosystem_id],
    ['description', prev.description, description],
    ['cap_group', prev.cap_group, cap_group],
    ['market_cap', prev.market_cap, market_cap]
  ];
  for (let i = 0; i < fields.length; i++) {
    const f = fields[i];
    if (String(f[1] == null ? '' : f[1]) === String(f[2] == null ? '' : f[2])) continue;
    await writeSotAudit(null, {
      admin_id: adminId || null,
      entity_key: t,
      field_key: f[0],
      from_value: f[1],
      to_value: f[2],
      source_code: 'admin',
      why: 'Admin PATCH stock',
      result: 'admin_patch'
    });
  }

  return res.rows[0];
}

async function deleteStock(ticker) {
  const t = String(ticker).toUpperCase();
  const res = await query('DELETE FROM stocks WHERE ticker = $1 RETURNING ticker', [t]);
  if (!res.rows[0]) throw AppError.notFound('Không tìm thấy mã');
  return { deleted: true, ticker: t };
}

async function setStatus(ticker, status) {
  const t = String(ticker).toUpperCase();
  const st = String(status).trim();
  const res = await query(
    `UPDATE stocks SET status = $2, updated_at = NOW() WHERE ticker = $1 RETURNING *`,
    [t, st]
  );
  if (!res.rows[0]) throw AppError.notFound('Không tìm thấy mã');
  return res.rows[0];
}

async function importStocks(items) {
  const list = Array.isArray(items) ? items : [];
  let upserted = 0;
  for (const row of list) {
    const ticker = String(row.ticker || '').trim().toUpperCase();
    const name = String(row.name || ticker).trim();
    if (!ticker) continue;
    
    const exchange = row.exchange ? String(row.exchange).trim() : null;
    const status = row.status ? String(row.status).trim() : 'active';
    const sector_id = row.sector_id || null;
    const ecosystem_id = row.ecosystem_id || null;
    const shares_outstanding = row.shares_outstanding || 0;
    const description = row.description ? String(row.description).trim() : null;

    await query(
      `INSERT INTO stocks (ticker, name, exchange, status, sector_id, ecosystem_id, shares_outstanding, description)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT (ticker) DO UPDATE
         SET name = EXCLUDED.name,
             exchange = EXCLUDED.exchange,
             status = EXCLUDED.status,
             sector_id = EXCLUDED.sector_id,
             ecosystem_id = EXCLUDED.ecosystem_id,
             shares_outstanding = EXCLUDED.shares_outstanding,
             description = EXCLUDED.description,
             updated_at = NOW()`,
      [ticker, name, exchange, status, sector_id, ecosystem_id, shares_outstanding, description]
    );
    upserted += 1;
  }
  return { upserted };
}

async function exportStocks() {
  const items = await listStocks();
  const csv = ['ticker,name,exchange,status,sector_id,ecosystem_id']
    .concat(items.map((r) => [r.ticker, r.name, r.exchange, r.status, r.sector_id, r.ecosystem_id].join(',')))
    .join('\n');
  return { csv, total: items.length };
}

module.exports = {
  listStocks,
  createStock,
  updateStock,
  deleteStock,
  setStatus,
  importStocks,
  exportStocks
};
