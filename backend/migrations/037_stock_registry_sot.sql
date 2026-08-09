-- Migration 037: Stock Registry Business Source of Truth Schema Extension & Data Sync
-- Target Table: stocks (Primary Business SSoT)
--
-- NOTE: Migration 037_stock_registry_sot.sql là one-time migration phục vụ Cutover.
-- Sau khi Cutover hoàn tất, market_admin_stocks không còn là nguồn đồng bộ dữ liệu
-- và sẽ không được sử dụng trong Business Runtime.

ALTER TABLE stocks ADD COLUMN IF NOT EXISTS slug VARCHAR(255);
ALTER TABLE stocks ADD COLUMN IF NOT EXISTS short_name VARCHAR(100);
ALTER TABLE stocks ADD COLUMN IF NOT EXISTS english_name VARCHAR(255);
ALTER TABLE stocks ADD COLUMN IF NOT EXISTS isin VARCHAR(20);
ALTER TABLE stocks ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE stocks ADD COLUMN IF NOT EXISTS icon_media_id VARCHAR(100);
ALTER TABLE stocks ADD COLUMN IF NOT EXISTS display_order INT DEFAULT 0;
ALTER TABLE stocks ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
ALTER TABLE stocks ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE stocks ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Sync legacy market_admin_stocks records into primary stocks table (One-Time Cutover Sync)
INSERT INTO stocks (ticker, name, exchange, is_active, created_at, updated_at)
SELECT ticker, name, exchange, (status = 'active'), NOW(), NOW()
FROM market_admin_stocks
ON CONFLICT (ticker) DO UPDATE
  SET name = EXCLUDED.name,
      exchange = EXCLUDED.exchange,
      updated_at = NOW();

-- Create Indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_stocks_sector_id ON stocks(sector_id);
CREATE INDEX IF NOT EXISTS idx_stocks_ecosystem_id ON stocks(ecosystem_id);
CREATE INDEX IF NOT EXISTS idx_stocks_status ON stocks(status);
