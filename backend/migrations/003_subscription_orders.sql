CREATE TABLE IF NOT EXISTS subscription_orders (
    id VARCHAR(40) PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_name VARCHAR(255),
    email VARCHAR(255),
    plan_tier VARCHAR(20) NOT NULL,
    plan_name VARCHAR(100) NOT NULL,
    cycle VARCHAR(20) NOT NULL,
    amount NUMERIC(14, 0) NOT NULL DEFAULT 0,
    coupon_discount NUMERIC(14, 0) NOT NULL DEFAULT 0,
    pay_method VARCHAR(20) NOT NULL,
    transfer_ref VARCHAR(100) DEFAULT '',
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    reject_reason TEXT DEFAULT '',
    approved_by VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    approved_at TIMESTAMPTZ,
    rejected_at TIMESTAMPTZ,
    refunded_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_subscription_orders_user ON subscription_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_orders_status ON subscription_orders(status);
CREATE INDEX IF NOT EXISTS idx_subscription_orders_created ON subscription_orders(created_at DESC);
