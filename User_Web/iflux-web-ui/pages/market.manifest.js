/**
 * Page Manifest — Thị trường (/market)
 * Chỉ mô tả: Page → Widget IDs → Layout. KHÔNG chứa implementation.
 * Widget đặc thù cố định (SoT Product Composition):
 *   Sidebar: WGT-MKT-001, WGT-MKT-002
 *   Main: WGT-MKT-004, WGT-MKT-005
 * Widget tùy chỉnh (shared) — TẮT mặc định; không nằm trong manifest này.
 */

export default {
  pageKey: 'market',
  path: '/thi-truong',
  title: 'Thị trường',
  intro: 'Tổng quan thị trường — sidebar · Heatmap Ngành & Họ CP',
  documentTitle: 'Thị trường · iFlux',
  sections: [
    { key: 'sidebar', label: 'Sidebar thị trường', visible: true, layout: 'stack' },
    { key: 'main', label: 'Nội dung chính', visible: true, layout: 'grid-12' }
  ],
  widgets: [
    {
      id: 'WGT-MKT-001',
      title: 'Tổng quan thị trường',
      section: 'sidebar',
      position: 0,
      span: 12,
      enabled: true,
      locked: true,
      lazyModule: '/User_Web/iflux-web-ui/widgets/market-overview/index.js',
      css: [
        '/User_Web/iflux-web-ui/block-templates.css',
        '/User_Web/iflux-web-ui/market.css'
      ]
    },
    {
      id: 'WGT-MKT-002',
      title: 'Độ rộng thị trường',
      section: 'sidebar',
      position: 1,
      span: 12,
      enabled: true,
      locked: true,
      lazyModule: '/User_Web/iflux-web-ui/widgets/market-breadth/index.js',
      css: [
        '/User_Web/iflux-web-ui/block-templates.css',
        '/User_Web/iflux-web-ui/market.css'
      ]
    },
    {
      id: 'WGT-MKT-004',
      title: 'Heatmap Ngành',
      section: 'main',
      position: 0,
      span: 6,
      enabled: true,
      locked: true,
      config: { source: 'sector' },
      lazyModule: '/User_Web/iflux-web-ui/widgets/market-heatmap/index.js',
      css: [
        '/User_Web/iflux-web-ui/block-templates.css',
        '/User_Web/iflux-web-ui/market.css',
        '/User_Web/iflux-web-ui/market-components.css'
      ]
    },
    {
      id: 'WGT-MKT-005',
      title: 'Heatmap Họ cổ phiếu',
      section: 'main',
      position: 1,
      span: 6,
      enabled: true,
      locked: true,
      config: { source: 'family' },
      lazyModule: '/User_Web/iflux-web-ui/widgets/market-heatmap/index.js',
      css: [
        '/User_Web/iflux-web-ui/block-templates.css',
        '/User_Web/iflux-web-ui/market.css',
        '/User_Web/iflux-web-ui/market-components.css'
      ]
    }
  ]
};
