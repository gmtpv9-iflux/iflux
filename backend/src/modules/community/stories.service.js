'use strict';

/**
 * Community V1 Phase 2 — Story/Chủ đề (SoT "Community (Cộng đồng) Architecture V1" §7).
 *
 * Phase 6 (2026-10-08, cuối ngày) — Owner chuyển lifecycle 5-trạng-thái (percentile+window,
 * Topic_Engine V2) từ Topic sang Story (cột `lifecycle_status`/`lifecycle_override`, migration
 * 080) — tính trên Engagement của chính TOPIC đã map vào (topic_daily_stats), KHÔNG tính riêng.
 * Bỏ hẳn "Đồng tình"/Bình luận riêng của Story (interaction_likes/interaction_comments entity_
 * type='story') — Story hiển thị THẲNG Like/Dislike/Comment/Share của Topic gốc, y hệt Topic.
 * Bình luận trên Story giờ qua entity-posts-panel.js (Social Post gắn entity_refs type=story,
 * community-posts.service.js's getEntityPosts/createEntityPost — đã hỗ trợ sẵn 'story').
 *
 * Tiêu đề + cổ phiếu đính kèm = snapshot CỐ ĐỊNH của Topic lúc map — KHÔNG đổi tới khi Story bị
 * xoá (CASCADE theo Topic, FK đã đổi). Story có thể được TỰ ĐỘNG tạo (auto_created=true, Topic
 * lọt Top 5 Thịnh hành tuần, xem autoCreateStoryFromTopic) hoặc Admin ánh xạ thủ công.
 */
const { query } = require('../../core/database/connection');
const { AppError } = require('../../shared/exceptions/app-error');

const MAX_LIMIT = 50;
const MAX_DESC_LEN = 4000;
const SENTIMENTS = ['bullish', 'bearish'];
const RANGE_DAYS = { day: 1, week: 7, month: 30 };
const LIFECYCLE_STATUSES = ['new', 'rising', 'trending', 'declining', 'archived'];
const DEFAULT_LIFECYCLE_THRESHOLDS = { window_days: 3, sustain_days: 3, archive_sustain_days: 7, top_percentile: 0.8 };

function clampLimit(n, fallback) {
  const v = Number(n);
  if (!Number.isFinite(v) || v < 1) return fallback;
  return Math.min(Math.floor(v), MAX_LIMIT);
}

function isAdmin(user) {
  return !!(user && user.roles && user.roles.indexOf('admin') >= 0);
}

async function getConfig(key, fallback) {
  const res = await query('SELECT value FROM topic_scoring_config WHERE key = $1', [key]);
  if (res.rows[0] && res.rows[0].value) return Object.assign({}, fallback, res.rows[0].value);
  return fallback;
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

const AUTHOR_COLS = `
  u.id AS author_id,
  u.display_name AS author_display_name,
  u.nickname AS author_nickname,
  u.subscription_tier AS author_tier
`;

/* Owner 2026-10 (Phase 6) — Engagement của Story = Engagement của Topic liên kết (toàn thời
   gian, không theo kỳ — trang chi tiết Story hiển thị tổng, khác "Thịnh hành/Mới nổi" tính theo
   kỳ). s.topic_id NULL (hiếm, Story cũ trước Phase 2) -> COALESCE về 0. */
const STATS_SELECT = `
  COALESCE((SELECT SUM(ds.likes_count) FROM topic_daily_stats ds WHERE ds.topic_id = s.topic_id), 0) AS likes_count,
  COALESCE((SELECT SUM(ds.dislikes_count) FROM topic_daily_stats ds WHERE ds.topic_id = s.topic_id), 0) AS dislikes_count,
  COALESCE((SELECT SUM(ds.comments_count) FROM topic_daily_stats ds WHERE ds.topic_id = s.topic_id), 0) AS comments_count,
  COALESCE((SELECT SUM(ds.shares_count) FROM topic_daily_stats ds WHERE ds.topic_id = s.topic_id), 0) AS shares_count
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
    lifecycle_status: row.lifecycle_override || row.lifecycle_status,
    lifecycle_is_override: !!row.lifecycle_override,
    auto_created: !!row.auto_created,
    topic_id: row.topic_id || null,
    stats: {
      likes: Number(row.likes_count) || 0,
      dislikes: Number(row.dislikes_count) || 0,
      comments: Number(row.comments_count) || 0,
      shares: Number(row.shares_count) || 0
    },
    created_at: row.created_at ? new Date(row.created_at).toISOString() : null,
    updated_at: row.updated_at ? new Date(row.updated_at).toISOString() : null
  };
}

/**
 * Owner 2026-10 (VI.2, VII.1): Story CHỈ được tạo qua Admin ánh xạ Topic (hoặc tự động — xem
 * autoCreateStoryFromTopic). Giữ hàm này cho Admin tạo Story thủ công KHÔNG qua Topic (hiếm) —
 * luồng chính là mapTopicToStory() dưới.
 */
async function createStory(user, input) {
  const authorId = user && user.id;
  if (!authorId) throw AppError.unauthorized('Cần đăng nhập');
  if (!isAdmin(user)) throw AppError.forbidden('STORY_ADMIN_ONLY', 'Chỉ Admin được tạo Câu chuyện');

  const title = String((input && input.title) || '').trim();
  const description = String((input && input.description) || '').trim();
  const sentiment = SENTIMENTS.indexOf(input && input.sentiment) >= 0 ? input.sentiment : null;

  if (!title) throw AppError.badRequest('STORY_TITLE_REQUIRED', 'Thiếu tên chủ đề');
  if (description.length > MAX_DESC_LEN) throw AppError.badRequest('STORY_DESC_TOO_LONG', 'Luận điểm tối đa ' + MAX_DESC_LEN + ' ký tự');
  if (!sentiment) throw AppError.badRequest('STORY_SENTIMENT_REQUIRED', 'Thiếu quan điểm (bullish/bearish)');

  const slug = await ensureUniqueSlug(slugifyTitle(title));
  const res = await query(
    `INSERT INTO stories (title, description, author_id, stock_tags, sentiment, slug)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id`,
    [title, description, authorId, [], sentiment, slug]
  );
  return getStoryById(res.rows[0].id);
}

/**
 * Owner 2026-10 (VI.2, Phase 6): Admin ánh xạ 1 Topic → 1 Story — "Tạo Story mới" (input không
 * cần title nữa, luôn lấy topic.display_name — Owner: "Tiêu đề không thay đổi luôn khi từ Topic
 * thành Story") hoặc "Gắn vào Story có sẵn" (input.story_id). Cổ phiếu đính kèm = snapshot CỐ
 * ĐỊNH đã chốt của Topic (topics.getStoredRepresentativeStocks), KHÔNG tính lại.
 */
async function mapTopicToStory(topicId, input, adminUser) {
  if (!adminUser || !adminUser.id) throw AppError.unauthorized('Cần đăng nhập Admin');
  input = input || {};

  const topicRes = await query('SELECT id, display_name FROM topics WHERE id = $1', [topicId]);
  if (!topicRes.rows[0]) throw AppError.notFound('Không tìm thấy Topic');
  const topic = topicRes.rows[0];

  const topics = require('./topics.service');
  const rep = await topics.getStoredRepresentativeStocks(topicId);
  const stockTags = rep.stocks.map((s) => s.ticker);

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

  const sentiment = SENTIMENTS.indexOf(input.sentiment) >= 0 ? input.sentiment : 'bullish';
  const description = String(input.description || '').trim();
  const slug = await ensureUniqueSlug(slugifyTitle(topic.display_name));

  const created = await query(
    `INSERT INTO stories (title, description, author_id, stock_tags, sentiment, topic_id, mapped_by, mapped_at, slug)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), $8)
     RETURNING id`,
    [topic.display_name, description, adminUser.id, stockTags, sentiment, topicId, adminUser.id, slug]
  );
  return getStoryById(created.rows[0].id);
}

/** Owner 2026-10 (Phase 6, điểm 10): Topic lọt Top 5 Thịnh hành tuần, chưa có Story -> tự động
 * tạo (mapped_by=NULL, auto_created=true). Gọi NỘI BỘ từ cron — không qua HTTP/adminUser. */
async function autoCreateStoryFromTopic(topicId) {
  const topicRes = await query('SELECT id, display_name FROM topics WHERE id = $1', [topicId]);
  if (!topicRes.rows[0]) return null;
  const topic = topicRes.rows[0];

  const existing = await query('SELECT id FROM stories WHERE topic_id = $1', [topicId]);
  if (existing.rows[0]) return existing.rows[0].id;

  const topics = require('./topics.service');
  const rep = await topics.getStoredRepresentativeStocks(topicId);
  const stockTags = rep.stocks.map((s) => s.ticker);
  const slug = await ensureUniqueSlug(slugifyTitle(topic.display_name));

  const created = await query(
    `INSERT INTO stories (title, description, author_id, stock_tags, sentiment, topic_id, mapped_by, mapped_at, slug, auto_created)
     VALUES ($1, '', NULL, $2, 'bullish', $3, NULL, NOW(), $4, true)
     RETURNING id`,
    [topic.display_name, stockTags, topicId, slug]
  );
  return created.rows[0].id;
}

async function getStoryById(id) {
  const res = await query(
    `SELECT s.id, s.title, s.slug, s.description, s.stock_tags, s.sentiment, s.status, s.topic_id,
            s.lifecycle_status, s.lifecycle_override, s.auto_created,
            s.created_at, s.updated_at, ${AUTHOR_COLS}, ${STATS_SELECT}
     FROM stories s
     LEFT JOIN users u ON u.id = s.author_id
     WHERE s.id = $1 AND s.status = 'active'`,
    [id]
  );
  if (!res.rows[0]) throw AppError.notFound('Không tìm thấy chủ đề');
  return rowToStory(res.rows[0]);
}

/** Admin sửa description/sentiment — KHÔNG cho sửa title/stock_tags (chốt cứng theo Topic). */
async function updateStory(id, patch, adminUser) {
  if (!adminUser || !adminUser.id) throw AppError.unauthorized('Cần đăng nhập Admin');
  patch = patch || {};
  const sets = [];
  const params = [];
  if (patch.description != null) {
    const description = String(patch.description).trim();
    if (description.length > MAX_DESC_LEN) throw AppError.badRequest('STORY_DESC_TOO_LONG', 'Luận điểm tối đa ' + MAX_DESC_LEN + ' ký tự');
    params.push(description);
    sets.push('description = $' + params.length);
  }
  if (patch.sentiment != null) {
    if (SENTIMENTS.indexOf(patch.sentiment) < 0) throw AppError.badRequest('STORY_SENTIMENT_INVALID', 'Quan điểm không hợp lệ');
    params.push(patch.sentiment);
    sets.push('sentiment = $' + params.length);
  }
  if (!sets.length) return getStoryById(id);
  params.push(id);
  const res = await query(
    `UPDATE stories SET ${sets.join(', ')}, updated_at = NOW() WHERE id = $${params.length} AND status = 'active' RETURNING id`,
    params
  );
  if (!res.rows[0]) throw AppError.notFound('Không tìm thấy chủ đề');
  return getStoryById(res.rows[0].id);
}

/** Admin có thể archive bất kỳ Story; tác giả tự archive Story của mình (§7.2 — không còn state machine). */
async function archiveStory(id, user) {
  const uid = user && user.id;
  if (!uid) throw AppError.unauthorized('Cần đăng nhập');
  const admin = !!(user.roles && user.roles.includes('admin'));
  const params = admin ? [id] : [id, uid];
  const ownerClause = admin ? '' : ' AND author_id = $2';
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
 * GET /community/stories?sort=latest|trending&range=day|week|month (§7.4). `trending` xếp theo
 * Engagement của Topic liên kết PHÁT SINH trong khoảng `range` (Phase 6 — không còn agree_count).
 */
async function listStories(opts) {
  opts = opts || {};
  const limit = clampLimit(opts.limit, 10);
  const sort = opts.sort === 'trending' ? 'trending' : 'latest';

  if (sort === 'trending') {
    const range = RANGE_DAYS[opts.range] ? opts.range : 'day';
    const days = RANGE_DAYS[range];
    const res = await query(
      `SELECT s.id, s.title, s.slug, s.description, s.stock_tags, s.sentiment, s.status, s.topic_id,
              s.lifecycle_status, s.lifecycle_override, s.auto_created,
              s.created_at, s.updated_at, ${AUTHOR_COLS},
              COALESCE((SELECT SUM(ds.likes_count) FROM topic_daily_stats ds WHERE ds.topic_id = s.topic_id AND ds.day >= CURRENT_DATE - ($1::int - 1)), 0) AS likes_count,
              COALESCE((SELECT SUM(ds.dislikes_count) FROM topic_daily_stats ds WHERE ds.topic_id = s.topic_id AND ds.day >= CURRENT_DATE - ($1::int - 1)), 0) AS dislikes_count,
              COALESCE((SELECT SUM(ds.comments_count) FROM topic_daily_stats ds WHERE ds.topic_id = s.topic_id AND ds.day >= CURRENT_DATE - ($1::int - 1)), 0) AS comments_count,
              COALESCE((SELECT SUM(ds.shares_count) FROM topic_daily_stats ds WHERE ds.topic_id = s.topic_id AND ds.day >= CURRENT_DATE - ($1::int - 1)), 0) AS shares_count,
              COALESCE((SELECT SUM(ds.engagement_score) FROM topic_daily_stats ds WHERE ds.topic_id = s.topic_id AND ds.day >= CURRENT_DATE - ($1::int - 1)), 0) AS engagement
       FROM stories s
       LEFT JOIN users u ON u.id = s.author_id
       WHERE s.status = 'active'
       ORDER BY engagement DESC, s.created_at DESC
       LIMIT $2`,
      [days, limit]
    );
    return { items: res.rows.map(rowToStory), sort: sort, range: range, limit: limit };
  }

  const params = [];
  let sql =
    `SELECT s.id, s.title, s.slug, s.description, s.stock_tags, s.sentiment, s.status, s.topic_id,
            s.lifecycle_status, s.lifecycle_override, s.auto_created,
            s.created_at, s.updated_at, ${AUTHOR_COLS}, ${STATS_SELECT}
     FROM stories s
     LEFT JOIN users u ON u.id = s.author_id
     WHERE s.status = 'active'`;
  sql += buildCursorWhere(params, opts.cursor);
  params.push(limit + 1);
  sql += ` ORDER BY s.created_at DESC, s.id DESC LIMIT $${params.length}`;
  const res = await query(sql, params);
  const out = paginate(res.rows, limit);
  out.sort = sort;
  return out;
}

/**
 * Lifecycle 5-trạng-thái (percentile+window, Topic_Engine V2) — Phase 6: chuyển từ Topic sang
 * Story, tính trên Engagement của TOPIC liên kết. Admin override (lifecycle_override) luôn thắng.
 */
async function evaluateAllStoryLifecycles() {
  const cfg = await getConfig('story_lifecycle_thresholds', DEFAULT_LIFECYCLE_THRESHOLDS);
  const windowDays = cfg.window_days;
  const sustainDays = cfg.sustain_days;
  const archiveSustainDays = cfg.archive_sustain_days;
  const topPercentile = cfg.top_percentile;

  const res = await query(
    `SELECT s.id, s.lifecycle_status AS status, s.lifecycle_override AS status_override,
            s.lifecycle_status_since AS status_since, s.created_at AS first_seen_at,
            COALESCE(AVG(ds.engagement_score), 0) AS avg_engagement
     FROM stories s
     LEFT JOIN topic_daily_stats ds ON ds.topic_id = s.topic_id AND ds.day >= CURRENT_DATE - ($1::int - 1)
     WHERE s.status = 'active'
     GROUP BY s.id`,
    [windowDays]
  );
  const rows = res.rows;
  if (!rows.length) return { evaluated: 0 };

  const scores = rows.map((r) => Number(r.avg_engagement) || 0).filter((s) => s > 0).sort((a, b) => a - b);
  const thresholdIdx = Math.floor(scores.length * (1 - topPercentile));
  const topThreshold = scores.length ? scores[Math.min(thresholdIdx, scores.length - 1)] : 0;

  let changed = 0;
  for (const row of rows) {
    if (row.status_override) continue;

    const avgEngagement = Number(row.avg_engagement) || 0;
    const isTop = avgEngagement > 0 && avgEngagement >= topThreshold;
    const ageDays = Math.floor((Date.now() - new Date(row.first_seen_at).getTime()) / 86400000);
    const daysSinceStatus = Math.floor((Date.now() - new Date(row.status_since).getTime()) / 86400000);

    let nextStatus = row.status;
    if (ageDays < windowDays) {
      nextStatus = 'new';
    } else if (isTop) {
      if (row.status === 'new' || row.status === 'declining' || row.status === 'archived') {
        nextStatus = 'rising';
      } else if (row.status === 'rising' && daysSinceStatus >= sustainDays) {
        nextStatus = 'trending';
      }
    } else if (row.status === 'trending' || row.status === 'rising') {
      nextStatus = 'declining';
    } else if (row.status === 'declining' && daysSinceStatus >= archiveSustainDays) {
      nextStatus = 'archived';
    }

    if (nextStatus !== row.status) {
      await query(
        'UPDATE stories SET lifecycle_status = $1, lifecycle_status_since = NOW(), updated_at = NOW() WHERE id = $2',
        [nextStatus, row.id]
      );
      changed += 1;
    }
  }
  return { evaluated: rows.length, changed, topThreshold };
}

/** Topic nào lọt Top 5 Thịnh hành tuần hiện tại mà chưa có Story -> tự động tạo (điểm 10). */
async function autoCreateFromTopTrendingWeekly() {
  const topics = require('./topics.service');
  const trending = await topics.getTrendingTopics('week', 5);
  let created = 0;
  for (const t of trending) {
    const existing = await query('SELECT id FROM stories WHERE topic_id = $1', [t.id]);
    if (existing.rows[0]) continue;
    await autoCreateStoryFromTopic(t.id);
    created += 1;
  }
  return { created };
}

async function setLifecycleOverride(storyId, status, adminUser) {
  if (status != null && LIFECYCLE_STATUSES.indexOf(status) < 0) {
    throw AppError.badRequest('STORY_LIFECYCLE_INVALID', 'Trạng thái không hợp lệ');
  }
  const res = await query(
    `UPDATE stories SET lifecycle_override = $1, lifecycle_override_by = $2, lifecycle_override_at = NOW(), updated_at = NOW()
     WHERE id = $3 RETURNING id`,
    [status || null, status ? (adminUser && adminUser.id) : null, storyId]
  );
  if (!res.rows[0]) throw AppError.notFound('Không tìm thấy chủ đề');
  return { id: res.rows[0].id };
}

module.exports = {
  createStory,
  mapTopicToStory,
  autoCreateStoryFromTopic,
  autoCreateFromTopTrendingWeekly,
  getStoryById,
  updateStory,
  archiveStory,
  listStories,
  evaluateAllStoryLifecycles,
  setLifecycleOverride,
  LIFECYCLE_STATUSES,
  SENTIMENTS
};
