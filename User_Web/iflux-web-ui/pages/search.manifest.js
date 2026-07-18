/**
 * Page Manifest — Tìm kiếm (/tim-kiem)
 */
export default {
  pageKey: 'search',
  path: '/tim-kiem',
  title: 'Tìm kiếm',
  documentTitle: 'Tìm kiếm · iFlux',
  composite: true,
  sections: [{ key: 'main', label: 'Nội dung chính', visible: true, layout: 'stack' }],
  widgets: [{
    id: 'WGT-SEARCH-PAGE',
    title: 'Tìm kiếm',
    section: 'main',
    position: 0,
    span: 12,
    enabled: true,
    locked: true,
    lazyModule: '/User_Web/iflux-web-ui/widgets/search-page/index.js?v=bpPhaseD20260716',
    css: [
      '/User_Web/iflux-web-ui/hub.css',
      '/User_Web/iflux-web-ui/watchlist.css'
    ]
  }]
};
