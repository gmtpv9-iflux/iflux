-- AFFILIATE_REFERRAL_SUCCESS — template SoT (title/body + affiliate_tier variable)

UPDATE notification_types
SET
  variables = '[
    {"key":"recipient_name","label":"Tên người dùng","required":false,"example":"Nguyễn Văn A"},
    {"key":"member","label":"Tên thành viên mới","required":true,"example":"Phạm Minh Tuấn"},
    {"key":"affiliate_tier","label":"Tầng affiliate","required":true,"example":"F0"}
  ]'::jsonb,
  sample_variables = '{"recipient_name":"Nguyễn Văn A","member":"Phạm Minh Tuấn","affiliate_tier":"F0"}'::jsonb,
  updated_at = NOW()
WHERE code = 'AFFILIATE_REFERRAL_SUCCESS';

UPDATE notification_templates
SET
  seed_title = 'Bạn có thành viên {Tầng affiliate} mới!',
  seed_body = '{Tên thành viên mới} đã đăng ký thành công thông qua nhánh giới thiệu của bạn!',
  title = CASE
    WHEN title IN ('Referral mới', 'Bạn có thành viên {Tầng affiliate} mới!')
      OR title = seed_title
      OR title LIKE '%Referral mới%'
    THEN 'Bạn có thành viên {Tầng affiliate} mới!'
    ELSE title
  END,
  body = CASE
    WHEN body = seed_body
      OR body LIKE '%đăng ký qua mã giới thiệu%'
      OR body LIKE '%thông qua nhánh giới thiệu%'
    THEN '{Tên thành viên mới} đã đăng ký thành công thông qua nhánh giới thiệu của bạn!'
    ELSE body
  END,
  version = version + 1,
  updated_at = NOW()
WHERE type_code = 'AFFILIATE_REFERRAL_SUCCESS' AND channel = 'in_app';
