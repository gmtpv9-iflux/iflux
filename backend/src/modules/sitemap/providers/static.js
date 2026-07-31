'use strict';

const PROD_ORIGIN = 'https://iflux.vn';

class StaticSitemapProvider {
  async getUrls() {
    const today = new Date().toISOString().split('T')[0];
    const pages = [
      '',
      '/cong-dong',
      '/goi-cuoc',
      '/hoi-dap',
      '/thanh-vien',
      '/thi-truong',
      '/dong-tien'
    ];

    return pages.map(path => ({
      loc: `${PROD_ORIGIN}${path}`,
      lastmod: today
    }));
  }
}

module.exports = new StaticSitemapProvider();
