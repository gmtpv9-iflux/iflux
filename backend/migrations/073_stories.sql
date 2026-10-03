-- Community V1 Phase 2 — Story/Chủ đề (SoT "Community (Cộng đồng) Architecture V1" §7).
-- Thay thế hoàn toàn Topic Engine V1/V2 (state machine 5 trạng thái + Topic Score) — SUPERSEDED
-- theo SoT §8, không triển khai lại ở đây. Story: User/Admin tạo trực tiếp (title + luận điểm +
-- sentiment), tồn tại ngay khi publish, không qua cron đánh giá trạng thái.
-- agree_count/comment_count KHÔNG lưu cột riêng — đọc qua Interaction (interaction_likes với
-- entity_type='story' cho "Đồng tình"/agree, interaction_comments với entity_type='story' cho
-- bình luận), đúng nguyên tắc "không lưu trùng engagement" đã áp dụng cho social_posts (migration 072).
CREATE TABLE IF NOT EXISTS stories (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           VARCHAR(200) NOT NULL,
  description     TEXT NOT NULL DEFAULT '',
  author_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stock_tags      TEXT[] NOT NULL DEFAULT '{}',
  sentiment       VARCHAR(10) NOT NULL CHECK (sentiment IN ('bullish', 'bearish')),
  status          VARCHAR(20) NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'archived')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Danh sách Chủ đề theo thời gian (latest) + lọc active.
CREATE INDEX IF NOT EXISTS idx_stories_created
  ON stories (created_at DESC)
  WHERE status = 'active';

-- "Mã được thảo luận nhiều" cần quét stock_tags của Story (cùng với Post — xem §7.4, bảng xếp
-- hạng KHÔNG gộp nhưng cả hai nguồn đều cần lọc theo mã).
CREATE INDEX IF NOT EXISTS idx_stories_stock_tags
  ON stories USING GIN (stock_tags)
  WHERE status = 'active';

COMMENT ON TABLE stories IS 'SoT Community (Cộng đồng) Architecture V1 §7 — Story/Chủ đề, thay thế Topic Engine V1/V2 (SUPERSEDED §8).';
