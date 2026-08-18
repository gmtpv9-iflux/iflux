-- BR-11 — Field Authority = Entity×Field Current Source; CSV staging for Sync-all
CREATE TABLE IF NOT EXISTS market_source_staging (
    source_code VARCHAR(80) PRIMARY KEY,
    payload_text TEXT NOT NULL DEFAULT '',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE market_source_staging IS 'Staging CSV/JSON for sources that need payload before Sync-all (not selected at Import time)';
