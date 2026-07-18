#!/usr/bin/env node
'use strict';
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { loadConfig } = require('../src/config');
const { initPool, closePool } = require('../src/core/database/connection');
const { runMigrations } = require('../src/core/database/migration-runner');

(async () => {
  initPool(loadConfig());
  const migrationsDir = path.join(__dirname, '..', 'migrations');
  const result = await runMigrations(migrationsDir);
  console.log('applied:', result.applied);
  console.log('total files:', result.total);
  await closePool();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
