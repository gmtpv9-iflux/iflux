'use strict';

const { query } = require('../../core/database/connection');
const { AppError } = require('../../shared/exceptions/app-error');

const MAX_LIMIT = 30;

function clampLimit(n) {
  const v = Number(n);
  if (!Number.isFinite(v) || v < 1) return 15;
  return Math.min(Math.floor(v), MAX_LIMIT);
}

function rowToDto(row) {
  return {
    id: row.id,
    templateCode: row.template_code,
    title: row.title,
    body: row.body || '',
    icon: row.icon || 'ti-bell',
    href: row.href || '',
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
    read: !!row.read_at
  };
}

async function summary(userId) {
  const res = await query(
    `SELECT COUNT(*)::int AS n FROM user_inbox_notifications
     WHERE user_id = $1 AND read_at IS NULL`,
    [userId]
  );
  return { unreadCount: (res.rows[0] && res.rows[0].n) || 0 };
}

async function listInbox(userId, opts) {
  opts = opts || {};
  const limit = clampLimit(opts.limit);
  const params = [userId];
  let sql =
    `SELECT id, template_code, title, body, icon, href, read_at, created_at
     FROM user_inbox_notifications
     WHERE user_id = $1`;
  if (opts.cursor) {
    const parts = String(opts.cursor).split('|');
    const ts = parts[0];
    const id = parts[1];
    if (ts && id) {
      params.push(ts, id);
      sql += ` AND (created_at, id) < ($${params.length - 1}::timestamptz, $${params.length}::uuid)`;
    }
  }
  params.push(limit + 1);
  sql += ` ORDER BY created_at DESC, id DESC LIMIT $${params.length}`;
  const res = await query(sql, params);
  const rows = res.rows || [];
  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  const last = page[page.length - 1];
  return {
    items: page.map(rowToDto),
    next_cursor: hasMore && last
      ? new Date(last.created_at).toISOString() + '|' + last.id
      : null,
    limit: limit
  };
}

async function pushToUser(userId, item) {
  if (!userId || !item) return null;
  const dedupe = item.dedupeKey || item.dedupe_key || null;
  try {
    const res = await query(
      `INSERT INTO user_inbox_notifications
         (user_id, template_code, title, body, icon, href, dedupe_key)
       SELECT $1::uuid, $2::varchar, $3::varchar, $4::text, $5::varchar, $6::text, $7::varchar
       WHERE $7::varchar IS NULL
          OR NOT EXISTS (
            SELECT 1 FROM user_inbox_notifications u
            WHERE u.user_id = $1::uuid AND u.dedupe_key = $7::varchar
          )
       RETURNING id, template_code, title, body, icon, href, read_at, created_at`,
      [
        userId,
        item.templateCode || item.template_code || 'SYS',
        String(item.title || 'Thông báo').slice(0, 255),
        String(item.body || '').slice(0, 2000),
        String(item.icon || 'ti-bell').slice(0, 64),
        String(item.href || '').slice(0, 2000),
        dedupe
      ]
    );
    return res.rows[0] ? rowToDto(res.rows[0]) : null;
  } catch (err) {
    throw err;
  }
}

async function markRead(userId, id) {
  const res = await query(
    `UPDATE user_inbox_notifications
     SET read_at = COALESCE(read_at, NOW())
     WHERE user_id = $1 AND id = $2
     RETURNING id`,
    [userId, id]
  );
  if (!res.rows[0]) throw AppError.notFound('Không tìm thấy thông báo');
  return { ok: true };
}

async function markAllRead(userId) {
  await query(
    `UPDATE user_inbox_notifications
     SET read_at = NOW()
     WHERE user_id = $1 AND read_at IS NULL`,
    [userId]
  );
  return { ok: true };
}

/**
 * Users có ticker trong watchlist_json.memberships (keys).
 * Bound LIMIT — không full dump.
 */
async function findWatchlistUserIdsByTicker(ticker, limit) {
  const tk = String(ticker || '').toUpperCase();
  if (!tk) return [];
  const lim = Math.min(Math.max(Number(limit) || 200, 1), 500);
  const res = await query(
    `SELECT user_id
     FROM user_data
     WHERE watchlist_json IS NOT NULL
       AND watchlist_json->'memberships' ? $1
     LIMIT $2`,
    [tk, lim]
  );
  return (res.rows || []).map(function (r) { return r.user_id; });
}

module.exports = {
  summary,
  listInbox,
  pushToUser,
  markRead,
  markAllRead,
  findWatchlistUserIdsByTicker,
  MAX_LIMIT
};
