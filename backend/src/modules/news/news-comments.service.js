'use strict';

const { query } = require('../../core/database/connection');
const { AppError } = require('../../shared/exceptions/app-error');
const articles = require('./news-articles.service');

function rowToComment(row) {
  if (!row) return null;
  return {
    id: row.id,
    post_id: row.post_id,
    post_slug: row.post_slug || '',
    user_id: row.user_id || null,
    user_name: row.user_name || 'Thành viên',
    body: row.body || '',
    image: row.image_url || null,
    created_at: row.created_at ? new Date(row.created_at).toISOString() : null,
    likes: 0,
    shares: 0,
    replies: 0
  };
}

/**
 * Resolve bài viết Cộng đồng theo id hoặc slug.
 * Chỉ cho phép bình luận bài đang live trên User Web.
 */
async function resolvePost(idOrSlug) {
  const key = String(idOrSlug || '').trim();
  if (!key) {
    throw AppError.badRequest('COMMENT_POST_REQUIRED', 'Thiếu bài viết');
  }
  const post = await articles.getArticle(key);
  if (!post) {
    throw AppError.notFound('Không tìm thấy bài viết');
  }
  const status = post.status || '';
  if (status !== 'published' && status !== 'published_rss') {
    throw AppError.badRequest('COMMENT_POST_NOT_LIVE', 'Bài viết chưa được xuất bản');
  }
  return {
    id: String(post.id),
    slug: String((post.slug || post.payload && post.payload.slug) || post.id)
  };
}

async function listComments(idOrSlug, opts) {
  opts = opts || {};
  const post = await resolvePost(idOrSlug);
  const limit = Math.min(Math.max(Number(opts.limit) || 100, 1), 200);
  const res = await query(
    `SELECT id, post_id, post_slug, user_id, user_name, body, image_url, created_at
     FROM news_comments
     WHERE deleted_at IS NULL
       AND (post_id = $1 OR ($2 <> '' AND post_slug = $2))
     ORDER BY created_at DESC
     LIMIT $3`,
    [post.id, post.slug, limit]
  );
  return {
    post_id: post.id,
    post_slug: post.slug,
    comments: res.rows.map(rowToComment),
    total: res.rows.length
  };
}

async function countComments(postId, postSlug) {
  const res = await query(
    `SELECT COUNT(*)::int AS n
     FROM news_comments
     WHERE deleted_at IS NULL
       AND (post_id = $1 OR ($2 <> '' AND post_slug = $2))`,
    [postId, postSlug || '']
  );
  return (res.rows[0] && res.rows[0].n) || 0;
}

async function createComment(idOrSlug, user, payload) {
  const post = await resolvePost(idOrSlug);
  const body = String((payload && payload.body) || '').trim();
  const image = (payload && (payload.image || payload.image_url)) || null;
  if (!body && !image) {
    throw AppError.badRequest('COMMENT_EMPTY', 'Nhập nội dung hoặc đính kèm hình ảnh');
  }
  if (body.length > 4000) {
    throw AppError.badRequest('COMMENT_TOO_LONG', 'Bình luận tối đa 4000 ký tự');
  }
  /* image dataURL chỉ chấp nhận tạm — giới hạn kích thước */
  let imageUrl = null;
  if (image) {
    const raw = String(image);
    if (raw.length > 900000) {
      throw AppError.badRequest('COMMENT_IMAGE_TOO_LARGE', 'Ảnh đính kèm quá lớn');
    }
    imageUrl = raw;
  }

  const userId = user && user.id ? user.id : null;
  const userName = (user && (user.display_name || user.name)) || 'Thành viên';

  const res = await query(
    `INSERT INTO news_comments
       (post_id, post_slug, user_id, user_name, body, image_url)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, post_id, post_slug, user_id, user_name, body, image_url, created_at`,
    [post.id, post.slug, userId, userName, body, imageUrl]
  );

  const comment = rowToComment(res.rows[0]);
  const total = await countComments(post.id, post.slug);

  /* Đồng bộ stats.comments trên payload bài (đếm từ SoT comment) */
  try {
    await query(
      `UPDATE news_posts
       SET payload = jsonb_set(
             COALESCE(payload, '{}'::jsonb),
             '{stats,comments}',
             to_jsonb($2::int),
             true
           ),
           updated_at = NOW()
       WHERE id = $1`,
      [post.id, total]
    );
  } catch (e) {
    /* không chặn tạo comment nếu sync stats lỗi */
  }

  return { comment, total, post_id: post.id, post_slug: post.slug };
}

async function countMapForPostIds(postIds) {
  const ids = (postIds || []).filter(Boolean);
  if (!ids.length) return {};
  const res = await query(
    `SELECT post_id, COUNT(*)::int AS n
     FROM news_comments
     WHERE deleted_at IS NULL AND post_id = ANY($1::varchar[])
     GROUP BY post_id`,
    [ids]
  );
  const map = {};
  res.rows.forEach(function (r) { map[r.post_id] = r.n; });
  return map;
}

module.exports = {
  listComments,
  createComment,
  countComments,
  countMapForPostIds,
  resolvePost
};
