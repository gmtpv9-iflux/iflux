'use strict';

const fs = require('fs');
const path = require('path');
const { getLogger } = require('../logger/logger');

let configRef = null;

function initStorage(config) {
  configRef = config;
  if (config.STORAGE_DRIVER === 'local') {
    const root = path.resolve(config.STORAGE_LOCAL_PATH);
    fs.mkdirSync(root, { recursive: true });
    getLogger().info({ root }, 'Local storage initialized');
  }
}

function getStorageRoot() {
  if (!configRef) throw new Error('Storage not initialized');
  if (configRef.STORAGE_DRIVER === 'local') {
    return path.resolve(configRef.STORAGE_LOCAL_PATH);
  }
  throw new Error(`Storage driver "${configRef.STORAGE_DRIVER}" not configured in bootstrap phase`);
}

async function putObject(relativePath, buffer) {
  const fullPath = path.join(getStorageRoot(), relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  await fs.promises.writeFile(fullPath, buffer);
  return { path: relativePath, driver: configRef.STORAGE_DRIVER };
}

async function getObject(relativePath) {
  const fullPath = path.join(getStorageRoot(), relativePath);
  return fs.promises.readFile(fullPath);
}

module.exports = { initStorage, getStorageRoot, putObject, getObject };
