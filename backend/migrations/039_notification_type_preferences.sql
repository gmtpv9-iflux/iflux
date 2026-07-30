-- D1-rev — Type-level notification preferences · retire bucket model (038)

-- 1. Rename preference_bucket → preference_group (UI category only)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'notification_types'
      AND column_name = 'preference_bucket'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'notification_types'
      AND column_name = 'preference_group'
  ) THEN
    ALTER TABLE notification_types RENAME COLUMN preference_bucket TO preference_group;
  END IF;
END $$;

DROP INDEX IF EXISTS idx_notification_types_preference_bucket;
CREATE INDEX IF NOT EXISTS idx_notification_types_preference_group
  ON notification_types (preference_group);

-- 2. Type-level preference SoT
CREATE TABLE IF NOT EXISTS user_notification_type_preferences (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type_code VARCHAR(80) NOT NULL REFERENCES notification_types(code) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, type_code)
);

CREATE INDEX IF NOT EXISTS idx_user_notif_type_prefs_type
  ON user_notification_type_preferences (type_code);

-- 3. One-time migrate from bucket table (migration source only)
INSERT INTO user_notification_type_preferences (user_id, type_code, enabled, updated_at)
SELECT unp.user_id, nt.code, unp.enabled, COALESCE(unp.updated_at, NOW())
FROM user_notification_preferences unp
JOIN notification_types nt ON nt.preference_group = unp.preference_bucket
WHERE nt.preference_group IS NOT NULL
ON CONFLICT (user_id, type_code)
DO UPDATE SET enabled = EXCLUDED.enabled, updated_at = EXCLUDED.updated_at;

-- 4. Retire bucket-level table
DROP TABLE IF EXISTS user_notification_preferences;
