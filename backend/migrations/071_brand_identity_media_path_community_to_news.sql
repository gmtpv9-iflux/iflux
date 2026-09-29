-- 066/070 fixed page_seo_configs and news_posts but missed every OTHER table with a
-- payload jsonb column. The global brand identity (favicon/logo/default og+social image)
-- lives in marketing_brand_identity (site-seo.service.js getGlobalPayload → getBrand,
-- code='primary') — a table neither prior migration listed, which is why those 4 fields
-- still showed /media/community/. Sweeping every payload-holding table here as a defensive
-- catch-all so this doesn't surface a third time. Idempotent — a no-op wherever the LIKE
-- pattern doesn't match, safe to run again.

UPDATE marketing_brand_identity
SET payload = replace(payload::text, '/media/community/', '/media/news/')::jsonb
WHERE payload::text LIKE '%/media/community/%';

UPDATE community_posts
SET payload = replace(payload::text, '/media/community/', '/media/news/')::jsonb
WHERE payload::text LIKE '%/media/community/%';

UPDATE market_lot_config
SET payload = replace(payload::text, '/media/community/', '/media/news/')::jsonb
WHERE payload::text LIKE '%/media/community/%';

UPDATE market_ranking_config
SET payload = replace(payload::text, '/media/community/', '/media/news/')::jsonb
WHERE payload::text LIKE '%/media/community/%';

UPDATE sub_admin_entitlements
SET payload = replace(payload::text, '/media/community/', '/media/news/')::jsonb
WHERE payload::text LIKE '%/media/community/%';

UPDATE sub_admin_loyalty
SET payload = replace(payload::text, '/media/community/', '/media/news/')::jsonb
WHERE payload::text LIKE '%/media/community/%';

UPDATE system_admin_kv
SET payload = replace(payload::text, '/media/community/', '/media/news/')::jsonb
WHERE payload::text LIKE '%/media/community/%';
