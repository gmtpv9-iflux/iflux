-- Queue bền vững riêng nghiệp vụ news; reuse scheduler, registry prompt và dữ liệu news hiện có.
-- Chỉ preview/review. Không có nhánh tự publish khi chưa đạt semantic quality gate.
CREATE TABLE IF NOT EXISTS news_ai_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_post_id TEXT NOT NULL REFERENCES news_posts(id) ON DELETE RESTRICT,
  input_hash VARCHAR(64) NOT NULL,
  prompt_hash VARCHAR(64) NOT NULL,
  prompt_version VARCHAR(80) NOT NULL,
  prompt_body TEXT NOT NULL,
  schema_version VARCHAR(80) NOT NULL,
  model VARCHAR(120) NOT NULL,
  source_snapshot JSONB NOT NULL,
  context JSONB,
  extraction JSONB,
  result JSONB,
  review_reasons JSONB NOT NULL DEFAULT '[]',
  calls JSONB NOT NULL DEFAULT '[]',
  status VARCHAR(24) NOT NULL DEFAULT 'queued' CHECK(status IN ('queued','running','preview_ready','needs_review','failed')),
  attempts INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ,
  lease_token UUID,
  lease_until TIMESTAMPTZ,
  next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_error VARCHAR(80),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(source_post_id,input_hash,prompt_hash,schema_version,model)
);
CREATE INDEX IF NOT EXISTS news_ai_jobs_claim ON news_ai_jobs(status,next_attempt_at,lease_until);
