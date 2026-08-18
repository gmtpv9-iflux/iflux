ALTER TABLE subscription_orders
  ADD COLUMN IF NOT EXISTS affiliate_credit NUMERIC(14, 0) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS gross_amount NUMERIC(14, 0) NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS affiliate_order_credits (
  id VARCHAR(40) PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_id VARCHAR(40) NOT NULL REFERENCES subscription_orders(id) ON DELETE CASCADE,
  amount NUMERIC(14, 0) NOT NULL,
  refunded BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_aff_order_credits_user ON affiliate_order_credits(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_aff_order_credits_order_active
  ON affiliate_order_credits(order_id) WHERE NOT refunded;
