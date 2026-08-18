-- Rename Story/Topic → Chủ đề (chu-de) — tables & columns
-- Safe to re-run: IF EXISTS checks

BEGIN;

-- 1) content_stories → content_chu_de
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'content_stories')
     AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'content_chu_de') THEN
    ALTER TABLE content_stories RENAME TO content_chu_de;
  END IF;
END $$;

-- 2) content_story_mappings → content_chu_de_mappings + story_id → chu_de_id
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'content_story_mappings')
     AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'content_chu_de_mappings') THEN
    ALTER TABLE content_story_mappings RENAME TO content_chu_de_mappings;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'content_chu_de_mappings' AND column_name = 'story_id'
  ) THEN
    ALTER TABLE content_chu_de_mappings RENAME COLUMN story_id TO chu_de_id;
  END IF;
END $$;

-- 3) content_topics → content_chu_de_candidates + story_id → chu_de_id
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'content_topics')
     AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'content_chu_de_candidates') THEN
    ALTER TABLE content_topics RENAME TO content_chu_de_candidates;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'content_chu_de_candidates' AND column_name = 'story_id'
  ) THEN
    ALTER TABLE content_chu_de_candidates RENAME COLUMN story_id TO chu_de_id;
  END IF;
END $$;

-- 4) content_article_topics → content_article_chu_de_candidates + topic_id → candidate_id
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'content_article_topics')
     AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'content_article_chu_de_candidates') THEN
    ALTER TABLE content_article_topics RENAME TO content_article_chu_de_candidates;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'content_article_chu_de_candidates' AND column_name = 'topic_id'
  ) THEN
    ALTER TABLE content_article_chu_de_candidates RENAME COLUMN topic_id TO candidate_id;
  END IF;
END $$;

-- 5) content_relevance_events columns
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'content_relevance_events' AND column_name = 'story_id'
  ) THEN
    ALTER TABLE content_relevance_events RENAME COLUMN story_id TO chu_de_id;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'content_relevance_events' AND column_name = 'topic_id'
  ) THEN
    ALTER TABLE content_relevance_events RENAME COLUMN topic_id TO candidate_id;
  END IF;
END $$;

-- 6) content_interest_events topic_id → candidate_id
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'content_interest_events' AND column_name = 'topic_id'
  ) THEN
    ALTER TABLE content_interest_events RENAME COLUMN topic_id TO candidate_id;
  END IF;
END $$;

-- 7) content_chu_de.origin_topic_id → origin_candidate_id
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'content_chu_de' AND column_name = 'origin_topic_id'
  ) THEN
    ALTER TABLE content_chu_de RENAME COLUMN origin_topic_id TO origin_candidate_id;
  END IF;
END $$;

COMMIT;
