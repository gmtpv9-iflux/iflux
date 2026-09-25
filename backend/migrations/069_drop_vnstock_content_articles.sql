-- Bỏ luồng B (vnstock → Content Engine articles). Tin tức chỉ còn luồng RSS → news_posts.
-- Hệ thống Chủ đề (content_chu_de*, content_interest_events, content_relevance_events) giữ nguyên,
-- chỉ tính theo tương tác người dùng.
ALTER TABLE content_interest_events DROP COLUMN IF EXISTS article_id;
ALTER TABLE content_relevance_events DROP COLUMN IF EXISTS article_id;
ALTER TABLE content_chu_de_candidates DROP COLUMN IF EXISTS article_count;

DROP TABLE IF EXISTS content_article_entities;
DROP TABLE IF EXISTS content_article_chu_de_candidates;
DROP TABLE IF EXISTS content_ingest_runs;
DROP TABLE IF EXISTS content_articles;
DROP TABLE IF EXISTS content_sources;
