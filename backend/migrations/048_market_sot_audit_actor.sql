-- BR-23 — Who (actor) khi X-Admin-Key / JWT không có admin_id UUID
ALTER TABLE market_sot_audit
  ADD COLUMN IF NOT EXISTS actor VARCHAR(160);

COMMENT ON COLUMN market_sot_audit.actor IS 'Who label: admin email hoặc system@admin-key';
