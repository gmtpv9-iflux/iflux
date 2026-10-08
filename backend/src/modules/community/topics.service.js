'use strict';

/**
 * Topic service — Owner 2026-10: Topic hình thành từ Hashtag Post Cộng đồng (SoT "Community →
 * Topic → Story"). Tách khỏi Story — Admin ánh xạ thủ công (xem stories.service.js mapTopicToStory).
 *
 * Phase 6 (2026-10-08, cuối ngày) — Owner đơn giản hoá lại:
 *   - Topic KHÔNG còn lifecycle 5-trạng-thái (đã chuyển sang Story — xem stories.service.js).
 *   - Topic "chính thức" (confirmed) khi hashtag được dùng (usage_count, all-time, KHÔNG tính
 *     Like/Dislike) >= ngưỡng (topic_formation.confirm_usage_count, mặc định 100). Trước đó vẫn
 *     đếm ngầm, không hiện trong gợi ý "chủ đề có sẵn".
 *   - Cổ phiếu đại diện (tỷ trọng cộng dồn >=80%) CHỐT CỨNG 1 lần duy nhất đúng lúc confirmed_at
 *     set (representative_stocks), KHÔNG tính lại sau đó.
 *   - Topic không được nhắc tới (last_activity_at) trong N ngày (topic_formation
 *     .inactive_delete_days, mặc định 90) -> xoá thật (cleanupInactiveTopics) -> Story liên kết
 *     xoá CASCADE theo (FK đã đổi, xem migration 080).
 *
 * Công thức Owner chốt (đáp ứng nguyên văn, chỉ xử lý chia-0/mẫu nhỏ — "giữ đơn giản, tối ưu sau"):
 *   Engagement = L*wL + D*wD + C*wC + S*wS (mặc định wL=wD=1, wC=3, wS=4 — xem topic_scoring_config)
 *   Author Sentiment = (P-N)/(P+N), chỉ tính trên bài ĐÃ khai báo (loại U khỏi tử/mẫu).
 *   Reaction Sentiment = (L-D)/(L+D) — mức tán thành, KHÔNG phải sắc thái bài viết (II.3).
 *   "Chủ đề đang thịnh hành" (getTrendingTopics) = Top N theo Engagement(kỳ) DESC, lọc Topic đã
 *     confirmed + có cổ phiếu đại diện — KHÔNG áp Eligibility Gate.
 *   "Top chủ đề mới nổi" (getHotTopics) = Eligibility Gate (Engagement/User/Recent Floor theo kỳ)
 *     + Net Reaction Gate (Likes-Dislikes trong kỳ phải >=0) + Hot Score = (0.7*Velocity +
 *     0.3*Growth) * (1 + 0.1*NetReactionNorm), Velocity/Growth/NetReaction chuẩn hoá percentile
 *     rank trong nhóm đã qua Gate (ổn định hơn min-max).
 *   Representative Stocks: tỷ trọng cộng dồn ≥80%, Leader = cao nhất (Topic_Engine V2).
 */
const { query } = require('../../core/database/connection');

const DEFAULT_WEIGHTS = { like: 1, dislike: 1, comment: 3, share: 4 };
const DEFAULT_REP_STOCK = { cumulative_weight_min: 0.8 };
const DEFAULT_FORMATION = { confirm_usage_count: 100, inactive_delete_days: 90 };
const DEFAULT_HOT_SCORE_WEIGHTS = { velocity: 0.7, growth: 0.3, net_reaction_bonus: 0.1 };
const DEFAULT_HOT_ELIGIBILITY = {
  day: { engagement_floor: 15, user_floor: 5, recent_floor: 8, recent_window_days: 1 },
  week: { engagement_floor: 40, user_floor: 12, recent_floor: 15, recent_window_days: 2 },
  month: { engagement_floor: 100, user_floor: 25, recent_floor: 30, recent_window_days: 5 }
};
const RANGE_DAYS = { day: 1, week: 7, month: 30 };

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

/** Chốt cứng cổ phiếu đại diện + đánh dấu Topic "chính thức" — gọi ĐÚNG 1 LẦN khi usage_count
 * vừa đạt ngưỡng. Tính trên TOÀN BỘ lịch sử topic_stock_mentions từ lúc hashtag xuất hiện lần đầu
 * tới hiện tại (Owner: "nếu được nhắc nhiều hơn 100 lần từ lúc xuất hiện lần đầu"). */
async function confirmTopic(topicId) {
  const rep = await getRepresentativeStocks(topicId);
  await query(
    `UPDATE topics SET confirmed_at = NOW(), representative_stocks = $1, updated_at = NOW()
     WHERE id = $2 AND confirmed_at IS NULL`,
    [JSON.stringify(rep), topicId]
  );
  return rep;
}

/** Ghi Post ↔ Topic đã resolve — gọi sau khi tạo Post có hashtags (community-posts.service.js).
 * Tăng usage_count CHỈ khi (post_id, topic_id) chưa từng tồn tại (bài mới dùng hashtag này lần
 * đầu) — không tăng khi 1 bài được xử lý lại/trùng. Đạt ngưỡng lần đầu -> confirmTopic(). */
async function attachPostTopics(postId, hashtags) {
  if (!postId || !Array.isArray(hashtags) || !hashtags.length) return [];
  const formation = await getConfig('topic_formation', DEFAULT_FORMATION);
  const topicIds = [];
  for (let i = 0; i < hashtags.length; i++) {
    const topicId = await resolveOrCreateTopic(hashtags[i]);
    if (!topicId) continue;
    topicIds.push(topicId);

    const inserted = await query(
      `INSERT INTO post_topics (post_id, topic_id) VALUES ($1, $2) ON CONFLICT (post_id, topic_id) DO NOTHING RETURNING post_id`,
      [postId, topicId]
    );
    if (!inserted.rows[0]) {
      await query('UPDATE topics SET last_activity_at = NOW(), updated_at = NOW() WHERE id = $1', [topicId]);
      continue;
    }

    const updated = await query(
      `UPDATE topics SET usage_count = usage_count + 1, last_activity_at = NOW(), updated_at = NOW()
       WHERE id = $1 RETURNING usage_count, confirmed_at`,
      [topicId]
    );
    const row = updated.rows[0];
    if (row && !row.confirmed_at && Number(row.usage_count) >= Number(formation.confirm_usage_count)) {
      await confirmTopic(topicId);
    }
  }
  return topicIds;
}

/** Quét toàn bộ Topic pending — phòng trường hợp bỏ sót (chạy trong cron, không chỉ lúc post mới). */
async function confirmPendingTopics() {
  const formation = await getConfig('topic_formation', DEFAULT_FORMATION);
  const res = await query(
    `SELECT id FROM topics WHERE confirmed_at IS NULL AND usage_count >= $1`,
    [formation.confirm_usage_count]
  );
  for (const row of res.rows) await confirmTopic(row.id);
  return { confirmed: res.rows.length };
}

/** Xoá Topic không được nhắc tới trong N ngày (topic_formation.inactive_delete_days) — xoá thật,
 * CASCADE kéo theo topic_hashtags/post_topics/topic_daily_stats/topic_stock_mentions/stories. */
async function cleanupInactiveTopics() {
  const formation = await getConfig('topic_formation', DEFAULT_FORMATION);
  const res = await query(
    `DELETE FROM topics WHERE last_activity_at < NOW() - ($1 || ' days')::interval RETURNING id`,
    [formation.inactive_delete_days]
  );
  return { deleted: res.rows.length, ids: res.rows.map((r) => r.id) };
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

/** Users duy nhất tương tác với Topic trong N ngày (viết bài / Like / Dislike / Bình luận) —
 * dùng cho Eligibility Gate "Unique Interacting Users" (Top chủ đề mới nổi). */
async function getTopicUniqueUsers(topicId, days) {
  const res = await query(
    `SELECT COUNT(DISTINCT user_id)::int AS n FROM (
       SELECT sp.author_id AS user_id FROM social_posts sp
         JOIN post_topics pt ON pt.post_id = sp.id
         WHERE pt.topic_id = $1 AND sp.status = 'published' AND sp.created_at >= NOW() - ($2::int || ' days')::interval
       UNION
       SELECT il.user_id FROM interaction_likes il
         JOIN post_topics pt ON pt.post_id::text = il.entity_id
         WHERE pt.topic_id = $1 AND il.entity_type = 'communitypost' AND il.created_at >= NOW() - ($2::int || ' days')::interval
       UNION
       SELECT ic.user_id FROM interaction_comments ic
         JOIN post_topics pt ON pt.post_id::text = ic.entity_id
         WHERE pt.topic_id = $1 AND ic.entity_type = 'communitypost' AND ic.deleted_at IS NULL
           AND ic.created_at >= NOW() - ($2::int || ' days')::interval
     ) x`,
    [topicId, days]
  );
  return Number(res.rows[0] && res.rows[0].n) || 0;
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

/** Owner: "cổ phiếu có trong Story có tỉ trọng xuất hiện trong top 80% tương tác" — tính TOÀN
 * THỜI GIAN của Topic (đại diện lâu dài, không phải trending ngắn hạn). Gọi lúc confirmTopic() —
 * KHÔNG gọi lại sau đó (xem getStoredRepresentativeStocks để đọc giá trị đã chốt). */
async function getRepresentativeStocks(topicId) {
  const cfg = await getConfig('representative_stock', DEFAULT_REP_STOCK);
  /* Tính TRỰC TIẾP từ social_posts/post_topics (toàn bộ lịch sử tới hiện tại) — KHÔNG đọc
     topic_stock_mentions (chỉ được cron ghi theo ngày, 00:00). Nếu dùng bảng đó, Topic confirm
     ngay trong ngày (trước khi cron chạy) sẽ luôn ra cổ phiếu đại diện rỗng — bug đã phát hiện
     khi test thật trên Staging 2026-10-08. */
  const res = await query(
    `SELECT st.ticker AS ticker, COUNT(*)::int AS total
     FROM social_posts sp
     JOIN post_topics pt ON pt.post_id = sp.id
     JOIN LATERAL unnest(sp.stock_tags) AS st(ticker) ON true
     WHERE pt.topic_id = $1 AND sp.status = 'published'
     GROUP BY st.ticker ORDER BY total DESC`,
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

/** Đọc snapshot CỐ ĐỊNH đã chốt lúc confirmTopic() — dùng cho mapTopicToStory/hiển thị, KHÔNG
 * tính lại. Topic chưa confirmed trả rỗng. */
async function getStoredRepresentativeStocks(topicId) {
  const res = await query('SELECT representative_stocks FROM topics WHERE id = $1', [topicId]);
  const row = res.rows[0];
  if (!row || !row.representative_stocks) return { leader: null, stocks: [] };
  return row.representative_stocks;
}

function percentileRank(values, value) {
  if (!values.length) return 0;
  const sorted = values.slice().sort((a, b) => a - b);
  let countBelow = 0;
  for (let i = 0; i < sorted.length; i++) { if (sorted[i] < value) countBelow++; }
  if (sorted.length === 1) return 100;
  return (countBelow / (sorted.length - 1)) * 100;
}

/**
 * "Chủ đề đang thịnh hành" — Top N theo Engagement(kỳ) DESC. Lọc: Topic đã confirmed VÀ có
 * cổ phiếu đại diện (representative_stocks không rỗng) — nếu rỗng thì loại (Owner: "Nếu không có
 * cổ phiếu nào đáp ứng điều kiện -> Chủ đề đó sẽ không xuất hiện"). KHÔNG áp Eligibility Gate.
 */
async function getTrendingTopics(range, limit) {
  const days = rangeToDays(range);
  const n = Math.min(Math.max(Number(limit) || 5, 1), 50);
  const res = await query(
    `SELECT t.id, t.slug, t.display_name, t.representative_stocks,
            COALESCE(SUM(ds.likes_count), 0) AS likes, COALESCE(SUM(ds.dislikes_count), 0) AS dislikes,
            COALESCE(SUM(ds.comments_count), 0) AS comments, COALESCE(SUM(ds.shares_count), 0) AS shares,
            COALESCE(SUM(ds.engagement_score), 0) AS engagement
     FROM topics t
     JOIN topic_daily_stats ds ON ds.topic_id = t.id AND ds.day >= CURRENT_DATE - ($1::int - 1)
     WHERE t.confirmed_at IS NOT NULL
       AND t.representative_stocks IS NOT NULL
       AND jsonb_array_length(t.representative_stocks->'stocks') > 0
     GROUP BY t.id
     HAVING COALESCE(SUM(ds.engagement_score), 0) > 0
     ORDER BY engagement DESC
     LIMIT $2`,
    [days, n]
  );
  return res.rows.map((r) => ({
    id: r.id, slug: r.slug, title: r.display_name,
    representativeStocks: r.representative_stocks,
    stats: {
      likes: Number(r.likes) || 0, dislikes: Number(r.dislikes) || 0,
      comments: Number(r.comments) || 0, shares: Number(r.shares) || 0,
      engagement: Number(r.engagement) || 0
    }
  }));
}

/**
 * "Top chủ đề mới nổi" — Eligibility Gate + Net Reaction Gate + Hot Score (Velocity/Growth
 * percentile rank trong nhóm đã qua Gate). Trả tối đa `limit`, có thể ít hơn nếu không đủ Topic
 * qua Gate (Owner: "Không bắt buộc phải đủ 10 Topic nếu ít Topic đạt ngưỡng").
 */
async function getHotTopics(range, limit) {
  const r = ['day', 'week', 'month'].indexOf(range) >= 0 ? range : 'week';
  const days = rangeToDays(r);
  const n = Math.min(Math.max(Number(limit) || 10, 1), 50);
  const eligibilityCfg = await getConfig('hot_eligibility', DEFAULT_HOT_ELIGIBILITY);
  const gate = Object.assign({}, DEFAULT_HOT_ELIGIBILITY[r], eligibilityCfg[r]);
  const weights = await getConfig('hot_score_weights', DEFAULT_HOT_SCORE_WEIGHTS);

  const candidates = await query(
    `SELECT t.id, t.slug, t.display_name, t.representative_stocks
     FROM topics t WHERE t.confirmed_at IS NOT NULL`
  );
  if (!candidates.rows.length) return [];

  const evaluated = [];
  for (const row of candidates.rows) {
    const [cur, prev, recent, uniqueUsers] = await Promise.all([
      getTopicWindowStats(row.id, days),
      getTopicWindowStatsOffset(row.id, days, days),
      getTopicWindowStatsOffset(row.id, gate.recent_window_days, 0),
      getTopicUniqueUsers(row.id, days)
    ]);
    const netReaction = cur.likes - cur.dislikes;
    const eligible =
      cur.engagement >= gate.engagement_floor &&
      uniqueUsers >= gate.user_floor &&
      recent.engagement >= gate.recent_floor &&
      netReaction >= 0;
    if (!eligible) continue;

    const growthBase = Math.max(prev.engagement, 1);
    const growth = (cur.engagement - prev.engagement) / growthBase;
    evaluated.push({
      id: row.id, slug: row.slug, title: row.display_name, representativeStocks: row.representative_stocks,
      stats: { likes: cur.likes, dislikes: cur.dislikes, comments: cur.comments, shares: cur.shares, engagement: cur.engagement },
      recentEngagement: recent.engagement, growth, netReaction
    });
  }
  if (!evaluated.length) return [];

  const recentValues = evaluated.map((e) => e.recentEngagement);
  const growthValues = evaluated.map((e) => e.growth);
  const netValues = evaluated.map((e) => e.netReaction);

  evaluated.forEach((e) => {
    const velocity = percentileRank(recentValues, e.recentEngagement);
    const growthScore = percentileRank(growthValues, e.growth);
    const netNorm = percentileRank(netValues, e.netReaction) / 100;
    e.hotScore = (weights.velocity * velocity + weights.growth * growthScore) * (1 + weights.net_reaction_bonus * netNorm);
  });

  evaluated.sort((a, b) => b.hotScore - a.hotScore);
  return evaluated.slice(0, n).map((e) => ({
    id: e.id, slug: e.slug, title: e.title, representativeStocks: e.representativeStocks,
    stats: e.stats, hotScore: e.hotScore
  }));
}

/** Admin dashboard (Phase 3) — mọi biến công thức theo Topic, sort theo điểm giảm dần, filter
 * Ngày/Tuần/Tháng (Owner yêu cầu — xác nhận công thức có hoạt động). */
async function listTopicsAdmin(opts) {
  opts = opts || {};
  const range = ['day', 'week', 'month'].indexOf(opts.range) >= 0 ? opts.range : 'week';
  const days = rangeToDays(range);
  const limit = Math.min(Math.max(Number(opts.limit) || 50, 1), 200);

  const res = await query(
    `SELECT t.id, t.slug, t.display_name, t.usage_count, t.confirmed_at, t.representative_stocks,
            t.first_seen_at, t.last_activity_at,
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
      return {
        id: r.id, slug: r.slug, displayName: r.display_name,
        usageCount: Number(r.usage_count) || 0, confirmed: !!r.confirmed_at, confirmedAt: r.confirmed_at,
        representativeStocks: r.representative_stocks || { leader: null, stocks: [] },
        firstSeenAt: r.first_seen_at, lastActivityAt: r.last_activity_at,
        stats,
        reactionSentiment: reactionSentimentFromStats(stats),
        authorSentiment: authorSentimentFromStats(stats, 5),
        mappedStoryId: r.mapped_story_id
      };
    })
  };
}

module.exports = {
  topicSlug,
  resolveOrCreateTopic,
  attachPostTopics,
  confirmTopic,
  confirmPendingTopics,
  cleanupInactiveTopics,
  recomputeDailyStats,
  getTopicWindowStats,
  getTopicUniqueUsers,
  authorSentimentFromStats,
  reactionSentimentFromStats,
  getRepresentativeStocks,
  getStoredRepresentativeStocks,
  getTrendingTopics,
  getHotTopics,
  listTopicsAdmin
};
