/**
 * Page Manifest — Cộng đồng (/cong-dong)
 * Mạng xã hội nhà đầu tư — xem docs/SoT — Community (Cộng đồng) Architecture V1.md
 * Sidebar trái (3/12) + Sidebar phải (2/12, MỚI — xem app-shell.js opts.rightSidebar)
 * đều là Widget host qua Admin > Cài đặt trang (giống mọi trang khác).
 * Main (7/12) KHÔNG host widget — Composer + Timeline do widgets/community-page tự dựng.
 */
export default {
  pageKey: 'community',
  mainClass: 'ifx-main--community-social',
  css: ['/User_Web/iflux-web-ui/community.css?v=r20261002a'],
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
      lazyModule: '/User_Web/iflux-web-ui/widgets/community-page/index.js?v=r20261002a',
      css: ['/User_Web/iflux-web-ui/community.css?v=r20261002a']
    }
  ]
};
