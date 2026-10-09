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
    lazyModule: '/User_Web/iflux-web-ui/widgets/group-page/index.js?v=723c3f57fb',
    css: [
      '/User_Web/iflux-web-ui/market-components.css?v=c8e2f06ab3',
      '/User_Web/iflux-web-ui/watchlist.css?v=255d879a1e',
      '/User_Web/iflux-web-ui/news.css?v=76795c8d4e',
      '/User_Web/iflux-web-ui/block-templates.css?v=483f2092fe',
      '/User_Web/iflux-web-ui/stock.css?v=eab675e4cc'
    ]
  }]
};
