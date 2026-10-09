/**
 * Page Manifest — Chi tiết ngành (/nganh/:id)
 */

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
    lazyModule: '/User_Web/iflux-web-ui/widgets/group-page/index.js?v=0ee36a35d4',
    css: [
      '/User_Web/iflux-web-ui/market-components.css?v=c8e2f06ab3',
      '/User_Web/iflux-web-ui/watchlist.css?v=255d879a1e',
      '/User_Web/iflux-web-ui/news.css?v=07112d43ed',
      '/User_Web/iflux-web-ui/block-templates.css?v=d1e0b803fd',
      '/User_Web/iflux-web-ui/stock.css?v=c07620f5e0',
      '/User_Web/iflux-web-ui/community.css?v=5dc2a24e5d'
    ]
  }]
};
