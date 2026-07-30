-- Phase C5 — market.sectors admin (status + seed danh mục ngành)
ALTER TABLE sectors
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_sectors_is_active ON sectors(is_active);

INSERT INTO sectors (code, name_vi, divisor, is_active) VALUES
  ('bao-hiem', 'Bảo hiểm', 5, TRUE),
  ('bat-dong-san', 'Bất động sản', 5, TRUE),
  ('cong-nghe', 'Công nghệ', 5, TRUE),
  ('du-lich-giai-tri', 'Du lịch & Giải trí', 5, TRUE),
  ('dau-khi', 'Dầu khí', 5, TRUE),
  ('dich-vu-ban-le', 'Dịch vụ bán lẻ', 5, TRUE),
  ('dich-vu-tien-ich', 'Dịch vụ tiện ích', 5, TRUE),
  ('dich-vu-tai-chinh', 'Dịch vụ tài chính', 5, TRUE),
  ('hang-hoa-dich-vu-cn', 'Hàng hóa và dịch vụ công nghiệp', 5, TRUE),
  ('hoa-chat', 'Hóa chất', 5, TRUE),
  ('ngan-hang', 'Ngân hàng', 5, TRUE),
  ('truyen-thong', 'Phương tiện truyền thông', 5, TRUE),
  ('thuc-pham-do-uong', 'Thực phẩm & Đồ uống', 5, TRUE),
  ('tai-nguyen', 'Tài nguyên', 5, TRUE),
  ('vien-thong', 'Viễn thông', 5, TRUE),
  ('xay-dung-vat-lieu', 'Xây dựng & Vật liệu', 5, TRUE),
  ('y-te', 'Y tế', 5, TRUE),
  ('oto-linh-kien', 'Ôtô & linh kiện phụ tùng', 5, TRUE),
  ('do-dung-ca-nhan', 'Đồ dùng cá nhân và đồ gia dụng', 5, TRUE)
ON CONFLICT (code) DO NOTHING;
