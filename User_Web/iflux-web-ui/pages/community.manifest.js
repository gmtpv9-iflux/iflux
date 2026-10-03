/**
 * Page Manifest — Cộng đồng (/cong-dong)
 * Mạng xã hội nhà đầu tư — xem docs/SoT — Community (Cộng đồng) Architecture V1.md
 * Sidebar trái (3/12) + Main (7/12) + Sidebar phải (2/12, MỚI — xem app-shell.js
 * opts.rightSidebar). Phase 0: CẢ 3 vùng do widgets/community-page tự dựng bằng seed
 * data (không qua Widget host Admin — xem ghi chú trong widgets/community-page/index.js).
 */
export default {
  pageKey: 'community',
  mainClass: 'ifx-main--community-social',
  css: [
    '/design_system/03_primitives/03_badge/badge.css?v=20260928d',
    '/design_system/03_primitives/08_title/title.css?v=r20261003a',
    '/design_system/04_components/03_card/card.css?v=20260928d',
    '/User_Web/iflux-web-ui/community.css?v=r20261003c'
  ],
  path: '/cong-dong',
  title: 'Cộng đồng',
  intro: 'Nơi nhà đầu tư Việt Nam chia sẻ nhận định, theo dõi nhau và thảo luận về thị trường.',
  documentTitle: '',
  composite: true,
  sections: [
    { key: 'sidebar', label: 'Sidebar Cộng đồng', visible: true, layout: 'stack' },
    { key: 'main', label: 'Dòng thời gian', visible: true, layout: 'stack' },
    { key: 'sidebar-right', label: 'Sidebar phải', visible: true, layout: 'stack' }
  ],
  widgets: [
    {
      id: 'WGT-COMMUNITY-PAGE',
      title: 'Cộng đồng',
      section: 'main',
      position: 0,
      span: 12,
      enabled: true,
      locked: true,
      lazyModule: '/User_Web/iflux-web-ui/widgets/community-page/index.js?v=r20261003c',
      css: [
        '/design_system/03_primitives/03_badge/badge.css?v=20260928d',
        '/design_system/03_primitives/08_title/title.css?v=r20261003a',
        '/design_system/04_components/03_card/card.css?v=20260928d',
        '/User_Web/iflux-web-ui/community.css?v=r20261003c'
      ]
    }
  ]
};
