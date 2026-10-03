-- Community V1 Phase 1 — Post model thống nhất (SoT "Community (Cộng đồng) Architecture V1" §4).
-- MỘT bảng duy nhất cho Feed/Timeline/Stock Detail — không tạo 3 bản copy theo view (nguyên tắc
-- khoá cứng §4.1). Tên "social_posts" (không phải "community_posts") để tránh trùng tên với
-- bảng community_posts LỊCH SỬ đã RENAME thành news_posts ở migration 063 (khái niệm khác hẳn —
-- bảng đó là bài báo/tin tức, bảng này là bài đăng mạng xã hội nhà đầu tư).
CREATE TABLE IF NOT EXISTS social_posts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content         TEXT NOT NULL DEFAULT '',
  post_type       VARCHAR(20) NOT NULL DEFAULT 'status'
                    CHECK (post_type IN ('status', 'stock_view', 'share', 'reply_as_post')),
  source_type     VARCHAR(20)
                    CHECK (source_type IS NULL OR source_type IN ('news', 'story', 'post', 'chart')),
  source_id       VARCHAR(160),
  stock_tags      TEXT[] NOT NULL DEFAULT '{}',
  visibility      VARCHAR(20) NOT NULL DEFAULT 'public'
                    CHECK (visibility IN ('public', 'followers')),
  status          VARCHAR(20) NOT NULL DEFAULT 'published'
                    CHECK (status IN ('published', 'deleted')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Timeline (1 author, mới nhất trước).
CREATE INDEX IF NOT EXISTS idx_social_posts_author_created
  ON social_posts (author_id, created_at DESC)
  WHERE status = 'published';

-- Feed latest/trending (toàn bộ public, mới nhất trước).
CREATE INDEX IF NOT EXISTS idx_social_posts_created
  ON social_posts (created_at DESC)
  WHERE status = 'published' AND visibility = 'public';

-- Stock Detail tab Thảo luận — lọc theo mã trong stock_tags.
CREATE INDEX IF NOT EXISTS idx_social_posts_stock_tags
  ON social_posts USING GIN (stock_tags)
  WHERE status = 'published';

-- Repost/Share — đếm "đã chia sẻ bao nhiêu lần" qua source_type='post' + source_id, không cần
-- bảng riêng (post_type='share' TỰ LÀ 1 Post mới, xem SoT §4.2).
CREATE INDEX IF NOT EXISTS idx_social_posts_source
  ON social_posts (source_type, source_id)
  WHERE status = 'published';

COMMENT ON TABLE social_posts IS 'SoT Community (Cộng đồng) Architecture V1 §4 — Post model duy nhất cho Feed/Timeline/Stock Detail.';

-- Like/Favorite generic (IA-001 registry) — CHƯA có bảng nào trước đây, chỉ interaction_comments
-- (migration 023) tồn tại. Dùng chung cho mọi entity_type (post cộng đồng, stock, sector, family,
-- story…) — không riêng cho bảng nào, giống đúng tinh thần "Interaction tái dùng" của SoT §5.
CREATE TABLE IF NOT EXISTS interaction_likes (
  entity_type   VARCHAR(32) NOT NULL,
  entity_id     VARCHAR(160) NOT NULL,
  user_id       UUID NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (entity_type, entity_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_ix_likes_entity
  ON interaction_likes (entity_type, entity_id);

COMMENT ON TABLE interaction_likes IS 'SoT Interaction v1 — like/favorite generic theo entity_type+entity_id, dùng chung mọi nơi (không riêng Community).';
