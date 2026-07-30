-- Phase C7 — data.etl_jobs (Tác vụ ETL)
CREATE TABLE IF NOT EXISTS data_etl_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(80) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    schedule VARCHAR(80) NOT NULL DEFAULT '',
    status VARCHAR(20) NOT NULL DEFAULT 'idle',
    last_run_at TIMESTAMPTZ,
    last_duration_ms INT,
    last_records INT,
    description TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT data_etl_jobs_status_chk
      CHECK (status IN ('idle', 'running', 'success', 'failed'))
);

CREATE INDEX IF NOT EXISTS idx_data_etl_jobs_status ON data_etl_jobs(status);
CREATE INDEX IF NOT EXISTS idx_data_etl_jobs_code ON data_etl_jobs(code);

INSERT INTO data_etl_jobs (code, name, schedule, status, last_duration_ms, last_records, description, last_run_at)
VALUES
  (
    'ingest_ticks_hose',
    'Ingest ticks HOSE',
    '*/1 * * * *',
    'success',
    12000,
    1200000,
    'Kéo tick HOSE định kỳ',
    NOW() - INTERVAL '5 minutes'
  ),
  (
    'breadth_aggregate',
    'Breadth aggregate',
    '*/5 * * * *',
    'idle',
    NULL,
    NULL,
    'Tổng hợp độ rộng thị trường',
    NULL
  )
ON CONFLICT (code) DO NOTHING;
