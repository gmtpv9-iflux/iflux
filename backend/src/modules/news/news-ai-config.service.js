'use strict';

const { query } = require('../../core/database/connection');

const SCOPE = 'news_ai_config';
const DEFAULTS = { enabled: false, auto_publish: false, model: null, price_per_1k_input_usd: 0, price_per_1k_output_usd: 0, daily_budget_usd: 0 };

async function getConfig() {
  const row = (await query(`SELECT payload FROM system_admin_kv WHERE scope=$1 AND code='primary'`, [SCOPE])).rows[0];
  return Object.assign({}, DEFAULTS, row ? row.payload : {});
}

async function setConfig(payload) {
  const current = await getConfig();
  const next = Object.assign({}, current, payload || {});
  const res = await query(
    `UPDATE system_admin_kv SET payload=$2::jsonb, updated_at=NOW() WHERE scope=$1 AND code='primary' RETURNING payload`,
    [SCOPE, JSON.stringify(next)]
  );
  if (res.rows[0]) return res.rows[0].payload;
  const ins = await query(
    `INSERT INTO system_admin_kv (scope,code,payload) VALUES ($1,'primary',$2::jsonb) RETURNING payload`,
    [SCOPE, JSON.stringify(next)]
  );
  return ins.rows[0].payload;
}

module.exports = { getConfig, setConfig };
