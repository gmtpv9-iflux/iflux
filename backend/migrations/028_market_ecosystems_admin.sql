-- Phase C6 — market.ecosystems admin
ALTER TABLE ecosystems
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_ecosystems_is_active ON ecosystems(is_active);

INSERT INTO ecosystems (code, name_vi, divisor, is_active) VALUES
  ('vingroup', 'Họ Vingroup', 5, TRUE),
  ('gelex', 'Họ GELEX', 4, TRUE),
  ('masan', 'Họ Masan', 4, TRUE),
  ('hoaphat', 'Họ Hòa Phát', 2, TRUE),
  ('fpt', 'Họ FPT', 3, TRUE),
  ('sovico', 'Họ Sovico', 2, TRUE),
  ('tt', 'Họ T&T', 4, TRUE),
  ('bcg', 'Họ Bamboo Capital (BCG)', 4, TRUE),
  ('louis', 'Họ Louis', 1, TRUE),
  ('dnp', 'Họ DNP', 3, TRUE),
  ('ree', 'Họ REE', 4, TRUE),
  ('viettel', 'Họ Viettel', 3, TRUE),
  ('petrolimex', 'Họ Petrolimex', 4, TRUE),
  ('pvn', 'Họ PVN (Dầu khí)', 9, TRUE),
  ('evn', 'Họ EVN', 3, TRUE),
  ('vinachem', 'Họ Vinachem', 3, TRUE),
  ('geleximco', 'Họ Geleximco', 3, TRUE),
  ('ttc', 'Họ Thành Thành Công (TTC)', 4, TRUE),
  ('tng', 'Họ TNG Holdings (ROX)', 3, TRUE),
  ('tuanmuot', 'Họ Tuấn Mượt (Gelex/VIX)', 4, TRUE),
  ('apec', 'Họ Apec', 3, TRUE),
  ('anphat', 'Họ An Phát Holdings', 4, TRUE),
  ('pc1', 'Họ PC1', 1, TRUE)
ON CONFLICT (code) DO NOTHING;
