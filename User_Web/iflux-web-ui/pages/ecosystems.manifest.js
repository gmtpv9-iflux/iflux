/**
 * Page Manifest — Danh sách hệ sinh thái (/he-sinh-thai)
 */
var VER = '?v=codeChoXoa20260720';

export default {
  pageKey: 'ecosystems',
  path: '/he-sinh-thai',
  title: '',
  documentTitle: 'Danh sách hệ sinh thái · iFlux',
  composite: true,
  sections: [
    { key: 'main', label: 'Nội dung chính', visible: true, layout: 'stack' }
  ],
  widgets: [{
    id: 'WGT-ELP-PAGE',
    title: 'Danh sách hệ sinh thái',
    section: 'main',
    position: 0,
    span: 12,
    enabled: true,
    locked: true,
    config: { kind: 'ecosystems' },
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
