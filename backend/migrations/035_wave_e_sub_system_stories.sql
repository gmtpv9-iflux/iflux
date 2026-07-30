-- Wave E — subscription + system + stories stubs
CREATE TABLE IF NOT EXISTS sub_admin_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(80) NOT NULL UNIQUE,
  name VARCHAR(200) NOT NULL,
  price_vnd INT NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sub_admin_entitlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(40) NOT NULL UNIQUE,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sub_admin_loyalty (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(40) NOT NULL UNIQUE,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sub_admin_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(200) NOT NULL,
  plan_code VARCHAR(80) NOT NULL DEFAULT 'free',
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS system_admin_kv (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope VARCHAR(40) NOT NULL,
  code VARCHAR(80) NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (scope, code)
);

CREATE TABLE IF NOT EXISTS stories_cau_chuyen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(80) NOT NULL UNIQUE,
  title VARCHAR(200) NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO sub_admin_plans (code, name, price_vnd, status) VALUES
  ('free', 'Free', 0, 'active'),
  ('premium', 'Premium', 199000, 'active')
ON CONFLICT (code) DO NOTHING;

INSERT INTO sub_admin_entitlements (code, payload) VALUES
  ('matrix', '{"blocks":[]}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO sub_admin_loyalty (code, payload) VALUES
  ('default', '{"pointsPerOrder":10}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO sub_admin_subscribers (email, plan_code, status)
SELECT * FROM (VALUES
  ('demo@iflux.vn', 'premium', 'active'),
  ('guest@iflux.vn', 'free', 'active')
) AS v(email, plan_code, status)
WHERE NOT EXISTS (SELECT 1 FROM sub_admin_subscribers LIMIT 1);

INSERT INTO system_admin_kv (scope, code, payload) VALUES
  ('core_setup', 'primary', '{"env":"production"}'::jsonb),
  ('feature_flags', 'primary', '{"lazyRuntime":true}'::jsonb),
  ('maintenance', 'primary', '{"enabled":false}'::jsonb),
  ('platform_layers', 'primary', '{"layers":4}'::jsonb),
  ('sla', 'primary', '{"uptime":99.9}'::jsonb)
ON CONFLICT (scope, code) DO NOTHING;

INSERT INTO stories_cau_chuyen (code, title, body) VALUES
  ('sample', 'Câu chuyện mẫu', 'Nội dung stub Wave E')
ON CONFLICT (code) DO NOTHING;
