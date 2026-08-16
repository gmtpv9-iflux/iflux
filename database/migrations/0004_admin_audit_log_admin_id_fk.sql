-- 0004 — FK admin_audit_log.admin_id + quyền ghi cho role ứng dụng
--
-- 0001 đã apply: không sửa 0001. Bảng 0 dòng — không backfill.
-- GRANT chỉ phần PLAN-0 đo thiếu (17/08/2026): INSERT bảng + USAGE sequence.
-- Không SELECT/UPDATE/DELETE nhật ký. Không đụng users.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_admin_audit_log_admin'
  ) THEN
    ALTER TABLE admin_audit_log
      ADD CONSTRAINT fk_admin_audit_log_admin
      FOREIGN KEY (admin_id) REFERENCES admin_accounts(id)
      ON DELETE RESTRICT;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_admin_audit_log_admin_id
  ON admin_audit_log (admin_id);

GRANT INSERT ON admin_audit_log TO staging_2;
GRANT USAGE ON SEQUENCE admin_audit_log_id_seq TO staging_2;

INSERT INTO schema_migrations (version)
VALUES ('0004_admin_audit_log_admin_id_fk')
ON CONFLICT DO NOTHING;
