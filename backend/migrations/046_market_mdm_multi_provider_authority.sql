-- 046 — Seed field-level authority for all Market providers in registry
-- Active source ≠ Trusted. Defaults: not_trusted until Admin promotes fields.

INSERT INTO market_source_field_authority (source_id, entity, field_key, trust_level)
SELECT s.id, 'stock', f.field_key, f.trust_level
FROM data_sources s
CROSS JOIN (
  VALUES
    ('ticker', 'not_trusted'),
    ('name', 'not_trusted'),
    ('exchange', 'not_trusted'),
    ('market_cap', 'not_trusted'),
    ('cap_group', 'not_trusted'),
    ('sector_id', 'not_trusted'),
    ('ecosystem_id', 'not_trusted'),
    ('status', 'not_trusted'),
    ('description', 'not_trusted')
) AS f(field_key, trust_level)
WHERE s.code IN ('vndirect_finfo', 'ssi_market_feed', 'fiinpro_eod')
ON CONFLICT (source_id, entity, field_key) DO NOTHING;
