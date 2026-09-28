/**
 * Page Manifest — Danh sách cổ phiếu (/co-phieu)
 * Composite: Page Feature entity-list (kind=stocks).
 */
var VER = '?v=r20260928r';

export default {
  pageKey: 'stocks',
  /* App Shell: class <main> + CSS riêng của trang (nạp khi vào trang — tải đầy đủ lẫn điều hướng mềm). */
  mainClass: 'ifx-main--market ifx-main--list',
  css: [],
  path: '/co-phieu',
  title: '',
  documentTitle: '',
  composite: true,
  sections: [
    { key: 'main', label: 'Nội dung chính', visible: true, layout: 'stack' }
  ],
  widgets: [{
    id: 'WGT-ELP-PAGE',
    title: 'Danh sách cổ phiếu',
    section: 'main',
    position: 0,
    span: 12,
    enabled: true,
    locked: true,
    config: { kind: 'stocks' },
    lazyModule: '/User_Web/iflux-web-ui/widgets/entity-list-page/index.js' + VER,
    css: [
      '/User_Web/iflux-web-ui/market-components.css',
      '/User_Web/iflux-web-ui/block-templates.css?v=r20260928n',
      '/User_Web/iflux-web-ui/news.css?v=r20260928n',
      '/User_Web/iflux-web-ui/watchlist.css?v=r20260928n',
      '/User_Web/iflux-web-ui/alerts.css',
      '/User_Web/iflux-web-ui/market.css?v=appShell20260928'
    ]
  }]
};
