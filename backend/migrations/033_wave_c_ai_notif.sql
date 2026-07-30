-- Wave C — AI + notifications admin stubs
CREATE TABLE IF NOT EXISTS ai_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(80) NOT NULL UNIQUE,
  name VARCHAR(200) NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  status VARCHAR(20) NOT NULL DEFAULT 'draft',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_quality_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(80) NOT NULL UNIQUE,
  label VARCHAR(200) NOT NULL,
  score NUMERIC(5,2) NOT NULL DEFAULT 0,
  note TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_cost_rows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider VARCHAR(80) NOT NULL,
  model VARCHAR(80) NOT NULL DEFAULT '',
  tokens INT NOT NULL DEFAULT 0,
  cost_usd NUMERIC(12,4) NOT NULL DEFAULT 0,
  day DATE NOT NULL DEFAULT CURRENT_DATE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_log_rows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level VARCHAR(20) NOT NULL DEFAULT 'info',
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notif_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel VARCHAR(20) NOT NULL,
  code VARCHAR(80) NOT NULL,
  title VARCHAR(200) NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  status VARCHAR(20) NOT NULL DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (channel, code)
);

CREATE TABLE IF NOT EXISTS notif_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel VARCHAR(20) NOT NULL,
  title VARCHAR(200) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'sent',
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notif_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(80) NOT NULL UNIQUE,
  name VARCHAR(200) NOT NULL,
  channel VARCHAR(20) NOT NULL DEFAULT 'in_app',
  body TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO ai_prompts (code, name, body, status) VALUES
  ('summary_vn', 'Tóm tắt tiếng Việt', 'Tóm tắt ngắn gọn nội dung thị trường.', 'active'),
  ('risk_note', 'Ghi chú rủi ro', 'Liệt kê rủi ro chính.', 'draft')
ON CONFLICT (code) DO NOTHING;

INSERT INTO ai_quality_items (code, label, score, note) VALUES
  ('hallucination', 'Ảo giác', 82.5, 'Mẫu kiểm thử tuần'),
  ('relevance', 'Liên quan', 91.0, 'OK')
ON CONFLICT (code) DO NOTHING;

INSERT INTO ai_cost_rows (provider, model, tokens, cost_usd)
SELECT * FROM (VALUES
  ('openai', 'gpt-4o-mini', 120000, 0.42),
  ('anthropic', 'claude-haiku', 80000, 0.31)
) AS v(provider, model, tokens, cost_usd)
WHERE NOT EXISTS (SELECT 1 FROM ai_cost_rows LIMIT 1);

INSERT INTO ai_log_rows (level, message)
SELECT * FROM (VALUES
  ('info', 'Prompt summary_vn chạy OK'),
  ('warn', 'Latency cao model haiku')
) AS v(level, message)
WHERE NOT EXISTS (SELECT 1 FROM ai_log_rows LIMIT 1);

INSERT INTO notif_campaigns (channel, code, title, body, status) VALUES
  ('push', 'push_open', 'Thị trường mở cửa', 'Phiên sáng đã mở', 'draft'),
  ('in_app', 'inapp_welcome', 'Chào mừng', 'Chào bạn đến iFlux', 'draft'),
  ('email', 'email_digest', 'Tóm tắt ngày', 'Digest EOD', 'draft')
ON CONFLICT (channel, code) DO NOTHING;

INSERT INTO notif_history (channel, title, status)
SELECT * FROM (VALUES
  ('push', 'Thông báo phiên sáng', 'sent'),
  ('email', 'Digest hôm qua', 'sent')
) AS v(channel, title, status)
WHERE NOT EXISTS (SELECT 1 FROM notif_history LIMIT 1);

INSERT INTO notif_templates (code, name, channel, body) VALUES
  ('tpl_announcement', 'Thông báo hệ thống', 'in_app', 'Nội dung thông báo'),
  ('tpl_email_digest', 'Email digest', 'email', 'Xin chào {{name}}')
ON CONFLICT (code) DO NOTHING;
