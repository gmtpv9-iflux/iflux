CREATE TABLE IF NOT EXISTS feature_suggestions (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    user_name TEXT,
    title TEXT NOT NULL,
    idea_description TEXT NOT NULL,
    expectation_description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'new',
    like_count INT NOT NULL DEFAULT 0,
    ip TEXT,
    user_agent TEXT,
    admin_note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    processed_by TEXT
);

CREATE TABLE IF NOT EXISTS feature_suggestion_likes (
    suggestion_id TEXT NOT NULL REFERENCES feature_suggestions(id) ON DELETE CASCADE,
    voter_id TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (suggestion_id, voter_id)
);

CREATE TABLE IF NOT EXISTS bug_reports (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    user_name TEXT,
    title TEXT NOT NULL,
    context TEXT NOT NULL,
    problem_description TEXT NOT NULL,
    root_cause TEXT,
    status TEXT NOT NULL DEFAULT 'new',
    agree_count INT NOT NULL DEFAULT 0,
    ip TEXT,
    user_agent TEXT,
    admin_note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    processed_by TEXT
);

CREATE TABLE IF NOT EXISTS bug_report_agrees (
    report_id TEXT NOT NULL REFERENCES bug_reports(id) ON DELETE CASCADE,
    voter_id TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (report_id, voter_id)
);

CREATE INDEX IF NOT EXISTS idx_feat_suggest_status ON feature_suggestions(status);
CREATE INDEX IF NOT EXISTS idx_feat_suggest_likes ON feature_suggestions(like_count DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feat_suggest_created ON feature_suggestions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_bug_report_status ON bug_reports(status);
CREATE INDEX IF NOT EXISTS idx_bug_report_agrees ON bug_reports(agree_count DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bug_report_created ON bug_reports(created_at DESC);
