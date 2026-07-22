/**
 * Page Manifest — FAQ (/hoi-dap)
 */
export default {
  pageKey: 'faq',
  path: '/hoi-dap',
  title: 'Câu hỏi thường gặp',
  documentTitle: 'Hỏi đáp · iFlux',
  renderPageHead: false,
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
    lazyModule: '/User_Web/iflux-web-ui/widgets/faq-page/index.js?v=bpPhaseD20260716',
    css: [
      '/User_Web/iflux-web-ui/pricing.css',
      '/User_Web/iflux-web-ui/faq.css'
    ]
  }]
};
