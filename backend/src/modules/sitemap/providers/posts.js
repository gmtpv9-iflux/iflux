'use strict';

const { query } = require('../../../core/database/connection');

class PostsSitemapProvider {
  async getUrls(config) {
    /* Owner 2026-10: CHỈ đăng ký Google index bài 'published' (Admin xuất bản tay) — bài
       'published_rss' (tự động RSS) không đưa vào sitemap nữa, vì nội dung có thể bị sửa lại sau
       khi đã index gây lỗi/bị Google phạt (xem seo-platform.service.js resolveArticleContract
       cho phần noindex meta tương ứng). */
    const origin = config.PUBLIC_SITE_URL || 'https://iflux.vn';
    const res = await query(
      `SELECT id, payload->>'slug' AS slug, updated_at
       FROM news_posts
       WHERE status = 'published'
       ORDER BY updated_at DESC`
    );

    return res.rows.map(row => {
      const ref = row.slug || row.id;
      const lastmod = row.updated_at ? new Date(row.updated_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      return {
        loc: `${origin}/tin-tuc/bai-viet/${encodeURIComponent(ref)}`,
        lastmod
      };
    });
  }
}

module.exports = new PostsSitemapProvider();
