-- Content Engine P0 — Article ownership + Topic (pre-Story) + Entity links
-- Story table + promote rules: P1. Vnstock = connector input shape only.

CREATE TABLE IF NOT EXISTS content_sources (
  id VARCHAR(80) PRIMARY KEY,
  code VARCHAR(80) NOT NULL UNIQUE,
  name VARCHAR(200) NOT NULL,
  source_type VARCHAR(40) NOT NULL DEFAULT 'vnstock',
  config JSONB NOT NULL DEFAULT '{}',
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS content_articles (
  id VARCHAR(80) PRIMARY KEY,
  source_id VARCHAR(80) REFERENCES content_sources(id) ON DELETE SET NULL,
  external_url TEXT NOT NULL,
  url_hash VARCHAR(64) NOT NULL,
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL DEFAULT '',
  body_text TEXT NOT NULL DEFAULT '',
  body_storage_mode VARCHAR(20) NOT NULL DEFAULT 'excerpt',
  author_name VARCHAR(200) NOT NULL DEFAULT '',
  category_raw VARCHAR(200) NOT NULL DEFAULT '',
  tags_raw TEXT NOT NULL DEFAULT '',
  image_url TEXT NOT NULL DEFAULT '',
  published_at TIMESTAMPTZ,
  lang VARCHAR(10) NOT NULL DEFAULT 'vi',
  status VARCHAR(20) NOT NULL DEFAULT 'normalized',
  published_to_feed BOOLEAN NOT NULL DEFAULT FALSE,
  view_counts INTEGER,
  raw_payload JSONB NOT NULL DEFAULT '{}',
  ingested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT content_articles_url_hash_unique UNIQUE (url_hash)
);

CREATE INDEX IF NOT EXISTS idx_content_articles_published
  ON content_articles (published_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_content_articles_status_feed
  ON content_articles (status, published_to_feed);
CREATE INDEX IF NOT EXISTS idx_content_articles_source
  ON content_articles (source_id);

-- Topic = pre-Story (building|candidate|promoted|retired)
CREATE TABLE IF NOT EXISTS content_topics (
  id VARCHAR(80) PRIMARY KEY,
  slug VARCHAR(160) NOT NULL UNIQUE,
  label VARCHAR(200) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'building',
  story_id VARCHAR(80),
  interest_score NUMERIC(12, 2) NOT NULL DEFAULT 0,
  article_count INTEGER NOT NULL DEFAULT 0,
  meta JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_content_topics_status
  ON content_topics (status, interest_score DESC);

CREATE TABLE IF NOT EXISTS content_article_topics (
  article_id VARCHAR(80) NOT NULL REFERENCES content_articles(id) ON DELETE CASCADE,
  topic_id VARCHAR(80) NOT NULL REFERENCES content_topics(id) ON DELETE CASCADE,
  weight NUMERIC(6, 3) NOT NULL DEFAULT 1,
  method VARCHAR(40) NOT NULL DEFAULT 'seed',
  PRIMARY KEY (article_id, topic_id)
);

-- Entity: stock|sector|ecosystem|organization|person
CREATE TABLE IF NOT EXISTS content_article_entities (
  id BIGSERIAL PRIMARY KEY,
  article_id VARCHAR(80) NOT NULL REFERENCES content_articles(id) ON DELETE CASCADE,
  entity_type VARCHAR(40) NOT NULL,
  entity_id VARCHAR(120) NOT NULL,
  entity_label VARCHAR(200) NOT NULL DEFAULT '',
  confidence NUMERIC(6, 3) NOT NULL DEFAULT 0.5,
  method VARCHAR(40) NOT NULL DEFAULT 'seed',
  UNIQUE (article_id, entity_type, entity_id)
);

CREATE INDEX IF NOT EXISTS idx_content_article_entities_lookup
  ON content_article_entities (entity_type, entity_id);

CREATE TABLE IF NOT EXISTS content_ingest_runs (
  id BIGSERIAL PRIMARY KEY,
  source_id VARCHAR(80) REFERENCES content_sources(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  status VARCHAR(20) NOT NULL DEFAULT 'running',
  ok_count INTEGER NOT NULL DEFAULT 0,
  fail_count INTEGER NOT NULL DEFAULT 0,
  detail JSONB NOT NULL DEFAULT '{}'
);

-- Seed default sources (CafeF / VietStock / Báo Đầu Tư qua connector Vnstock)
INSERT INTO content_sources (id, code, name, source_type, config, status)
VALUES
  ('src_vnstock_cafef', 'vnstock:cafef', 'CafeF (Vnstock)', 'vnstock', '{"site_name":"cafef"}', 'active'),
  ('src_vnstock_vietstock', 'vnstock:vietstock', 'VietStock (Vnstock)', 'vnstock', '{"site_name":"vietstock"}', 'active'),
  ('src_vnstock_baodautu', 'vnstock:baodautu', 'Báo Đầu Tư (Vnstock)', 'vnstock', '{"site_name":"baodautu"}', 'active'),
  ('src_internal_seed', 'internal:seed', 'iFlux Seed', 'internal', '{}', 'active')
ON CONFLICT (id) DO NOTHING;
