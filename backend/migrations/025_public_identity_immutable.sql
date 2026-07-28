-- P1 Public Identity Readiness (AFF-ID-002 / ADR-AFF-006)
-- publicId := referral_code
-- 1) Backfill NULL/blank for registered users
-- 2) Reject UPDATE that changes a non-empty referral_code

BEGIN;

-- Backfill (idempotent)
DO $$
DECLARE
  r RECORD;
  candidate TEXT;
  tries INT;
BEGIN
  FOR r IN
    SELECT id
    FROM users
    WHERE referral_code IS NULL OR BTRIM(COALESCE(referral_code, '')) = ''
  LOOP
    tries := 0;
    LOOP
      tries := tries + 1;
      candidate := 'IFL' || UPPER(SUBSTR(MD5(random()::text || r.id::text || clock_timestamp()::text), 1, 5));
      BEGIN
        UPDATE users SET referral_code = candidate WHERE id = r.id;
        EXIT;
      EXCEPTION
        WHEN unique_violation THEN
          IF tries >= 20 THEN
            RAISE EXCEPTION 'P1 backfill: cannot allocate unique referral_code for user %', r.id;
          END IF;
      END;
    END LOOP;
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION iflux_prevent_referral_code_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF OLD.referral_code IS NOT NULL AND BTRIM(OLD.referral_code) <> '' THEN
      IF NEW.referral_code IS DISTINCT FROM OLD.referral_code THEN
        RAISE EXCEPTION 'publicId/referral_code is immutable after creation (AFF-ID-002)'
          USING ERRCODE = 'check_violation';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_users_referral_code_immutable ON users;
CREATE TRIGGER trg_users_referral_code_immutable
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE PROCEDURE iflux_prevent_referral_code_mutation();

COMMENT ON FUNCTION iflux_prevent_referral_code_mutation() IS
  'P1 AFF-ID-002: block changing referral_code once assigned; NULL→value still allowed for backfill edge.';

COMMIT;
