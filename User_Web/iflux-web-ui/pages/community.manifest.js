/**
 * Page Manifest — Cộng đồng (/cong-dong)
 * Mạng xã hội nhà đầu tư — xem docs/SoT — Community (Cộng đồng) Architecture V1.md
 * Sidebar trái (3/12) + Main (7/12) + Sidebar phải (2/12 — xem app-shell.js opts.rightSidebar).
 * 2026-10: Sidebar trái = brand card + "Chủ đề đang thịnh hành" (community-page.js tự dựng,
 * dữ liệu Topic thật) + Widget Host thật phía trên (mountPageWidgets('community'), apply Cài
 * đặt trang > Widget Placement — xem widgets/community-page/index.js). Main/Sidebar phải vẫn
 * do community-page.js tự dựng.
 *
 * css[] dưới đây là bản PRELOAD tĩnh (tránh FOUC cho brand card/trending card — render ngay khi
 * IfluxCommunityPage.init(), TRƯỚC khi mountPageWidgets() kịp nạp Template qua
 * IfxTemplateLoader). 2 dòng /design_system/... (card.css/title.css) nằm NGOÀI phạm vi
 * sync-js-versions.mjs (tool chỉ quản version trong User_Web/iflux-web-ui/) — SỬA NỘI DUNG
 * card.css hay title.css PHẢI bump tay đúng 2 dòng này (và 2 dòng trùng trong widgets[0].css
 * dưới) kẻo IfxTemplateLoader thấy <link> path đã có sẵn (bỏ qua version) → trang này kẹt ở
 * bản cũ dù mọi trang khác đã cập nhật (đã xảy ra đúng case này 2026-10-09, xem card.css/
 * widget.js cùng ngày — Admin "Danh sách template" trông khác Cộng đồng do chính lỗi quên bump
 * 2 dòng này, không phải do CSS trang nào ghi đè).
 */
export default {
  pageKey: 'community',
  mainClass: 'ifx-main--community-social',
  css: [
    '/design_system/03_primitives/03_badge/badge.css?v=20260928d',
    '/design_system/03_primitives/08_title/title.css?v=r20261009d',
    '/design_system/04_components/03_card/card.css?v=r20261009e',
    '/User_Web/iflux-web-ui/community.css?v=5dc2a24e5d'
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
      lazyModule: '/User_Web/iflux-web-ui/widgets/community-page/index.js?v=082eedfd77',
      css: [
        '/design_system/03_primitives/03_badge/badge.css?v=20260928d',
        '/design_system/03_primitives/08_title/title.css?v=r20261009d',
        '/design_system/04_components/03_card/card.css?v=r20261009e',
        '/User_Web/iflux-web-ui/community.css?v=5dc2a24e5d'
      ]
    }
  ]
};
