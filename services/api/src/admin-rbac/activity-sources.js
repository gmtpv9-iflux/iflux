'use strict';

/**
 * Activity Source Registry — Phase 02 đúng một nguồn.
 * Phase sau chỉ append phần tử. Một hàm hasActivity. Không cache.
 */

const sources = [{ table: 'admin_audit_log', column: 'admin_id' }];

async function hasActivity(client, accountId) {
  for (let i = 0; i < sources.length; i++) {
    const src = sources[i];
    const res = await client.query(
      'SELECT 1 FROM ' + src.table + ' WHERE ' + src.column + ' = $1 LIMIT 1',
      [accountId]
    );
    if (res.rows.length) return true;
  }
  return false;
}

module.exports = { sources, hasActivity };
