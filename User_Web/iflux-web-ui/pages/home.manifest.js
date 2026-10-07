/**
 * Page Manifest — Cá nhân (/ca-nhan)
 *
 * Merge Trang chủ cũ (Dashboard tùy chỉnh) + Tài khoản cũ (/tai-khoan) — xem
 * docs/SoT — Trang chủ = Cộng đồng, Cá nhân = Trang chủ cũ + Tài khoản cũ (Migration V1).md
 * Composite: widgets/home-page tự dựng khung 3 cột (buildPageFrame rightSidebar:true) —
 * Sidebar trái (Hồ sơ + Watchlist + canvas tùy chỉnh) · Main (5 tab) · Sidebar phải (Gói cước +
 * Hoạt động gần đây + widget host Admin). Luôn cần đăng nhập, không còn phiên bản vãng lai.
 */

var VER = '?v=r20261003e';

export default {
  pageKey: 'home',
  /* App Shell: class <main> + CSS riêng của trang (nạp khi vào trang — tải đầy đủ lẫn điều hướng mềm). */
  mainClass: 'ifx-main--hub',
  css: [
    '/User_Web/iflux-web-ui/hub.css?v=r20261003a',
    '/User_Web/iflux-web-ui/profile.css?v=r20261003b',
    '/User_Web/iflux-web-ui/widget-shell.css?v=r20260928n',
    '/User_Web/iflux-web-ui/watchlist.css?v=r20260928n',
    '/User_Web/iflux-web-ui/block-templates.css?v=r20260928n',
    '/User_Web/iflux-web-ui/feature-suggestions.css'
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
      lazyModule: '/User_Web/iflux-web-ui/widgets/home-page/index.js' + VER
    }
  ]
};
