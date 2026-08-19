-- Media Image Platform foundation (Task 04 P1)
-- Modify-first: extend existing media_* ; create profile registry tables only.
-- Idempotent: Staging schema_migrations is incomplete (054 columns exist, file not tracked).

CREATE TABLE IF NOT EXISTS media_image_profiles (
  id            TEXT PRIMARY KEY,
  profile_key   TEXT NOT NULL UNIQUE,
  display_name  TEXT NOT NULL DEFAULT '',
  purpose       TEXT NOT NULL DEFAULT '',
  status        TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS media_image_profile_versions (
  id          TEXT PRIMARY KEY,
  profile_id  TEXT NOT NULL REFERENCES media_image_profiles(id) ON DELETE CASCADE,
  version     INT NOT NULL,
  width       INT,
  height      INT,
  max_width   INT,
  max_height  INT,
  crop        TEXT NOT NULL DEFAULT 'none',
  format      TEXT NOT NULL,
  quality     INT,
  lossless    BOOLEAN NOT NULL DEFAULT false,
  status      TEXT NOT NULL DEFAULT 'ACTIVE',
  spec        JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (profile_id, version)
);

CREATE INDEX IF NOT EXISTS idx_media_image_profiles_status
  ON media_image_profiles (status);

CREATE INDEX IF NOT EXISTS idx_media_image_profile_versions_profile
  ON media_image_profile_versions (profile_id, status);

ALTER TABLE media_assets
  ADD COLUMN IF NOT EXISTS is_animated BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS master_variant_id TEXT,
  ADD COLUMN IF NOT EXISTS limitation TEXT,
  ADD COLUMN IF NOT EXISTS cleanup_eligible_at TIMESTAMPTZ;

ALTER TABLE media_variants
  ADD COLUMN IF NOT EXISTS profile_version_id TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'media_assets_master_variant_id_fkey'
  ) THEN
    ALTER TABLE media_assets
      ADD CONSTRAINT media_assets_master_variant_id_fkey
      FOREIGN KEY (master_variant_id) REFERENCES media_variants(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'media_variants_profile_version_id_fkey'
  ) THEN
    ALTER TABLE media_variants
      ADD CONSTRAINT media_variants_profile_version_id_fkey
      FOREIGN KEY (profile_version_id) REFERENCES media_image_profile_versions(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS media_variants_asset_profile_version_uidx
  ON media_variants (asset_id, profile_version_id)
  WHERE profile_version_id IS NOT NULL;

ALTER TABLE media_jobs
  ADD COLUMN IF NOT EXISTS asset_id TEXT,
  ADD COLUMN IF NOT EXISTS profile_id TEXT,
  ADD COLUMN IF NOT EXISTS profile_version_id TEXT,
  ADD COLUMN IF NOT EXISTS attempt_count INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS error TEXT,
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'media_jobs_asset_id_fkey'
  ) THEN
    ALTER TABLE media_jobs
      ADD CONSTRAINT media_jobs_asset_id_fkey
      FOREIGN KEY (asset_id) REFERENCES media_assets(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'media_jobs_profile_id_fkey'
  ) THEN
    ALTER TABLE media_jobs
      ADD CONSTRAINT media_jobs_profile_id_fkey
      FOREIGN KEY (profile_id) REFERENCES media_image_profiles(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'media_jobs_profile_version_id_fkey'
  ) THEN
    ALTER TABLE media_jobs
      ADD CONSTRAINT media_jobs_profile_version_id_fkey
      FOREIGN KEY (profile_version_id) REFERENCES media_image_profile_versions(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_media_jobs_asset ON media_jobs (asset_id);
CREATE INDEX IF NOT EXISTS idx_media_jobs_kind_status ON media_jobs (kind, status);

-- Seed exactly 5 locked profiles (Plan §0). No media-detail.
INSERT INTO media_image_profiles (id, profile_key, display_name, purpose, status)
VALUES
  ('mip-media-compact', 'media-compact', 'Ảnh compact', 'Compact list 120×120', 'ACTIVE'),
  ('mip-media-card', 'media-card', 'Ảnh card', 'Card desktop + mobile, một file, không crop', 'ACTIVE'),
  ('mip-media-hero', 'media-hero', 'Ảnh hero / cover', 'Hero feed và Detail cover — cùng file 960×540', 'ACTIVE'),
  ('mip-media-body', 'media-body', 'Ảnh body', 'Body article, max width 960, không crop', 'ACTIVE'),
  ('mip-media-og', 'media-og', 'Ảnh OG', 'Open Graph / social JPEG 1200×630', 'ACTIVE')
ON CONFLICT (profile_key) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  purpose = EXCLUDED.purpose,
  status = EXCLUDED.status,
  updated_at = NOW();

INSERT INTO media_image_profile_versions
  (id, profile_id, version, width, height, max_width, max_height, crop, format, quality, lossless, status, spec)
VALUES
  (
    'mipv-media-compact-v1', 'mip-media-compact', 1,
    120, 120, 120, 120, 'cover', 'webp', 82, false, 'ACTIVE',
    '{"width":120,"height":120,"crop":"cover","format":"webp","quality":82}'::jsonb
  ),
  (
    'mipv-media-card-v1', 'mip-media-card', 1,
    NULL, NULL, 640, NULL, 'none', 'webp', 82, false, 'ACTIVE',
    '{"maxWidth":640,"crop":"none","format":"webp","quality":82}'::jsonb
  ),
  (
    'mipv-media-hero-v1', 'mip-media-hero', 1,
    960, 540, 960, 540, 'cover', 'webp', 84, false, 'ACTIVE',
    '{"width":960,"height":540,"crop":"cover","format":"webp","quality":84}'::jsonb
  ),
  (
    'mipv-media-body-v1', 'mip-media-body', 1,
    NULL, NULL, 960, NULL, 'none', 'webp', 84, false, 'ACTIVE',
    '{"maxWidth":960,"crop":"none","format":"webp","quality":84}'::jsonb
  ),
  (
    'mipv-media-og-v1', 'mip-media-og', 1,
    1200, 630, 1200, 630, 'cover', 'jpeg', 85, false, 'ACTIVE',
    '{"width":1200,"height":630,"crop":"cover","format":"jpeg","quality":85}'::jsonb
  )
ON CONFLICT (profile_id, version) DO UPDATE SET
  width = EXCLUDED.width,
  height = EXCLUDED.height,
  max_width = EXCLUDED.max_width,
  max_height = EXCLUDED.max_height,
  crop = EXCLUDED.crop,
  format = EXCLUDED.format,
  quality = EXCLUDED.quality,
  lossless = EXCLUDED.lossless,
  status = EXCLUDED.status,
  spec = EXCLUDED.spec;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'iflux_staging') THEN
    GRANT ALL ON TABLE media_image_profiles TO iflux_staging;
    GRANT ALL ON TABLE media_image_profile_versions TO iflux_staging;
    ALTER TABLE media_image_profiles OWNER TO iflux_staging;
    ALTER TABLE media_image_profile_versions OWNER TO iflux_staging;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'iflux_production_next') THEN
    GRANT ALL ON TABLE media_image_profiles TO iflux_production_next;
    GRANT ALL ON TABLE media_image_profile_versions TO iflux_production_next;
  END IF;
END $$;
