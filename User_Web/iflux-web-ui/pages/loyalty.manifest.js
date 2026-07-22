/**
 * Page Manifest — Membership (/thanh-vien)
 */
export default {
  pageKey: 'loyalty',
  path: '/thanh-vien',
  title: 'Chương trình thành viên',
  documentTitle: 'Chương trình thành viên · iFlux',
  renderPageHead: false,
  composite: true,
  sections: [{ key: 'main', label: 'Nội dung chính', visible: true, layout: 'stack' }],
  widgets: [{
    id: 'WGT-LOY-PAGE',
    title: 'Chương trình thành viên',
    section: 'main',
    position: 0,
    span: 12,
    enabled: true,
    locked: true,
    lazyModule: '/User_Web/iflux-web-ui/widgets/loyalty-page/index.js?v=bpPhaseD20260716',
    css: ['/User_Web/iflux-web-ui/loyalty.css']
  }]
};
