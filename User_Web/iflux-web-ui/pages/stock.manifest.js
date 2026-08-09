/**
 * Page Manifest — Chi tiết cổ phiếu (/co-phieu/:ticker)
 */
var VER = '?v=mdmShell20260808';

export default {
  pageKey: 'stock',
  path: '/co-phieu',
  title: '',
  documentTitle: 'Chi tiết mã · iFlux',
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
      '/User_Web/iflux-web-ui/watchlist.css',
      '/User_Web/iflux-web-ui/community.css',
      '/User_Web/iflux-web-ui/block-templates.css',
      '/User_Web/iflux-web-ui/stock.css'
    ]
  }]
};
