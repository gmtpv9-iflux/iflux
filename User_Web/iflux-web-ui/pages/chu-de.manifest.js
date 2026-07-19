/**
 * Page Manifest — Danh sách chủ đề (/chu-de)
 */
var VER = '?v=w2Host20260720';

export default {
  pageKey: 'chuDe',
  path: '/chu-de',
  title: '',
  documentTitle: 'Danh sách chủ đề · iFlux',
  composite: true,
  sections: [
    { key: 'main', label: 'Nội dung chính', visible: true, layout: 'stack' }
  ],
  widgets: [{
    id: 'WGT-ELP-PAGE',
    title: 'Danh sách chủ đề',
    section: 'main',
    position: 0,
    span: 12,
    enabled: true,
    locked: true,
    config: { kind: 'chu-de' },
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
