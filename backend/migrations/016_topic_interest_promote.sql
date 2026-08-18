-- Content Engine P1 — Interest events + Story promote (Topic → Story)

CREATE TABLE IF NOT EXISTS content_interest_events (
  id BIGSERIAL PRIMARY KEY,
  topic_id VARCHAR(80) NOT NULL REFERENCES content_topics(id) ON DELETE CASCADE,
  event_type VARCHAR(20) NOT NULL,
  /* view | search | like | favorite | share | comment */
  user_id VARCHAR(80),
  article_id VARCHAR(80) REFERENCES content_articles(id) ON DELETE SET NULL,
  meta JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_content_interest_topic_time
  ON content_interest_events (topic_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_interest_type_time
  ON content_interest_events (event_type, created_at DESC);

CREATE TABLE IF NOT EXISTS content_stories (
  id VARCHAR(80) PRIMARY KEY,
  slug VARCHAR(160) NOT NULL UNIQUE,
  label VARCHAR(200) NOT NULL,
  origin_topic_id VARCHAR(80) REFERENCES content_topics(id) ON DELETE SET NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  /* active | merged | retired */
  interest_score NUMERIC(12, 2) NOT NULL DEFAULT 0,
  meta JSONB NOT NULL DEFAULT '{}',
  promoted_at TIMESTAMPTZ,
  promoted_by VARCHAR(80),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_content_stories_status
  ON content_stories (status, interest_score DESC);

ALTER TABLE content_topics
  ADD COLUMN IF NOT EXISTS candidate_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS promoted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS promote_reason TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS last_interest_at TIMESTAMPTZ;

-- Seed interest events từ article.view_counts (một lần) để Interest Score có dữ liệu Demo
INSERT INTO content_interest_events (topic_id, event_type, article_id, meta, created_at)
SELECT
  at.topic_id,
  'view',
  a.id,
  jsonb_build_object('seed', true, 'from_article_views', true),
  COALESCE(a.published_at, a.ingested_at, NOW()) - (gs.i || ' hours')::interval
FROM content_article_topics at
JOIN content_articles a ON a.id = at.article_id
CROSS JOIN LATERAL generate_series(
  1,
  LEAST(GREATEST(COALESCE(a.view_counts, 0) / 40, 1), 25)
) AS gs(i)
WHERE NOT EXISTS (
  SELECT 1 FROM content_interest_events e
  WHERE e.topic_id = at.topic_id AND e.event_type = 'view' AND (e.meta->>'seed') = 'true'
);

INSERT INTO content_interest_events (topic_id, event_type, article_id, meta, created_at)
SELECT
  at.topic_id,
  v.event_type,
  a.id,
  jsonb_build_object('seed', true),
  COALESCE(a.published_at, a.ingested_at, NOW()) - ((v.n % 48) || ' hours')::interval
FROM content_article_topics at
JOIN content_articles a ON a.id = at.article_id
CROSS JOIN LATERAL (
  VALUES
    ('search', 1), ('search', 2), ('search', 3),
    ('like', 1), ('like', 2),
    ('favorite', 1),
    ('share', 1),
    ('comment', 1), ('comment', 2)
) AS v(event_type, n)
WHERE NOT EXISTS (
  SELECT 1 FROM content_interest_events e
  WHERE e.topic_id = at.topic_id AND e.event_type = v.event_type AND (e.meta->>'seed') = 'true'
  LIMIT 1
);
