-- 047 — Close BRD gaps: DROP divisor; Change Set; Audit; CSV sources; runtime authority; Skip state

-- ── BR-03.4 / BR-04.4 — Divisor out of Market Master SoT ─────────────
ALTER TABLE sectors DROP COLUMN IF EXISTS divisor;
ALTER TABLE ecosystems DROP COLUMN IF EXISTS divisor;

-- ── BR-19 — Full Change Set (all import classes) ─────────────────────
CREATE TABLE IF NOT EXISTS market_data_change_set_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    import_id UUID NOT NULL REFERENCES market_data_imports(id) ON DELETE CASCADE,
    entity VARCHAR(40) NOT NULL DEFAULT 'stock',
    entity_key VARCHAR(64) NOT NULL,
    field_key VARCHAR(80) NOT NULL DEFAULT '*',
    current_value TEXT,
    incoming_value TEXT,
    source_code VARCHAR(80) NOT NULL DEFAULT '',
    trust_level VARCHAR(20) NOT NULL DEFAULT '',
    class VARCHAR(20) NOT NULL,
    result VARCHAR(20) NOT NULL DEFAULT 'noop',
    note TEXT NOT NULL DEFAULT '',
    conflict_id UUID REFERENCES market_data_conflicts(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT market_data_cs_class_chk
      CHECK (class IN ('new','fill','unchanged','conflict','missing','reject','noop','invalid','updated')),
    CONSTRAINT market_data_cs_result_chk
      CHECK (result IN ('apply','review','reject','noop','missing','skip','failed'))
);

CREATE INDEX IF NOT EXISTS idx_mdcsi_import ON market_data_change_set_items(import_id);
CREATE INDEX IF NOT EXISTS idx_mdcsi_class ON market_data_change_set_items(class, created_at DESC);

-- ── BR-20 — Skip decision on conflicts ───────────────────────────────
ALTER TABLE market_data_conflicts DROP CONSTRAINT IF EXISTS market_data_conflicts_state_chk;
ALTER TABLE market_data_conflicts
  ADD CONSTRAINT market_data_conflicts_state_chk
  CHECK (review_state IN ('pending', 'applied', 'rejected', 'skipped'));

-- ── BR-22 — History counters ─────────────────────────────────────────
ALTER TABLE market_data_imports ADD COLUMN IF NOT EXISTS updated_count INT NOT NULL DEFAULT 0;
ALTER TABLE market_data_imports ADD COLUMN IF NOT EXISTS rejected_count INT NOT NULL DEFAULT 0;
ALTER TABLE market_data_imports ADD COLUMN IF NOT EXISTS failed_count INT NOT NULL DEFAULT 0;

-- ── BR-23 — SoT audit trail ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS market_sot_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID,
    entity VARCHAR(40) NOT NULL DEFAULT 'stock',
    entity_key VARCHAR(64) NOT NULL,
    field_key VARCHAR(80) NOT NULL,
    from_value TEXT,
    to_value TEXT,
    source_code VARCHAR(80) NOT NULL DEFAULT 'admin',
    why TEXT NOT NULL DEFAULT '',
    result VARCHAR(40) NOT NULL DEFAULT '',
    import_id UUID REFERENCES market_data_imports(id) ON DELETE SET NULL,
    conflict_id UUID REFERENCES market_data_conflicts(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_msa_entity ON market_sot_audit(entity, entity_key, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_msa_admin ON market_sot_audit(admin_id, created_at DESC);

-- Allow Disabled source status (BR-13.3)
ALTER TABLE data_sources DROP CONSTRAINT IF EXISTS data_sources_status_chk;
ALTER TABLE data_sources
  ADD CONSTRAINT data_sources_status_chk
  CHECK (status IN ('idle', 'connected', 'success', 'failed', 'degraded', 'disabled'));

-- ── BR-12.3 — Manual CSV / Internal Upload registry entries ──────────
INSERT INTO data_sources (code, name, source_type, status, description, last_check_at)
VALUES
  (
    'manual_csv',
    'Manual CSV',
    'File',
    'idle',
    'Manual CSV upload — candidate intake via MDM (not SoT)',
    NULL
  ),
  (
    'internal_upload',
    'Internal Upload',
    'File',
    'idle',
    'Internal JSON/CSV upload — candidate intake via MDM (not SoT)',
    NULL
  )
ON CONFLICT (code) DO NOTHING;

-- Default not_trusted master fields for CSV/Upload
INSERT INTO market_source_field_authority (source_id, entity, field_key, trust_level)
SELECT s.id, 'stock', f.field_key, 'not_trusted'
FROM data_sources s
CROSS JOIN (
  VALUES
    ('ticker'), ('name'), ('exchange'), ('market_cap'), ('cap_group'),
    ('sector_id'), ('ecosystem_id'), ('status'), ('description')
) AS f(field_key)
WHERE s.code IN ('manual_csv', 'internal_upload')
ON CONFLICT (source_id, entity, field_key) DO NOTHING;

-- ── BR-11A / BR-15 — Runtime quotes authority (VNDirect) ─────────────
INSERT INTO market_source_field_authority (source_id, entity, field_key, trust_level)
SELECT s.id, 'runtime', f.field_key, 'trusted'
FROM data_sources s
CROSS JOIN (
  VALUES ('price'), ('ohlc')
) AS f(field_key)
WHERE s.code = 'vndirect_finfo'
ON CONFLICT (source_id, entity, field_key) DO UPDATE
SET trust_level = EXCLUDED.trust_level, updated_at = NOW();
