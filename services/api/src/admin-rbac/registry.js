'use strict';

/**
 * Permission Registry — load Contract, sync qua hàm DEFINER, listRegistered.
 * Không INSERT/UPDATE trực tiếp admin_permissions.
 */

const fs = require('fs');
const path = require('path');
const { getPool } = require('../db');

const ACTION_TYPE = {
  view: 'READ',
  create: 'CREATE',
  edit: 'UPDATE',
  delete: 'DELETE',
  disable: 'STATUS_CHANGE',
  enable: 'STATUS_CHANGE',
  reset_password: 'RESET',
  assign_role: 'GRANT',
  clone: 'CREATE',
  assign: 'GRANT'
};

const CONTRACTS_DIR = path.join(__dirname, 'contracts');

let loaded = [];

function deriveType(action) {
  const type = ACTION_TYPE[action];
  if (!type) {
    throw new Error('registry: action không có type: ' + action);
  }
  return type;
}

function loadContracts(includeFixtures) {
  const names = fs.readdirSync(CONTRACTS_DIR).filter(function (name) {
    if (!name.endsWith('.js')) return false;
    if (name.endsWith('.fixture.js')) return !!includeFixtures;
    return true;
  });
  names.sort();
  return names.map(function (name) {
    return require(path.join(CONTRACTS_DIR, name));
  });
}

function flatten(contracts) {
  const items = [];
  contracts.forEach(function (contract) {
    (contract.register || []).forEach(function (row) {
      const type = deriveType(row.action);
      items.push({
        key: row.key,
        domain: contract.domain,
        feature: row.feature,
        action: row.action,
        label: row.label,
        description: row.description || null,
        sort: row.sort || 0,
        type: type,
        module: contract.domain,
        moduleLabel: contract.moduleLabel || contract.domain,
        page: row.feature,
        pageLabel: row.pageLabel || row.feature,
        navPageIdentity: row.navPageIdentity || null
      });
    });
  });
  return items;
}

async function sync(options) {
  const includeFixtures =
    !!(options && options.includeFixtures) ||
    process.env.IFLUX_LOAD_PERMISSION_FIXTURES === '1';
  const contracts = loadContracts(includeFixtures);
  loaded = flatten(contracts);
  const pool = getPool();
  for (let i = 0; i < loaded.length; i++) {
    const item = loaded[i];
    await pool.query(
      'SELECT registry_sync_permission($1, $2, $3, $4, $5, $6, $7, $8)',
      [
        item.key,
        item.module,
        item.moduleLabel,
        item.page,
        item.pageLabel,
        item.action,
        item.label,
        item.sort
      ]
    );
  }
  return loaded;
}

function listRegistered() {
  return loaded.slice();
}

module.exports = { sync, listRegistered, deriveType };
