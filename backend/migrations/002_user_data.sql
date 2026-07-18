-- Per-user persisted JSON (bridge sandbox localStorage → PostgreSQL)
CREATE TABLE IF NOT EXISTS user_data (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    watchlist_json JSONB NOT NULL DEFAULT '{}',
    alerts_json JSONB NOT NULL DEFAULT '{}',
    dashboard_layout_json JSONB NOT NULL DEFAULT '{}',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Watchlist tickers may not exist in stocks master during MVP
ALTER TABLE watchlist_items DROP CONSTRAINT IF EXISTS watchlist_items_ticker_fkey;

CREATE INDEX IF NOT EXISTS idx_user_data_updated ON user_data(updated_at);
