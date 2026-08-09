-- Time SoT tick_interval (1–3600s) may mirror into market_price_sync_config.interval_seconds
-- for status display only — authority is system_admin_kv.core_setup.

ALTER TABLE market_price_sync_config
  DROP CONSTRAINT IF EXISTS market_price_sync_config_interval_seconds_check;

ALTER TABLE market_price_sync_config
  ADD CONSTRAINT market_price_sync_config_interval_seconds_check
  CHECK (interval_seconds >= 1 AND interval_seconds <= 3600);
