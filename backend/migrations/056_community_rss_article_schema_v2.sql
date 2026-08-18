-- 056: community_rss_schema — SoT field keys khớp community_posts (v2)
-- Payload chi tiết được ensure bởi API (community-article-schema-fields.js).
-- Migration đánh dấu / chèn row nếu thiếu; version < 2 → API tự upsert fields đầy đủ.

INSERT INTO community_rss_schema (code, name, mapping_json)
VALUES (
  'default_article',
  'Schema bài viết Cộng đồng (community_posts)',
  '{"version":1,"fields":[]}'::jsonb
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  updated_at = NOW()
WHERE community_rss_schema.mapping_json->>'version' IS NULL
   OR (community_rss_schema.mapping_json->>'version')::int < 2
   OR jsonb_typeof(community_rss_schema.mapping_json->'fields') IS DISTINCT FROM 'array'
   OR jsonb_array_length(COALESCE(community_rss_schema.mapping_json->'fields', '[]'::jsonb)) = 0;
