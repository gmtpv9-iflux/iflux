export default {
  pageKey: 'pricing',
  path: '/goi-cuoc',
  title: '',
  documentTitle: 'Gói cước · iFlux',
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
    lazyModule: '/User_Web/iflux-web-ui/widgets/pricing-page/index.js?v=bpPhaseD20260716',
    css: ['/User_Web/iflux-web-ui/pricing.css']
  }]
};
