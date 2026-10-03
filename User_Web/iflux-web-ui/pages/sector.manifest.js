/**
 * Page Manifest — Chi tiết ngành (/nganh/:id)
 */
var VER = '?v=r20261002af';

export default {
  pageKey: 'sector',
  /* App Shell: class <main> + CSS riêng của trang (nạp khi vào trang — tải đầy đủ lẫn điều hướng mềm). */
  mainClass: 'ifx-main--stock',
  css: [],
  path: '/nganh',
  title: '',
  documentTitle: '',
  composite: true,
  sections: [
    { key: 'main', label: 'Nội dung chính', visible: true, layout: 'stack' }
  ],
  widgets: [{
    id: 'WGT-GROUP-PAGE',
    title: 'Chi tiết ngành',
    section: 'main',
    position: 0,
    span: 12,
    enabled: true,
    locked: true,
    config: { kind: 'sector' },
    lazyModule: '/User_Web/iflux-web-ui/widgets/group-page/index.js' + VER,
    css: [
      '/User_Web/iflux-web-ui/market-components.css',
      '/User_Web/iflux-web-ui/watchlist.css?v=r20260928n',
      '/User_Web/iflux-web-ui/news.css?v=r20261003c',
      '/User_Web/iflux-web-ui/block-templates.css?v=r20260928n',
      '/User_Web/iflux-web-ui/stock.css?v=appHeader20260928'
    ]
  }]
};
