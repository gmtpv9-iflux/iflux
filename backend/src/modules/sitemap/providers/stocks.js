'use strict';

const { query } = require('../../../core/database/connection');

class StocksSitemapProvider {
  async getUrls(config) {
    const origin = config.PUBLIC_SITE_URL || 'https://iflux.vn';
    const res = await query(
      `SELECT ticker FROM stocks WHERE is_active = true ORDER BY ticker ASC`
    );
    const today = new Date().toISOString().split('T')[0];
    return res.rows.map(row => ({
      loc: `${origin}/co-phieu/${encodeURIComponent(row.ticker.toUpperCase())}`,
      lastmod: today
    }));
  }
}

module.exports = new StocksSitemapProvider();
