-- Owner 2026-10-16: đồng bộ cấu trúc bài AI với form Admin — thêm seo.keywords (gap thật duy
-- nhất tìm được khi so sánh article_input AI vs collectPayload() Admin; ảnh/sectors/display chủ ý
-- không giao AI — xem comment STATUSES trong news-articles.service.js). Schema compose đã thêm
-- field bắt buộc `seo.keywords` ở news-ai.contract.js; patch 2 câu hướng dẫn tương ứng trong
-- prompt (REPLACE theo substring chính xác, không ghi đè toàn bộ prompt dài ~70KB).
UPDATE ai_prompts
SET body = REPLACE(
  REPLACE(
    body,
    '- SEO title và description.',
    '- SEO title, description và keywords (3–8 từ khoá/cụm từ ngắn, phân tách bằng dấu phẩy, không lạm dụng lặp từ).'
  ),
  'Đề xuất SEO title khoảng 50–65 ký tự và description khoảng 140–160 ký tự; ưu tiên chính xác, tự nhiên.',
  'Đề xuất SEO title khoảng 50–65 ký tự, description khoảng 140–160 ký tự và keywords 3–8 từ khoá/cụm từ ngắn liên quan trực tiếp nội dung (mã cổ phiếu, doanh nghiệp, chủ đề); ưu tiên chính xác, tự nhiên, không nhồi từ khoá.'
),
updated_at = NOW()
WHERE code = 'news-editorial-v2' AND status = 'active';
