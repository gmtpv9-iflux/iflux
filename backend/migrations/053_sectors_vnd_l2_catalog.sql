-- Catalog Ngành = VNDirect industryLevel:2 (19). Đồng bộ tên + display_order.
-- Không thêm L4; giữ code slug đã khóa (stocks.sector_id FK theo id).

INSERT INTO sectors (code, name_vi, is_active, display_order, updated_at) VALUES
  ('dau-khi', 'Dầu khí', TRUE, 1, NOW()),
  ('hoa-chat', 'Hóa chất', TRUE, 2, NOW()),
  ('tai-nguyen', 'Tài nguyên', TRUE, 3, NOW()),
  ('xay-dung-vat-lieu', 'Xây dựng & Vật liệu', TRUE, 4, NOW()),
  ('hang-hoa-dich-vu-cn', 'Hàng hóa và dịch vụ công nghiệp', TRUE, 5, NOW()),
  ('oto-linh-kien', 'Ôtô & linh kiện phụ tùng', TRUE, 6, NOW()),
  ('thuc-pham-do-uong', 'Thực phẩm & Đồ uống', TRUE, 7, NOW()),
  ('do-dung-ca-nhan', 'Đồ dùng cá nhân và đồ gia dụng', TRUE, 8, NOW()),
  ('y-te', 'Y tế', TRUE, 9, NOW()),
  ('dich-vu-ban-le', 'Dịch vụ bán lẻ', TRUE, 10, NOW()),
  ('truyen-thong', 'Phương tiện truyền thông', TRUE, 11, NOW()),
  ('du-lich-giai-tri', 'Du lịch & Giải trí', TRUE, 12, NOW()),
  ('vien-thong', 'Viễn thông', TRUE, 13, NOW()),
  ('dich-vu-tien-ich', 'Dịch vụ tiện ích', TRUE, 14, NOW()),
  ('ngan-hang', 'Ngân hàng', TRUE, 15, NOW()),
  ('bao-hiem', 'Bảo hiểm', TRUE, 16, NOW()),
  ('bat-dong-san', 'Bất động sản', TRUE, 17, NOW()),
  ('dich-vu-tai-chinh', 'Dịch vụ tài chính', TRUE, 18, NOW()),
  ('cong-nghe', 'Công nghệ', TRUE, 19, NOW())
ON CONFLICT (code) DO UPDATE SET
  name_vi = EXCLUDED.name_vi,
  display_order = EXCLUDED.display_order,
  is_active = TRUE,
  updated_at = NOW();
