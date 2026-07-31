'use strict';

const { query } = require('../../../core/database/connection');
const PROD_ORIGIN = 'https://iflux.vn';

class SectorsSitemapProvider {
  async getUrls() {
    const res = await query(
      `SELECT code, created_at FROM sectors ORDER BY code ASC`
    );
    return res.rows.map(row => {
      const lastmod = row.created_at ? new Date(row.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      return {
        loc: `${PROD_ORIGIN}/nganh/${encodeURIComponent(row.code.toLowerCase())}`,
        lastmod
      };
    });
  }
}

module.exports = new SectorsSitemapProvider();
