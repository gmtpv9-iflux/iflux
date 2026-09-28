export default {
  pageKey: 'pricing',
  /* App Shell: class <main> + CSS riêng của trang (nạp khi vào trang — tải đầy đủ lẫn điều hướng mềm). */
  mainClass: 'ifx-main--pricing',
  css: [],
  path: '/goi-cuoc',
  title: '',
  documentTitle: '',
  composite: true,
  sections: [
    { key: 'main', label: 'Nội dung chính', visible: true, layout: 'stack' }
  ],
  widgets: [{
    id: 'WGT-PRICING-PAGE',
    title: 'Gói cước',
    section: 'main',
    position: 0,
    span: 12,
    enabled: true,
    locked: true,
    lazyModule: '/User_Web/iflux-web-ui/widgets/pricing-page/index.js?v=r20260928n',
    css: ['/User_Web/iflux-web-ui/pricing.css?v=r20260928n']
  }]
};
