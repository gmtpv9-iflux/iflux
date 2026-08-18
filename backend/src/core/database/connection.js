'use strict';

const { Pool } = require('pg');

let pool = null;

function initPool(config) {
  if (pool) return pool;
  pool = new Pool({
    connectionString: config.DATABASE_URL,
    max: config.APP_ENV === 'production' ? 20 : 5
  });
  pool.on('error', (err) => {
    const { getLogger } = require('../logger/logger');
    getLogger().error({ err }, 'Unexpected PostgreSQL pool error');
  });
  return pool;
}

function getPool() {
  if (!pool) throw new Error('Database pool not initialized');
  return pool;
}

async function query(text, params) {
  return getPool().query(text, params);
}

async function ping() {
  const res = await query('SELECT 1 AS ok');
  return res.rows[0]?.ok === 1;
}

async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

module.exports = { initPool, getPool, query, ping, closePool };
