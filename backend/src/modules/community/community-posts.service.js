'use strict';

/**
 * Community V1 Phase 1 — Post model thống nhất (SoT "Community (Cộng đồng) Architecture V1" §4).
 * MỘT bảng `social_posts` duy nhất — Feed/Timeline/Stock Detail chỉ là query khác nhau trên
 * cùng 1 bảng (§6), không phải 3 API/bảng riêng.
 *
 * Tên bảng SQL cố ý vẫn là `social_posts` (không phải `community_posts`) dù API public giờ đã
 * chuyển về đúng path /api/community/* (2026-10-03, sau khi gỡ bỏ hẳn alias community→newsRouter
 * cũ) — vì `community_posts` là tên bảng LỊCH SỬ đã đổi thành `news_posts` (migration 063, thời
 * "Cộng đồng = Tin tức"). Dùng lại đúng tên đó cho bảng MỚI (ý nghĩa khác hẳn) sẽ gây lẫn lộn khi
 * tra cứu lịch sử migration sau này — tên bảng SQL (nội bộ) và tên API public (đối ngoại) KHÔNG
 * bắt buộc phải trùng nhau, miễn API đúng và rõ nghĩa là đủ.
 */
const { query } = require('../../core/database/connection');
const { AppError } = require('../../shared/exceptions/app-error');

const MAX_LIMIT = 50;
const MAX_CONTENT_LEN = 4000;
const MAX_STOCK_TAGS = 10;
const POST_TYPES = ['status', 'stock_view', 'share', 'reply_as_post'];
const SOURCE_TYPES = ['news', 'story', 'post', 'chart'];

function clampLimit(n, fallback) {
  const v = Number(n);
  if (!Number.isFinite(v) || v < 1) return fallback;
  return Math.min(Math.floor(v), MAX_LIMIT);
}

function normalizeStockTags(raw) {
  if (!Array.isArray(raw)) return [];
  const out = [];
  const seen = {};
  for (let i = 0; i < raw.length && out.length < MAX_STOCK_TAGS; i++) {
    const t = String(raw[i] || '').trim().toUpperCase();
    if (!t || seen[t]) continue;
    seen[t] = true;
    out.push(t);
  }
  return out;
}

const AUTHOR_COLS = `
  u.id AS author_id,
  u.display_name AS author_display_name,
  u.nickname AS author_nickname,
  u.subscription_tier AS author_tier
`;

function rowToPost(row) {
  if (!row) return null;
  return {
    id: row.id,
    author: {
      id: row.author_id,
      display_name: row.author_display_name || row.author_nickname || 'Thành viên',
      tier: row.author_tier || 'free'
    },
    content: row.content || '',
    post_type: row.post_type,
    source_type: row.source_type || null,
    source_id: row.source_id || null,
    stock_tags: row.stock_tags || [],
    visibility: row.visibility,
    stats: {
      likes: Number(row.likes_count) || 0,
      comments: Number(row.comments_count) || 0,
      shares: Number(row.shares_count) || 0
    },
    viewer_liked: false,
    created_at: row.created_at ? new Date(row.created_at).toISOString() : null,
    updated_at: row.updated_at ? new Date(row.updated_at).toISOString() : null
  };
}

/**
 * Gắn `viewer_liked` cho danh sách Post trả về từ Feed/Timeline (getPostById đã tự làm việc này
 * riêng — xem dưới). Dùng 1 query riêng theo lô id (không nhúng vào STATS_SELECT) để khỏi phải
 * tính lại vị trí placeholder $N mỗi khi buildCursorWhere/limit đổi số lượng param — an toàn hơn,
 * rẻ hơn 1 query so với rủi ro lệch tham số trong câu SELECT chính.
 */
async function attachViewerLiked(result, viewer) {
  if (!viewer || !viewer.id || !result.items.length) return result;
  const ids = result.items.map((p) => p.id);
  const res = await query(
    `SELECT entity_id FROM interaction_likes WHERE entity_type = 'communitypost' AND user_id = $1 AND entity_id = ANY($2::text[])`,
    [viewer.id, ids]
  );
  const liked = {};
  res.rows.forEach((r) => { liked[r.entity_id] = true; });
  result.items.forEach((p) => { p.viewer_liked = !!liked[p.id]; });
  return result;
}

const STATS_SELECT = `
  (SELECT COUNT(*)::int FROM interaction_likes il WHERE il.entity_type = 'communitypost' AND il.entity_id = p.id::text) AS likes_count,
  (SELECT COUNT(*)::int FROM interaction_comments ic WHERE ic.entity_type = 'communitypost' AND ic.entity_id = p.id::text AND ic.deleted_at IS NULL) AS comments_count,
  (SELECT COUNT(*)::int FROM social_posts sp2 WHERE sp2.source_type = 'post' AND sp2.source_id = p.id::text AND sp2.status = 'published') AS shares_count
`;

async function createPost(user, input) {
  const authorId = user && user.id;
  if (!authorId) throw AppError.unauthorized('Cần đăng nhập');

  const content = String((input && input.content) || '').trim();
  const postType = POST_TYPES.indexOf(input && input.post_type) >= 0 ? input.post_type : 'status';
  const sourceType = input && input.source_type && SOURCE_TYPES.indexOf(input.source_type) >= 0 ? input.source_type : null;
  const sourceId = sourceType ? String((input && input.source_id) || '').trim() || null : null;
  const stockTags = normalizeStockTags(input && input.stock_tags);
  const visibility = (input && input.visibility) === 'followers' ? 'followers' : 'public';

  if (!content && !sourceType) {
    throw AppError.badRequest('POST_EMPTY', 'Viết nội dung hoặc gắn nguồn chia sẻ trước khi đăng');
  }
  if (content.length > MAX_CONTENT_LEN) {
    throw AppError.badRequest('POST_TOO_LONG', 'Nội dung tối đa ' + MAX_CONTENT_LEN + ' ký tự');
  }
  if (sourceType && !sourceId) {
    throw AppError.badRequest('POST_SOURCE_ID_REQUIRED', 'Thiếu id nguồn chia sẻ');
  }
  if (postType === 'share' && sourceType === 'post') {
    const origin = await query(`SELECT id FROM social_posts WHERE id = $1 AND status = 'published'`, [sourceId]);
    if (!origin.rows[0]) throw AppError.notFound('Không tìm thấy bài viết được chia sẻ');
  }

  const res = await query(
    `INSERT INTO social_posts (author_id, content, post_type, source_type, source_id, stock_tags, visibility)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id`,
    [authorId, content, postType, sourceType, sourceId, stockTags, visibility]
  );
  return getPostById(res.rows[0].id, user);
}

async function getPostById(id, viewer) {
  const res = await query(
    `SELECT p.id, p.content, p.post_type, p.source_type, p.source_id, p.stock_tags, p.visibility,
            p.created_at, p.updated_at, ${AUTHOR_COLS}, ${STATS_SELECT}
     FROM social_posts p
     JOIN users u ON u.id = p.author_id
     WHERE p.id = $1 AND p.status = 'published'`,
    [id]
  );
  if (!res.rows[0]) throw AppError.notFound('Không tìm thấy bài viết');
  const post = rowToPost(res.rows[0]);
  if (viewer && viewer.id) {
    const liked = await query(
      `SELECT 1 FROM interaction_likes WHERE entity_type = 'communitypost' AND entity_id = $1 AND user_id = $2`,
      [id, viewer.id]
    );
    post.viewer_liked = !!liked.rows[0];
  }
  return post;
}

async function deletePost(id, user) {
  const uid = user && user.id;
  if (!uid) throw AppError.unauthorized('Cần đăng nhập');
  const res = await query(
    `UPDATE social_posts SET status = 'deleted', updated_at = NOW()
     WHERE id = $1 AND author_id = $2 AND status = 'published'
     RETURNING id`,
    [id, uid]
  );
  if (!res.rows[0]) throw AppError.notFound('Không tìm thấy bài viết hoặc không có quyền xoá');
  return { ok: true, id: id };
}

function buildCursorWhere(params, cursorField, cursor) {
  if (!cursor) return '';
  const parts = String(cursor).split('|');
  const ts = parts[0];
  const id = parts[1];
  if (!ts || !id) return '';
  params.push(ts, id);
  return ` AND (${cursorField}, p.id) < ($${params.length - 1}::timestamptz, $${params.length}::uuid)`;
}

function paginate(rows, limit) {
  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  const last = page[page.length - 1];
  const nextCursor = hasMore && last
    ? new Date(last.created_at).toISOString() + '|' + last.id
    : null;
  return { items: page.map(rowToPost), next_cursor: nextCursor, limit: limit };
}

/**
 * GET /community/feed — mode=latest|following|trending (§6). `trending` dùng thứ tự mới nhất làm
 * mặc định ở Phase 1 — FeedScore thật (DirectFollow + InteractionWeight + Recency + Engagement)
 * là Phase 3 riêng (§9), không đoán số trước khi có traffic thật (đúng nguyên tắc SoT §5).
 */
async function getFeed(opts, viewer) {
  opts = opts || {};
  const limit = clampLimit(opts.limit, 10);
  const mode = ['following', 'trending', 'latest'].indexOf(opts.mode) >= 0 ? opts.mode : 'latest';

  if (mode === 'following') {
    if (!viewer || !viewer.id) {
      return { items: [], next_cursor: null, limit: limit, mode: mode };
    }
    const params = [viewer.id];
    let sql =
      `SELECT p.id, p.content, p.post_type, p.source_type, p.source_id, p.stock_tags, p.visibility,
              p.created_at, p.updated_at, ${AUTHOR_COLS}, ${STATS_SELECT}
       FROM social_posts p
       JOIN users u ON u.id = p.author_id
       WHERE p.status = 'published' AND p.visibility = 'public'
         AND p.author_id IN (SELECT followee_id FROM user_follows WHERE follower_id = $1)`;
    sql += buildCursorWhere(params, 'p.created_at', opts.cursor);
    params.push(limit + 1);
    sql += ` ORDER BY p.created_at DESC, p.id DESC LIMIT $${params.length}`;
    const res = await query(sql, params);
    const out = paginate(res.rows, limit);
    out.mode = mode;
    return attachViewerLiked(out, viewer);
  }

  const params = [];
  let sql =
    `SELECT p.id, p.content, p.post_type, p.source_type, p.source_id, p.stock_tags, p.visibility,
            p.created_at, p.updated_at, ${AUTHOR_COLS}, ${STATS_SELECT}
     FROM social_posts p
     JOIN users u ON u.id = p.author_id
     WHERE p.status = 'published' AND p.visibility = 'public'`;
  sql += buildCursorWhere(params, 'p.created_at', opts.cursor);
  params.push(limit + 1);
  sql += ` ORDER BY p.created_at DESC, p.id DESC LIMIT $${params.length}`;
  const res = await query(sql, params);
  const out = paginate(res.rows, limit);
  out.mode = mode;
  return attachViewerLiked(out, viewer);
}

/** GET /community/users/:id/timeline — toàn bộ Post của 1 author (§6). */
async function getUserTimeline(authorId, opts, viewer) {
  opts = opts || {};
  const limit = clampLimit(opts.limit, 10);
  const isOwner = !!(viewer && viewer.id && String(viewer.id) === String(authorId));
  const params = [authorId];
  let sql =
    `SELECT p.id, p.content, p.post_type, p.source_type, p.source_id, p.stock_tags, p.visibility,
            p.created_at, p.updated_at, ${AUTHOR_COLS}, ${STATS_SELECT}
     FROM social_posts p
     JOIN users u ON u.id = p.author_id
     WHERE p.status = 'published' AND p.author_id = $1`;
  if (!isOwner) sql += ` AND p.visibility = 'public'`;
  sql += buildCursorWhere(params, 'p.created_at', opts.cursor);
  params.push(limit + 1);
  sql += ` ORDER BY p.created_at DESC, p.id DESC LIMIT $${params.length}`;
  const res = await query(sql, params);
  return attachViewerLiked(paginate(res.rows, limit), viewer);
}

/** GET /community/stocks/:ticker/posts — Thảo luận theo mã, phục vụ Stock Detail tab Discussion (§6). */
async function getStockPosts(ticker, opts) {
  opts = opts || {};
  const limit = clampLimit(opts.limit, 10);
  const tk = String(ticker || '').trim().toUpperCase();
  if (!tk) throw AppError.badRequest('STOCK_TICKER_REQUIRED', 'Thiếu mã cổ phiếu');
  const params = [tk];
  let sql =
    `SELECT p.id, p.content, p.post_type, p.source_type, p.source_id, p.stock_tags, p.visibility,
            p.created_at, p.updated_at, ${AUTHOR_COLS}, ${STATS_SELECT}
     FROM social_posts p
     JOIN users u ON u.id = p.author_id
     WHERE p.status = 'published' AND p.visibility = 'public' AND p.stock_tags @> ARRAY[$1]::text[]`;
  sql += buildCursorWhere(params, 'p.created_at', opts.cursor);
  params.push(limit + 1);
  sql += ` ORDER BY p.created_at DESC, p.id DESC LIMIT $${params.length}`;
  const res = await query(sql, params);
  return paginate(res.rows, limit);
}

module.exports = {
  createPost,
  getPostById,
  deletePost,
  getFeed,
  getUserTimeline,
  getStockPosts,
  POST_TYPES,
  SOURCE_TYPES
};
