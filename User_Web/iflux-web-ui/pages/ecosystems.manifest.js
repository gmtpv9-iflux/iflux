/**
 * Page Manifest — Danh sách hệ sinh thái (/he-sinh-thai)
 */
var VER = '?v=r20261002a';

export default {
  pageKey: 'ecosystems',
  /* App Shell: class <main> + CSS riêng của trang (nạp khi vào trang — tải đầy đủ lẫn điều hướng mềm). */
  mainClass: 'ifx-main--market ifx-main--list',
  css: [],
  path: '/he-sinh-thai',
  title: '',
  documentTitle: '',
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
      '/User_Web/iflux-web-ui/block-templates.css?v=r20260928n',
      '/User_Web/iflux-web-ui/news.css?v=r20261002t',
      '/User_Web/iflux-web-ui/watchlist.css?v=r20260928n',
      '/User_Web/iflux-web-ui/alerts.css',
      '/User_Web/iflux-web-ui/market.css?v=appShell20260928'
    ]
  }]
};
