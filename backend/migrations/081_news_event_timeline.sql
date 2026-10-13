-- Hồ sơ/mốc có bằng chứng, độc lập vòng đời Topic/Story. Không tạo dữ liệu demo.
CREATE TABLE IF NOT EXISTS news_event_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL UNIQUE,
  title VARCHAR(240) NOT NULL,
  event_group SMALLINT NOT NULL CHECK (event_group BETWEEN 1 AND 8),
  subject_name VARCHAR(240) NOT NULL,
  tickers TEXT[] NOT NULL DEFAULT '{}',
  story_id UUID REFERENCES stories(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS news_event_cases_story ON news_event_cases(story_id);
CREATE INDEX IF NOT EXISTS news_event_cases_tickers ON news_event_cases USING GIN(tickers);

CREATE TABLE IF NOT EXISTS news_event_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES news_event_cases(id) ON DELETE RESTRICT,
  idempotency_key VARCHAR(64) NOT NULL,
  title VARCHAR(240) NOT NULL,
  summary TEXT NOT NULL,
  status VARCHAR(40) NOT NULL,
  announced_on DATE,
  effective_on DATE,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  evidence JSONB NOT NULL CHECK (jsonb_typeof(evidence) = 'array' AND jsonb_array_length(evidence) > 0),
  metrics JSONB NOT NULL DEFAULT '[]' CHECK (jsonb_typeof(metrics) = 'array'),
  reviewed_by TEXT NOT NULL,
  UNIQUE(case_id, idempotency_key)
);
CREATE INDEX IF NOT EXISTS news_event_milestones_case ON news_event_milestones(case_id, announced_on DESC, recorded_at DESC);
