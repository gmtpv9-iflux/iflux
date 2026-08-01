'use strict';

const { query } = require('../../../core/database/connection');

class EcosystemsSitemapProvider {
  async getUrls(config) {
    const origin = config.PUBLIC_SITE_URL || 'https://iflux.vn';
    const res = await query(
      `SELECT code, created_at FROM ecosystems WHERE is_active = true ORDER BY code ASC`
    );
    return res.rows.map(row => {
      const lastmod = row.created_at ? new Date(row.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      return {
        loc: `${origin}/he-sinh-thai/${encodeURIComponent(row.code.toLowerCase())}`,
        lastmod
      };
    });
  }
}

module.exports = new EcosystemsSitemapProvider();
