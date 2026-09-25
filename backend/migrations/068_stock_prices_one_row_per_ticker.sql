-- stock_prices = giá thị trường hiện hành: mỗi mã (theo nguồn) đúng 1 dòng, mỗi chu kỳ chỉ UPDATE tại chỗ.
-- Trước đây khóa (ticker, trading_date, source) → mỗi ngày giao dịch thêm ~1 dòng / mã.
-- Giữ dòng mới nhất của mỗi (ticker, source); bỏ các dòng ngày cũ (không nơi nào đọc lịch sử này).
DELETE FROM stock_prices
WHERE ctid IN (
  SELECT ctid FROM (
    SELECT ctid,
           ROW_NUMBER() OVER (PARTITION BY ticker, source ORDER BY trading_date DESC, updated_at DESC) AS rn
    FROM stock_prices
  ) ranked
  WHERE ranked.rn > 1
);

ALTER TABLE stock_prices DROP CONSTRAINT IF EXISTS uq_stock_prices_ticker_date_source;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_stock_prices_ticker_source') THEN
    ALTER TABLE stock_prices ADD CONSTRAINT uq_stock_prices_ticker_source UNIQUE (ticker, source);
  END IF;
END $$;
