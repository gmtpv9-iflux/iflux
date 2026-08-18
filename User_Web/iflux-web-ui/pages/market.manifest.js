/**
 * Page Manifest — Thị trường (/market)
 * Host sidebar/main trống mặc định; widget không đặc thù chỉ qua PagePublished Placement.
 */

export default {
  pageKey: 'market',
  path: '/thi-truong',
  title: 'Thị trường',
  intro: 'Tổng quan thị trường.',
  documentTitle: '',
  sections: [
    { key: 'sidebar', label: 'Sidebar thị trường', visible: true, layout: 'stack' },
    { key: 'main', label: 'Nội dung chính', visible: true, layout: 'grid-12' }
  ],
  /* Widget không đặc thù — chỉ qua PagePublished Placement (Admin đã OFF).
     enabled:false = không inject cứng vào Host khi slot path còn đọc static. */
  widgets: [
    {
      id: 'WGT-MKT-001',
      title: 'Tổng quan thị trường',
      section: 'sidebar',
      position: 0,
      span: 12,
      enabled: false,
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
      enabled: false,
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
      enabled: false,
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
      title: 'Heatmap Hệ sinh thái',
      section: 'main',
      position: 1,
      span: 6,
      enabled: false,
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
