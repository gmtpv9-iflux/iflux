-- Task 04_0826: community SEO representation — Display Tin tức. Không đổi page_key.

UPDATE page_seo_configs
SET payload = jsonb_set(
      payload,
      '{seoTitle}',
      '"Tin tức | iFlux"'
    ),
    updated_at = NOW(),
    updated_by = 'task-04-0826-tin-tuc'
WHERE page_key = 'community';

UPDATE onboarding_steps
SET title = 'Tin tức'
WHERE target_key = 'community' AND title = 'Cộng đồng';
