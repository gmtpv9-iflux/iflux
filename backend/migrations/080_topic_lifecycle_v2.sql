-- Owner 2026-10 (cuối ngày) — Đơn giản hoá vòng đời Topic, chuyển lifecycle 5-trạng-thái
-- (percentile+window, Topic_Engine V2) từ Topic sang Story. Lý do Owner: vòng đời phức tạp hợp
-- với "Câu chuyện" (cần Admin theo dõi/xác nhận) hơn "Chủ đề" (chỉ là thống kê thô từ hashtag).
--
-- Topic giờ chỉ có 2 trạng thái: đang tích lũy (usage_count < 100) / đã chính thức (confirmed_at
-- set khi usage_count đạt 100 — đếm all-time, KHÔNG tính Like/Dislike). Cổ phiếu đại diện (tỷ
-- trọng cộng dồn >=80%) được CHỐT CỨNG đúng lúc confirmed_at set, không tính lại sau đó. Topic
-- không được nhắc tới trong 90 ngày (last_activity_at) -> xoá thật (xem topics.service.js
-- cleanupInactiveTopics) -> Story liên kết xoá CASCADE theo (đổi FK topic_id dưới).
--
-- Dữ liệu Topic/Story hiện tại trên Staging/Production chỉ là dữ liệu test (Owner xác nhận nhiều
-- lần "dữ liệu không quan trọng") -> TRUNCATE trước khi đổi schema, tránh lẫn dữ liệu cũ (status
-- 5-state kiểu cũ) không còn ý nghĩa với logic mới.
TRUNCATE TABLE topic_stock_mentions, topic_daily_stats, post_topics, topic_hashtags, stories, topics CASCADE;

-- ───────────────────────── Topic: bỏ lifecycle 5-state, thêm ngưỡng hình thành ─────────────────────────
ALTER TABLE topics DROP COLUMN IF EXISTS status;
ALTER TABLE topics DROP COLUMN IF EXISTS status_override;
ALTER TABLE topics DROP COLUMN IF EXISTS status_override_by;
ALTER TABLE topics DROP COLUMN IF EXISTS status_override_at;
ALTER TABLE topics DROP COLUMN IF EXISTS status_since;

ALTER TABLE topics ADD COLUMN IF NOT EXISTS usage_count INT NOT NULL DEFAULT 0;
ALTER TABLE topics ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ NULL;
ALTER TABLE topics ADD COLUMN IF NOT EXISTS representative_stocks JSONB NULL;

DROP INDEX IF EXISTS idx_topics_status;
CREATE INDEX IF NOT EXISTS idx_topics_confirmed ON topics (confirmed_at) WHERE confirmed_at IS NOT NULL;

COMMENT ON COLUMN topics.usage_count IS 'Owner 2026-10 — số bài viết đã gắn hashtag này (all-time, từ lần xuất hiện đầu). Đạt 100 -> confirmed_at set, chốt cứng representative_stocks.';
COMMENT ON COLUMN topics.confirmed_at IS 'NULL = đang tích lũy (chưa hiện trong gợi ý chủ đề). Set = đã chính thức, 1 lần duy nhất.';
COMMENT ON COLUMN topics.representative_stocks IS 'Snapshot CỐ ĐỊNH {leader, stocks:[{ticker,weight,cumulative,rank}]} tại lúc confirmed_at — KHÔNG tính lại sau đó, tới khi Topic bị xoá.';

-- ───────────────────────── Story: nhận lifecycle 5-state + cờ tự động tạo ─────────────────────────
-- Cột `status` hiện có của stories (active|archived) GIỮ NGUYÊN — đây là lifecycle MỚI, đặt tên
-- khác (`lifecycle_status`) để không đụng.
ALTER TABLE stories ADD COLUMN IF NOT EXISTS lifecycle_status VARCHAR(20) NOT NULL DEFAULT 'new'
  CHECK (lifecycle_status IN ('new', 'rising', 'trending', 'declining', 'archived'));
ALTER TABLE stories ADD COLUMN IF NOT EXISTS lifecycle_override VARCHAR(20)
  CHECK (lifecycle_override IS NULL OR lifecycle_override IN ('new', 'rising', 'trending', 'declining', 'archived'));
ALTER TABLE stories ADD COLUMN IF NOT EXISTS lifecycle_override_by UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS lifecycle_override_at TIMESTAMPTZ;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS lifecycle_status_since TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE stories ADD COLUMN IF NOT EXISTS auto_created BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN stories.lifecycle_status IS 'Owner 2026-10 — lifecycle 5-trạng-thái chuyển từ Topic sang đây, tính trên Engagement của Topic liên kết (topic_daily_stats), KHÔNG tính riêng cho Story.';
COMMENT ON COLUMN stories.auto_created IS 'true = cron tự tạo (Topic lọt Top 5 Thịnh hành tuần), false = Admin ánh xạ thủ công.';

-- Story chết theo Topic (90 ngày im ắng) — đổi FK từ SET NULL sang CASCADE.
ALTER TABLE stories DROP CONSTRAINT IF EXISTS stories_topic_id_fkey;
ALTER TABLE stories ADD CONSTRAINT stories_topic_id_fkey FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE;

-- ───────────────────────── Config mới/ghi đè (Single Source of Truth) ─────────────────────────
INSERT INTO topic_scoring_config (key, value) VALUES
  ('topic_formation', '{"confirm_usage_count": 100, "inactive_delete_days": 90}'::jsonb),
  ('hot_score_weights', '{"velocity": 0.7, "growth": 0.3, "net_reaction_bonus": 0.1}'::jsonb),
  ('story_lifecycle_thresholds', '{"window_days": 3, "sustain_days": 3, "archive_sustain_days": 7, "top_percentile": 0.8}'::jsonb)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- hot_eligibility đổi hẳn shape: per-range (Ngày/Tuần/Tháng), thay cho {min_engagement,
-- min_sentiment_sample} cũ (không còn dùng cho Topic — min_sentiment_sample vẫn dùng ở
-- authorSentimentFromStats, giữ fallback trong code, không cần ở đây nữa).
UPDATE topic_scoring_config SET value = '{
  "day":   {"engagement_floor": 15,  "user_floor": 5,  "recent_floor": 8,  "recent_window_days": 1},
  "week":  {"engagement_floor": 40,  "user_floor": 12, "recent_floor": 15, "recent_window_days": 2},
  "month": {"engagement_floor": 100, "user_floor": 25, "recent_floor": 30, "recent_window_days": 5}
}'::jsonb, updated_at = NOW() WHERE key = 'hot_eligibility';
