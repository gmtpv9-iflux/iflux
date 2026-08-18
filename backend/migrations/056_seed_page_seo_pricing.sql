-- Seed Thiết lập SEO page: pricing (/goi-cuoc)
-- Owner request 2026-08-10 — remove hardcode Gói cước · iFlux

INSERT INTO page_seo_configs (page_key, payload, updated_at, updated_by)
VALUES (
  'pricing',
  '{
    "seoTier": "tier1",
    "seoTitle": "iFlux | Gói cước Membership",
    "metaDescription": "So sánh các gói Free, Premium và Elite trên iFlux — quyền lợi, tính năng và cách nâng cấp Membership.",
    "faviconUrl": "",
    "ogImageUrl": "",
    "socialImageUrl": "",
    "baselineKind": "default_seo_template",
    "baselineSource": "owner-seo-pricing-2026-08-10",
    "hasPlaceholders": false
  }'::jsonb,
  NOW(),
  'owner-seo-pricing-2026-08-10'
)
ON CONFLICT (page_key) DO UPDATE
SET
  payload = EXCLUDED.payload,
  updated_at = NOW(),
  updated_by = EXCLUDED.updated_by;
