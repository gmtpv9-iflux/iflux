-- Community Media Library (SoT-COM-MEDIA-001 / PLAN-COM-MEDIA P0–P1)
CREATE TABLE IF NOT EXISTS media_assets (
  id              TEXT PRIMARY KEY,
  status          TEXT NOT NULL DEFAULT 'active',
  fingerprint     TEXT,
  filename        TEXT NOT NULL,
  alt_text        TEXT NOT NULL DEFAULT '',
  caption         TEXT NOT NULL DEFAULT '',
  public_url      TEXT NOT NULL DEFAULT '',
  mime            TEXT,
  byte_size       BIGINT,
  width           INT,
  height          INT,
  created_by      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_media_assets_status ON media_assets (status);
CREATE INDEX IF NOT EXISTS idx_media_assets_fingerprint ON media_assets (fingerprint) WHERE fingerprint IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_media_assets_created ON media_assets (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_media_assets_filename ON media_assets (filename);

CREATE TABLE IF NOT EXISTS media_variants (
  id              TEXT PRIMARY KEY,
  asset_id        TEXT NOT NULL REFERENCES media_assets(id) ON DELETE CASCADE,
  role            TEXT NOT NULL,
  format          TEXT,
  width           INT,
  height          INT,
  byte_size       BIGINT,
  storage_key     TEXT NOT NULL,
  public_url      TEXT NOT NULL DEFAULT '',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (asset_id, role)
);

CREATE INDEX IF NOT EXISTS idx_media_variants_asset ON media_variants (asset_id);

CREATE TABLE IF NOT EXISTS media_sources (
  id              TEXT PRIMARY KEY,
  asset_id        TEXT NOT NULL REFERENCES media_assets(id) ON DELETE CASCADE,
  original_url    TEXT,
  channel         TEXT NOT NULL DEFAULT 'upload',
  provider        TEXT,
  captured_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_media_sources_asset ON media_sources (asset_id);

CREATE TABLE IF NOT EXISTS media_usages (
  id              TEXT PRIMARY KEY,
  asset_id        TEXT NOT NULL REFERENCES media_assets(id) ON DELETE CASCADE,
  article_id      TEXT NOT NULL,
  field_ref       TEXT NOT NULL DEFAULT 'body',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (asset_id, article_id, field_ref)
);

CREATE INDEX IF NOT EXISTS idx_media_usages_asset ON media_usages (asset_id);
CREATE INDEX IF NOT EXISTS idx_media_usages_article ON media_usages (article_id);

CREATE TABLE IF NOT EXISTS media_jobs (
  id              TEXT PRIMARY KEY,
  article_id      TEXT,
  kind            TEXT NOT NULL DEFAULT 'import',
  status          TEXT NOT NULL DEFAULT 'queued',
  actor_id        TEXT,
  result          JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_media_jobs_article ON media_jobs (article_id);
CREATE INDEX IF NOT EXISTS idx_media_jobs_created ON media_jobs (created_at DESC);
