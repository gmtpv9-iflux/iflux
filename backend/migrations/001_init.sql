-- iFlux MVP local schema (Contract Spec §1.1 + auth fields)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS sectors (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    name_vi VARCHAR(100) NOT NULL,
    divisor NUMERIC(20,6) NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ecosystems (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    name_vi VARCHAR(100) NOT NULL,
    divisor NUMERIC(20,6) NOT NULL DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stocks (
    ticker VARCHAR(10) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    exchange VARCHAR(10) NOT NULL DEFAULT 'HOSE',
    sector_id INT REFERENCES sectors(id),
    ecosystem_id INT REFERENCES ecosystems(id),
    shares_outstanding BIGINT NOT NULL DEFAULT 0,
    lot_threshold BIGINT DEFAULT 1000000000,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(15) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(255),
    nickname VARCHAR(255),
    referral_code VARCHAR(20) UNIQUE,
    referred_by UUID REFERENCES users(id),
    subscription_tier VARCHAR(10) DEFAULT 'free',
    subscription_expires_at TIMESTAMPTZ,
    account_status VARCHAR(20) DEFAULT 'active',
    email_verified_at TIMESTAMPTZ DEFAULT NOW(),
    version INT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS watchlist_items (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    tab_name VARCHAR(50) DEFAULT 'Theo dõi',
    ticker VARCHAR(10) REFERENCES stocks(ticker),
    position SMALLINT DEFAULT 0,
    version INT DEFAULT 1,
    UNIQUE(user_id, tab_name, ticker)
);

CREATE TABLE IF NOT EXISTS alerts (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    entity_type VARCHAR(20) NOT NULL,
    entity_id TEXT NOT NULL,
    conditions JSONB NOT NULL DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'active',
    version INT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_watchlist_user ON watchlist_items(user_id);
