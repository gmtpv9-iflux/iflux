/**
 * Page Manifest — Tin nhắn (/tin-nhan)
 */
export default {
  pageKey: 'messages',
  /* App Shell: class <main> + CSS riêng của trang (nạp khi vào trang — tải đầy đủ lẫn điều hướng mềm). */
  mainClass: 'ifx-main--messages',
  css: ['/User_Web/iflux-web-ui/profile.css?v=d906d1d30f', '/User_Web/iflux-web-ui/hub.css?v=dfca1bcfb4'],
  path: '/tin-nhan',
  title: 'Tin nhắn',
  documentTitle: '',
  composite: true,
  sections: [{ key: 'main', label: 'Nội dung chính', visible: true, layout: 'stack' }],
  widgets: [{
    id: 'WGT-MSG-PAGE',
    title: 'Tin nhắn',
    section: 'main',
    position: 0,
    span: 12,
    enabled: true,
    locked: true,
    lazyModule: '/User_Web/iflux-web-ui/widgets/messages-page/index.js?v=3d590b1496',
    css: [
      '/User_Web/iflux-web-ui/profile.css?v=d906d1d30f',
      '/User_Web/iflux-web-ui/hub.css?v=dfca1bcfb4'
    ]
  }]
};
