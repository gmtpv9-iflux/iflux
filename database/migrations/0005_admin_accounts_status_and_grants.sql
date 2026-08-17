-- 0005 — Phase 02: CHECK status + GRANT ghi identity/roles + sync quyền
--
-- 0001 đã apply: status NOT NULL DEFAULT 'active' (dòng 26). Không SET DEFAULT.
-- 0001–0004 không sửa. Ghi admin_permissions chỉ qua hàm DEFINER — không GRANT
-- INSERT/UPDATE/DELETE bảng hay sequence admin_permissions_id_seq.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'admin_accounts_status_check'
  ) THEN
    ALTER TABLE admin_accounts
      ADD CONSTRAINT admin_accounts_status_check
      CHECK (status IN ('active', 'disabled', 'deleted'));
  END IF;
END $$;

GRANT INSERT, DELETE ON admin_accounts TO staging_2;

GRANT INSERT, UPDATE, DELETE ON admin_roles TO staging_2;
GRANT INSERT, UPDATE, DELETE ON admin_account_roles TO staging_2;
GRANT INSERT, UPDATE, DELETE ON admin_role_permissions TO staging_2;

CREATE OR REPLACE FUNCTION registry_sync_permission(
  p_key varchar,
  p_module varchar,
  p_module_label varchar,
  p_page varchar,
  p_page_label varchar,
  p_action varchar,
  p_label varchar,
  p_sort integer
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO admin_permissions (
    key, module, module_label, page, page_label, action, label, sort
  ) VALUES (
    p_key, p_module, p_module_label, p_page, p_page_label, p_action, p_label, p_sort
  )
  ON CONFLICT (key) DO UPDATE SET
    module = EXCLUDED.module,
    module_label = EXCLUDED.module_label,
    page = EXCLUDED.page,
    page_label = EXCLUDED.page_label,
    action = EXCLUDED.action,
    label = EXCLUDED.label,
    sort = EXCLUDED.sort;
END;
$$;

REVOKE ALL ON FUNCTION registry_sync_permission(
  varchar, varchar, varchar, varchar, varchar, varchar, varchar, integer
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION registry_sync_permission(
  varchar, varchar, varchar, varchar, varchar, varchar, varchar, integer
) TO staging_2;

INSERT INTO schema_migrations (version)
VALUES ('0005_admin_accounts_status_and_grants')
ON CONFLICT (version) DO NOTHING;
