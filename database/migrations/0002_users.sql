-- 0002 — Người dùng cuối
--
-- Hợp đồng dữ liệu lấy từ bảng `users` đang chạy thật ở Staging 1, rút gọn còn
-- phần thuộc năng lực đang migrate (quản trị danh tính người dùng).
--
-- CỐ Ý KHÔNG mang sang — mỗi cột thuộc một năng lực chưa tồn tại ở Staging 2,
-- sẽ được thêm bởi chính migration của năng lực đó:
--   password_hash                              → Đăng nhập người dùng cuối
--   referral_code · referred_by                → Loyalty / Affiliate
--   subscription_tier · subscription_expires_at → Gói hội viên
--
-- Cột `version` của Staging 1 cũng không mang sang: kiểm tra toàn bộ
-- admin-users.service.js cho thấy không endpoint nào đọc hay tăng nó — là cột
-- chết. Khi nào cần khóa lạc quan thật thì thêm cùng lúc với logic dùng nó.

CREATE TABLE IF NOT EXISTS users (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email              varchar(255) NOT NULL UNIQUE,
  phone              varchar(15) UNIQUE,
  display_name       varchar(255),
  nickname           varchar(255),
  account_status     varchar(20) NOT NULL DEFAULT 'active'
                     CHECK (account_status IN ('active', 'suspended')),
  email_verified_at  timestamptz,
  country            varchar(100) NOT NULL DEFAULT '',
  bio                text NOT NULL DEFAULT '',
  auth_provider      varchar(20) NOT NULL DEFAULT 'email',
  auth_provider_id   varchar(255),
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

-- Sắp xếp mặc định của danh sách quản trị.
CREATE INDEX IF NOT EXISTS idx_users_created ON users (created_at DESC);

-- Bộ lọc trạng thái.
CREATE INDEX IF NOT EXISTS idx_users_status ON users (account_status);

-- Tra cứu theo email không phân biệt hoa thường (ràng buộc UNIQUE ở trên phân
-- biệt hoa thường, nên cần index riêng cho đường tra cứu này).
CREATE INDEX IF NOT EXISTS idx_users_email_lower ON users (lower(email));

-- Quản trị hiện chỉ xem và sửa. Chưa cấp INSERT/DELETE: bản ghi người dùng
-- sinh ra từ đăng ký ở User Web — năng lực đó chưa được migrate.
GRANT SELECT, UPDATE ON users TO staging_2;

INSERT INTO schema_migrations (version) VALUES ('0002_users')
ON CONFLICT (version) DO NOTHING;
