-- iFlux Admin RBAC — tài khoản quản trị, vai trò, quyền, gán quyền, nhật ký
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS admin_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    password_hash VARCHAR(255),
    avatar_url TEXT,
    is_super BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(20) NOT NULL DEFAULT 'active',   -- active | locked
    provider VARCHAR(20) NOT NULL DEFAULT 'password', -- password | google
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_system BOOLEAN NOT NULL DEFAULT FALSE,  -- không cho xóa
    is_super BOOLEAN NOT NULL DEFAULT FALSE,   -- toàn quyền, bỏ qua kiểm permission
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_permissions (
    id SERIAL PRIMARY KEY,
    key VARCHAR(120) UNIQUE NOT NULL,  -- module.page.action | module.page.business_action
    module VARCHAR(60) NOT NULL,
    module_label VARCHAR(120),
    page VARCHAR(80),
    page_label VARCHAR(160),
    action VARCHAR(60) NOT NULL,
    label VARCHAR(200) NOT NULL,
    is_business BOOLEAN NOT NULL DEFAULT FALSE,
    sort INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_role_permissions (
    role_id UUID REFERENCES admin_roles(id) ON DELETE CASCADE,
    permission_id INT REFERENCES admin_permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS admin_account_roles (
    admin_id UUID REFERENCES admin_accounts(id) ON DELETE CASCADE,
    role_id UUID REFERENCES admin_roles(id) ON DELETE CASCADE,
    PRIMARY KEY (admin_id, role_id)
);

CREATE TABLE IF NOT EXISTS admin_audit_log (
    id BIGSERIAL PRIMARY KEY,
    admin_id UUID,
    admin_email VARCHAR(255),
    action VARCHAR(80) NOT NULL,
    target_type VARCHAR(60),
    target_id VARCHAR(255),
    detail JSONB NOT NULL DEFAULT '{}',
    ip VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_created ON admin_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_account_roles_admin ON admin_account_roles(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_role_permissions_role ON admin_role_permissions(role_id);

-- Vai trò neo Admin (full quyền, chỉ Owner). Không seed Role nhân viên mặc định (Human Control SoT).
INSERT INTO admin_roles (code, name, description, is_system, is_super)
VALUES
    ('admin', 'Admin', 'Tài khoản Admin — toàn quyền. Chỉ Owner sử dụng. Không chỉnh trên Matrix.', TRUE, TRUE)
ON CONFLICT (code) DO NOTHING;
