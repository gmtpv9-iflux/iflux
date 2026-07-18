#!/usr/bin/env node
'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { loadConfig } = require('../src/config');
const { initPool, closePool } = require('../src/core/database/connection');
const { getLogger, createLogger } = require('../src/core/logger/logger');

async function main() {
  const config = loadConfig();
  createLogger(config);
  const logger = getLogger();
  initPool(config);

  logger.info('Seeder framework ready — no bootstrap seeds defined');
  await closePool();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
