/**
 * Page Manifest — Trang chủ (/trang-chu)
 *
 * Composite: widgets/home-page tự dựng khung (buildPageFrame) vì 2 trải nghiệm khác hẳn nhau:
 *  - Đăng nhập: Sidebar (Widget Placement Admin + Gói cước) + Main 3 tab Dashboard | Timeline | Hoạt động gần đây.
 *  - Vãng lai: không sidebar, landing phẳng (nội dung Discovery bổ sung sau).
 */

var VER = '?v=r20261001a';

export default {
  pageKey: 'home',
  /* App Shell: class <main> + CSS riêng của trang (nạp khi vào trang — tải đầy đủ lẫn điều hướng mềm). */
  mainClass: 'ifx-main--hub',
  css: [
    '/User_Web/iflux-web-ui/hub.css?v=r20260928n',
    '/User_Web/iflux-web-ui/profile.css?v=r20260928n',
    '/User_Web/iflux-web-ui/widget-shell.css?v=r20260928n',
    '/User_Web/iflux-web-ui/watchlist.css?v=r20260928n',
    '/User_Web/iflux-web-ui/block-templates.css?v=r20260928n',
    '/User_Web/iflux-web-ui/feature-suggestions.css'
  ],
  path: '/trang-chu',
  title: 'Trang chủ',
  documentTitle: 'Trang chủ',
  composite: true,
  sections: [
    { key: 'main', label: 'Trang chủ', visible: true, layout: 'stack' }
  ],
  widgets: [
    {
      id: 'WGT-HOME-PAGE',
      title: 'Trang chủ',
      section: 'main',
      position: 0,
      span: 12,
      enabled: true,
      locked: true,
      lazyModule: '/User_Web/iflux-web-ui/widgets/home-page/index.js' + VER
    }
  ]
};
