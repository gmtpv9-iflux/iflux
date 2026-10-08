-- Retire Content Engine (Topic/Chủ đề cũ) hoàn toàn — Owner 2026-10: tách Topic/Story trở lại
-- theo mô hình mới (Hashtag → Topic → Admin ánh xạ → Story), không còn auto-promote qua
-- Interest/Relevance Score. Toàn bộ engine này (migration 015-017, rename ở 019) không còn khớp
-- logic mới. (Luồng vnstock/article-ingest của Content Engine đã dọn trước ở migration 069 —
-- content_sources/content_articles/content_article_entities/content_ingest_runs/
-- content_article_chu_de_candidates không còn tồn tại, DROP IF EXISTS ở đây chỉ là no-op an toàn.)
--
-- Dữ liệu không quan trọng (Owner xác nhận — chưa dùng thật), không cần backup/migrate data.
-- Tin tức (article-edit-page.js) chuyển sang gắn `story_id` → bảng `stories` (Community V1,
-- migration 073) thay cho content_chu_de — xem backend/src/modules/news/news-articles.service.js.

BEGIN;

DROP TABLE IF EXISTS content_article_chu_de_candidates CASCADE;
DROP TABLE IF EXISTS content_chu_de_mappings CASCADE;
DROP TABLE IF EXISTS content_relevance_events CASCADE;
DROP TABLE IF EXISTS content_interest_events CASCADE;
DROP TABLE IF EXISTS content_chu_de_candidates CASCADE;
DROP TABLE IF EXISTS content_chu_de CASCADE;
DROP TABLE IF EXISTS content_article_entities CASCADE;
DROP TABLE IF EXISTS content_ingest_runs CASCADE;
DROP TABLE IF EXISTS content_articles CASCADE;
DROP TABLE IF EXISTS content_sources CASCADE;

-- Fix bug registry IA-001 (Thread Target Registry v1 LOCKED: chỉ post|stock|sector|family|story) —
-- 'communitypost' từng được dùng riêng cho Post Cộng đồng, không có trong registry đã lock. Migrate
-- data cũ về đúng 'post' (dùng chung với Post Tin tức) trước khi code bỏ hẳn alias.
UPDATE interaction_likes SET entity_type = 'post' WHERE entity_type = 'communitypost';
UPDATE interaction_comments SET entity_type = 'post' WHERE entity_type = 'communitypost';

COMMIT;
