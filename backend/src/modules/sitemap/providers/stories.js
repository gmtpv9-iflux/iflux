'use strict';

const { query } = require('../../../core/database/connection');

class StoriesSitemapProvider {
  async getUrls(config) {
    /* content_chu_de (Content Engine cũ) đã dọn (migration 075, Owner 2026-10) — /cau-chuyen giờ
       phục vụ bởi bảng `stories` (Community V1). TODO Phase 1/4: stories chưa có cột slug SEO
       riêng, tạm dùng id — xem kế hoạch "Community → Topic → Story: dọn sạch hệ cũ". */
    const origin = config.PUBLIC_SITE_URL || 'https://iflux.vn';
    const res = await query(
      `SELECT id, updated_at FROM stories WHERE status = 'active' ORDER BY created_at DESC`
    );
    return res.rows.map(row => {
      const lastmod = row.updated_at ? new Date(row.updated_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      return {
        loc: `${origin}/cau-chuyen/${encodeURIComponent(row.id)}`,
        lastmod
      };
    });
  }
}

module.exports = new StoriesSitemapProvider();
