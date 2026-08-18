-- Interaction Thread comments — entity types (IA-001 §6b) ngoài post
-- post tiếp tục dùng community_comments (alias); bảng này cho stock|sector|family|story
-- user_id không FK users: owner bảng users = postgres trên Prod (tránh 42501 khi migrate role iflux)
CREATE TABLE IF NOT EXISTS interaction_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(32) NOT NULL,
    entity_id VARCHAR(160) NOT NULL,
    user_id UUID,
    user_name VARCHAR(160) NOT NULL DEFAULT 'Thành viên',
    body TEXT NOT NULL DEFAULT '',
    image_url TEXT,
    parent_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_ix_cmt_entity_created
  ON interaction_comments (entity_type, entity_id, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_ix_cmt_parent
  ON interaction_comments (parent_id)
  WHERE parent_id IS NOT NULL AND deleted_at IS NULL;

COMMENT ON TABLE interaction_comments IS 'SoT Thread Interaction v1 — entity stock|sector|family|story (RC-API-08…10)';
