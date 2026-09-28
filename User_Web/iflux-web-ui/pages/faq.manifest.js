/**
 * Page Manifest — FAQ (/hoi-dap)
 */
export default {
  pageKey: 'faq',
  /* App Shell: class <main> + CSS riêng của trang (nạp khi vào trang — tải đầy đủ lẫn điều hướng mềm). */
  mainClass: 'ifx-main--faq',
  css: ['/User_Web/iflux-web-ui/pricing.css?v=r20260928n', '/User_Web/iflux-web-ui/faq.css?v=r20260928n'],
  path: '/hoi-dap',
  title: 'Câu hỏi thường gặp',
  documentTitle: '',
  composite: true,
  sections: [{ key: 'main', label: 'Nội dung chính', visible: true, layout: 'stack' }],
  widgets: [{
    id: 'WGT-FAQ-PAGE',
    title: 'Câu hỏi thường gặp',
    section: 'main',
    position: 0,
    span: 12,
    enabled: true,
    locked: true,
    lazyModule: '/User_Web/iflux-web-ui/widgets/faq-page/index.js?v=r20260928q',
    css: [
      '/User_Web/iflux-web-ui/pricing.css?v=r20260928n',
      '/User_Web/iflux-web-ui/faq.css?v=r20260928n'
    ]
  }]
};
