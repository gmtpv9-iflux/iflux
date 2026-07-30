-- Bình luận bài viết Cộng đồng — Server là Source of Truth (không dùng localStorage nghiệp vụ)
-- user_id không FK users: Prod owners khác nhau (postgres vs iflux) — tránh 42501 khi migrate
CREATE TABLE IF NOT EXISTS community_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id VARCHAR(120) NOT NULL,
    post_slug VARCHAR(255) NOT NULL DEFAULT '',
    user_id UUID,
    user_name VARCHAR(160) NOT NULL DEFAULT 'Thành viên',
    body TEXT NOT NULL DEFAULT '',
    image_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_com_cmt_post_created
  ON community_comments (post_id, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_com_cmt_slug_created
  ON community_comments (post_slug, created_at DESC)
  WHERE deleted_at IS NULL AND post_slug <> '';

COMMENT ON TABLE community_comments IS 'SoT bình luận bài Cộng đồng — User Web đọc/ghi qua API, không persist localStorage';
