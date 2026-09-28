-- Task 05 change request: disk/URL prefix Tin tức community/ → news/.
-- Giải phóng folder community cho sản phẩm Community. Idempotent.

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
