-- Schema reconciliation: sectors + ecosystems taxonomy columns.
-- Các cột/constraint/index dưới đây đã tồn tại thật trên Production (áp trực tiếp
-- ngoài migration system, không qua file .sql nào) — xác nhận bằng audit đối chiếu
-- pg_dump --schema-only Production vs full migration replay (xem
-- "Product Backlogs/120826_pending_Git_Deployment_Process_Reconstruction/09 -
-- Schema Reconciliation Audit (Production vs Migrations).md").
-- Migration này CHỈ đưa structure đã có thật trên Production trở lại migration SoT.
-- Không thêm cột/tính năng mới ngoài phạm vi đã audit. Idempotent để an toàn khi
-- chạy lại trên Production (nơi các object này đã tồn tại) và chạy mới trên Staging.

ALTER TABLE sectors
  ADD COLUMN IF NOT EXISTS slug VARCHAR(100),
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS display_order INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS icon_media_id TEXT,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sectors_slug_key'
  ) THEN
    ALTER TABLE sectors ADD CONSTRAINT sectors_slug_key UNIQUE (slug);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sectors_icon_media_id_fkey'
  ) THEN
    ALTER TABLE sectors
      ADD CONSTRAINT sectors_icon_media_id_fkey
      FOREIGN KEY (icon_media_id) REFERENCES media_assets(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_sectors_deleted_display
  ON sectors (deleted_at, display_order, name_vi);

ALTER TABLE ecosystems
  ADD COLUMN IF NOT EXISTS slug VARCHAR(100),
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS display_order INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS icon_media_id TEXT,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ecosystems_slug_key'
  ) THEN
    ALTER TABLE ecosystems ADD CONSTRAINT ecosystems_slug_key UNIQUE (slug);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ecosystems_icon_media_id_fkey'
  ) THEN
    ALTER TABLE ecosystems
      ADD CONSTRAINT ecosystems_icon_media_id_fkey
      FOREIGN KEY (icon_media_id) REFERENCES media_assets(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_ecosystems_deleted_display
  ON ecosystems (deleted_at, display_order, name_vi);
