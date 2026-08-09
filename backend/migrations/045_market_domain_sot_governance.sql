-- 045 — Market Domain SoT Governance (Architecture Decision Complete)
-- Cap Group + Market Cap on stocks; field authority; import/conflict stores
-- Reuse data_sources as provider registry hub

-- ── Stock Master attributes ──────────────────────────────────────────
ALTER TABLE stocks ADD COLUMN IF NOT EXISTS cap_group VARCHAR(16);
ALTER TABLE stocks ADD COLUMN IF NOT EXISTS market_cap NUMERIC(24, 2);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'stocks_cap_group_chk'
  ) THEN
    ALTER TABLE stocks
      ADD CONSTRAINT stocks_cap_group_chk
      CHECK (cap_group IS NULL OR cap_group IN ('large', 'medium', 'small'));
  END IF;
END $$;

COMMENT ON COLUMN stocks.cap_group IS 'Capitalization Group Master: large|medium|small (Micro+ → small)';
COMMENT ON COLUMN stocks.market_cap IS 'Market Cap Master attribute (field-level Trusted Source)';

-- Lifecycle: align is_active from canonical status (non-authoritative dual field)
UPDATE stocks
SET is_active = (LOWER(COALESCE(status, 'active')) = 'active')
WHERE is_active IS DISTINCT FROM (LOWER(COALESCE(status, 'active')) = 'active');

-- ── Field-level authority (satellite of data_sources) ────────────────
CREATE TABLE IF NOT EXISTS market_source_field_authority (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID NOT NULL REFERENCES data_sources(id) ON DELETE CASCADE,
    entity VARCHAR(40) NOT NULL DEFAULT 'stock',
    field_key VARCHAR(80) NOT NULL,
    trust_level VARCHAR(20) NOT NULL DEFAULT 'not_trusted',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT market_source_field_authority_trust_chk
      CHECK (trust_level IN ('trusted', 'review_required', 'not_trusted')),
    CONSTRAINT market_source_field_authority_uniq
      UNIQUE (source_id, entity, field_key)
);

CREATE INDEX IF NOT EXISTS idx_msfa_source ON market_source_field_authority(source_id);
CREATE INDEX IF NOT EXISTS idx_msfa_field ON market_source_field_authority(entity, field_key);

-- ── Import executions ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS market_data_imports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID REFERENCES data_sources(id) ON DELETE SET NULL,
    source_code VARCHAR(80) NOT NULL DEFAULT '',
    status VARCHAR(20) NOT NULL DEFAULT 'running',
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    finished_at TIMESTAMPTZ,
    admin_id UUID,
    received_count INT NOT NULL DEFAULT 0,
    valid_count INT NOT NULL DEFAULT 0,
    invalid_count INT NOT NULL DEFAULT 0,
    new_count INT NOT NULL DEFAULT 0,
    filled_count INT NOT NULL DEFAULT 0,
    unchanged_count INT NOT NULL DEFAULT 0,
    conflict_count INT NOT NULL DEFAULT 0,
    missing_count INT NOT NULL DEFAULT 0,
    auto_applied_count INT NOT NULL DEFAULT 0,
    error_summary TEXT NOT NULL DEFAULT '',
    meta JSONB NOT NULL DEFAULT '{}'::jsonb,
    CONSTRAINT market_data_imports_status_chk
      CHECK (status IN ('running', 'success', 'failed', 'partial'))
);

CREATE INDEX IF NOT EXISTS idx_mdi_source_started ON market_data_imports(source_code, started_at DESC);

-- ── Conflicts / change set ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS market_data_conflicts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    import_id UUID REFERENCES market_data_imports(id) ON DELETE CASCADE,
    entity VARCHAR(40) NOT NULL DEFAULT 'stock',
    entity_key VARCHAR(64) NOT NULL,
    field_key VARCHAR(80) NOT NULL,
    current_value TEXT,
    incoming_value TEXT,
    source_code VARCHAR(80) NOT NULL DEFAULT '',
    review_state VARCHAR(20) NOT NULL DEFAULT 'pending',
    decided_by UUID,
    decided_at TIMESTAMPTZ,
    detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    note TEXT NOT NULL DEFAULT '',
    CONSTRAINT market_data_conflicts_state_chk
      CHECK (review_state IN ('pending', 'applied', 'rejected'))
);

CREATE INDEX IF NOT EXISTS idx_mdc_pending ON market_data_conflicts(review_state, detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_mdc_entity ON market_data_conflicts(entity, entity_key);

-- ── Seed providers into data_sources (registry hub) ──────────────────
INSERT INTO data_sources (code, name, source_type, status, description, last_check_at)
VALUES
  (
    'dnse',
    'DNSE',
    'REST',
    'idle',
    'External Market Data Provider — candidate data only (not SoT)',
    NULL
  ),
  (
    'vndirect_finfo',
    'VNDirect Finfo',
    'REST',
    'connected',
    'Runtime quotes/OHLC provider; Master fields via governed import when Trusted',
    NOW()
  )
ON CONFLICT (code) DO NOTHING;

-- Default field authority for DNSE (trusted master-ish fields; iFlux-owned not trusted)
INSERT INTO market_source_field_authority (source_id, entity, field_key, trust_level)
SELECT s.id, 'stock', f.field_key, f.trust_level
FROM data_sources s
CROSS JOIN (
  VALUES
    ('ticker', 'trusted'),
    ('name', 'trusted'),
    ('exchange', 'trusted'),
    ('market_cap', 'trusted'),
    ('cap_group', 'trusted'),
    ('sector_id', 'not_trusted'),
    ('ecosystem_id', 'not_trusted'),
    ('status', 'not_trusted'),
    ('description', 'not_trusted')
) AS f(field_key, trust_level)
WHERE s.code = 'dnse'
ON CONFLICT (source_id, entity, field_key) DO NOTHING;
