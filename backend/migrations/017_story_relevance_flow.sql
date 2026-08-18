-- Content Engine P2 — Relevance Score (Story ↔ Stock cumulative) + Flow snapshot + auto-promote hooks

CREATE TABLE IF NOT EXISTS content_story_mappings (
  id BIGSERIAL PRIMARY KEY,
  story_id VARCHAR(80) NOT NULL REFERENCES content_stories(id) ON DELETE CASCADE,
  ticker VARCHAR(20) NOT NULL,
  entity_label VARCHAR(200) NOT NULL DEFAULT '',
  relevance_score NUMERIC(14, 2) NOT NULL DEFAULT 0,
  mention_count INTEGER NOT NULL DEFAULT 0,
  confidence_avg NUMERIC(6, 3) NOT NULL DEFAULT 0,
  views INTEGER NOT NULL DEFAULT 0,
  likes INTEGER NOT NULL DEFAULT 0,
  comments INTEGER NOT NULL DEFAULT 0,
  shares INTEGER NOT NULL DEFAULT 0,
  favorites INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  /* proposed | active | removed */
  method VARCHAR(40) NOT NULL DEFAULT 'auto',
  /* auto | admin | seed */
  meta JSONB NOT NULL DEFAULT '{}',
  computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (story_id, ticker)
);

CREATE INDEX IF NOT EXISTS idx_content_story_map_story_score
  ON content_story_mappings (story_id, relevance_score DESC);
CREATE INDEX IF NOT EXISTS idx_content_story_map_ticker
  ON content_story_mappings (ticker, relevance_score DESC);

/* Tín hiệu community validation theo cặp Story/Topic ↔ Stock (lũy kế) */
CREATE TABLE IF NOT EXISTS content_relevance_events (
  id BIGSERIAL PRIMARY KEY,
  story_id VARCHAR(80) REFERENCES content_stories(id) ON DELETE CASCADE,
  topic_id VARCHAR(80) REFERENCES content_topics(id) ON DELETE SET NULL,
  ticker VARCHAR(20) NOT NULL,
  event_type VARCHAR(20) NOT NULL,
  /* view | like | favorite | share | comment | follow */
  user_id VARCHAR(80),
  article_id VARCHAR(80) REFERENCES content_articles(id) ON DELETE SET NULL,
  weight NUMERIC(8, 3) NOT NULL DEFAULT 1,
  meta JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_content_rel_events_story_tk
  ON content_relevance_events (story_id, ticker, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_rel_events_topic_tk
  ON content_relevance_events (topic_id, ticker, created_at DESC);

ALTER TABLE content_stories
  ADD COLUMN IF NOT EXISTS lifecycle VARCHAR(20) NOT NULL DEFAULT 'emerging',
  /* emerging | growing | trending | peak | fading | archived */
  ADD COLUMN IF NOT EXISTS flow_net_value NUMERIC(18, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS flow_buy_value NUMERIC(18, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS flow_sell_value NUMERIC(18, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS flow_updated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS mapping_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS top_relevance NUMERIC(14, 2) NOT NULL DEFAULT 0;

-- Seed relevance events từ entity stock trên bài + interest view seed (một lần)
INSERT INTO content_relevance_events (story_id, topic_id, ticker, event_type, article_id, weight, meta, created_at)
SELECT
  t.story_id,
  t.id,
  UPPER(e.entity_id),
  'view',
  a.id,
  GREATEST(COALESCE(e.confidence, 0.5), 0.3),
  jsonb_build_object('seed', true, 'from_entity', true),
  COALESCE(a.published_at, a.ingested_at, NOW()) - (gs.i || ' hours')::interval
FROM content_article_entities e
JOIN content_articles a ON a.id = e.article_id
JOIN content_article_topics at ON at.article_id = a.id
JOIN content_topics t ON t.id = at.topic_id
CROSS JOIN LATERAL generate_series(1, LEAST(GREATEST(COALESCE(a.view_counts, 0) / 80, 1), 12)) AS gs(i)
WHERE e.entity_type = 'stock'
  AND t.story_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM content_relevance_events r
    WHERE r.topic_id = t.id AND r.ticker = UPPER(e.entity_id)
      AND r.event_type = 'view' AND (r.meta->>'seed') = 'true'
    LIMIT 1
  );

INSERT INTO content_relevance_events (story_id, topic_id, ticker, event_type, article_id, weight, meta, created_at)
SELECT
  t.story_id,
  t.id,
  UPPER(e.entity_id),
  v.event_type,
  a.id,
  GREATEST(COALESCE(e.confidence, 0.5), 0.3),
  jsonb_build_object('seed', true),
  COALESCE(a.published_at, a.ingested_at, NOW()) - ((v.n % 36) || ' hours')::interval
FROM content_article_entities e
JOIN content_articles a ON a.id = e.article_id
JOIN content_article_topics at ON at.article_id = a.id
JOIN content_topics t ON t.id = at.topic_id
CROSS JOIN LATERAL (
  VALUES
    ('like', 1), ('like', 2),
    ('favorite', 1),
    ('share', 1),
    ('comment', 1)
) AS v(event_type, n)
WHERE e.entity_type = 'stock'
  AND NOT EXISTS (
    SELECT 1 FROM content_relevance_events r
    WHERE COALESCE(r.story_id, '') = COALESCE(t.story_id, '')
      AND r.topic_id = t.id
      AND r.ticker = UPPER(e.entity_id)
      AND r.event_type = v.event_type
      AND (r.meta->>'seed') = 'true'
    LIMIT 1
  );
