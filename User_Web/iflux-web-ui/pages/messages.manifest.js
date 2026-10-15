/**
 * Page Manifest — Tin nhắn (/tin-nhan)
 */
export default {
  pageKey: 'messages',
  /* App Shell: class <main> + CSS riêng của trang (nạp khi vào trang — tải đầy đủ lẫn điều hướng mềm). */
  mainClass: 'ifx-main--messages',
  css: ['/User_Web/iflux-web-ui/profile.css?v=2c89cee009', '/User_Web/iflux-web-ui/hub.css?v=dfca1bcfb4'],
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
    lazyModule: '/User_Web/iflux-web-ui/widgets/messages-page/index.js?v=00aace6024',
    css: [
      '/User_Web/iflux-web-ui/profile.css?v=2c89cee009',
      '/User_Web/iflux-web-ui/hub.css?v=dfca1bcfb4'
    ]
  }]
};
