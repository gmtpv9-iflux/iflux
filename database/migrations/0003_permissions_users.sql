-- 0003 — Quyền quản trị: nhóm Quản lý người dùng
--
-- Owner mở phase build enforcement cho nhóm users.* ngày 15/08/2026
-- (Owner-Decision-Matrix-SoT: "Build API = Phase C+ khi Owner mở").
--
-- CHỈ seed khóa nào đang thật sự được endpoint enforce. Không seed sẵn
-- users.list.create / grant_premium / reset_password: ba năng lực đó chưa được
-- dựng ở Staging 2, seed trước sẽ tạo checkbox rỗng trên ma trận phân quyền.
--
-- Không cấp quyền cho vai trò 'admin' hiện có: vai trò đó is_super = true nên
-- bỏ qua kiểm quyền theo thiết kế (Admin = toàn quyền, không nằm trên Ma trận).
-- Bảng admin_role_permissions chỉ dùng cho vai trò do Owner tạo về sau.

INSERT INTO admin_permissions (key, module, module_label, page, page_label, action, label, is_business, sort)
VALUES
  ('users.list.view',   'users', 'Quản lý người dùng', 'list', 'Danh sách người dùng', 'view',   'Xem',  false, 10),
  ('users.list.edit',   'users', 'Quản lý người dùng', 'list', 'Danh sách người dùng', 'edit',   'Sửa',  false, 20),
  ('users.list.export', 'users', 'Quản lý người dùng', 'list', 'Danh sách người dùng', 'export', 'Xuất', false, 30)
ON CONFLICT (key) DO NOTHING;

INSERT INTO schema_migrations (version) VALUES ('0003_permissions_users')
ON CONFLICT (version) DO NOTHING;
