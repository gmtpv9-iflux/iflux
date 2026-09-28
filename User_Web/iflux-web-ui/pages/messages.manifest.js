/**
 * Page Manifest — Tin nhắn (/tin-nhan)
 */
export default {
  pageKey: 'messages',
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
    lazyModule: '/User_Web/iflux-web-ui/widgets/messages-page/index.js?v=pageFrame20260928',
    css: [
      '/User_Web/iflux-web-ui/profile.css?v=pageFrame20260928',
      '/User_Web/iflux-web-ui/hub.css'
    ]
  }]
};
