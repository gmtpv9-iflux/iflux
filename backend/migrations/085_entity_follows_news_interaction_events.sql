-- Theo dõi thực thể (Stock/Sector/Ecosystem/Story) — SoT thật, có timestamp. Dùng cho Tin tức
-- "Bạn đang quan tâm" và Tầng Thô sau này. Tái dùng đúng pattern entity_type/entity_id generic
-- đã có ở interaction_likes (migration 072) — entity_id lưu dạng text (ticker/slug/code/UUID),
-- không ràng buộc FK cứng vì entity_type khác loại ID (sectors.id SERIAL, ecosystems.id SERIAL,
-- stocks.ticker VARCHAR, stories.id UUID). Thay thế watchlist_json (chỉ ticker, client-managed,
-- không timestamp) cho mục đích Follow — watchlist_json vẫn giữ nguyên cho mục đích cũ (danh mục
-- theo dõi giá cổ phiếu), không đụng tới.
CREATE TABLE IF NOT EXISTS user_entity_follows (
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  entity_type VARCHAR(16) NOT NULL CHECK (entity_type IN ('stock', 'sector', 'ecosystem', 'story')),
  entity_id   VARCHAR(160) NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, entity_type, entity_id)
);
CREATE INDEX IF NOT EXISTS idx_user_entity_follows_user ON user_entity_follows (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_entity_follows_entity ON user_entity_follows (entity_type, entity_id);

COMMENT ON TABLE user_entity_follows IS 'Theo dõi thực thể (Cổ phiếu/Ngành/Hệ sinh thái/Câu chuyện) có timestamp thật — dùng cho Tin tức "Bạn đang quan tâm" + Tầng Thô sau này.';

-- Log tương tác News thô (append-only, có timestamp) — CHỈ 2 chỉ số chưa có timestamp ở nơi khác
-- (Thích/Chia sẻ hiện lưu dạng mảng liked_by[]/favorited_by[] hoặc bộ đếm cộng dồn trong
-- news_posts.payload — xem backend/src/modules/news/interaction.service.js mutate(), không có
-- mốc thời gian từng lượt). Bình luận (news_comments.created_at) và Đăng lại (social_posts
-- .created_at, post_type='share' AND source_type='news') ĐÃ có timestamp thật — tính điểm
-- "Tin nóng" sẽ JOIN trực tiếp 2 bảng đó, KHÔNG log lại ở đây (tránh trùng dữ liệu).
CREATE TABLE IF NOT EXISTS news_interaction_events (
  id            BIGSERIAL PRIMARY KEY,
  news_post_id  VARCHAR(80) NOT NULL REFERENCES news_posts(id) ON DELETE CASCADE,
  user_id       UUID REFERENCES users(id) ON DELETE SET NULL, -- NULL: share_bump cho phép khách (chưa đăng nhập)
  event_type    VARCHAR(16) NOT NULL CHECK (event_type IN ('like', 'favorite', 'share')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_news_ix_events_post_time ON news_interaction_events (news_post_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_ix_events_user ON news_interaction_events (user_id, created_at DESC);

COMMENT ON TABLE news_interaction_events IS 'Log thô append-only (KHÔNG xoá khi unlike) cho Thích/Yêu thích/Chia sẻ trên News — phục vụ tính điểm "Tin nóng" theo khung giờ (Hôm nay/Tuần này/Tháng này) + Tầng Thô sau này.';
