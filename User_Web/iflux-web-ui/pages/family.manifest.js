/**
 * Page Manifest — Chi tiết hệ sinh thái (/he-sinh-thai/:id)
 */
var VER = '?v=phaseCW120260721';

export default {
  pageKey: 'family',
  path: '/he-sinh-thai',
  title: '',
  documentTitle: 'Hệ sinh thái · iFlux',
  composite: true,
  sections: [
    { key: 'main', label: 'Nội dung chính', visible: true, layout: 'stack' }
  ],
  widgets: [{
    id: 'WGT-GROUP-PAGE',
    title: 'Chi tiết hệ sinh thái',
    section: 'main',
    position: 0,
    span: 12,
    enabled: true,
    locked: true,
    config: { kind: 'family' },
    lazyModule: '/User_Web/iflux-web-ui/widgets/group-page/index.js' + VER,
    css: [
      '/User_Web/iflux-web-ui/market-components.css',
      '/User_Web/iflux-web-ui/watchlist.css',
      '/User_Web/iflux-web-ui/community.css',
      '/User_Web/iflux-web-ui/block-templates.css',
      '/User_Web/iflux-web-ui/stock.css'
    ]
  }]
};
