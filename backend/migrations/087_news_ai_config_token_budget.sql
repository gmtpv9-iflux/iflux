-- AI Programmatic SEO: bỏ hẳn quy đổi USD (OpenAI không có API trả giá, không bịa số) —
-- ngân sách/ngày đổi sang đơn vị TOKEN (chính xác 100%, không cần đoán giá). Owner 2026-10-16.
UPDATE system_admin_kv
SET payload = (payload - 'price_per_1k_input_usd' - 'price_per_1k_output_usd' - 'daily_budget_usd')
  || jsonb_build_object('daily_token_budget', COALESCE(payload->'daily_token_budget', '0'::jsonb)),
  updated_at = NOW()
WHERE scope = 'news_ai_config' AND code = 'primary';
