-- Notification Platform Foundation — Phase B
-- Template + Type registry tables (Platform SoT)

CREATE TABLE IF NOT EXISTS notification_types (
  code VARCHAR(80) PRIMARY KEY,
  legacy_case_id VARCHAR(80) NOT NULL UNIQUE,
  admin_code VARCHAR(20) NOT NULL,
  name VARCHAR(200) NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category VARCHAR(40) NOT NULL,
  group_label VARCHAR(120) NOT NULL DEFAULT '',
  channel_label VARCHAR(80) NOT NULL DEFAULT 'In-app user',
  variables JSONB NOT NULL DEFAULT '[]',
  sample_variables JSONB NOT NULL DEFAULT '{}',
  preference_bucket VARCHAR(80) NULL,
  supported_channels JSONB NOT NULL DEFAULT '["in_app"]',
  enabled BOOLEAN NOT NULL DEFAULT true,
  icon VARCHAR(40) NULL,
  created_by UUID NULL,
  updated_by UUID NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_types_admin_code ON notification_types (admin_code);
CREATE INDEX IF NOT EXISTS idx_notification_types_category ON notification_types (category);
CREATE INDEX IF NOT EXISTS idx_notification_types_preference_bucket ON notification_types (preference_bucket);

CREATE TABLE IF NOT EXISTS notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type_code VARCHAR(80) NOT NULL REFERENCES notification_types(code) ON DELETE CASCADE,
  channel VARCHAR(20) NOT NULL DEFAULT 'in_app',
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  seed_title TEXT NOT NULL,
  seed_body TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  version INT NOT NULL DEFAULT 1,
  created_by UUID NULL,
  updated_by UUID NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (type_code, channel)
);

CREATE INDEX IF NOT EXISTS idx_notification_templates_type_code ON notification_templates (type_code);
