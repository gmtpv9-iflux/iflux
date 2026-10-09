/**
 * Page Manifest — Cá nhân (/ca-nhan)
 *
 * Merge Trang chủ cũ (Dashboard tùy chỉnh) + Tài khoản cũ (/tai-khoan) — xem
 * docs/SoT — Trang chủ = Cộng đồng, Cá nhân = Trang chủ cũ + Tài khoản cũ (Migration V1).md
 * Composite: widgets/home-page tự dựng khung 3 cột (buildPageFrame rightSidebar:true) —
 * Sidebar trái (Hồ sơ + Watchlist + canvas tùy chỉnh) · Main (5 tab) · Sidebar phải (Gói cước +
 * Hoạt động gần đây + widget host Admin). Luôn cần đăng nhập, không còn phiên bản vãng lai.
 */


export default {
  pageKey: 'home',
  /* App Shell: class <main> + CSS riêng của trang (nạp khi vào trang — tải đầy đủ lẫn điều hướng mềm). */
  mainClass: 'ifx-main--hub',
  css: [
    '/User_Web/iflux-web-ui/hub.css?v=dfca1bcfb4',
    '/User_Web/iflux-web-ui/profile.css?v=d906d1d30f',
    '/User_Web/iflux-web-ui/widget-shell.css?v=d7a5c097f9',
    '/User_Web/iflux-web-ui/watchlist.css?v=255d879a1e',
    '/User_Web/iflux-web-ui/block-templates.css?v=d1e0b803fd',
    '/User_Web/iflux-web-ui/feature-suggestions.css?v=1238c3b539'
  ],
  path: '/ca-nhan',
  title: 'Cá nhân',
  documentTitle: 'Cá nhân',
  composite: true,
  sections: [
    { key: 'sidebar', label: 'Sidebar trái', visible: true, layout: 'stack' },
    { key: 'main', label: 'Cá nhân', visible: true, layout: 'stack' },
    { key: 'sidebar-right', label: 'Sidebar phải', visible: true, layout: 'stack' }
  ],
  widgets: [
    {
      id: 'WGT-HOME-PAGE',
      title: 'Cá nhân',
      section: 'main',
      position: 0,
      span: 12,
      enabled: true,
      locked: true,
      lazyModule: '/User_Web/iflux-web-ui/widgets/home-page/index.js?v=99bce94c7b'
    }
  ]
};
