/**
 * Page Manifest — Chi tiết câu chuyện (/cau-chuyen/:slug)
 * Giao diện tái dùng group-page (trước đây /chu-de/:slug).
 */
var VER = '?v=phaseCW120260721';

export default {
  pageKey: 'cauChuyenDetail',
  path: '/cau-chuyen',
  title: '',
  documentTitle: 'Câu chuyện · iFlux',
  composite: true,
  sections: [
    { key: 'main', label: 'Nội dung chính', visible: true, layout: 'stack' }
  ],
  widgets: [{
    id: 'WGT-GROUP-PAGE',
    title: 'Chi tiết câu chuyện',
    section: 'main',
    position: 0,
    span: 12,
    enabled: true,
    locked: true,
    config: { kind: 'cau-chuyen' },
    lazyModule: '/User_Web/iflux-web-ui/widgets/group-page/index.js' + VER,
    css: [
      '/User_Web/iflux-web-ui/market-components.css',
      '/User_Web/iflux-web-ui/watchlist.css',
      '/User_Web/iflux-web-ui/community.css',
      '/User_Web/iflux-web-ui/block-templates.css',
      '/User_Web/iflux-web-ui/stock.css'
    ]
  }]
};
