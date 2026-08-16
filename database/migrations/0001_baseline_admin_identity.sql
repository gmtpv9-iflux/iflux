-- 0001 — Baseline: danh tính quản trị
--
-- Sáu bảng dưới đây ĐÃ tồn tại trong staging_2 trước khi thư mục
-- database/migrations được lập (tạo tay trong M00 Platform Foundation). File này
-- ghi lại đúng cấu trúc đang chạy để schema có nguồn trong mã nguồn, không phải
-- chỉ nằm trong DB.
--
-- Toàn bộ câu lệnh idempotent — chạy lại trên DB đã có sẽ không đổi gì.
-- Dùng serial/bigserial thay cho cặp CREATE SEQUENCE + ALTER COLUMN DEFAULT của
-- bản dump; kết quả cấu trúc tương đương.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS schema_migrations (
  version     text PRIMARY KEY,
  applied_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS admin_accounts (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email          varchar(255) NOT NULL UNIQUE,
  name           varchar(255),
  password_hash  varchar(255),
  avatar_url     text,
  is_super       boolean NOT NULL DEFAULT false,
  status         varchar(20) NOT NULL DEFAULT 'active',
  provider       varchar(20) NOT NULL DEFAULT 'password',
  last_login_at  timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS admin_roles (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code         varchar(50) NOT NULL UNIQUE,
  name         varchar(100) NOT NULL,
  description  text,
  is_system    boolean NOT NULL DEFAULT false,
  is_super     boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- key = module.page.action
CREATE TABLE IF NOT EXISTS admin_permissions (
  id            serial PRIMARY KEY,
  key           varchar(120) NOT NULL UNIQUE,
  module        varchar(60) NOT NULL,
  module_label  varchar(120),
  page          varchar(80),
  page_label    varchar(160),
  action        varchar(60) NOT NULL,
  label         varchar(200) NOT NULL,
  is_business   boolean NOT NULL DEFAULT false,
  sort          integer NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS admin_role_permissions (
  role_id        uuid NOT NULL REFERENCES admin_roles(id) ON DELETE CASCADE,
  permission_id  integer NOT NULL REFERENCES admin_permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS admin_account_roles (
  admin_id  uuid NOT NULL REFERENCES admin_accounts(id) ON DELETE CASCADE,
  role_id   uuid NOT NULL REFERENCES admin_roles(id) ON DELETE CASCADE,
  PRIMARY KEY (admin_id, role_id)
);

CREATE TABLE IF NOT EXISTS admin_audit_log (
  id           bigserial PRIMARY KEY,
  admin_id     uuid,
  admin_email  varchar(255),
  action       varchar(80) NOT NULL,
  target_type  varchar(60),
  target_id    varchar(255),
  detail       jsonb NOT NULL DEFAULT '{}'::jsonb,
  ip           varchar(64),
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_account_roles_admin    ON admin_account_roles (admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_role_permissions_role  ON admin_role_permissions (role_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_created          ON admin_audit_log (created_at DESC);

-- Quyền cho vai trò ứng dụng.
--
-- Bảng do postgres tạo nên vai trò kết nối của backend không mặc nhiên đọc
-- được. Trước migration này chỉ admin_accounts được cấp — đủ cho đăng nhập,
-- nên thiếu sót chỉ lộ ra khi bật kiểm quyền (Postgres 42501).
--
-- Cấp đúng những gì mã nguồn đang làm: đọc để kiểm quyền, cập nhật
-- last_login_at khi đăng nhập. Không cấp INSERT/DELETE — chưa có màn hình quản
-- trị vai trò ở Staging 2.
--
-- 'staging_2' là vai trò kết nối của môi trường này. Khi có môi trường thứ
-- hai thì tách tên vai trò ra cấu hình.
GRANT SELECT, UPDATE ON admin_accounts TO staging_2;
GRANT SELECT ON admin_roles, admin_permissions, admin_role_permissions, admin_account_roles
  TO staging_2;

INSERT INTO schema_migrations (version) VALUES ('0001_baseline_admin_identity')
ON CONFLICT (version) DO NOTHING;
