'use strict';

const { query } = require('../../../core/database/connection');

class StoriesSitemapProvider {
  async getUrls(config) {
    const origin = config.PUBLIC_SITE_URL || 'https://iflux.vn';
    const res = await query(
      `SELECT slug, updated_at FROM content_chu_de WHERE status = 'active' ORDER BY slug ASC`
    );
    return res.rows.map(row => {
      const lastmod = row.updated_at ? new Date(row.updated_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      return {
        loc: `${origin}/cau-chuyen/${encodeURIComponent(row.slug)}`,
        lastmod
      };
    });
  }
}

module.exports = new StoriesSitemapProvider();
