'use strict';

const fs = require('fs');
const path = require('path');
const { getPool } = require('./connection');

async function ensureMigrationsTable() {
  await getPool().query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      filename VARCHAR(255) UNIQUE NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function getAppliedMigrations() {
  const res = await getPool().query('SELECT filename FROM schema_migrations ORDER BY id');
  return new Set(res.rows.map((r) => r.filename));
}

async function applyMigration(filename, sql) {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [filename]);
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function runMigrations(migrationsDir) {
  await ensureMigrationsTable();
  const applied = await getAppliedMigrations();
  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  const pending = files.filter((f) => !applied.has(f));
  for (const file of pending) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    await applyMigration(file, sql);
  }
  return { applied: pending, total: files.length };
}

module.exports = { runMigrations, ensureMigrationsTable };
