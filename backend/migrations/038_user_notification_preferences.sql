-- Phase D2.1 — User notification preference buckets (business bucket ON/OFF)
CREATE TABLE IF NOT EXISTS user_notification_preferences (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  preference_bucket VARCHAR(80) NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, preference_bucket)
);

CREATE INDEX IF NOT EXISTS idx_user_notification_preferences_bucket
  ON user_notification_preferences (preference_bucket);
