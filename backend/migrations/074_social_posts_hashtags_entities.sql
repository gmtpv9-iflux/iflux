-- Community V1 Phase 4 (mở rộng) — Hashtag + gắn nhiều loại Thực thể lên Post (SoT §4/§9).
-- Hashtag KHÔNG tạo thực thể/bảng riêng (không trùng lặp với Story) — lưu dạng mảng text ngay
-- trên Post, giống stock_tags. "Chủ đề thịnh hành" tính trực tiếp từ tần suất xuất hiện (unnest +
-- COUNT trong khoảng thời gian), không cần bảng đếm riêng ở V1 (chưa đủ traffic để cần tối ưu).
-- entity_refs: Thực thể iFlux đính kèm NGOÀI cổ phiếu (Ngành/Hệ sinh thái/Câu chuyện) — stock vẫn
-- giữ nguyên cột stock_tags cũ (đã có GIN index phục vụ Stock Detail tab Thảo luận, không đổi).
ALTER TABLE social_posts ADD COLUMN IF NOT EXISTS hashtags TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE social_posts ADD COLUMN IF NOT EXISTS entity_refs JSONB NOT NULL DEFAULT '[]';

CREATE INDEX IF NOT EXISTS idx_social_posts_hashtags
  ON social_posts USING GIN (hashtags)
  WHERE status = 'published';

COMMENT ON COLUMN social_posts.hashtags IS 'Hashtag tự do (tối đa 5/post) — cơ sở xác định Chủ đề thịnh hành, không phải thực thể riêng.';
COMMENT ON COLUMN social_posts.entity_refs IS 'Thực thể iFlux đính kèm ngoài cổ phiếu: [{type: sector|family|story, id, label}].';
