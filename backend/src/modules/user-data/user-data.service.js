'use strict';

const { query } = require('../../core/database/connection');

const FIELDS = {
  watchlist: 'watchlist_json',
  alerts: 'alerts_json',
  dashboard: 'dashboard_layout_json',
  onboarding: 'onboarding_json',
  payment: 'payment_json',
  notifications: 'notifications_json',
  messages: 'messages_json'
};

async function ensureRow(userId) {
  await query(
    `INSERT INTO user_data (user_id) VALUES ($1)
     ON CONFLICT (user_id) DO NOTHING`,
    [userId]
  );
}

async function getSection(userId, section) {
  const col = FIELDS[section];
  if (!col) throw Object.assign(new Error('Invalid section'), { statusCode: 400 });
  await ensureRow(userId);
  const res = await query(`SELECT ${col} AS data, updated_at FROM user_data WHERE user_id = $1`, [userId]);
  const raw = res.rows[0]?.data;
  let data = raw;
  if (section === 'notifications') {
    data = Array.isArray(raw) ? raw : [];
  } else if (section === 'messages') {
    data = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  } else {
    data = raw || {};
  }
  return {
    data,
    updated_at: res.rows[0]?.updated_at || null
  };
}

async function putSection(userId, section, data) {
  const col = FIELDS[section];
  if (!col) throw Object.assign(new Error('Invalid section'), { statusCode: 400 });
  await ensureRow(userId);
  let payload = data;
  if (section === 'notifications') {
    payload = Array.isArray(data) ? data : [];
  } else if (section === 'messages') {
    payload = data && typeof data === 'object' && !Array.isArray(data) ? data : {};
  } else {
    payload = data || {};
  }
  const res = await query(
    `UPDATE user_data SET ${col} = $2::jsonb, updated_at = NOW()
     WHERE user_id = $1
     RETURNING updated_at`,
    [userId, JSON.stringify(payload)]
  );
  return { updated_at: res.rows[0]?.updated_at || new Date().toISOString() };
}

async function getAll(userId) {
  await ensureRow(userId);
  const res = await query(
    `SELECT watchlist_json, alerts_json, dashboard_layout_json, onboarding_json, payment_json,
            notifications_json, messages_json, updated_at
     FROM user_data WHERE user_id = $1`,
    [userId]
  );
  const row = res.rows[0] || {};
  return {
    watchlist: row.watchlist_json || {},
    alerts: row.alerts_json || {},
    dashboard: row.dashboard_layout_json || {},
    onboarding: row.onboarding_json || {},
    payment: row.payment_json || {},
    notifications: Array.isArray(row.notifications_json) ? row.notifications_json : [],
    messages: row.messages_json && typeof row.messages_json === 'object' && !Array.isArray(row.messages_json)
      ? row.messages_json
      : {},
    updated_at: row.updated_at || null
  };
}

module.exports = { getSection, putSection, getAll, FIELDS };
