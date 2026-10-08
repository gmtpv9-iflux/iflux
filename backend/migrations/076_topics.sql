-- Topic entity mới — Owner 2026-10: tách lại khỏi Story, hình thành từ Hashtag trên Post Cộng
-- đồng (SoT "Community → Topic → Story", mục III.1: "Mỗi Topic là một thực thể được quản lý tập
-- trung, không phải chuỗi văn bản độc lập ở từng bài đăng"). Thay thế hoàn toàn Content Engine
-- cũ (content_chu_de* — đã DROP ở migration 075).

CREATE TABLE IF NOT EXISTS topics (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- slug = chuẩn hoá hoàn toàn (bỏ dấu + lowercase + bỏ khoảng trắng) — khoá GOM các hashtag
  -- khác nhau (có dấu/không dấu/viết hoa khác nhau) về đúng 1 Topic (III.1: "hashtag trùng nhau
  -- phải ánh xạ về cùng Topic theo quy tắc chuẩn hoá").
  slug                VARCHAR(160) NOT NULL UNIQUE,
  display_name        VARCHAR(200) NOT NULL,
  status              VARCHAR(20) NOT NULL DEFAULT 'new'
                        CHECK (status IN ('new', 'rising', 'trending', 'declining', 'archived')),
  -- Admin override thắng thuật toán tới khi gỡ (hồi sinh nguyên tắc Topic_Engine V1/V2, chỉ áp
  -- riêng cho Topic — không còn gắn Story).
  status_override     VARCHAR(20)
                        CHECK (status_override IS NULL OR status_override IN ('new', 'rising', 'trending', 'declining', 'archived')),
  status_override_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  status_override_at  TIMESTAMPTZ,
  first_seen_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_activity_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_topics_status ON topics (status, last_activity_at DESC);

COMMENT ON TABLE topics IS 'Owner 2026-10 — Topic hình thành từ Hashtag Post Cộng đồng, entity độc lập, Admin ánh xạ thủ công sang Story (stories.topic_id, migration 078).';

-- Hashtag thô (giữ dấu, như user gõ) đã từng map tới Topic nào — tra cứu nhanh khi user gõ lại
-- đúng hashtag cũ, không cần tính lại slug chuẩn hoá mỗi lần.
CREATE TABLE IF NOT EXISTS topic_hashtags (
  hashtag     VARCHAR(80) PRIMARY KEY,
  topic_id    UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_topic_hashtags_topic ON topic_hashtags (topic_id);

-- Post ↔ Topic đã resolve (không còn chỉ là chuỗi text rời rạc trong social_posts.hashtags).
CREATE TABLE IF NOT EXISTS post_topics (
  post_id     UUID NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
  topic_id    UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (post_id, topic_id)
);

CREATE INDEX IF NOT EXISTS idx_post_topics_topic ON post_topics (topic_id);

-- Snapshot thống kê THEO NGÀY — Ngày/Tuần/Tháng là cửa sổ SUM nhiều dòng, không phải state
-- riêng (IV.1: "Mỗi khoảng thời gian phải có dữ liệu độc lập, không dùng tổng toàn thời gian").
CREATE TABLE IF NOT EXISTS topic_daily_stats (
  topic_id              UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  day                   DATE NOT NULL,
  posts_count           INT NOT NULL DEFAULT 0,
  authors_count         INT NOT NULL DEFAULT 0,
  likes_count           INT NOT NULL DEFAULT 0,
  dislikes_count        INT NOT NULL DEFAULT 0,
  comments_count        INT NOT NULL DEFAULT 0,
  shares_count          INT NOT NULL DEFAULT 0,
  sentiment_pos         INT NOT NULL DEFAULT 0,
  sentiment_neg         INT NOT NULL DEFAULT 0,
  sentiment_neu         INT NOT NULL DEFAULT 0,
  sentiment_unspecified INT NOT NULL DEFAULT 0,
  engagement_score      NUMERIC(14, 4) NOT NULL DEFAULT 0,
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (topic_id, day)
);

CREATE INDEX IF NOT EXISTS idx_topic_daily_stats_day ON topic_daily_stats (day DESC);

-- Stock Mention Ranking (GAP-9) — phân biệt số lần nhắc / số bài duy nhất / số tác giả duy nhất,
-- theo ngày để cộng theo cửa sổ Ngày/Tuần/Tháng giống topic_daily_stats.
CREATE TABLE IF NOT EXISTS topic_stock_mentions (
  topic_id              UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  ticker                VARCHAR(16) NOT NULL,
  day                   DATE NOT NULL,
  mention_count         INT NOT NULL DEFAULT 0,
  unique_post_count     INT NOT NULL DEFAULT 0,
  unique_author_count   INT NOT NULL DEFAULT 0,
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (topic_id, ticker, day)
);

CREATE INDEX IF NOT EXISTS idx_topic_stock_mentions_topic ON topic_stock_mentions (topic_id, day DESC);

-- Single Source of Truth cho mọi hằng số công thức (trọng số Engagement, ngưỡng Hot Eligibility,
-- ngưỡng lifecycle W/D/X%) — Admin chỉnh qua Admin UI (Phase 3), không rải hardcode nhiều nơi.
CREATE TABLE IF NOT EXISTS topic_scoring_config (
  key         VARCHAR(80) PRIMARY KEY,
  value       JSONB NOT NULL,
  updated_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO topic_scoring_config (key, value) VALUES
  ('engagement_weights', '{"like": 1, "dislike": 1, "comment": 3, "share": 4}'::jsonb),
  ('lifecycle_thresholds', '{"window_days": 3, "sustain_days": 3, "archive_sustain_days": 7, "top_percentile": 0.8}'::jsonb),
  ('hot_eligibility', '{"min_engagement": 20, "min_sentiment_sample": 5}'::jsonb),
  ('representative_stock', '{"cumulative_weight_min": 0.8}'::jsonb)
ON CONFLICT (key) DO NOTHING;
