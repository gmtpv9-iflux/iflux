-- Phase C8 — data.sources (Nguồn dữ liệu)
CREATE TABLE IF NOT EXISTS data_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(80) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    source_type VARCHAR(40) NOT NULL DEFAULT 'REST',
    status VARCHAR(20) NOT NULL DEFAULT 'idle',
    latency_ms INT,
    last_check_at TIMESTAMPTZ,
    description TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT data_sources_status_chk
      CHECK (status IN ('idle', 'connected', 'success', 'failed', 'degraded')),
    CONSTRAINT data_sources_type_chk
      CHECK (source_type IN ('REST', 'WebSocket', 'File', 'DB', 'Other'))
);

CREATE INDEX IF NOT EXISTS idx_data_sources_status ON data_sources(status);
CREATE INDEX IF NOT EXISTS idx_data_sources_code ON data_sources(code);

INSERT INTO data_sources (code, name, source_type, status, latency_ms, description, last_check_at)
VALUES
  (
    'ssi_market_feed',
    'SSI Market Feed',
    'WebSocket',
    'connected',
    42,
    'Feed thị trường realtime',
    NOW() - INTERVAL '2 minutes'
  ),
  (
    'fiinpro_eod',
    'FiinPro EOD',
    'REST',
    'success',
    NULL,
    'Dữ liệu cuối ngày',
    NOW() - INTERVAL '8 hours'
  )
ON CONFLICT (code) DO NOTHING;
