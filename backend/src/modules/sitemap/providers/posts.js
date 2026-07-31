'use strict';

const { query } = require('../../../core/database/connection');
const PROD_ORIGIN = 'https://iflux.vn';

class PostsSitemapProvider {
  async getUrls() {
    const res = await query(
      `SELECT id, payload->>'slug' AS slug, updated_at 
       FROM community_posts 
       WHERE status IN ('published', 'published_rss') 
       ORDER BY updated_at DESC`
    );

    return res.rows.map(row => {
      const ref = row.slug || row.id;
      const lastmod = row.updated_at ? new Date(row.updated_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      return {
        loc: `${PROD_ORIGIN}/cong-dong/bai-viet/${encodeURIComponent(ref)}`,
        lastmod
      };
    });
  }
}

module.exports = new PostsSitemapProvider();
