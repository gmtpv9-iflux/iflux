'use strict';

const { query } = require('../../../core/database/connection');
const PROD_ORIGIN = 'https://iflux.vn';

class StocksSitemapProvider {
  async getUrls() {
    const res = await query(
      `SELECT ticker FROM stocks WHERE is_active = true ORDER BY ticker ASC`
    );
    const today = new Date().toISOString().split('T')[0];
    return res.rows.map(row => ({
      loc: `${PROD_ORIGIN}/co-phieu/${encodeURIComponent(row.ticker.toUpperCase())}`,
      lastmod: today
    }));
  }
}

module.exports = new StocksSitemapProvider();
