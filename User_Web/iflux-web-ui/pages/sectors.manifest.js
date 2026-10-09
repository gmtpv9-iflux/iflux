/**
 * Page Manifest — Danh sách ngành (/nganh)
 */

export default {
  pageKey: 'sectors',
  /* App Shell: class <main> + CSS riêng của trang (nạp khi vào trang — tải đầy đủ lẫn điều hướng mềm). */
  mainClass: 'ifx-main--market ifx-main--list',
  css: [],
  path: '/nganh',
  title: '',
  documentTitle: '',
  composite: true,
  sections: [
    { key: 'main', label: 'Nội dung chính', visible: true, layout: 'stack' }
  ],
  widgets: [{
    id: 'WGT-ELP-PAGE',
    title: 'Danh sách ngành',
    section: 'main',
    position: 0,
    span: 12,
    enabled: true,
    locked: true,
    config: { kind: 'sectors' },
    lazyModule: '/User_Web/iflux-web-ui/widgets/entity-list-page/index.js?v=87b1ccdca2',
    css: [
      '/User_Web/iflux-web-ui/market-components.css?v=c8e2f06ab3',
      '/User_Web/iflux-web-ui/block-templates.css?v=d1e0b803fd',
      '/User_Web/iflux-web-ui/news.css?v=ff9894f428',
      '/User_Web/iflux-web-ui/watchlist.css?v=255d879a1e',
      '/User_Web/iflux-web-ui/alerts.css?v=9a03ebc64a',
      '/User_Web/iflux-web-ui/market.css?v=78eddf5ade'
    ]
  }]
};
