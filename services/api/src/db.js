'use strict';

const { Pool } = require('pg');

let pool;

function initPool(config) {
  pool = new Pool({ connectionString: config.DATABASE_URL });
  return pool;
}

function getPool() {
  if (!pool) throw new Error('Database pool not initialized');
  return pool;
}

function closePool() {
  if (!pool) return Promise.resolve();
  const p = pool;
  pool = null;
  return p.end();
}

module.exports = { initPool, getPool, closePool };
