'use strict';

const { query } = require('../../core/database/connection');
const { AppError } = require('../../shared/exceptions/app-error');

async function listFormulas() {
  const res = await query('SELECT * FROM market_formulas ORDER BY code ASC');
  return res.rows || [];
}

async function updateFormula(id, input) {
  const cur = await query('SELECT * FROM market_formulas WHERE id = $1', [id]);
  if (!cur.rows[0]) throw AppError.notFound('Không tìm thấy công thức');
  const name = input.name != null ? String(input.name).trim() : cur.rows[0].name;
  const formulaText =
    input.formula_text != null ? String(input.formula_text) : cur.rows[0].formula_text;
  const status = input.status != null ? String(input.status).trim() : cur.rows[0].status;
  const res = await query(
    `UPDATE market_formulas
     SET name = $2, formula_text = $3, status = $4, updated_at = NOW()
     WHERE id = $1 RETURNING *`,
    [id, name, formulaText, status]
  );
  return res.rows[0];
}

async function recalculateFormula(id) {
  const cur = await query('SELECT * FROM market_formulas WHERE id = $1', [id]);
  if (!cur.rows[0]) throw AppError.notFound('Không tìm thấy công thức');
  const res = await query(
    `UPDATE market_formulas
     SET last_recalc_at = NOW(), updated_at = NOW()
     WHERE id = $1 RETURNING *`,
    [id]
  );
  return res.rows[0];
}

async function getLotConfig() {
  const res = await query(`SELECT * FROM market_lot_config WHERE code = 'defaults' LIMIT 1`);
  return res.rows[0] || { code: 'defaults', payload: {} };
}

async function updateLotConfig(payload) {
  const res = await query(
    `UPDATE market_lot_config
     SET payload = $1::jsonb, updated_at = NOW()
     WHERE code = 'defaults'
     RETURNING *`,
    [JSON.stringify(payload || {})]
  );
  if (!res.rows[0]) {
    const ins = await query(
      `INSERT INTO market_lot_config (code, payload) VALUES ('defaults', $1::jsonb) RETURNING *`,
      [JSON.stringify(payload || {})]
    );
    return ins.rows[0];
  }
  return res.rows[0];
}

async function getRankingConfig() {
  const res = await query(`SELECT * FROM market_ranking_config WHERE code = 'weights' LIMIT 1`);
  return res.rows[0] || { code: 'weights', payload: {} };
}

async function updateRankingConfig(payload) {
  const res = await query(
    `UPDATE market_ranking_config
     SET payload = $1::jsonb, updated_at = NOW()
     WHERE code = 'weights'
     RETURNING *`,
    [JSON.stringify(payload || {})]
  );
  if (!res.rows[0]) {
    const ins = await query(
      `INSERT INTO market_ranking_config (code, payload) VALUES ('weights', $1::jsonb) RETURNING *`,
      [JSON.stringify(payload || {})]
    );
    return ins.rows[0];
  }
  return res.rows[0];
}

async function listSessions() {
  const res = await query('SELECT * FROM market_ops_sessions ORDER BY code ASC');
  return res.rows || [];
}

async function updateSession(id, input) {
  const cur = await query('SELECT * FROM market_ops_sessions WHERE id = $1', [id]);
  if (!cur.rows[0]) throw AppError.notFound('Không tìm thấy phiên');
  const name = input.name != null ? String(input.name).trim() : cur.rows[0].name;
  const openTime = input.open_time != null ? String(input.open_time).trim() : cur.rows[0].open_time;
  const closeTime =
    input.close_time != null ? String(input.close_time).trim() : cur.rows[0].close_time;
  const isActive =
    input.is_active != null ? !!input.is_active : cur.rows[0].is_active;
  const res = await query(
    `UPDATE market_ops_sessions
     SET name = $2, open_time = $3, close_time = $4, is_active = $5, updated_at = NOW()
     WHERE id = $1 RETURNING *`,
    [id, name, openTime, closeTime, isActive]
  );
  return res.rows[0];
}

async function listMissingTicks() {
  const res = await query(
    'SELECT * FROM market_ops_missing_ticks ORDER BY gap_count DESC, ticker ASC'
  );
  return res.rows || [];
}

async function listCorrections() {
  const res = await query('SELECT * FROM market_ops_corrections ORDER BY updated_at DESC');
  return res.rows || [];
}

async function updateCorrection(id, input) {
  const cur = await query('SELECT * FROM market_ops_corrections WHERE id = $1', [id]);
  if (!cur.rows[0]) throw AppError.notFound('Không tìm thấy chỉnh sửa');
  const status = input.status != null ? String(input.status).trim() : cur.rows[0].status;
  const newValue = input.new_value != null ? String(input.new_value) : cur.rows[0].new_value;
  const note = input.note != null ? String(input.note) : cur.rows[0].note;
  const res = await query(
    `UPDATE market_ops_corrections
     SET status = $2, new_value = $3, note = $4, updated_at = NOW()
     WHERE id = $1 RETURNING *`,
    [id, status, newValue, note]
  );
  return res.rows[0];
}

module.exports = {
  listFormulas,
  updateFormula,
  recalculateFormula,
  getLotConfig,
  updateLotConfig,
  getRankingConfig,
  updateRankingConfig,
  listSessions,
  updateSession,
  listMissingTicks,
  listCorrections,
  updateCorrection
};
