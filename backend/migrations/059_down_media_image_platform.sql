-- Task 04 removal — down 058 on Staging only (iflux_staging).
-- CẤM chạy trên iflux_production_next / leftover iflux.
-- Giữ 043/054: media_assets / media_variants / media_usages / media_jobs / media_sources.

UPDATE media_jobs
   SET status = 'cancelled', updated_at = NOW()
 WHERE kind IN ('GENERATE','REGENERATE','REBUILD','VERIFY','CLEANUP')
   AND status IN ('queued','running');

ALTER TABLE media_assets DROP CONSTRAINT IF EXISTS media_assets_master_variant_id_fkey;
ALTER TABLE media_variants DROP CONSTRAINT IF EXISTS media_variants_profile_version_id_fkey;
ALTER TABLE media_jobs DROP CONSTRAINT IF EXISTS media_jobs_profile_id_fkey;
ALTER TABLE media_jobs DROP CONSTRAINT IF EXISTS media_jobs_profile_version_id_fkey;
ALTER TABLE media_jobs DROP CONSTRAINT IF EXISTS media_jobs_asset_id_fkey;

DROP INDEX IF EXISTS media_variants_asset_profile_version_uidx;
DROP INDEX IF EXISTS idx_media_jobs_asset;
DROP INDEX IF EXISTS idx_media_jobs_kind_status;
DROP INDEX IF EXISTS idx_media_image_profiles_status;
DROP INDEX IF EXISTS idx_media_image_profile_versions_profile;

UPDATE media_variants SET profile_version_id = NULL WHERE profile_version_id IS NOT NULL;
UPDATE media_assets SET master_variant_id = NULL WHERE master_variant_id IS NOT NULL;

DELETE FROM media_variants
 WHERE role IN ('media-compact','media-card','media-hero','media-body','media-og');

DROP TABLE IF EXISTS media_image_profile_versions;
DROP TABLE IF EXISTS media_image_profiles;

ALTER TABLE media_assets DROP COLUMN IF EXISTS is_animated;
ALTER TABLE media_assets DROP COLUMN IF EXISTS master_variant_id;
ALTER TABLE media_assets DROP COLUMN IF EXISTS limitation;
ALTER TABLE media_assets DROP COLUMN IF EXISTS cleanup_eligible_at;
ALTER TABLE media_variants DROP COLUMN IF EXISTS profile_version_id;
ALTER TABLE media_jobs DROP COLUMN IF EXISTS asset_id;
ALTER TABLE media_jobs DROP COLUMN IF EXISTS profile_id;
ALTER TABLE media_jobs DROP COLUMN IF EXISTS profile_version_id;
ALTER TABLE media_jobs DROP COLUMN IF EXISTS attempt_count;
ALTER TABLE media_jobs DROP COLUMN IF EXISTS error;
ALTER TABLE media_jobs DROP COLUMN IF EXISTS started_at;
ALTER TABLE media_jobs DROP COLUMN IF EXISTS completed_at;

DELETE FROM admin_permissions WHERE key LIKE 'media.%';

DELETE FROM schema_migrations WHERE filename = '058_media_image_platform.sql';
