-- Wave A — data ops + dashboard seed
CREATE TABLE IF NOT EXISTS data_pipeline_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(80) NOT NULL UNIQUE,
  name VARCHAR(200) NOT NULL,
  throughput VARCHAR(40) NOT NULL DEFAULT '',
  lag VARCHAR(40) NOT NULL DEFAULT '',
  status VARCHAR(20) NOT NULL DEFAULT 'success',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS data_quality_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section VARCHAR(80) NOT NULL,
  label VARCHAR(200) NOT NULL,
  value_text VARCHAR(200) NOT NULL DEFAULT '',
  sort_order INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS data_dictionary_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(80) NOT NULL UNIQUE,
  name VARCHAR(200) NOT NULL,
  field_type VARCHAR(40) NOT NULL DEFAULT 'string',
  description TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS data_reconciliation_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(80) NOT NULL UNIQUE,
  name VARCHAR(200) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'idle',
  last_run_at TIMESTAMPTZ,
  diff_count INT,
  description TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO data_pipeline_stages (code, name, throughput, lag, status) VALUES
  ('kafka_ingest', 'Kafka ingest', '18k/s', '120ms', 'success'),
  ('redis_hot', 'Redis hot store', '16k/s', '45ms', 'success'),
  ('postgres_eod', 'Postgres EOD', '2k/min', '890ms', 'degraded')
ON CONFLICT (code) DO NOTHING;

INSERT INTO data_quality_items (section, label, value_text, sort_order)
SELECT * FROM (VALUES
  ('Missing Data', 'Tick thiếu', '12 mã', 1),
  ('Missing Data', 'Phiên', 'HOSE chiều', 2),
  ('Outliers', 'Giá bất thường', '3 mã', 3)
) AS v(section, label, value_text, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM data_quality_items LIMIT 1);

INSERT INTO data_dictionary_fields (code, name, field_type, description) VALUES
  ('price', 'Giá khớp', 'number', 'Giá khớp gần nhất'),
  ('volume', 'Khối lượng', 'number', 'Khối lượng giao dịch'),
  ('ticker', 'Mã CK', 'string', 'Mã chứng khoán')
ON CONFLICT (code) DO NOTHING;

INSERT INTO data_reconciliation_runs (code, name, status, description) VALUES
  ('eod_hose', 'Đối soát EOD HOSE', 'idle', 'So khớp EOD vs feed'),
  ('foreign_room', 'Đối soát room NN', 'idle', 'Room khối ngoại')
ON CONFLICT (code) DO NOTHING;
