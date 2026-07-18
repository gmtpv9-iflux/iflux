CREATE TABLE IF NOT EXISTS partnership_requests (
    id TEXT PRIMARY KEY,
    first_name TEXT,
    last_name TEXT,
    full_name TEXT,
    email TEXT NOT NULL,
    phone TEXT,
    partnership_type TEXT NOT NULL,
    partnership_type_label TEXT,
    message TEXT,
    status TEXT NOT NULL DEFAULT 'new',
    ip TEXT,
    user_agent TEXT,
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    processed_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_partnership_status ON partnership_requests(status);
CREATE INDEX IF NOT EXISTS idx_partnership_created ON partnership_requests(created_at DESC);
