-- Reapply 066_news_media_path_community_to_news.sql — idempotent, safe to run again.
--
-- Found still-unmigrated /media/community/ URLs on staging: 60 articles' body_html/cover
-- (60/350 sampled) and page_seo_configs.favicon_url/logo_url/og_image/social_image. These
-- are old rows that were copied from production via a raw SQL import (Task "import 60 bài
-- mới nhất từ production qua staging"), which does not go through the app's importArticle
-- localization step — a raw row copy carries over whatever the source payload said at the
-- time, so it never ran through 066's string-replace. Re-running the exact same 5
-- statements here fixes whatever slipped through on either environment (production may
-- have the same leftover for articles predating the 066 run); the WHERE clauses make every
-- statement a no-op wherever it already ran.

UPDATE media_assets
SET public_url = replace(public_url, '/media/community/', '/media/news/')
WHERE public_url LIKE '%/media/community/%';

UPDATE media_variants
SET storage_key = regexp_replace(storage_key, '^community/', 'news/'),
    public_url = replace(public_url, '/media/community/', '/media/news/')
WHERE storage_key LIKE 'community/%'
   OR public_url LIKE '%/media/community/%';

UPDATE media_sources
SET original_url = replace(original_url, '/media/community/', '/media/news/')
WHERE original_url LIKE '%/media/community/%';

UPDATE news_posts
SET payload = replace(payload::text, '/media/community/', '/media/news/')::jsonb
WHERE payload::text LIKE '%/media/community/%';

UPDATE page_seo_configs
SET payload = replace(payload::text, '/media/community/', '/media/news/')::jsonb
WHERE payload::text LIKE '%/media/community/%';
