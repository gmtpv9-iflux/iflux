-- Owner: stocks = market identity only.
-- Drop: lot_threshold (sàn/quy tắc giao dịch — Admin Ngưỡng lô riêng),
--       is_active (duplicate của status),
--       display_order (không sort cổ phiếu),
--       icon_media_id (CMS/presentation — không phải market identity).

DELETE FROM market_source_field_authority
WHERE entity = 'stock'
  AND field_key IN ('lot_threshold', 'is_active', 'display_order', 'icon_media_id');

ALTER TABLE stocks DROP COLUMN IF EXISTS lot_threshold;
ALTER TABLE stocks DROP COLUMN IF EXISTS is_active;
ALTER TABLE stocks DROP COLUMN IF EXISTS display_order;
ALTER TABLE stocks DROP COLUMN IF EXISTS icon_media_id;
