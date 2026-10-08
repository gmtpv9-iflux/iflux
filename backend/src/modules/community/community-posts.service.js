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
/* ~1000 từ tiếng Việt (Owner chốt) — trung bình 5-6 ký tự/từ kể cả khoảng trắng, chừa biên an toàn. */
const MAX_CONTENT_LEN = 6000;
const MAX_STOCK_TAGS = 10;
const MAX_HASHTAGS = 5;
const MAX_ENTITY_REFS = 10;
const POST_TYPES = ['status', 'stock_view', 'share', 'reply_as_post'];
const SOURCE_TYPES = ['news', 'story', 'post', 'chart'];
/* Owner 2026-10: bổ sung 'market_index' (Thị trường/Sàn/Chỉ số — VN-Index, HNX-Index, UPCoM-Index)
   vào Entity Mention (II.1) — chỉ là tag trên Post, không cần trang/thread riêng (chưa đăng ký vào
   Thread Target Registry IA-001). */
const ENTITY_REF_TYPES = ['stock', 'sector', 'family', 'story', 'market_index'];

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

/* Hashtag: chữ thường, không dấu #, chỉ [a-z0-9_] + chữ có dấu tiếng Việt (giữ nguyên để hiển thị
   đúng tên chủ đề) — KHÔNG ép ASCII-only vì "chủ đề" tiếng Việt cần giữ dấu để đọc được. */
function normalizeHashtags(raw) {
  if (!Array.isArray(raw)) return [];
  const out = [];
  const seen = {};
  for (let i = 0; i < raw.length && out.length < MAX_HASHTAGS; i++) {
    let t = String(raw[i] || '').trim().replace(/^#+/, '').toLowerCase();
    t = t.replace(/\s+/g, '').slice(0, 60);
    if (!t || seen[t]) continue;
    seen[t] = true;
    out.push(t);
  }
  return out;
}

function normalizeEntityRefs(raw) {
  if (!Array.isArray(raw)) return [];
  const out = [];
  const seen = {};
  for (let i = 0; i < raw.length && out.length < MAX_ENTITY_REFS; i++) {
    const r = raw[i];
    if (!r || typeof r !== 'object') continue;
    const type = ENTITY_REF_TYPES.indexOf(r.type) >= 0 ? r.type : null;
    const id = String(r.id || '').trim();
    if (!type || !id) continue;
    const key = type + ':' + id;
    if (seen[key]) continue;
    seen[key] = true;
    out.push({ type: type, id: id, label: String(r.label || id).slice(0, 200) });
  }
  return out;
}

const AUTHOR_COLS = `
  u.id AS author_id,
  u.display_name AS author_display_name,
  u.nickname AS author_nickname,
  u.subscription_tier AS author_tier
`;

/* Post cơ bản + hashtags/entity_refs (Owner yêu cầu 2026-10: Compose đủ khả năng gắn hashtag +
   nhiều loại Thực thể) + source_preview — hydrate thật title/ảnh bài Tin tức khi source_type='news'
   (trước đây FE phải tự mock vì chỉ có source_id trần, không đủ hiển thị). Không JOIN khi
   source_type khác 'news' (CASE WHEN tránh query thừa). */
const POST_COLS = `
  p.id, p.content, p.post_type, p.source_type, p.source_id, p.stock_tags, p.hashtags,
  p.entity_refs, p.visibility, p.created_at, p.updated_at,
  (CASE WHEN p.source_type = 'news' THEN (
    SELECT jsonb_build_object(
      'title', np.payload->>'title',
      'slug', np.payload->>'slug',
      'cover_url', COALESCE(np.payload->'cover'->'variants'->>'cover_thumb', np.payload->'cover'->>'url')
    )
    FROM news_posts np WHERE np.id::text = p.source_id LIMIT 1
  ) ELSE NULL END) AS source_preview
`;

/* Vài bài RSS cũ còn lưu nguyên HTML entity thô trong title (trước khi rss-ingest.service.js
   decodeEntities được sửa — xem news-store.js decodeHtmlEntities FE, bản này cho source_preview
   phía API) — decode lại ở đây để "Đăng lại" không hiện &#039; literal thay vì dấu nháy thật. */
function decodeHtmlEntities(s) {
  s = String(s == null ? '' : s);
  if (s.indexOf('&') === -1) return s;
  return s
    .replace(/&amp;/g, '&')
    .replace(/&#0*39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&#0*8216;|&lsquo;/g, '‘')
    .replace(/&#0*8217;|&rsquo;/g, '’')
    .replace(/&#0*8220;|&ldquo;/g, '“')
    .replace(/&#0*8221;|&rdquo;/g, '”')
    .replace(/&#0*8211;|&ndash;/g, '–')
    .replace(/&#0*8212;|&mdash;/g, '—')
    .replace(/&#0*8230;|&hellip;/g, '…')
    .replace(/&nbsp;/g, ' ');
}

function rowToPost(row) {
  if (!row) return null;
  if (row.source_preview && row.source_preview.title) {
    row.source_preview.title = decodeHtmlEntities(row.source_preview.title);
  }
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
    source_preview: row.source_preview || null,
    stock_tags: row.stock_tags || [],
    hashtags: row.hashtags || [],
    entity_refs: row.entity_refs || [],
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

const SENTIMENTS = ['positive', 'negative', 'neutral'];

async function createPost(user, input) {
  const authorId = user && user.id;
  if (!authorId) throw AppError.unauthorized('Cần đăng nhập');

  const content = String((input && input.content) || '').trim();
  const postType = POST_TYPES.indexOf(input && input.post_type) >= 0 ? input.post_type : 'status';
  const sourceType = input && input.source_type && SOURCE_TYPES.indexOf(input.source_type) >= 0 ? input.source_type : null;
  const sourceId = sourceType ? String((input && input.source_id) || '').trim() || null : null;
  const stockTags = normalizeStockTags(input && input.stock_tags);
  const hashtags = normalizeHashtags(input && input.hashtags);
  const entityRefs = normalizeEntityRefs(input && input.entity_refs);
  const visibility = (input && input.visibility) === 'followers' ? 'followers' : 'public';
  /* Sentiment TÁC GIẢ khai báo (II.1), mặc định KHÔNG chọn (Unspecified = NULL) — khác hẳn
     Like/Dislike cộng đồng (II.3, Reaction Sentiment), không được đồng nhất. */
  const sentiment = SENTIMENTS.indexOf(input && input.sentiment) >= 0 ? input.sentiment : null;

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
  /* Đăng lại Tin tức (nút "Đăng lại" trên trang bài viết) — xác thực bài viết thật tồn tại trước
     khi lưu source_id, để source_preview (POST_COLS) luôn hydrate được, không trỏ tới bài đã xoá. */
  if (sourceType === 'news') {
    const origin = await query(`SELECT id FROM news_posts WHERE id = $1 LIMIT 1`, [sourceId]);
    if (!origin.rows[0]) throw AppError.notFound('Không tìm thấy bài viết Tin tức được chia sẻ');
  }

  const res = await query(
    `INSERT INTO social_posts (author_id, content, post_type, source_type, source_id, stock_tags, hashtags, entity_refs, visibility, sentiment)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING id`,
    [authorId, content, postType, sourceType, sourceId, stockTags, hashtags, JSON.stringify(entityRefs), visibility, sentiment]
  );
  const postId = res.rows[0].id;
  /* Hashtag → Topic (III.1) — resolve-or-create, không chặn tạo bài nếu lỗi phụ trợ này. */
  try {
    await require('./topics.service').attachPostTopics(postId, hashtags);
  } catch (e) { /* Topic formation là phụ trợ — không chặn flow tạo bài chính */ }
  return getPostById(postId, user);
}

async function getPostById(id, viewer) {
  const res = await query(
    `SELECT ${POST_COLS}, ${AUTHOR_COLS}, ${STATS_SELECT}
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
      `SELECT ${POST_COLS}, ${AUTHOR_COLS}, ${STATS_SELECT}
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
    `SELECT ${POST_COLS}, ${AUTHOR_COLS}, ${STATS_SELECT}
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
    `SELECT ${POST_COLS}, ${AUTHOR_COLS}, ${STATS_SELECT}
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
    `SELECT ${POST_COLS}, ${AUTHOR_COLS}, ${STATS_SELECT}
     FROM social_posts p
     JOIN users u ON u.id = p.author_id
     WHERE p.status = 'published' AND p.visibility = 'public' AND p.stock_tags @> ARRAY[$1]::text[]`;
  sql += buildCursorWhere(params, 'p.created_at', opts.cursor);
  params.push(limit + 1);
  sql += ` ORDER BY p.created_at DESC, p.id DESC LIMIT $${params.length}`;
  const res = await query(sql, params);
  return paginate(res.rows, limit);
}

/**
 * Gợi ý khi user gõ vào ô hashtag (Compose) — chỉ gọi khi user bấm vào ô (lazy, không tải sẵn —
 * Owner yêu cầu nhẹ tải). Hợp nhất 2 nguồn, KHÔNG tạo thực thể hashtag riêng (SoT §4.1 — cấm
 * nhân bản thực thể): (a) Story đang có (title khớp — chủ đề user/Admin đã tạo chính thức),
 * (b) hashtag tự do đã dùng trên Post khác trong 30 ngày gần nhất, xếp theo tần suất — "cơ sở xác
 * định chủ đề đang hot" đúng như Owner mô tả. Giới hạn 8 gợi ý, không phân trang (gõ thêm chữ để
 * lọc tiếp, không cần "xem thêm").
 */
async function getTrendingSuggestions(q) {
  const term = String(q || '').trim().toLowerCase().replace(/^#+/, '');
  if (!term) return { items: [] };
  const like = '%' + term.replace(/[%_]/g, '\\$&') + '%';

  const storyRes = await query(
    `SELECT id, title FROM stories
     WHERE status = 'active' AND title ILIKE $1
     ORDER BY created_at DESC LIMIT 5`,
    [like]
  );
  const hashtagRes = await query(
    `SELECT tag, COUNT(*)::int AS n
     FROM social_posts, unnest(hashtags) AS tag
     WHERE status = 'published' AND created_at >= NOW() - INTERVAL '30 days' AND tag ILIKE $1
     GROUP BY tag
     ORDER BY n DESC, tag ASC
     LIMIT 8`,
    [like]
  );

  const items = [];
  const seen = {};
  hashtagRes.rows.forEach((r) => {
    if (seen[r.tag]) return;
    seen[r.tag] = true;
    items.push({ type: 'hashtag', value: r.tag, label: '#' + r.tag, count: r.n });
  });
  storyRes.rows.forEach((r) => {
    const slugLike = String(r.title || '').toLowerCase().replace(/\s+/g, '');
    if (seen[slugLike]) return;
    seen[slugLike] = true;
    items.push({ type: 'story', value: r.id, label: r.title });
  });
  return { items: items.slice(0, 8) };
}

module.exports = {
  createPost,
  getPostById,
  deletePost,
  getFeed,
  getUserTimeline,
  getStockPosts,
  getTrendingSuggestions,
  POST_TYPES,
  SOURCE_TYPES
};
