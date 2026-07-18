-- Persist in-app notifications + profile chat (localStorage → PostgreSQL)
ALTER TABLE user_data
  ADD COLUMN IF NOT EXISTS notifications_json JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS messages_json JSONB NOT NULL DEFAULT '{}';
