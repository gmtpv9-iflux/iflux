'use strict';

const fs = require('fs');
const path = require('path');

class StaticSitemapProvider {
  async getUrls(config) {
    const origin = config.PUBLIC_SITE_URL || 'https://iflux.vn';
    let lastmod = config.SEO_STATIC_LASTMOD;

    if (!lastmod) {
      try {
        // Resolve path to backend root directory
        const backendRoot = path.dirname(path.dirname(path.dirname(path.dirname(__dirname))));
        const targetFile = path.join(backendRoot, 'User_Web', 'community', 'index.html');
        const stats = fs.statSync(targetFile);
        lastmod = stats.mtime.toISOString().split('T')[0];
      } catch (err) {
        lastmod = new Date().toISOString().split('T')[0];
      }
    }

    const pages = [
      '',
      '/tin-tuc',
      '/goi-cuoc',
      '/hoi-dap',
      '/thanh-vien',
      '/thi-truong',
      '/dong-tien'
    ];

    return pages.map(pagePath => ({
      loc: `${origin}${pagePath}`,
      lastmod
    }));
  }
}

module.exports = new StaticSitemapProvider();
