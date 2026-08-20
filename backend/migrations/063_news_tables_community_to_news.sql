-- Task 05 P8: bảng bài Tin tức community_* → news_*.
-- Leftover: VIEW cùng tên cũ (updatable) trong migration window.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'community_posts')
     AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'news_posts') THEN
    ALTER TABLE community_posts RENAME TO news_posts;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'community_comments')
     AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'news_comments') THEN
    ALTER TABLE community_comments RENAME TO news_comments;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'community_categories')
     AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'news_categories') THEN
    ALTER TABLE community_categories RENAME TO news_categories;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'community_rss_providers')
     AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'news_rss_providers') THEN
    ALTER TABLE community_rss_providers RENAME TO news_rss_providers;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'community_rss_schema')
     AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'news_rss_schema') THEN
    ALTER TABLE community_rss_schema RENAME TO news_rss_schema;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'community_rss_sync_jobs')
     AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'news_rss_sync_jobs') THEN
    ALTER TABLE community_rss_sync_jobs RENAME TO news_rss_sync_jobs;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'community_admin_comments')
     AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'news_admin_comments') THEN
    ALTER TABLE community_admin_comments RENAME TO news_admin_comments;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'community_admin_reports')
     AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'news_admin_reports') THEN
    ALTER TABLE community_admin_reports RENAME TO news_admin_reports;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'news_posts') THEN
    EXECUTE 'CREATE OR REPLACE VIEW community_posts AS SELECT * FROM news_posts';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'news_comments') THEN
    EXECUTE 'CREATE OR REPLACE VIEW community_comments AS SELECT * FROM news_comments';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'news_categories') THEN
    EXECUTE 'CREATE OR REPLACE VIEW community_categories AS SELECT * FROM news_categories';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'news_rss_providers') THEN
    EXECUTE 'CREATE OR REPLACE VIEW community_rss_providers AS SELECT * FROM news_rss_providers';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'news_rss_schema') THEN
    EXECUTE 'CREATE OR REPLACE VIEW community_rss_schema AS SELECT * FROM news_rss_schema';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'news_rss_sync_jobs') THEN
    EXECUTE 'CREATE OR REPLACE VIEW community_rss_sync_jobs AS SELECT * FROM news_rss_sync_jobs';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'news_admin_comments') THEN
    EXECUTE 'CREATE OR REPLACE VIEW community_admin_comments AS SELECT * FROM news_admin_comments';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'news_admin_reports') THEN
    EXECUTE 'CREATE OR REPLACE VIEW community_admin_reports AS SELECT * FROM news_admin_reports';
  END IF;
END $$;
