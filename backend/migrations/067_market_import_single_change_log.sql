-- Mỗi lần đồng bộ dữ liệu thị trường (1 import) = đúng 1 dòng nhật ký trong market_data_imports.
-- changes: chỉ các thay đổi thật (result apply / pending / review); '[]' khi không có gì thay đổi.
-- NULL = import cũ trước migration này — chi tiết vẫn đọc từ market_data_change_set_items (không xóa dữ liệu cũ).
ALTER TABLE market_data_imports ADD COLUMN IF NOT EXISTS changes JSONB;
