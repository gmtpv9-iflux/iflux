-- Legacy referral_code normalize: MINH10 → IFL publicId format (AFF-ID-002 exception slice)
-- Chỉ user minh@iflux.vn · idempotent · bật lại trigger immutable sau UPDATE

BEGIN;

ALTER TABLE users DISABLE TRIGGER trg_users_referral_code_immutable;

UPDATE users
SET referral_code = 'IFLMVN10',
    updated_at = NOW()
WHERE email = 'minh@iflux.vn'
  AND referral_code = 'MINH10';

ALTER TABLE users ENABLE TRIGGER trg_users_referral_code_immutable;

COMMIT;
