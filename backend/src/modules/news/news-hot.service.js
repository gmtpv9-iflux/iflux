'use strict';

/**
 * "Tin nóng" — xếp hạng News theo điểm tương tác trong khung giờ (Hôm nay/Tuần này/Tháng này).
 * Trọng số Owner chốt: Bình luận=5 · Đăng lại=3 · Chia sẻ=2 · Thích=1. Nguồn dữ liệu (SoT):
 *   - Bình luận: news_comments.created_at (đã có sẵn, không cần bảng mới).
 *   - Đăng lại:  social_posts (post_type='share' AND source_type='news' AND source_id=<newsId>),
 *                created_at thật — xem interaction/repost-modal.js.
 *   - Chia sẻ + Thích: news_interaction_events (migration 085, event_type='share'|'like') — 2 chỉ
 *     số DUY NHẤT chưa có timestamp ở nơi khác trước đây (news_posts.payload chỉ là bộ đếm/mảng
 *     liked_by[], không có mốc thời gian từng lượt — xem interaction.service.js mutate()).
 * Rolling window N ngày từ NOW() (không phải ranh giới lịch) — cùng quy ước RANGE_DAYS với
 * Community topics.service.js (day=1/week=7/month=30).
 */
const { query } = require('../../core/database/connection');

const RANGE_DAYS = { day: 1, week: 7, month: 30 };
const WEIGHTS = { comment: 5, repost: 3, share: 2, like: 1 };

function rangeToDays(range) {
  return RANGE_DAYS[range] || RANGE_DAYS.week;
}

/**
 * Trả danh sách news_post_id kèm điểm + breakdown, xếp hạng giảm dần, trong cửa sổ `days` ngày.
 * Chỉ tính trên bài đã published (JOIN news_posts, lọc status) — không aggregate bài draft/gỡ.
 */
async function getHotPostIds(range, limit) {
  const days = rangeToDays(range);
  const n = Math.min(Math.max(Number(limit) || 20, 1), 50);

  const res = await query(
    `WITH window_comments AS (
       SELECT post_id AS news_post_id, COUNT(*)::int AS n
       FROM news_comments
       WHERE deleted_at IS NULL AND created_at >= NOW() - ($1 || ' days')::interval
       GROUP BY post_id
     ),
     window_reposts AS (
       SELECT source_id AS news_post_id, COUNT(*)::int AS n
       FROM social_posts
       WHERE post_type = 'share' AND source_type = 'news'
         AND status = 'published'
         AND created_at >= NOW() - ($1 || ' days')::interval
       GROUP BY source_id
     ),
     window_events AS (
       SELECT news_post_id,
         COUNT(*) FILTER (WHERE event_type = 'share')::int AS shares,
         COUNT(*) FILTER (WHERE event_type = 'like')::int AS likes
       FROM news_interaction_events
       WHERE created_at >= NOW() - ($1 || ' days')::interval
       GROUP BY news_post_id
     ),
     candidates AS (
       SELECT news_post_id FROM window_comments
       UNION SELECT news_post_id FROM window_reposts
       UNION SELECT news_post_id FROM window_events
     ),
     scored AS (
       SELECT p.id AS news_post_id,
         COALESCE(c.n, 0) AS comments,
         COALESCE(r.n, 0) AS reposts,
         COALESCE(e.shares, 0) AS shares,
         COALESCE(e.likes, 0) AS likes,
         COALESCE(c.n, 0) * $2 + COALESCE(r.n, 0) * $3 + COALESCE(e.shares, 0) * $4 + COALESCE(e.likes, 0) * $5 AS score
       FROM candidates cand
       JOIN news_posts p ON p.id = cand.news_post_id AND p.status IN ('published', 'published_rss', 'publish_AI')
       LEFT JOIN window_comments c ON c.news_post_id = p.id
       LEFT JOIN window_reposts r ON r.news_post_id = p.id
       LEFT JOIN window_events e ON e.news_post_id = p.id
     )
     SELECT * FROM scored WHERE score > 0 ORDER BY score DESC, news_post_id DESC LIMIT $6`,
    [String(days), WEIGHTS.comment, WEIGHTS.repost, WEIGHTS.share, WEIGHTS.like, n]
  );
  return res.rows;
}

module.exports = { getHotPostIds, WEIGHTS, RANGE_DAYS };
