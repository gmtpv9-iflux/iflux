/**
 * Page Manifest — Danh sách câu chuyện (/cau-chuyen)
 * Entity core: cùng layout với /co-phieu, /nganh, /he-sinh-thai.
 */
var VER = '?v=phaseCW120260721';

export default {
  pageKey: 'cauChuyen',
  path: '/cau-chuyen',
  title: '',
  documentTitle: 'Danh sách câu chuyện · iFlux',
  composite: true,
  sections: [
    { key: 'main', label: 'Nội dung chính', visible: true, layout: 'stack' }
  ],
  widgets: [{
    id: 'WGT-ELP-PAGE',
    title: 'Danh sách câu chuyện',
    section: 'main',
    position: 0,
    span: 12,
    enabled: true,
    locked: true,
    config: { kind: 'cau-chuyen' },
    lazyModule: '/User_Web/iflux-web-ui/widgets/entity-list-page/index.js' + VER,
    css: [
      '/User_Web/iflux-web-ui/market-components.css',
      '/User_Web/iflux-web-ui/block-templates.css',
      '/User_Web/iflux-web-ui/community.css',
      '/User_Web/iflux-web-ui/watchlist.css',
      '/User_Web/iflux-web-ui/alerts.css',
      '/User_Web/iflux-web-ui/market.css'
    ]
  }]
};
