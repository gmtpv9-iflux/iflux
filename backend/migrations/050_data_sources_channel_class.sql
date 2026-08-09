-- MDM taxonomy: External Provider Registry vs Internal Input
-- Owner LOCK — Manual CSV / Internal Upload ≠ Nguồn Market data

ALTER TABLE data_sources
  ADD COLUMN IF NOT EXISTS channel_class VARCHAR(32) NOT NULL DEFAULT 'external_provider';

ALTER TABLE data_sources DROP CONSTRAINT IF EXISTS data_sources_channel_class_chk;
ALTER TABLE data_sources
  ADD CONSTRAINT data_sources_channel_class_chk
  CHECK (channel_class IN ('external_provider', 'internal_input'));

UPDATE data_sources
SET channel_class = 'internal_input', updated_at = NOW()
WHERE code IN ('manual_csv', 'internal_upload');

UPDATE data_sources
SET channel_class = 'external_provider', updated_at = NOW()
WHERE code NOT IN ('manual_csv', 'internal_upload');

CREATE INDEX IF NOT EXISTS idx_data_sources_channel_class ON data_sources(channel_class);

-- Demote Internal Input from Field Authority Current Source
UPDATE market_source_field_authority a
SET trust_level = 'not_trusted', updated_at = NOW()
FROM data_sources s
WHERE a.source_id = s.id
  AND s.channel_class = 'internal_input'
  AND a.trust_level IN ('trusted', 'review_required');
