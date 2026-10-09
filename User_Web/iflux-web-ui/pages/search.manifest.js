/**
 * Page Manifest — Tìm kiếm (/tim-kiem)
 */
export default {
  pageKey: 'search',
  /* App Shell: class <main> + CSS riêng của trang (nạp khi vào trang — tải đầy đủ lẫn điều hướng mềm). */
  mainClass: 'ifx-main--search',
  css: ['/User_Web/iflux-web-ui/hub.css?v=08dbf09ff6', '/User_Web/iflux-web-ui/watchlist.css?v=255d879a1e'],
  path: '/tim-kiem',
  title: 'Tìm kiếm',
  documentTitle: '',
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
    lazyModule: '/User_Web/iflux-web-ui/widgets/search-page/index.js?v=42c84240af',
    css: [
      '/User_Web/iflux-web-ui/hub.css?v=08dbf09ff6',
      '/User_Web/iflux-web-ui/watchlist.css?v=255d879a1e'
    ]
  }]
};
