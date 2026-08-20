-- Task 05: page identity Tin tức community → news.
-- Bảng bài: 063_news_tables_community_to_news.sql

UPDATE page_seo_configs
SET page_key = 'news',
    updated_at = NOW(),
    updated_by = 'task-05-0826-identity-news'
WHERE page_key = 'community';

UPDATE onboarding_steps
SET target_key = 'news'
WHERE target_key = 'community';
