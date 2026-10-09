/**
 * Page Manifest — Danh sách câu chuyện (/cau-chuyen)
 * Entity core: cùng layout với /co-phieu, /nganh, /he-sinh-thai.
 */

export default {
  pageKey: 'cauChuyen',
  /* App Shell: class <main> + CSS riêng của trang (nạp khi vào trang — tải đầy đủ lẫn điều hướng mềm). */
  mainClass: 'ifx-main--community',
  css: [],
  path: '/cau-chuyen',
  title: '',
  documentTitle: '',
  composite: true,
  sections: [
    { key: 'main', label: 'Nội dung chính', visible: true, layout: 'stack' }
  ],
  widgets: [{
    id: 'WGT-ELP-PAGE',
    title: 'Danh sách câu chuyện',
    section: 'main',
    position: 0,
    span: 12,
    enabled: true,
    locked: true,
    config: { kind: 'cau-chuyen' },
    lazyModule: '/User_Web/iflux-web-ui/widgets/entity-list-page/index.js?v=d90b9b2842',
    css: [
      '/User_Web/iflux-web-ui/market-components.css?v=c8e2f06ab3',
      '/User_Web/iflux-web-ui/block-templates.css?v=d1e0b803fd',
      '/User_Web/iflux-web-ui/news.css?v=07112d43ed',
      '/User_Web/iflux-web-ui/watchlist.css?v=255d879a1e',
      '/User_Web/iflux-web-ui/alerts.css?v=9a03ebc64a',
      '/User_Web/iflux-web-ui/market.css?v=78eddf5ade'
    ]
  }]
};
