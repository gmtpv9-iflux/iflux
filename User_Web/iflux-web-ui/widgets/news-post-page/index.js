/**
 * WGT-NEWS-POST-PAGE — Composite Bài viết cộng đồng (Blueprint Phase D)
 */
import { loadScriptTiers, loadScript } from '../../runtime/legacy-bridge.js?v=r20260928n';
import { buildPageFrame } from '../../runtime/app-shell.js?v=appHeader20260928';
import { mountPageWidgets } from '../../runtime/page-widgets.js?v=r20260928n';

var ASSET = '/User_Web/iflux-web-ui/';
var ADMIN = '/Admin_Design_system/iflux-admin-ui/';
var PUBLISH_KEY = 'article';

export const meta = { id: 'WGT-NEWS-POST-PAGE', title: 'Bài viết cộng đồng' };

/* W4: registry/seeds/mock/taxonomy/seo = Shell MARKET_PLATFORM */
var CORE_TIERS = [
  [ADMIN + 'iflux-admin-ui.js', ASSET + 'runtime/page-layout-engine.js?v=r20260928n'],
  [ASSET + 'stock-mentions.js?v=r20260928n'],
  [
    ASSET + 'news-store.js?v=r20260928n',
    ASSET + 'iflux-news-api-bridge.js?v=r20260928n',
    ASSET + 'profile-users-store.js',
    ASSET + 'profile-links.js'
  ],
  [
    ASSET + 'iflux-market-quotes.js?v=r20260928n',
    ASSET + 'watchlist-store.js?v=r20260928n',
    ADMIN + 'foundation/heart-action.js?v=followFound20260724',
    ASSET + 'news-ui.js?v=r20260928n',
    ASSET + 'news-daily-feed.js?v=r20260928n',
    ASSET + 'interaction/boot.js?v=r20260928n',
    ASSET + 'news-post-page.js?v=appHeader20260928'
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
