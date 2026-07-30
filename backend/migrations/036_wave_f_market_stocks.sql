-- Wave F — market.stocks admin stub
CREATE TABLE IF NOT EXISTS market_admin_stocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticker VARCHAR(20) NOT NULL UNIQUE,
  name VARCHAR(200) NOT NULL,
  exchange VARCHAR(20) NOT NULL DEFAULT 'HOSE',
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO market_admin_stocks (ticker, name, exchange, status) VALUES
  ('HPG', 'Hòa Phát', 'HOSE', 'active'),
  ('FPT', 'FPT', 'HOSE', 'active'),
  ('SSI', 'SSI', 'HOSE', 'halted')
ON CONFLICT (ticker) DO NOTHING;
