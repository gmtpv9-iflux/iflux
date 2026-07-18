#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { loadConfig } = require('../src/config');
const { initPool } = require('../src/core/database/connection');
const { runMigrations } = require('../src/core/database/migration-runner');

async function ensureDatabase(config) {
  const adminUrl = config.DATABASE_ADMIN_URL || 'postgresql://localhost:5432/postgres';
  const admin = new Pool({ connectionString: adminUrl });
  try {
    const exists = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [config.DATABASE_NAME]);
    if (!exists.rowCount) {
      await admin.query(`CREATE DATABASE ${config.DATABASE_NAME}`);
      console.log('Created database:', config.DATABASE_NAME);
    }
    const role = await admin.query('SELECT 1 FROM pg_roles WHERE rolname = $1', [config.DATABASE_USER]);
    if (!role.rowCount) {
      await admin.query(`CREATE USER ${config.DATABASE_USER} WITH PASSWORD '${config.DATABASE_PASSWORD}'`);
      console.log('Created user:', config.DATABASE_USER);
    }
    await admin.query(`GRANT ALL PRIVILEGES ON DATABASE ${config.DATABASE_NAME} TO ${config.DATABASE_USER}`);
  } finally {
    await admin.end();
  }
}

async function main() {
  const config = loadConfig();
  await ensureDatabase(config);
  initPool(config);
  const migrationsDir = path.join(__dirname, '..', 'migrations');
  const result = await runMigrations(migrationsDir);
  console.log(`Migrations: ${result.applied.length} applied (${result.total} total files).`);
  console.log('Database ready.');
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
