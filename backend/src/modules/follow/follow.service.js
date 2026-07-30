'use strict';

const { query } = require('../../core/database/connection');
const { AppError } = require('../../shared/exceptions/app-error');

const MAX_LIMIT = 50;

function clampLimit(n, fallback) {
  const v = Number(n);
  if (!Number.isFinite(v) || v < 1) return fallback;
  return Math.min(Math.floor(v), MAX_LIMIT);
}

async function follow(followerId, followeeId) {
  if (!followerId || !followeeId) throw AppError.badRequest('FOLLOW_IDS_REQUIRED', 'Thiếu id');
  if (String(followerId) === String(followeeId)) {
    throw AppError.badRequest('FOLLOW_SELF', 'Không thể theo dõi chính mình');
  }
  await query(
    `INSERT INTO user_follows (follower_id, followee_id)
     VALUES ($1, $2)
     ON CONFLICT DO NOTHING`,
    [followerId, followeeId]
  );
  return { following: true };
}

async function unfollow(followerId, followeeId) {
  await query(
    `DELETE FROM user_follows WHERE follower_id = $1 AND followee_id = $2`,
    [followerId, followeeId]
  );
  return { following: false };
}

async function exists(followerId, followeeId) {
  const res = await query(
    `SELECT 1 FROM user_follows WHERE follower_id = $1 AND followee_id = $2 LIMIT 1`,
    [followerId, followeeId]
  );
  return { following: !!res.rows[0] };
}

async function counts(userId) {
  const res = await query(
    `SELECT
       (SELECT COUNT(*)::int FROM user_follows WHERE followee_id = $1) AS followers,
       (SELECT COUNT(*)::int FROM user_follows WHERE follower_id = $1) AS following,
       (SELECT COUNT(*)::int FROM community_posts
         WHERE user_id = $1 AND status IN ('published', 'published_rss')) AS posts`,
    [userId]
  );
  const row = res.rows[0] || {};
  return {
    followers: row.followers || 0,
    following: row.following || 0,
    posts: row.posts || 0
  };
}

/** Cursor = created_at ISO + followee_id */
async function listFollowing(followerId, opts) {
  opts = opts || {};
  const limit = clampLimit(opts.limit, 20);
  const params = [followerId];
  let sql =
    `SELECT followee_id, created_at
     FROM user_follows
     WHERE follower_id = $1`;
  if (opts.cursor) {
    const parts = String(opts.cursor).split('|');
    const ts = parts[0];
    const id = parts[1];
    if (ts && id) {
      params.push(ts, id);
      sql += ` AND (created_at, followee_id) < ($${params.length - 1}::timestamptz, $${params.length}::uuid)`;
    }
  }
  params.push(limit + 1);
  sql += ` ORDER BY created_at DESC, followee_id DESC LIMIT $${params.length}`;
  const res = await query(sql, params);
  const rows = res.rows || [];
  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  const last = page[page.length - 1];
  const nextCursor = hasMore && last
    ? new Date(last.created_at).toISOString() + '|' + last.followee_id
    : null;
  return {
    items: page.map(function (r) {
      return {
        id: r.followee_id,
        created_at: r.created_at ? new Date(r.created_at).toISOString() : null
      };
    }),
    next_cursor: nextCursor,
    limit: limit
  };
}

async function listFollowerIds(followeeId, limit) {
  const lim = clampLimit(limit, 200);
  const res = await query(
    `SELECT follower_id FROM user_follows
     WHERE followee_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [followeeId, lim]
  );
  return (res.rows || []).map(function (r) { return r.follower_id; });
}

module.exports = {
  follow,
  unfollow,
  exists,
  counts,
  listFollowing,
  listFollowerIds,
  MAX_LIMIT
};
