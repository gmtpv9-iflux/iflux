-- Social login: Google, Apple, Facebook, Zalo
-- auth_provider + auth_provider_id; password optional for OAuth-only users

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(20) NOT NULL DEFAULT 'email',
  ADD COLUMN IF NOT EXISTS auth_provider_id VARCHAR(255);

ALTER TABLE users
  ALTER COLUMN password_hash DROP NOT NULL;

-- Backfill existing rows
UPDATE users SET auth_provider = 'email' WHERE auth_provider IS NULL OR auth_provider = '';

CREATE UNIQUE INDEX IF NOT EXISTS users_auth_provider_uidx
  ON users (auth_provider, auth_provider_id)
  WHERE auth_provider_id IS NOT NULL AND auth_provider_id <> '';

CREATE INDEX IF NOT EXISTS users_auth_provider_idx ON users (auth_provider);
