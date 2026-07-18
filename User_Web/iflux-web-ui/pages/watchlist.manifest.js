/**
 * Page Manifest — Danh sách theo dõi (/theo-doi)
 */
export default {
  pageKey: 'watchlist',
  path: '/theo-doi',
  title: 'Danh sách theo dõi',
  documentTitle: 'Theo dõi · iFlux',
  composite: true,
  sections: [{ key: 'main', label: 'Nội dung chính', visible: true, layout: 'stack' }],
  widgets: [{
    id: 'WGT-WL-PAGE',
    title: 'Danh sách theo dõi',
    section: 'main',
    position: 0,
    span: 12,
    enabled: true,
    locked: true,
    lazyModule: '/User_Web/iflux-web-ui/widgets/watchlist-page/index.js?v=bpPhaseD20260716',
    css: [
      '/User_Web/iflux-web-ui/watchlist.css',
      '/User_Web/iflux-web-ui/block-templates.css',
      '/User_Web/iflux-web-ui/widget-shell.css'
    ]
  }]
};
