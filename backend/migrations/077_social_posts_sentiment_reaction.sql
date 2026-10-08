-- Owner 2026-10 — Post Cộng đồng: Sentiment tác giả (II.1) + Dislike (II.2, loại trừ Like).

-- Sentiment do TÁC GIẢ khai báo (Tích cực/Tiêu cực/Trung lập, mặc định KHÔNG chọn — NULL =
-- Unspecified). Khác hẳn Like/Dislike của cộng đồng (II.3: "hai loại tín hiệu khác nhau, không
-- được đồng nhất") — không dùng chung cột/bảng với Reaction Sentiment.
ALTER TABLE social_posts ADD COLUMN IF NOT EXISTS sentiment VARCHAR(10)
  CHECK (sentiment IS NULL OR sentiment IN ('positive', 'negative', 'neutral'));

-- Dislike loại trừ Like trên cùng 1 bài với cùng 1 User (II.2) — tái dùng interaction_likes (PK
-- sẵn có entity_type+entity_id+user_id đã tự đảm bảo loại trừ 1 row/user/entity), chỉ thêm value
-- để phân biệt like(1)/dislike(-1). Default 1 — mọi like cũ trước migration này giữ đúng nghĩa.
ALTER TABLE interaction_likes ADD COLUMN IF NOT EXISTS value SMALLINT NOT NULL DEFAULT 1
  CHECK (value IN (1, -1));

COMMENT ON COLUMN interaction_likes.value IS 'Owner 2026-10 — 1=like, -1=dislike. Chỉ Post Cộng đồng (entity_type=''post'') dùng Dislike; Like trên Stock/Sector/Family/Story (Đồng tình) giữ nguyên value=1.';
