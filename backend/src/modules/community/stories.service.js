'use strict';

/**
 * Community V1 Phase 2 — Story/Chủ đề (SoT "Community (Cộng đồng) Architecture V1" §7).
 * Thay thế Topic Engine V1/V2 (SUPERSEDED §8) — không còn state machine 5 trạng thái, không còn
 * Topic Score. User/Admin tạo trực tiếp (title + luận điểm + sentiment) → tồn tại ngay khi publish.
 *
 * agree_count/comment_count KHÔNG lưu cột riêng trên bảng `stories` — đọc qua Interaction
 * (interaction_likes entity_type='story' cho "Đồng tình", interaction_comments entity_type='story'
 * cho bình luận), cùng nguyên tắc đã áp dụng cho social_posts (STATS_SELECT, community-posts.service.js).
 * "Đồng tình" cố ý TÁI DÙNG bảng interaction_likes (không viết lại hệ Interaction riêng — SoT §5) —
 * phân biệt ngữ nghĩa với "Like" của Post chỉ nhờ entity_type khác nhau ('story' vs 'communitypost'),
 * nên 2 bộ số không bao giờ lẫn vào nhau dù dùng chung bảng lưu trữ (§7.3: "tách biệt khỏi Like").
 */
const { query } = require('../../core/database/connection');
const { AppError } = require('../../shared/exceptions/app-error');

const MAX_LIMIT = 50;
const MAX_TITLE_LEN = 200;
const MAX_DESC_LEN = 4000;
const MAX_STOCK_TAGS = 10;
const SENTIMENTS = ['bullish', 'bearish'];
const RANGES = { day: '1 day', week: '7 days', month: '30 days' };

function clampLimit(n, fallback) {
  const v = Number(n);
  if (!Number.isFinite(v) || v < 1) return fallback;
  return Math.min(Math.floor(v), MAX_LIMIT);
}

function isAdmin(user) {
  return !!(user && user.roles && user.roles.indexOf('admin') >= 0);
}

function slugifyTitle(title) {
  return String(title || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 160) || 'cau-chuyen';
}

async function ensureUniqueSlug(base) {
  let slug = base;
  for (let i = 0; i < 5; i++) {
    const res = await query('SELECT 1 FROM stories WHERE slug = $1', [slug]);
    if (!res.rows[0]) return slug;
    slug = base + '-' + Math.random().toString(36).slice(2, 6);
  }
  return base + '-' + Date.now().toString(36);
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

const STATS_SELECT = `
  (SELECT COUNT(*)::int FROM interaction_likes il WHERE il.entity_type = 'story' AND il.entity_id = s.id::text) AS agree_count,
  (SELECT COUNT(*)::int FROM interaction_comments ic WHERE ic.entity_type = 'story' AND ic.entity_id = s.id::text AND ic.deleted_at IS NULL) AS comment_count
`;

function rowToStory(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    slug: row.slug || null,
    description: row.description || '',
    author: {
      id: row.author_id,
      display_name: row.author_display_name || row.author_nickname || 'Thành viên',
      tier: row.author_tier || 'free'
    },
    stock_tags: row.stock_tags || [],
    sentiment: row.sentiment,
    status: row.status,
    topic_id: row.topic_id || null,
    stats: {
      agree: Number(row.agree_count) || 0,
      comments: Number(row.comment_count) || 0
    },
    created_at: row.created_at ? new Date(row.created_at).toISOString() : null,
    updated_at: row.updated_at ? new Date(row.updated_at).toISOString() : null
  };
}

/**
 * Owner 2026-10 (VI.2, VII.1): Story CHỈ được tạo qua Admin ánh xạ Topic — không còn User tự
 * tạo trực tiếp qua Composer. Giữ hàm này cho Admin tạo Story thủ công (hiếm, không qua Topic)
 * — luồng chính là mapTopicToStory() dưới.
 */
async function createStory(user, input) {
  const authorId = user && user.id;
  if (!authorId) throw AppError.unauthorized('Cần đăng nhập');
  if (!isAdmin(user)) throw AppError.forbidden('STORY_ADMIN_ONLY', 'Chỉ Admin được tạo Câu chuyện');

  const title = String((input && input.title) || '').trim();
  const description = String((input && input.description) || '').trim();
  const sentiment = SENTIMENTS.indexOf(input && input.sentiment) >= 0 ? input.sentiment : null;
  const stockTags = normalizeStockTags(input && input.stock_tags);

  if (!title) throw AppError.badRequest('STORY_TITLE_REQUIRED', 'Thiếu tên chủ đề');
  if (title.length > MAX_TITLE_LEN) throw AppError.badRequest('STORY_TITLE_TOO_LONG', 'Tên chủ đề tối đa ' + MAX_TITLE_LEN + ' ký tự');
  if (description.length > MAX_DESC_LEN) throw AppError.badRequest('STORY_DESC_TOO_LONG', 'Luận điểm tối đa ' + MAX_DESC_LEN + ' ký tự');
  if (!sentiment) throw AppError.badRequest('STORY_SENTIMENT_REQUIRED', 'Thiếu quan điểm (bullish/bearish)');

  const slug = await ensureUniqueSlug(slugifyTitle(title));
  const res = await query(
    `INSERT INTO stories (title, description, author_id, stock_tags, sentiment, slug)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id`,
    [title, description, authorId, stockTags, sentiment, slug]
  );
  return getStoryById(res.rows[0].id);
}

/**
 * Owner 2026-10 (VI.2): Admin ánh xạ 1 Topic → 1 Story — "Tạo Story mới" (input.title) hoặc
 * "Gắn vào Story có sẵn" (input.story_id). Mã CP = tính từ Topic (tỷ trọng cộng dồn ≥80%,
 * Topic_Engine V2), Admin xác nhận/ghi đè qua input.stock_tags nếu muốn.
 */
async function mapTopicToStory(topicId, input, adminUser) {
  if (!isAdmin(adminUser)) throw AppError.forbidden('STORY_ADMIN_ONLY', 'Chỉ Admin được ánh xạ Topic sang Câu chuyện');
  input = input || {};

  const topicRes = await query('SELECT id FROM topics WHERE id = $1', [topicId]);
  if (!topicRes.rows[0]) throw AppError.notFound('Không tìm thấy Topic');

  const topics = require('./topics.service');
  const rep = await topics.getRepresentativeStocks(topicId);
  const stockTags = Array.isArray(input.stock_tags) && input.stock_tags.length
    ? normalizeStockTags(input.stock_tags)
    : rep.stocks.map((s) => s.ticker);

  if (input.story_id) {
    const res = await query(
      `UPDATE stories SET topic_id = $1, mapped_by = $2, mapped_at = NOW(), stock_tags = $3, updated_at = NOW()
       WHERE id = $4 AND topic_id IS NULL AND status = 'active'
       RETURNING id`,
      [topicId, adminUser.id, stockTags, input.story_id]
    );
    if (!res.rows[0]) {
      throw AppError.badRequest('STORY_ALREADY_MAPPED', 'Câu chuyện đã được ánh xạ với Topic khác, không tồn tại hoặc đã lưu trữ');
    }
    return getStoryById(res.rows[0].id);
  }

  const title = String(input.title || '').trim();
  if (!title) throw AppError.badRequest('STORY_TITLE_REQUIRED', 'Thiếu tên Câu chuyện');
  if (title.length > MAX_TITLE_LEN) throw AppError.badRequest('STORY_TITLE_TOO_LONG', 'Tên chủ đề tối đa ' + MAX_TITLE_LEN + ' ký tự');
  const description = String(input.description || '').trim();
  const sentiment = SENTIMENTS.indexOf(input.sentiment) >= 0 ? input.sentiment : 'bullish';
  const slug = await ensureUniqueSlug(slugifyTitle(title));

  const created = await query(
    `INSERT INTO stories (title, description, author_id, stock_tags, sentiment, topic_id, mapped_by, mapped_at, slug)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), $8)
     RETURNING id`,
    [title, description, adminUser.id, stockTags, sentiment, topicId, adminUser.id, slug]
  );
  return getStoryById(created.rows[0].id);
}

async function getStoryById(id) {
  const res = await query(
    `SELECT s.id, s.title, s.slug, s.description, s.stock_tags, s.sentiment, s.status, s.topic_id,
            s.created_at, s.updated_at, ${AUTHOR_COLS}, ${STATS_SELECT}
     FROM stories s
     JOIN users u ON u.id = s.author_id
     WHERE s.id = $1 AND s.status = 'active'`,
    [id]
  );
  if (!res.rows[0]) throw AppError.notFound('Không tìm thấy chủ đề');
  return rowToStory(res.rows[0]);
}

/** Admin có thể archive bất kỳ Story; tác giả tự archive Story của mình (§7.2 — không còn state machine). */
async function archiveStory(id, user) {
  const uid = user && user.id;
  if (!uid) throw AppError.unauthorized('Cần đăng nhập');
  const isAdmin = !!(user.roles && user.roles.includes('admin'));
  const params = isAdmin ? [id] : [id, uid];
  const ownerClause = isAdmin ? '' : ' AND author_id = $2';
  const res = await query(
    `UPDATE stories SET status = 'archived', updated_at = NOW()
     WHERE id = $1${ownerClause} AND status = 'active'
     RETURNING id`,
    params
  );
  if (!res.rows[0]) throw AppError.notFound('Không tìm thấy chủ đề hoặc không có quyền lưu trữ');
  return { ok: true, id: id };
}

function buildCursorWhere(params, cursor) {
  if (!cursor) return '';
  const parts = String(cursor).split('|');
  const ts = parts[0];
  const id = parts[1];
  if (!ts || !id) return '';
  params.push(ts, id);
  return ` AND (s.created_at, s.id) < ($${params.length - 1}::timestamptz, $${params.length}::uuid)`;
}

function paginate(rows, limit) {
  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  const last = page[page.length - 1];
  const nextCursor = hasMore && last
    ? new Date(last.created_at).toISOString() + '|' + last.id
    : null;
  return { items: page.map(rowToStory), next_cursor: nextCursor, limit: limit };
}

/**
 * GET /community/stories?sort=latest|trending&range=day|week|month (§7.4 — "Chủ đề HOT").
 * `trending` xếp theo số "Đồng tình" PHÁT SINH trong khoảng `range` (không phải agree_count toàn
 * thời gian) — khớp đúng 2 chu kỳ Ngày/Tuần/Tháng trong bảng xếp hạng của SoT, và cố ý không gộp
 * với "Mã được thảo luận nhiều" (bảng xếp hạng khác, nguồn khác — §7.4 "Đừng gộp hai cái").
 */
async function listStories(opts) {
  opts = opts || {};
  const limit = clampLimit(opts.limit, 10);
  const sort = opts.sort === 'trending' ? 'trending' : 'latest';

  if (sort === 'trending') {
    const range = RANGES[opts.range] ? opts.range : 'day';
    const res = await query(
      `SELECT s.id, s.title, s.description, s.stock_tags, s.sentiment, s.status,
              s.created_at, s.updated_at, ${AUTHOR_COLS},
              (SELECT COUNT(*)::int FROM interaction_likes il
                 WHERE il.entity_type = 'story' AND il.entity_id = s.id::text
                   AND il.created_at >= NOW() - $1::interval) AS agree_count,
              (SELECT COUNT(*)::int FROM interaction_comments ic
                 WHERE ic.entity_type = 'story' AND ic.entity_id = s.id::text AND ic.deleted_at IS NULL) AS comment_count
       FROM stories s
       JOIN users u ON u.id = s.author_id
       WHERE s.status = 'active'
       ORDER BY agree_count DESC, s.created_at DESC
       LIMIT $2`,
      [RANGES[range], limit]
    );
    return { items: res.rows.map(rowToStory), sort: sort, range: range, limit: limit };
  }

  const params = [];
  let sql =
    `SELECT s.id, s.title, s.description, s.stock_tags, s.sentiment, s.status,
            s.created_at, s.updated_at, ${AUTHOR_COLS}, ${STATS_SELECT}
     FROM stories s
     JOIN users u ON u.id = s.author_id
     WHERE s.status = 'active'`;
  sql += buildCursorWhere(params, opts.cursor);
  params.push(limit + 1);
  sql += ` ORDER BY s.created_at DESC, s.id DESC LIMIT $${params.length}`;
  const res = await query(sql, params);
  const out = paginate(res.rows, limit);
  out.sort = sort;
  return out;
}

module.exports = {
  createStory,
  mapTopicToStory,
  getStoryById,
  archiveStory,
  listStories,
  SENTIMENTS
};
