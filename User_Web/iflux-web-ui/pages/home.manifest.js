/**
 * Page Manifest — Trang chủ (/trang-chu)
 *
 * Sidebar: widget trang (PRF) theo Cài đặt trang Admin.
 * Main: shell Tùy chỉnh (toolbar Mặc định / Phổ biến / Tùy chỉnh + canvas).
 *   User layout ghi đè trong IfluxUserStorage; mặc định = Admin / DEFAULT_LAYOUT.
 *   Không phải “page giả” ôm cả trang — chỉ vùng Main.
 */

var VER = '?v=phaseCW120260721';
var CSS_HUB = [
  '/User_Web/iflux-web-ui/hub.css?v=pageFrame20260928',
  '/User_Web/iflux-web-ui/profile.css?v=appHeader20260928'
];
var CSS_DASH = [
  '/User_Web/iflux-web-ui/widget-shell.css?v=ui00120260723',
  '/User_Web/iflux-web-ui/watchlist.css',
  '/User_Web/iflux-web-ui/block-templates.css?v=ui00120260723',
  '/User_Web/iflux-web-ui/feature-suggestions.css'
];

export default {
  pageKey: 'home',
  /* App Shell: class <main> + CSS riêng của trang (nạp khi vào trang — tải đầy đủ lẫn điều hướng mềm). */
  mainClass: 'ifx-main--hub',
  css: ['/User_Web/iflux-web-ui/hub.css?v=softAll20260928'],
  path: '/trang-chu',
  title: 'Trang chủ',
  documentTitle: 'Trang chủ',
  sections: [
    { key: 'sidebar', label: 'Thông tin cá nhân', visible: true, layout: 'stack' },
    { key: 'main', label: 'Bảng tổng quan', visible: true, layout: 'stack' }
  ],
  widgets: [
    /* WGT-PRF-001 (Hồ sơ) — Owner: không đặc thù; không inject cứng vào Host sidebar.
       Profile page giữ widget module riêng — không đụng widgets/profile-card. */
    {
      id: 'WGT-PRF-002',
      title: 'Gói cước',
      section: 'sidebar',
      position: 0,
      span: 12,
      enabled: true,
      locked: true,
      lazyModule: '/User_Web/iflux-web-ui/widgets/plan-promo/index.js' + VER,
      css: CSS_HUB
    },
    {
      id: 'WGT-HOME-DASH',
      title: 'Bảng điều khiển',
      section: 'main',
      position: 0,
      span: 12,
      enabled: true,
      locked: true,
      lazyModule: '/User_Web/iflux-web-ui/widgets/home-dashboard/index.js' + VER,
      css: CSS_DASH
    }
  ]
};
