-- FN-001: Follow User + Inbox notifications (cursor) + comment likes
-- Cấm dùng làm full dump API — FE chỉ count/exist/cursor+limit

CREATE TABLE IF NOT EXISTS user_follows (
  follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  followee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (follower_id, followee_id),
  CONSTRAINT user_follows_no_self CHECK (follower_id <> followee_id)
);

CREATE INDEX IF NOT EXISTS idx_user_follows_followee ON user_follows (followee_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_follows_follower ON user_follows (follower_id, created_at DESC);

CREATE TABLE IF NOT EXISTS user_inbox_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  template_code VARCHAR(64) NOT NULL,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  icon VARCHAR(64) NOT NULL DEFAULT 'ti-bell',
  href TEXT NOT NULL DEFAULT '',
  dedupe_key VARCHAR(191) NULL,
  read_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_user_inbox_dedupe
  ON user_inbox_notifications (user_id, dedupe_key)
  WHERE dedupe_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_inbox_user_created
  ON user_inbox_notifications (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_inbox_user_unread
  ON user_inbox_notifications (user_id, created_at DESC)
  WHERE read_at IS NULL;

CREATE TABLE IF NOT EXISTS interaction_comment_likes (
  comment_id UUID NOT NULL REFERENCES interaction_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (comment_id, user_id)
);
