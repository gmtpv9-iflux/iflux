-- Owner 2026-10 — Story CHỈ được tạo qua Admin ánh xạ 1 Topic → 1 Story (VI.2, VII.1). 1 Story
-- có đúng 1 Topic (Owner chốt: "Một Story sẽ chỉ có 1 Topic") — UNIQUE đảm bảo 1 Topic không map
-- được vào 2 Story khác nhau.
ALTER TABLE stories ADD COLUMN IF NOT EXISTS topic_id UUID UNIQUE REFERENCES topics(id) ON DELETE SET NULL;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS mapped_by UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS mapped_at TIMESTAMPTZ;

-- Slug cho URL công khai đẹp (/cau-chuyen/:slug) — trang chi tiết Story hiện chưa tồn tại thật
-- (chỉ là widget tĩnh "Chủ đề HOT"), Phase 4 sẽ tạo trang thật dùng slug này. NULL cho Story cũ
-- (nếu có) — chỉ bắt buộc ở luồng tạo mới qua Admin mapping (Phase 2).
ALTER TABLE stories ADD COLUMN IF NOT EXISTS slug VARCHAR(220) UNIQUE;

COMMENT ON COLUMN stories.topic_id IS 'Owner 2026-10 — Topic đã map (1:1). NULL = Story cũ tạo trực tiếp trước khi có Topic (không còn xảy ra sau Phase 2 — User không còn quyền tạo Story).';
