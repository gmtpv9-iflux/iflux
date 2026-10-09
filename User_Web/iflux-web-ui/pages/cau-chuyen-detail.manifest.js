/**
 * Page Manifest — Chi tiết câu chuyện (/cau-chuyen/:slug)
 * Giao diện tái dùng group-page (trước đây /chu-de/:slug).
 */

export default {
  pageKey: 'cauChuyenDetail',
  /* App Shell: class <main> + CSS riêng của trang (nạp khi vào trang — tải đầy đủ lẫn điều hướng mềm). */
  mainClass: 'ifx-main--stock',
  css: [],
  path: '/cau-chuyen',
  title: '',
  documentTitle: '',
  composite: true,
  sections: [
    { key: 'main', label: 'Nội dung chính', visible: true, layout: 'stack' }
  ],
  widgets: [{
    id: 'WGT-GROUP-PAGE',
    title: 'Chi tiết câu chuyện',
    section: 'main',
    position: 0,
    span: 12,
    enabled: true,
    locked: true,
    config: { kind: 'cau-chuyen' },
    lazyModule: '/User_Web/iflux-web-ui/widgets/group-page/index.js?v=7ff84d4d61',
    css: [
      '/User_Web/iflux-web-ui/market-components.css?v=c8e2f06ab3',
      '/User_Web/iflux-web-ui/watchlist.css?v=255d879a1e',
      '/User_Web/iflux-web-ui/news.css?v=7dc01ac30a',
      '/User_Web/iflux-web-ui/block-templates.css?v=d1e0b803fd',
      '/User_Web/iflux-web-ui/stock.css?v=c07620f5e0'
    ]
  }]
};
