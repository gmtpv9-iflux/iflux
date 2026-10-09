/**
 * Page Manifest — Chi tiết cổ phiếu (/co-phieu/:ticker)
 */

export default {
  pageKey: 'stock',
  /* App Shell: class <main> + CSS riêng của trang (nạp khi vào trang — tải đầy đủ lẫn điều hướng mềm). */
  mainClass: 'ifx-main--stock',
  css: [],
  path: '/co-phieu',
  title: '',
  documentTitle: '',
  composite: true,
  sections: [
    { key: 'main', label: 'Nội dung chính', visible: true, layout: 'stack' }
  ],
  widgets: [{
    id: 'WGT-STOCK-PAGE',
    title: 'Chi tiết cổ phiếu',
    section: 'main',
    position: 0,
    span: 12,
    enabled: true,
    locked: true,
    lazyModule: '/User_Web/iflux-web-ui/widgets/stock-page/index.js?v=f76557c2e6',
    css: [
      '/User_Web/iflux-web-ui/market-components.css?v=c8e2f06ab3',
      '/User_Web/iflux-web-ui/watchlist.css?v=255d879a1e',
      '/User_Web/iflux-web-ui/news.css?v=76795c8d4e',
      '/User_Web/iflux-web-ui/block-templates.css?v=483f2092fe',
      '/User_Web/iflux-web-ui/stock.css?v=c07620f5e0',
      '/User_Web/iflux-web-ui/community.css?v=5dc2a24e5d'
    ]
  }]
};
