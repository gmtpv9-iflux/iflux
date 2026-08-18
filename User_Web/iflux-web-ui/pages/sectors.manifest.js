/**
 * Page Manifest — Danh sách ngành (/nganh)
 */
var VER = '?v=sidebarVR03_20260811';

export default {
  pageKey: 'sectors',
  path: '/nganh',
  title: '',
  documentTitle: '',
  composite: true,
  sections: [
    { key: 'main', label: 'Nội dung chính', visible: true, layout: 'stack' }
  ],
  widgets: [{
    id: 'WGT-ELP-PAGE',
    title: 'Danh sách ngành',
    section: 'main',
    position: 0,
    span: 12,
    enabled: true,
    locked: true,
    config: { kind: 'sectors' },
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
