-- Content Engine — bài ingest thiếu chủ đề (Admin review)
-- primary_chu_de_id = 01 Chủ đề SoT; needs_review = true khi chưa gắn.

ALTER TABLE content_articles
  ADD COLUMN IF NOT EXISTS primary_chu_de_id VARCHAR(80),
  ADD COLUMN IF NOT EXISTS needs_review BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS missing_fields JSONB NOT NULL DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS idx_content_articles_needs_review
  ON content_articles (needs_review, ingested_at DESC);

CREATE INDEX IF NOT EXISTS idx_content_articles_primary_chu_de
  ON content_articles (primary_chu_de_id)
  WHERE primary_chu_de_id IS NOT NULL;

-- Seed nội bộ: không chặn feed demo
UPDATE content_articles a
SET needs_review = FALSE,
    missing_fields = '[]'::jsonb,
    updated_at = NOW()
FROM content_sources s
WHERE a.source_id = s.id
  AND s.code LIKE 'internal:%'
  AND a.needs_review = TRUE;

-- Đã có primary → không cần review
UPDATE content_articles
SET needs_review = FALSE,
    missing_fields = '[]'::jsonb,
    updated_at = NOW()
WHERE primary_chu_de_id IS NOT NULL
  AND needs_review = TRUE;
