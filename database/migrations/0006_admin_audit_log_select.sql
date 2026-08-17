-- 0006 — Phase 02: SELECT nhật ký cho Activity Source Registry
--
-- 0004/0005 cố ý không GRANT UPDATE/DELETE admin_audit_log. 0005 đã apply.
-- hasActivity (SOL-C) đọc admin_audit_log.admin_id trên transaction xóa.
-- Thiếu SELECT → mọi DELETE account thành 503 (lỗi nguồn ≠ “không có hoạt động”).

GRANT SELECT ON admin_audit_log TO staging_2;

INSERT INTO schema_migrations (version)
VALUES ('0006_admin_audit_log_select')
ON CONFLICT (version) DO NOTHING;
