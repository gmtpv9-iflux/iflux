'use strict';

const { query } = require('../../../core/database/connection');
const PROD_ORIGIN = 'https://iflux.vn';

class StoriesSitemapProvider {
  async getUrls() {
    const res = await query(
      `SELECT slug, updated_at FROM content_chu_de WHERE status = 'active' ORDER BY slug ASC`
    );
    return res.rows.map(row => {
      const lastmod = row.updated_at ? new Date(row.updated_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      return {
        loc: `${PROD_ORIGIN}/cau-chuyen/${encodeURIComponent(row.slug)}`,
        lastmod
      };
    });
  }
}

module.exports = new StoriesSitemapProvider();
