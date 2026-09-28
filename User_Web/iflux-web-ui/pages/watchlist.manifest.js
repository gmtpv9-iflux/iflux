/**
 * Page Manifest — Danh sách theo dõi (/theo-doi)
 */
export default {
  pageKey: 'watchlist',
  /* App Shell: class <main> + CSS riêng của trang (nạp khi vào trang — tải đầy đủ lẫn điều hướng mềm). */
  mainClass: 'ifx-main--watchlist',
  css: ['/User_Web/iflux-web-ui/watchlist.css?v=r20260928n', '/User_Web/iflux-web-ui/block-templates.css?v=r20260928n', '/User_Web/iflux-web-ui/widget-shell.css?v=r20260928n'],
  path: '/theo-doi',
  title: 'Danh sách theo dõi',
  documentTitle: '',
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
    lazyModule: '/User_Web/iflux-web-ui/widgets/watchlist-page/index.js?v=r20260928n',
    css: [
      '/User_Web/iflux-web-ui/watchlist.css?v=r20260928n',
      '/User_Web/iflux-web-ui/block-templates.css?v=r20260928n',
      '/User_Web/iflux-web-ui/widget-shell.css?v=r20260928n'
    ]
  }]
};
