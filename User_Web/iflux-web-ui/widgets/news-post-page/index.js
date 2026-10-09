/**
 * WGT-NEWS-POST-PAGE — Composite Bài viết cộng đồng (Blueprint Phase D)
 */
import { loadScriptTiers, loadScript } from '../../runtime/legacy-bridge.js?v=dec30759da';
import { buildPageFrame } from '../../runtime/app-shell.js?v=7b8f128322';
import { mountPageWidgets } from '../../runtime/page-widgets.js?v=b515a6101c';

var ASSET = '/User_Web/iflux-web-ui/';
var ADMIN = '/Admin_Design_system/iflux-admin-ui/';
var PUBLISH_KEY = 'article';

export const meta = { id: 'WGT-NEWS-POST-PAGE', title: 'Bài viết cộng đồng' };

/* W4: registry/seeds/mock/taxonomy/seo = Shell MARKET_PLATFORM
 * Trước đây tách 4 tầng tuần tự (tầng sau đợi tầng trước tải xong) — không file
 * nào trong 9 file này gọi hàm của file khác NGAY khi vừa tải (chỉ định nghĩa
 * hàm/export global, mọi lệnh gọi chéo đều nằm trong init() — chạy sau khi CẢ
 * 9 file đã tải xong). Không có phụ thuộc thứ tự thật → gộp 1 tầng, tải song
 * song toàn bộ giống đúng cách trang danh sách tin tức đang làm (nhanh hơn). */
var CORE_TIERS = [
  [
    ASSET + 'runtime/page-layout-engine.js?v=a6f64093c8',
    ASSET + 'stock-mentions.js?v=63b1553d75',
    ASSET + 'news-store.js?v=84bb9b875c',
    ASSET + 'iflux-news-api-bridge.js?v=70487a5208',
    ASSET + 'profile-users-store.js?v=4fb82084de',
    ASSET + 'profile-links.js?v=31f14c2ed9',
    ASSET + 'iflux-market-quotes.js?v=349c1e1a74',
    ASSET + 'watchlist-store.js?v=f604e76323',
    '/design_system/04_components/29_follow/follow.js?v=r20261002a',
    ASSET + 'news-ui.js?v=8bd1108a4b',
    ASSET + 'news-daily-feed.js?v=407fadedc0',
    ASSET + 'interaction/boot.js?v=41e479c913',
    ASSET + 'news-post-page.js?v=72531d9593'
  ]
];

var LAYOUT_HTML = `<div data-ifx-community-story></div>`;

function mountFromHostTree(root) {
  return mountPageWidgets(root, PUBLISH_KEY);
}

export async function mount(el) {
  el.innerHTML = LAYOUT_HTML;
  await loadScriptTiers(CORE_TIERS);
  if (window.IfluxNewsApiBridge && IfluxNewsApiBridge.loadPostPage) {
    var ref = window.IfluxSeoUrl && IfluxSeoUrl.parsePostRef ? IfluxSeoUrl.parsePostRef() : null;
    if (ref) await IfluxNewsApiBridge.loadPostPage({ idOrSlug: ref });
  }
  /* AS-SEARCH: App Shell Entry (shell-boot) — không tải từ composite. */
  if (window.IfluxWebUI && IfluxWebUI.syncTopnav) IfluxWebUI.syncTopnav();
  /* Bridge khung trang chung cho news-post-page.js (IIFE) — paintPost() dựng qua buildPageFrame.
   * iflux-context-ready = khung đã dựng xong (dispatch cuối paintPost()) → mount widget vào host. */
  window.IfluxRuntimeSections = { buildPageFrame: buildPageFrame };
  function onContextReady() {
    mountFromHostTree(el);
  }
  function onPlans() {
    mountFromHostTree(el);
  }
  document.addEventListener('iflux-context-ready', onContextReady);
  document.addEventListener('iflux-plans-updated', onPlans);
  if (window.IfluxCommunityPostPage) IfluxCommunityPostPage.init();
  return {
    unmount: function () {
      document.removeEventListener('iflux-context-ready', onContextReady);
      document.removeEventListener('iflux-plans-updated', onPlans);
      if (el) el.innerHTML = '';
    }
  };
}

export function unmount(el) {
  if (el) el.innerHTML = '';
}
