'use strict';

const { query } = require('../../core/database/connection');
const { AppError } = require('../../shared/exceptions/app-error');

async function getConfigurableTypeRows() {
  const res = await query(
    `SELECT code, admin_code, name, group_label
     FROM notification_types
     WHERE group_label IS NOT NULL
       AND enabled = true
       AND admin_code NOT LIKE 'NOTIF-ADM-%'
     ORDER BY admin_code ASC`
  );
  return res.rows || [];
}

async function assertTypeConfigurable(typeCode) {
  const res = await query(
    `SELECT code, group_label, enabled
     FROM notification_types
     WHERE code = $1`,
    [typeCode]
  );
  const row = res.rows[0];
  if (!row) {
    throw AppError.badRequest('INVALID_TYPE', 'Loại thông báo không tồn tại: ' + typeCode);
  }
  if (!row.group_label) {
    throw AppError.badRequest('TYPE_NOT_CONFIGURABLE', 'Loại thông báo không cho phép bật/tắt: ' + typeCode);
  }
  if (row.enabled === false) {
    throw AppError.badRequest('TYPE_DISABLED', 'Loại thông báo đã tắt trên registry: ' + typeCode);
  }
  return row;
}

/**
 * B5: group_label NULL → always deliver.
 * Configurable types: check user_notification_type_preferences (default ON).
 */
async function canDeliver(userId, typeCode) {
  if (!userId || !typeCode) return false;

  const typeRes = await query(
    `SELECT group_label, enabled FROM notification_types WHERE code = $1`,
    [typeCode]
  );
  const typeRow = typeRes.rows[0];
  if (!typeRow || typeRow.enabled === false) return false;
  if (!typeRow.group_label) return true;

  const prefRes = await query(
    `SELECT enabled FROM user_notification_type_preferences
     WHERE user_id = $1 AND type_code = $2`,
    [userId, typeCode]
  );
  if (!prefRes.rows[0]) return true;
  return prefRes.rows[0].enabled !== false;
}

async function listForUser(userId) {
  const types = await getConfigurableTypeRows();
  const prefRes = await query(
    `SELECT type_code, enabled FROM user_notification_type_preferences WHERE user_id = $1`,
    [userId]
  );
  const prefMap = Object.create(null);
  (prefRes.rows || []).forEach(function (row) {
    prefMap[row.type_code] = row.enabled !== false;
  });

  const groupsMap = Object.create(null);
  types.forEach(function (t) {
    const gk = t.group_label;
    if (!groupsMap[gk]) {
      groupsMap[gk] = { key: gk, label: gk, types: [] };
    }
    groupsMap[gk].types.push({
      type_code: t.code,
      admin_code: t.admin_code,
      name: t.name,
      enabled: prefMap[t.code] !== undefined ? prefMap[t.code] : true
    });
  });

  const groups = Object.keys(groupsMap)
    .sort(function (a, b) {
      var minA = groupsMap[a].types[0] ? groupsMap[a].types[0].admin_code : '';
      var minB = groupsMap[b].types[0] ? groupsMap[b].types[0].admin_code : '';
      return String(minA).localeCompare(String(minB));
    })
    .map(function (k) { return groupsMap[k]; });

  return { groups: groups };
}

async function patchForUser(userId, patch) {
  patch = patch || {};
  const items = Array.isArray(patch.items) ? patch.items : (Array.isArray(patch) ? patch : null);
  if (!items || !items.length) {
    throw AppError.badRequest('INVALID_PAYLOAD', 'Cần mảng items { type_code, enabled }');
  }

  for (let i = 0; i < items.length; i++) {
    const item = items[i] || {};
    if (item.bucket || item.preference_bucket || item.preference_group) {
      throw AppError.badRequest('INVALID_PAYLOAD', 'Bucket/group legacy đã retire — dùng type_code');
    }
    const typeCode = item.type_code || item.code;
    if (!typeCode) {
      throw AppError.badRequest('INVALID_PAYLOAD', 'Thiếu type_code');
    }
    await assertTypeConfigurable(typeCode);
    const enabled = item.enabled !== false;
    await query(
      `INSERT INTO user_notification_type_preferences (user_id, type_code, enabled, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (user_id, type_code)
       DO UPDATE SET enabled = EXCLUDED.enabled, updated_at = NOW()`,
      [userId, typeCode, enabled]
    );
  }

  return listForUser(userId);
}

module.exports = {
  canDeliver,
  listForUser,
  patchForUser,
  assertTypeConfigurable
};
