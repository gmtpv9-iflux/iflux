-- Task 03_0826: dashboard SEO representation — Display Trang chủ. Không đổi page_key.

UPDATE page_seo_configs
SET payload = jsonb_set(
      payload,
      '{seoTitle}',
      '"Trang chủ | iFlux"'
    ),
    updated_at = NOW(),
    updated_by = 'task-03-0826-trang-chu'
WHERE page_key = 'dashboard';

UPDATE onboarding_steps
SET title = 'Trang chủ'
WHERE target_key = 'home' AND title = 'Nhà của tôi';
