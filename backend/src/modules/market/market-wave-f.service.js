'use strict';

const { query } = require('../../core/database/connection');
const { AppError } = require('../../shared/exceptions/app-error');

async function listStocks() {
  const res = await query(
    `SELECT id, ticker, name, exchange, status, updated_at
     FROM market_admin_stocks ORDER BY ticker ASC`
  );
  return res.rows || [];
}

async function createStock(input) {
  const ticker = String(input.ticker || '').trim().toUpperCase();
  const name = String(input.name || '').trim();
  if (!ticker || !name) throw AppError.badRequest('Thiếu ticker/name');
  const exchange = String(input.exchange || 'HOSE').trim();
  const status = String(input.status || 'active').trim();
  const res = await query(
    `INSERT INTO market_admin_stocks (ticker, name, exchange, status)
     VALUES ($1,$2,$3,$4) RETURNING *`,
    [ticker, name, exchange, status]
  );
  return res.rows[0];
}

async function updateStock(id, input) {
  const cur = await query('SELECT * FROM market_admin_stocks WHERE id = $1', [id]);
  if (!cur.rows[0]) throw AppError.notFound('Không tìm thấy mã');
  const name = input.name != null ? String(input.name).trim() : cur.rows[0].name;
  const exchange = input.exchange != null ? String(input.exchange).trim() : cur.rows[0].exchange;
  const status = input.status != null ? String(input.status).trim() : cur.rows[0].status;
  const res = await query(
    `UPDATE market_admin_stocks
     SET name = $2, exchange = $3, status = $4, updated_at = NOW()
     WHERE id = $1 RETURNING *`,
    [id, name, exchange, status]
  );
  return res.rows[0];
}

async function deleteStock(id) {
  const res = await query('DELETE FROM market_admin_stocks WHERE id = $1 RETURNING id', [id]);
  if (!res.rows[0]) throw AppError.notFound('Không tìm thấy mã');
  return { deleted: true, id };
}

async function setStatus(id, status) {
  const res = await query(
    `UPDATE market_admin_stocks SET status = $2, updated_at = NOW() WHERE id = $1 RETURNING *`,
    [id, status]
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
    await query(
      `INSERT INTO market_admin_stocks (ticker, name, exchange, status)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (ticker) DO UPDATE
         SET name = EXCLUDED.name,
             exchange = EXCLUDED.exchange,
             status = EXCLUDED.status,
             updated_at = NOW()`,
      [ticker, name, String(row.exchange || 'HOSE'), String(row.status || 'active')]
    );
    upserted += 1;
  }
  return { upserted };
}

async function exportStocks() {
  const items = await listStocks();
  const csv = ['ticker,name,exchange,status']
    .concat(items.map((r) => [r.ticker, r.name, r.exchange, r.status].join(',')))
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
