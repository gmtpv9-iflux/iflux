'use strict';

const { query } = require('../../../core/database/connection');
const PROD_ORIGIN = 'https://iflux.vn';

class EcosystemsSitemapProvider {
  async getUrls() {
    const res = await query(
      `SELECT code, created_at FROM ecosystems WHERE is_active = true ORDER BY code ASC`
    );
    return res.rows.map(row => {
      const lastmod = row.created_at ? new Date(row.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      return {
        loc: `${PROD_ORIGIN}/he-sinh-thai/${encodeURIComponent(row.code.toLowerCase())}`,
        lastmod
      };
    });
  }
}

module.exports = new EcosystemsSitemapProvider();
