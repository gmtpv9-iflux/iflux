-- CHECK constraint cột status chưa từng cho phép 'published' (migration 082) — auto-publish
-- (thêm ở phiên 2026-10-16) ghi status='published' sẽ bị DB từ chối, khiến job rơi về
-- needs_review dù bài viết thật (news_posts) đã publish thành công — dữ liệu mâu thuẫn.
ALTER TABLE news_ai_jobs DROP CONSTRAINT IF EXISTS news_ai_jobs_status_check;
ALTER TABLE news_ai_jobs ADD CONSTRAINT news_ai_jobs_status_check
  CHECK (status IN ('queued','running','preview_ready','needs_review','failed','published'));
