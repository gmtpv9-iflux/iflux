/**
 * Page Manifest — Cộng đồng (/community)
 * Composite: 1 widget "page" tự dựng layout feed + widget dedicated bên trong.
 * Widget dedicated (SoT Product Composition): WGT-COM-001, WGT-COM-CHUDE-TOP,
 * WGT-MKT-006, WGT-COM-002 — render trong composite theo đúng entitlement/block gate.
 */

export default {
  pageKey: 'community',
  path: '/cong-dong',
  title: 'Cộng đồng',
  intro: 'Tin tức, bài viết chuyên gia và thảo luận từ cộng đồng nhà đầu tư — cập nhật theo mã, ngành và chủ đề bạn quan tâm.',
  documentTitle: 'Cộng đồng · iFlux',
  composite: true,
  sections: [
    { key: 'main', label: 'Nội dung chính', visible: true, layout: 'stack' }
  ],
  widgets: [
    {
      id: 'WGT-COM-PAGE',
      title: 'Cộng đồng',
      section: 'main',
      position: 0,
      span: 12,
      enabled: true,
      locked: true,
      lazyModule: '/User_Web/iflux-web-ui/widgets/community-page/index.js?v=phaseCW320260721',
      /* Page Feature CSS (feed sở hữu). market-components.css đã chuyển về
         Widget Manifest của WGT-MKT-006 — không nạp ở tầng Page nữa. */
      css: [
        '/User_Web/iflux-web-ui/widget-shell.css',
        '/User_Web/iflux-web-ui/block-templates.css',
        '/User_Web/iflux-web-ui/watchlist.css',
        '/User_Web/iflux-web-ui/community.css'
      ]
    }
  ]
};
