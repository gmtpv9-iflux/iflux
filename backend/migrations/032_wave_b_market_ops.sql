-- Wave B — market config + market-ops stubs
CREATE TABLE IF NOT EXISTS market_formulas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(80) NOT NULL UNIQUE,
  name VARCHAR(200) NOT NULL,
  formula_text TEXT NOT NULL DEFAULT '',
  status VARCHAR(20) NOT NULL DEFAULT 'draft',
  last_recalc_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS market_lot_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(40) NOT NULL UNIQUE,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS market_ranking_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(40) NOT NULL UNIQUE,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS market_ops_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(80) NOT NULL UNIQUE,
  name VARCHAR(200) NOT NULL,
  open_time VARCHAR(20) NOT NULL DEFAULT '09:00',
  close_time VARCHAR(20) NOT NULL DEFAULT '15:00',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS market_ops_missing_ticks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticker VARCHAR(20) NOT NULL,
  session_code VARCHAR(40) NOT NULL DEFAULT '',
  gap_count INT NOT NULL DEFAULT 0,
  note TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS market_ops_corrections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticker VARCHAR(20) NOT NULL,
  field_name VARCHAR(80) NOT NULL,
  old_value TEXT NOT NULL DEFAULT '',
  new_value TEXT NOT NULL DEFAULT '',
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  note TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO market_formulas (code, name, formula_text, status) VALUES
  ('flow_score', 'Điểm dòng tiền', 'w1*vol + w2*price', 'active'),
  ('breadth', 'Breadth thị trường', 'adv/(adv+dec)', 'active')
ON CONFLICT (code) DO NOTHING;

INSERT INTO market_lot_config (code, payload) VALUES
  ('defaults', '{"large":1000000000,"mid":500000000,"small":100000000,"overrides":{}}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO market_ranking_config (code, payload) VALUES
  ('weights', '{"momentum":40,"flow":30,"liquidity":20,"quality":10,"lookbackDays":20,"sectorTopN":10}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO market_ops_sessions (code, name, open_time, close_time, is_active) VALUES
  ('hose_am', 'HOSE buổi sáng', '09:00', '11:30', TRUE),
  ('hose_pm', 'HOSE buổi chiều', '13:00', '15:00', TRUE)
ON CONFLICT (code) DO NOTHING;

INSERT INTO market_ops_missing_ticks (ticker, session_code, gap_count, note)
SELECT * FROM (VALUES
  ('HPG', 'hose_am', 12, 'Mất tick 10:15'),
  ('SSI', 'hose_pm', 3, 'Gap nhỏ')
) AS v(ticker, session_code, gap_count, note)
WHERE NOT EXISTS (SELECT 1 FROM market_ops_missing_ticks LIMIT 1);

INSERT INTO market_ops_corrections (ticker, field_name, old_value, new_value, status, note)
SELECT * FROM (VALUES
  ('VCB', 'close', '94500', '94600', 'pending', 'Sửa giá đóng')
) AS v(ticker, field_name, old_value, new_value, status, note)
WHERE NOT EXISTS (SELECT 1 FROM market_ops_corrections LIMIT 1);
