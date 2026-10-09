/**
 * Page Manifest — Membership (/thanh-vien)
 */
export default {
  pageKey: 'loyalty',
  /* App Shell: class <main> + CSS riêng của trang (nạp khi vào trang — tải đầy đủ lẫn điều hướng mềm). */
  mainClass: 'ifx-main--membership',
  css: ['/User_Web/iflux-web-ui/loyalty.css?v=673ce6dcdd'],
  path: '/thanh-vien',
  title: 'Chương trình thành viên',
  documentTitle: '',
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
    lazyModule: '/User_Web/iflux-web-ui/widgets/loyalty-page/index.js?v=6001bfcc03',
    css: ['/User_Web/iflux-web-ui/loyalty.css?v=673ce6dcdd']
  }]
};
