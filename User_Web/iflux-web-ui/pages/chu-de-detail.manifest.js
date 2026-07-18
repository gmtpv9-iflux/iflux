/**
 * Page Manifest — Chi tiết chủ đề (/chu-de/:slug)
 */
var VER = '?v=tmpDivBars20260718';

export default {
  pageKey: 'chuDeDetail',
  path: '/chu-de',
  title: '',
  documentTitle: 'Chủ đề · iFlux',
  composite: true,
  sections: [
    { key: 'main', label: 'Nội dung chính', visible: true, layout: 'stack' }
  ],
  widgets: [{
    id: 'WGT-GROUP-PAGE',
    title: 'Chi tiết chủ đề',
    section: 'main',
    position: 0,
    span: 12,
    enabled: true,
    locked: true,
    config: { kind: 'chu-de' },
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
