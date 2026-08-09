/**
 * Page Manifest — Dòng tiền (/flow)
 * Composite: 1 widget "page" tự dựng sidebar SUBJ + board 3-tab bên trong.
 * Widget dedicated (SoT Product Composition): WGT-FLW-SUBJ-STOCK/SECTOR (sidebar),
 * board 3-tab (STAT + EX) — 1 composite.
 */

export default {
  pageKey: 'flow',
  path: '/dong-tien',
  title: '',
  documentTitle: 'Dòng tiền · iFlux',
  composite: true,
  sections: [
    { key: 'main', label: 'Nội dung chính', visible: true, layout: 'stack' }
  ],
  widgets: [
    {
      id: 'WGT-FLW-PAGE',
      title: 'Dòng tiền',
      section: 'main',
      position: 0,
      span: 12,
      enabled: true,
      locked: true,
    lazyModule: '/User_Web/iflux-web-ui/widgets/flow-page/index.js?v=mdmShell20260808',
      css: [
        '/User_Web/iflux-web-ui/market-components.css',
        '/User_Web/iflux-web-ui/flow.css',
        '/User_Web/iflux-web-ui/block-templates.css'
      ]
    }
  ]
};
