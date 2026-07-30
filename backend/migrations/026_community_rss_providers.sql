-- Phase C4 — community.rss_providers (Nguồn RSS)
CREATE TABLE IF NOT EXISTS community_rss_providers (
    id VARCHAR(60) PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    website TEXT NOT NULL DEFAULT '',
    rss_index TEXT NOT NULL DEFAULT '',
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT community_rss_providers_status_chk
      CHECK (status IN ('active', 'warning', 'empty', 'inactive'))
);

CREATE INDEX IF NOT EXISTS idx_com_rss_providers_status ON community_rss_providers(status);
CREATE INDEX IF NOT EXISTS idx_com_rss_providers_name ON community_rss_providers(name);

INSERT INTO community_rss_providers (id, name, description, website, rss_index, status)
VALUES
  (
    'cafef',
    'CafeF',
    'Nguồn tin tài chính · chứng khoán · doanh nghiệp (cafef.vn). RSS chuyên mục ổn định.',
    'https://cafef.vn',
    'https://cafef.vn/rss.chn',
    'active'
  ),
  (
    'vietstock',
    'VietStock',
    'Nguồn nhận định · phái sinh · ETF · trái phiếu · hàng hóa (vietstock.vn).',
    'https://vietstock.vn',
    'https://vietstock.vn/rss',
    'active'
  ),
  (
    'baodautu',
    'Báo Đầu Tư',
    'Nguồn vĩ mô · chính sách · quốc tế · địa ốc (baodautu.vn). Channel RSS có URL nhưng hiện đang trống tin — tạm không map danh mục iFlux.',
    'https://baodautu.vn',
    'https://baodautu.vn/rssMain.html',
    'warning'
  )
ON CONFLICT (id) DO NOTHING;
