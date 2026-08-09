-- Current Market Price State + Market Data Sync Cycle (Owner 2026-08-08)
-- stock_prices: one current row per (ticker, trading_date, source) — UPSERT, not history.

CREATE TABLE IF NOT EXISTS stock_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticker VARCHAR(10) NOT NULL REFERENCES stocks(ticker),
  trading_date DATE NOT NULL,
  open NUMERIC(18, 4),
  high NUMERIC(18, 4),
  low NUMERIC(18, 4),
  close NUMERIC(18, 4),
  volume NUMERIC(20, 2),
  trading_value NUMERIC(24, 2),
  reference_price NUMERIC(18, 4),
  price_change NUMERIC(18, 4),
  price_change_percent NUMERIC(12, 6),
  source VARCHAR(80) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_stock_prices_ticker_date_source UNIQUE (ticker, trading_date, source)
);

CREATE INDEX IF NOT EXISTS idx_stock_prices_ticker ON stock_prices (ticker);
CREATE INDEX IF NOT EXISTS idx_stock_prices_trading_date ON stock_prices (trading_date DESC);
CREATE INDEX IF NOT EXISTS idx_stock_prices_updated_at ON stock_prices (updated_at DESC);

-- Sync Clock config (singleton)
CREATE TABLE IF NOT EXISTS market_price_sync_config (
  id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  interval_seconds INT NOT NULL DEFAULT 60
    CHECK (interval_seconds IN (10, 30, 60, 300, 900)),
  last_sync_at TIMESTAMPTZ,
  next_sync_at TIMESTAMPTZ,
  last_result VARCHAR(40),
  last_records_synced INT,
  last_error TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO market_price_sync_config (id, enabled, interval_seconds, next_sync_at)
VALUES (1, TRUE, 60, NOW())
ON CONFLICT (id) DO NOTHING;

-- Audit mỗi Sync Cycle (không phải price history)
CREATE TABLE IF NOT EXISTS market_data_sync_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  status VARCHAR(40) NOT NULL DEFAULT 'running',
  records_processed INT,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_market_data_sync_runs_started
  ON market_data_sync_runs (started_at DESC);

-- Seed Field Authority Block 2: Current Source = vndirect_finfo cho các field Price Ingest v1
INSERT INTO market_source_field_authority (source_id, entity, field_key, trust_level, updated_at)
SELECT s.id, 'stock_price', f.field_key, 'trusted', NOW()
FROM data_sources s
CROSS JOIN (
  VALUES
    ('ticker'),
    ('trading_date'),
    ('open'),
    ('high'),
    ('low'),
    ('close'),
    ('volume'),
    ('trading_value'),
    ('reference_price'),
    ('price_change'),
    ('price_change_percent'),
    ('source')
) AS f(field_key)
WHERE s.code = 'vndirect_finfo'
ON CONFLICT (source_id, entity, field_key) DO UPDATE
SET trust_level = 'trusted', updated_at = NOW();
