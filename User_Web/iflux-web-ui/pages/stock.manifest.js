/**
 * Page Manifest — Chi tiết cổ phiếu (/co-phieu/:ticker)
 */
var VER = '?v=r20261002am';

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
    lazyModule: '/User_Web/iflux-web-ui/widgets/stock-page/index.js' + VER,
    css: [
      '/User_Web/iflux-web-ui/market-components.css',
      '/User_Web/iflux-web-ui/watchlist.css?v=r20260928n',
      '/User_Web/iflux-web-ui/news.css?v=r20261003c',
      '/User_Web/iflux-web-ui/block-templates.css?v=r20260928n',
      '/User_Web/iflux-web-ui/stock.css?v=appHeader20260928'
    ]
  }]
};
