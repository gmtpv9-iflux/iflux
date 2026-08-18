CREATE TABLE IF NOT EXISTS affiliate_payout_requests (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_name TEXT,
    email TEXT,
    amount NUMERIC(14, 0) NOT NULL,
    bank_name TEXT,
    bank_branch TEXT,
    bank_account TEXT,
    bank_holder TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    reject_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    processed_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_affiliate_payout_user ON affiliate_payout_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_payout_status ON affiliate_payout_requests(status);
CREATE INDEX IF NOT EXISTS idx_affiliate_payout_created ON affiliate_payout_requests(created_at DESC);
