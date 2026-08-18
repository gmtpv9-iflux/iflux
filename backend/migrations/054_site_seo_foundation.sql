-- Site Metadata / SEO Foundation (090826)
-- D1: EXTEND marketing_brand_identity.payload in app (no column split)
-- D2: page_seo_configs by page_key
-- D4: extend media_usages for GLOBAL/PAGE without breaking ARTICLE

CREATE TABLE IF NOT EXISTS page_seo_configs (
  page_key    TEXT PRIMARY KEY,
  payload     JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by  TEXT
);

CREATE INDEX IF NOT EXISTS idx_page_seo_configs_updated ON page_seo_configs (updated_at DESC);

-- media_usages: add scope + owner_ref; keep ARTICLE rows intact
ALTER TABLE media_usages ADD COLUMN IF NOT EXISTS scope TEXT;
ALTER TABLE media_usages ADD COLUMN IF NOT EXISTS owner_ref TEXT;

UPDATE media_usages
SET scope = 'ARTICLE',
    owner_ref = article_id
WHERE scope IS NULL OR scope = '' OR owner_ref IS NULL OR owner_ref = '';

ALTER TABLE media_usages ALTER COLUMN scope SET DEFAULT 'ARTICLE';
ALTER TABLE media_usages ALTER COLUMN owner_ref SET DEFAULT '';

ALTER TABLE media_usages ALTER COLUMN scope SET NOT NULL;
ALTER TABLE media_usages ALTER COLUMN owner_ref SET NOT NULL;

-- Allow GLOBAL/PAGE rows without article_id
ALTER TABLE media_usages ALTER COLUMN article_id DROP NOT NULL;

-- Replace unique: old (asset_id, article_id, field_ref) → (asset_id, scope, owner_ref, field_ref)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'media_usages_asset_id_article_id_field_ref_key'
  ) THEN
    ALTER TABLE media_usages DROP CONSTRAINT media_usages_asset_id_article_id_field_ref_key;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS media_usages_asset_scope_owner_field_uidx
  ON media_usages (asset_id, scope, owner_ref, field_ref);

CREATE INDEX IF NOT EXISTS idx_media_usages_scope_owner
  ON media_usages (scope, owner_ref);
