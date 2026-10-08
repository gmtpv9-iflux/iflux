'use strict';

/**
 * Topic service — Owner 2026-10: Topic hình thành từ Hashtag Post Cộng đồng (SoT "Community →
 * Topic → Story"). Tách khỏi Story — Admin ánh xạ thủ công (xem stories.service.js mapTopicToStory).
 *
 * Công thức Owner chốt (đáp ứng nguyên văn, chỉ xử lý chia-0/mẫu nhỏ — "giữ đơn giản, tối ưu sau"):
 *   Engagement = L*wL + D*wD + C*wC + S*wS (mặc định wL=wD=1, wC=3, wS=4 — xem topic_scoring_config)
 *   Author Sentiment = (P-N)/(P+N), chỉ tính trên bài ĐÃ khai báo (loại U khỏi tử/mẫu) — khác bản
 *     gốc Owner đưa (P-N)/(P+N+U) vì tự mâu thuẫn với "chỉ tính bài khai báo" (đã nêu trong audit).
 *   Reaction Sentiment = (L-D)/(L+D) — mức tán thành, KHÔNG phải sắc thái bài viết (II.3).
 *   Trending Score = ln(1+Engagement_Window) × (1+0.2×Normalized_Growth) — bỏ Quality Factor theo
 *     chỉ đạo "giữ đơn giản", chỉ kẹp Normalized_Growth [-1,3] + mẫu base >=1 để tránh chia-0/bùng nổ.
 *   Lifecycle (New/Rising/Trending/Declining/Archived): hồi sinh percentile+window Topic_Engine V2
 *     (window_days/sustain_days/archive_sustain_days/top_percentile), áp RIÊNG cho Topic — không
 *     còn gắn Story. Admin override (topics.status_override) luôn thắng tới khi gỡ.
 *   Representative Stocks: tỷ trọng cộng dồn ≥80%, Leader = cao nhất (Topic_Engine V2 §Xác định
 *     cổ phiếu đại diện) — SoT Community V1 §8 đã xác nhận "vẫn hữu ích, có thể tái dùng".
 */
const { query } = require('../../core/database/connection');
const { AppError } = require('../../shared/exceptions/app-error');

const DEFAULT_WEIGHTS = { like: 1, dislike: 1, comment: 3, share: 4 };
const DEFAULT_LIFECYCLE = { window_days: 3, sustain_days: 3, archive_sustain_days: 7, top_percentile: 0.8 };
const DEFAULT_HOT = { min_engagement: 20, min_sentiment_sample: 5 };
const DEFAULT_REP_STOCK = { cumulative_weight_min: 0.8 };
const RANGE_DAYS = { day: 1, week: 7, month: 30 };
const STATUSES = ['new', 'rising', 'trending', 'declining', 'archived'];

function rangeToDays(range) {
  return RANGE_DAYS[range] || RANGE_DAYS.week;
}

function stripDiacritics(s) {
  return String(s == null ? '' : s)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

/** Topic slug — chuẩn hoá hoàn toàn (bỏ dấu + lowercase + bỏ khoảng trắng) để GOM các hashtag
 * khác nhau (có dấu/không dấu/viết hoa khác nhau) về đúng 1 Topic (III.1). */
function topicSlug(hashtagRaw) {
  return stripDiacritics(
    String(hashtagRaw == null ? '' : hashtagRaw).toLowerCase().trim().replace(/^#+/, '')
  ).replace(/\s+/g, '').slice(0, 160);
}

async function getConfig(key, fallback) {
  const res = await query('SELECT value FROM topic_scoring_config WHERE key = $1', [key]);
  if (res.rows[0] && res.rows[0].value) return Object.assign({}, fallback, res.rows[0].value);
  return fallback;
}

/** Resolve-or-create Topic từ 1 hashtag thô (giữ dấu, như user gõ) — III.1: "Khi User nhập
 * hashtag, hệ thống gợi ý Topic đã tồn tại. Nếu hashtag chưa tồn tại, hình thành Topic mới." */
async function resolveOrCreateTopic(hashtagRaw) {
  const hashtag = String(hashtagRaw == null ? '' : hashtagRaw).trim();
  if (!hashtag) return null;

  const existing = await query('SELECT topic_id FROM topic_hashtags WHERE hashtag = $1', [hashtag]);
  if (existing.rows[0]) return existing.rows[0].topic_id;

  const slug = topicSlug(hashtag);
  if (!slug) return null;

  /* Đã có Topic với slug này (hashtag khác dạng viết đã tạo trước) — chỉ map thêm hashtag mới. */
  const bySlug = await query('SELECT id FROM topics WHERE slug = $1', [slug]);
  let topicId;
  if (bySlug.rows[0]) {
    topicId = bySlug.rows[0].id;
  } else {
    const created = await query(
      `INSERT INTO topics (slug, display_name) VALUES ($1, $2)
       ON CONFLICT (slug) DO UPDATE SET slug = EXCLUDED.slug
       RETURNING id`,
      [slug, hashtag]
    );
    topicId = created.rows[0].id;
  }

  await query(
    `INSERT INTO topic_hashtags (hashtag, topic_id) VALUES ($1, $2) ON CONFLICT (hashtag) DO NOTHING`,
    [hashtag, topicId]
  );
  return topicId;
}

/** Ghi Post ↔ Topic đã resolve — gọi sau khi tạo Post có hashtags (community-posts.service.js). */
async function attachPostTopics(postId, hashtags) {
  if (!postId || !Array.isArray(hashtags) || !hashtags.length) return [];
  const topicIds = [];
  for (let i = 0; i < hashtags.length; i++) {
    const topicId = await resolveOrCreateTopic(hashtags[i]);
    if (!topicId) continue;
    topicIds.push(topicId);
    await query(
      `INSERT INTO post_topics (post_id, topic_id) VALUES ($1, $2) ON CONFLICT (post_id, topic_id) DO NOTHING`,
      [postId, topicId]
    );
    await query('UPDATE topics SET last_activity_at = NOW(), updated_at = NOW() WHERE id = $1', [topicId]);
  }
  return topicIds;
}

/**
 * Tính lại topic_daily_stats + topic_stock_mentions cho 1 ngày (mặc định hôm nay, UTC date).
 * IV.1: mỗi cửa sổ Ngày/Tuần/Tháng phải có dữ liệu ĐỘC LẬP — snapshot theo ngày, SUM nhiều dòng
 * khi cần Tuần/Tháng (xem getTopicWindowStats), không dùng tổng toàn thời gian thay thế.
 */
async function recomputeDailyStats(day) {
  const d = day || new Date().toISOString().slice(0, 10);

  await query(
    `INSERT INTO topic_daily_stats (topic_id, day, posts_count, authors_count, updated_at)
     SELECT pt.topic_id, $1::date, COUNT(DISTINCT sp.id), COUNT(DISTINCT sp.author_id)
     FROM social_posts sp
     JOIN post_topics pt ON pt.post_id = sp.id
     WHERE sp.status = 'published' AND sp.created_at::date = $1::date
     GROUP BY pt.topic_id
     ON CONFLICT (topic_id, day) DO UPDATE SET
       posts_count = EXCLUDED.posts_count, authors_count = EXCLUDED.authors_count, updated_at = NOW()`,
    [d]
  );

  await query(
    `INSERT INTO topic_daily_stats (topic_id, day, sentiment_pos, sentiment_neg, sentiment_neu, sentiment_unspecified, updated_at)
     SELECT pt.topic_id, $1::date,
            COUNT(*) FILTER (WHERE sp.sentiment = 'positive'),
            COUNT(*) FILTER (WHERE sp.sentiment = 'negative'),
            COUNT(*) FILTER (WHERE sp.sentiment = 'neutral'),
            COUNT(*) FILTER (WHERE sp.sentiment IS NULL)
     FROM social_posts sp
     JOIN post_topics pt ON pt.post_id = sp.id
     WHERE sp.status = 'published' AND sp.created_at::date = $1::date
     GROUP BY pt.topic_id
     ON CONFLICT (topic_id, day) DO UPDATE SET
       sentiment_pos = EXCLUDED.sentiment_pos, sentiment_neg = EXCLUDED.sentiment_neg,
       sentiment_neu = EXCLUDED.sentiment_neu, sentiment_unspecified = EXCLUDED.sentiment_unspecified,
       updated_at = NOW()`,
    [d]
  );

  /* Like/Dislike XẢY RA trong ngày d, trên MỌI bài thuộc Topic (không giới hạn bài tạo ngày nào). */
  await query(
    `INSERT INTO topic_daily_stats (topic_id, day, likes_count, dislikes_count, updated_at)
     SELECT pt.topic_id, $1::date,
            COUNT(*) FILTER (WHERE il.value = 1), COUNT(*) FILTER (WHERE il.value = -1)
     FROM interaction_likes il
     JOIN post_topics pt ON pt.post_id::text = il.entity_id
     WHERE il.entity_type = 'communitypost' AND il.created_at::date = $1::date
     GROUP BY pt.topic_id
     ON CONFLICT (topic_id, day) DO UPDATE SET
       likes_count = EXCLUDED.likes_count, dislikes_count = EXCLUDED.dislikes_count, updated_at = NOW()`,
    [d]
  );

  await query(
    `INSERT INTO topic_daily_stats (topic_id, day, comments_count, updated_at)
     SELECT pt.topic_id, $1::date, COUNT(*)
     FROM interaction_comments ic
     JOIN post_topics pt ON pt.post_id::text = ic.entity_id
     WHERE ic.entity_type = 'communitypost' AND ic.deleted_at IS NULL AND ic.created_at::date = $1::date
     GROUP BY pt.topic_id
     ON CONFLICT (topic_id, day) DO UPDATE SET comments_count = EXCLUDED.comments_count, updated_at = NOW()`,
    [d]
  );

  /* Share = Repost (Owner 2026-10) — bài MỚI post_type='share' source_type='post' tạo ngày d. */
  await query(
    `INSERT INTO topic_daily_stats (topic_id, day, shares_count, updated_at)
     SELECT pt.topic_id, $1::date, COUNT(*)
     FROM social_posts sp
     JOIN post_topics pt ON pt.post_id::text = sp.source_id
     WHERE sp.post_type = 'share' AND sp.source_type = 'post'
       AND sp.status = 'published' AND sp.created_at::date = $1::date
     GROUP BY pt.topic_id
     ON CONFLICT (topic_id, day) DO UPDATE SET shares_count = EXCLUDED.shares_count, updated_at = NOW()`,
    [d]
  );

  const weights = await getConfig('engagement_weights', DEFAULT_WEIGHTS);
  await query(
    `UPDATE topic_daily_stats SET
       engagement_score = likes_count * $2 + dislikes_count * $3 + comments_count * $4 + shares_count * $5,
       updated_at = NOW()
     WHERE day = $1::date`,
    [d, weights.like, weights.dislike, weights.comment, weights.share]
  );

  /* Stock Mention Ranking (GAP-9) — theo bài MỚI tạo ngày d. */
  await query(
    `INSERT INTO topic_stock_mentions (topic_id, ticker, day, mention_count, unique_post_count, unique_author_count, updated_at)
     SELECT pt.topic_id, st.ticker, $1::date, COUNT(*), COUNT(DISTINCT sp.id), COUNT(DISTINCT sp.author_id)
     FROM social_posts sp
     JOIN post_topics pt ON pt.post_id = sp.id
     JOIN LATERAL unnest(sp.stock_tags) AS st(ticker) ON true
     WHERE sp.status = 'published' AND sp.created_at::date = $1::date
     GROUP BY pt.topic_id, st.ticker
     ON CONFLICT (topic_id, ticker, day) DO UPDATE SET
       mention_count = EXCLUDED.mention_count, unique_post_count = EXCLUDED.unique_post_count,
       unique_author_count = EXCLUDED.unique_author_count, updated_at = NOW()`,
    [d]
  );

  return { day: d };
}

/** Tổng hợp chỉ số 1 Topic trong N ngày gần nhất (kể cả hôm nay). */
async function getTopicWindowStats(topicId, days) {
  const res = await query(
    `SELECT
       COALESCE(SUM(posts_count), 0) AS posts, COALESCE(SUM(likes_count), 0) AS likes,
       COALESCE(SUM(dislikes_count), 0) AS dislikes, COALESCE(SUM(comments_count), 0) AS comments,
       COALESCE(SUM(shares_count), 0) AS shares, COALESCE(SUM(sentiment_pos), 0) AS pos,
       COALESCE(SUM(sentiment_neg), 0) AS neg, COALESCE(SUM(sentiment_neu), 0) AS neu,
       COALESCE(SUM(sentiment_unspecified), 0) AS unspecified,
       COALESCE(SUM(engagement_score), 0) AS engagement
     FROM topic_daily_stats
     WHERE topic_id = $1 AND day >= CURRENT_DATE - ($2::int - 1)`,
    [topicId, days]
  );
  const r = res.rows[0] || {};
  return {
    posts: Number(r.posts) || 0, likes: Number(r.likes) || 0, dislikes: Number(r.dislikes) || 0,
    comments: Number(r.comments) || 0, shares: Number(r.shares) || 0,
    sentimentPos: Number(r.pos) || 0, sentimentNeg: Number(r.neg) || 0, sentimentNeu: Number(r.neu) || 0,
    sentimentUnspecified: Number(r.unspecified) || 0, engagement: Number(r.engagement) || 0
  };
}

async function getTopicWindowStatsOffset(topicId, days, offsetDays) {
  const res = await query(
    `SELECT COALESCE(SUM(engagement_score), 0) AS engagement
     FROM topic_daily_stats
     WHERE topic_id = $1 AND day >= CURRENT_DATE - ($2::int + $3::int - 1) AND day < CURRENT_DATE - ($3::int - 1)`,
    [topicId, days, offsetDays]
  );
  return { engagement: Number(res.rows[0].engagement) || 0 };
}

/** Author Sentiment = (P-N)/(P+N), chỉ tính trên bài ĐÃ khai báo — loại U khỏi tử/mẫu. */
function authorSentimentFromStats(stats, minSample) {
  const sample = stats.sentimentPos + stats.sentimentNeg;
  if (sample < minSample) return { ratio: null, label: 'undetermined', sample };
  const ratio = (stats.sentimentPos - stats.sentimentNeg) / sample;
  return { ratio, label: ratio > 0 ? 'positive' : (ratio < 0 ? 'negative' : 'neutral'), sample };
}

/** Reaction Sentiment = (L-D)/(L+D) — mức độ tán thành, KHÔNG phải sắc thái bài viết (II.3). */
function reactionSentimentFromStats(stats) {
  const total = stats.likes + stats.dislikes;
  if (total === 0) return { ratio: null, label: 'undetermined' };
  const ratio = (stats.likes - stats.dislikes) / total;
  return { ratio, label: ratio > 0 ? 'positive' : (ratio < 0 ? 'negative' : 'neutral') };
}

/** Trending Score — kẹp Normalized_Growth [-1,3] + mẫu base ≥1 để tránh chia-0/bùng nổ (mẫu mới). */
async function trendingScore(topicId, windowDays) {
  const [cur, prev] = await Promise.all([
    getTopicWindowStats(topicId, windowDays),
    getTopicWindowStatsOffset(topicId, windowDays, windowDays)
  ]);
  const growthBase = Math.max(prev.engagement, 1);
  let growth = (cur.engagement - prev.engagement) / growthBase;
  growth = Math.max(-1, Math.min(3, growth));
  const score = Math.log(1 + cur.engagement) * (1 + 0.2 * growth);
  return { score, engagement: cur.engagement, growth };
}

/** Owner: "cổ phiếu có trong Story có tỉ trọng xuất hiện trong top 80% tương tác" — tính TOÀN
 * THỜI GIAN của Topic (đại diện lâu dài, không phải trending ngắn hạn). */
async function getRepresentativeStocks(topicId) {
  const cfg = await getConfig('representative_stock', DEFAULT_REP_STOCK);
  const res = await query(
    `SELECT ticker, SUM(mention_count)::int AS total
     FROM topic_stock_mentions WHERE topic_id = $1 GROUP BY ticker ORDER BY total DESC`,
    [topicId]
  );
  const rows = res.rows;
  const grandTotal = rows.reduce((sum, r) => sum + Number(r.total), 0);
  if (!grandTotal) return { leader: null, stocks: [] };

  const out = [];
  let cumulative = 0;
  for (let i = 0; i < rows.length; i++) {
    const weight = Number(rows[i].total) / grandTotal;
    cumulative += weight;
    out.push({ ticker: rows[i].ticker, weight, cumulative, rank: i + 1 });
    if (cumulative >= cfg.cumulative_weight_min) break;
  }
  return { leader: out[0] ? out[0].ticker : null, stocks: out };
}

/** VII — Hot Eligibility: đạt tương tác tối thiểu + đủ mẫu Sentiment + Author Sentiment tích cực. */
async function hotEligibility(topicId, range) {
  const hotCfg = await getConfig('hot_eligibility', DEFAULT_HOT);
  const stats = await getTopicWindowStats(topicId, rangeToDays(range));
  const sentiment = authorSentimentFromStats(stats, hotCfg.min_sentiment_sample);
  const eligible = stats.engagement >= hotCfg.min_engagement && sentiment.label === 'positive';
  return { eligible, stats, sentiment };
}

/**
 * Đánh giá lại Lifecycle cho TẤT CẢ Topic — chạy 1 lần (cron 00:00), vì percentile cần biết
 * phân phối toàn hệ thống. Admin override (status_override) luôn thắng, không bị ghi đè.
 */
async function evaluateAllLifecycles() {
  const cfg = await getConfig('lifecycle_thresholds', DEFAULT_LIFECYCLE);
  const windowDays = cfg.window_days;
  const sustainDays = cfg.sustain_days;
  const archiveSustainDays = cfg.archive_sustain_days;
  const topPercentile = cfg.top_percentile;

  const res = await query(
    `SELECT t.id, t.status, t.status_override, t.status_since, t.first_seen_at,
            COALESCE(AVG(ds.engagement_score), 0) AS avg_engagement
     FROM topics t
     LEFT JOIN topic_daily_stats ds ON ds.topic_id = t.id AND ds.day >= CURRENT_DATE - ($1::int - 1)
     GROUP BY t.id`,
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
        'UPDATE topics SET status = $1, status_since = NOW(), updated_at = NOW() WHERE id = $2',
        [nextStatus, row.id]
      );
      changed += 1;
    }
  }
  return { evaluated: rows.length, changed, topThreshold };
}

/** Admin dashboard (Phase 3) — mọi biến công thức theo Topic, sort theo điểm giảm dần, filter
 * Ngày/Tuần/Tháng (Owner yêu cầu — xác nhận công thức có hoạt động). */
async function listTopicsAdmin(opts) {
  opts = opts || {};
  const range = ['day', 'week', 'month'].indexOf(opts.range) >= 0 ? opts.range : 'week';
  const days = rangeToDays(range);
  const limit = Math.min(Math.max(Number(opts.limit) || 50, 1), 200);
  const hotCfg = await getConfig('hot_eligibility', DEFAULT_HOT);

  const res = await query(
    `SELECT t.id, t.slug, t.display_name, t.status, t.status_override, t.first_seen_at, t.last_activity_at,
            COALESCE(SUM(ds.posts_count), 0) AS posts, COALESCE(SUM(ds.likes_count), 0) AS likes,
            COALESCE(SUM(ds.dislikes_count), 0) AS dislikes, COALESCE(SUM(ds.comments_count), 0) AS comments,
            COALESCE(SUM(ds.shares_count), 0) AS shares, COALESCE(SUM(ds.sentiment_pos), 0) AS sentiment_pos,
            COALESCE(SUM(ds.sentiment_neg), 0) AS sentiment_neg,
            COALESCE(SUM(ds.sentiment_unspecified), 0) AS sentiment_unspecified,
            COALESCE(SUM(ds.engagement_score), 0) AS engagement,
            (SELECT s.id FROM stories s WHERE s.topic_id = t.id) AS mapped_story_id
     FROM topics t
     LEFT JOIN topic_daily_stats ds ON ds.topic_id = t.id AND ds.day >= CURRENT_DATE - ($1::int - 1)
     GROUP BY t.id
     ORDER BY engagement DESC
     LIMIT $2`,
    [days, limit]
  );

  return {
    range,
    items: res.rows.map((r) => {
      const stats = {
        posts: Number(r.posts) || 0, likes: Number(r.likes) || 0, dislikes: Number(r.dislikes) || 0,
        comments: Number(r.comments) || 0, shares: Number(r.shares) || 0,
        sentimentPos: Number(r.sentiment_pos) || 0, sentimentNeg: Number(r.sentiment_neg) || 0,
        sentimentUnspecified: Number(r.sentiment_unspecified) || 0, engagement: Number(r.engagement) || 0
      };
      const authorSentiment = authorSentimentFromStats(stats, hotCfg.min_sentiment_sample);
      return {
        id: r.id, slug: r.slug, displayName: r.display_name,
        status: r.status_override || r.status, statusOverride: r.status_override,
        firstSeenAt: r.first_seen_at, lastActivityAt: r.last_activity_at,
        stats,
        reactionSentiment: reactionSentimentFromStats(stats),
        authorSentiment,
        hotEligible: stats.engagement >= hotCfg.min_engagement && authorSentiment.label === 'positive',
        mappedStoryId: r.mapped_story_id
      };
    })
  };
}

async function setStatusOverride(topicId, status, adminUser) {
  if (status != null && STATUSES.indexOf(status) < 0) {
    throw AppError.badRequest('TOPIC_STATUS_INVALID', 'Trạng thái không hợp lệ');
  }
  const res = await query(
    `UPDATE topics SET status_override = $1, status_override_by = $2, status_override_at = NOW(), updated_at = NOW()
     WHERE id = $3 RETURNING id`,
    [status || null, status ? (adminUser && adminUser.id) : null, topicId]
  );
  if (!res.rows[0]) throw AppError.notFound('Không tìm thấy Topic');
  return { id: res.rows[0].id };
}

module.exports = {
  topicSlug,
  resolveOrCreateTopic,
  attachPostTopics,
  recomputeDailyStats,
  getTopicWindowStats,
  authorSentimentFromStats,
  reactionSentimentFromStats,
  trendingScore,
  getRepresentativeStocks,
  hotEligibility,
  evaluateAllLifecycles,
  listTopicsAdmin,
  setStatusOverride,
  STATUSES
};
