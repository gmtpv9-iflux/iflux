-- Wave D — metadata + brand + community leftovers
CREATE TABLE IF NOT EXISTS meta_enums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(80) NOT NULL UNIQUE,
  name VARCHAR(200) NOT NULL,
  values_text TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS meta_sector_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(80) NOT NULL UNIQUE,
  name VARCHAR(200) NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS meta_themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(80) NOT NULL UNIQUE,
  name VARCHAR(200) NOT NULL,
  config_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS meta_story_lifecycle (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(80) NOT NULL UNIQUE,
  name VARCHAR(200) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS marketing_brand_identity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(40) NOT NULL UNIQUE,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS community_admin_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author VARCHAR(120) NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  status VARCHAR(20) NOT NULL DEFAULT 'visible',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS community_admin_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type VARCHAR(40) NOT NULL DEFAULT 'post',
  target_id VARCHAR(80) NOT NULL DEFAULT '',
  reason TEXT NOT NULL DEFAULT '',
  status VARCHAR(20) NOT NULL DEFAULT 'open',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS community_rss_sync_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(80) NOT NULL UNIQUE,
  name VARCHAR(200) NOT NULL,
  config_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_run_at TIMESTAMPTZ,
  status VARCHAR(20) NOT NULL DEFAULT 'idle',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS community_rss_schema (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(80) NOT NULL UNIQUE,
  name VARCHAR(200) NOT NULL,
  mapping_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO meta_enums (code, name, values_text) VALUES
  ('post_status', 'Trạng thái bài', 'draft,published,archived'),
  ('cap_tier', 'Vốn hóa', 'large,mid,small')
ON CONFLICT (code) DO NOTHING;

INSERT INTO meta_sector_types (code, name, description) VALUES
  ('icb', 'ICB', 'Phân loại ICB'),
  ('gics', 'GICS', 'Phân loại GICS')
ON CONFLICT (code) DO NOTHING;

INSERT INTO meta_themes (code, name, config_json) VALUES
  ('default', 'Theme mặc định', '{"accent":"teal"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO meta_story_lifecycle (code, name, sort_order) VALUES
  ('new', 'Mới', 1),
  ('mature', 'Trưởng thành', 2),
  ('declining', 'Suy giảm', 3)
ON CONFLICT (code) DO NOTHING;

INSERT INTO marketing_brand_identity (code, payload) VALUES
  ('primary', '{"name":"iFlux","tagline":"Dòng chảy thị trường"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO community_admin_comments (author, body, status)
SELECT * FROM (VALUES
  ('user_a', 'Bình luận mẫu 1', 'visible'),
  ('user_b', 'Spam?', 'visible')
) AS v(author, body, status)
WHERE NOT EXISTS (SELECT 1 FROM community_admin_comments LIMIT 1);

INSERT INTO community_admin_reports (target_type, target_id, reason, status)
SELECT * FROM (VALUES
  ('post', 'p1', 'Spam', 'open')
) AS v(target_type, target_id, reason, status)
WHERE NOT EXISTS (SELECT 1 FROM community_admin_reports LIMIT 1);

INSERT INTO community_rss_sync_jobs (code, name, status) VALUES
  ('cat_map', 'Đồng bộ danh mục RSS', 'idle')
ON CONFLICT (code) DO NOTHING;

INSERT INTO community_rss_schema (code, name, mapping_json) VALUES
  ('default_article', 'Schema bài viết mặc định', '{"title":"title","body":"content"}'::jsonb)
ON CONFLICT (code) DO NOTHING;
