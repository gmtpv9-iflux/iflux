/**
 * WGT-NEWS-POST-PAGE — Composite Bài viết cộng đồng (Blueprint Phase D)
 */
import { loadScriptTiers, loadScript } from '../../runtime/legacy-bridge.js?v=stickyFix20260811';
import { ensureSections } from '../../runtime/app-shell.js?v=scrollWave4early_20260811';
import { mountPublishedWidgets } from '../../runtime/mount-published-widgets.js?v=phase4Pub20260716b';

var ASSET = '/User_Web/iflux-web-ui/';
var ADMIN = '/Admin_Design_system/iflux-admin-ui/';
var PUBLISH_KEY = 'article';

export const meta = { id: 'WGT-NEWS-POST-PAGE', title: 'Bài viết cộng đồng' };

/* W4: registry/seeds/mock/taxonomy/seo = Shell MARKET_PLATFORM */
var CORE_TIERS = [
  [ADMIN + 'iflux-admin-ui.js', ASSET + 'runtime/page-layout-engine.js?v=scrollWave4early_20260811'],
  [ASSET + 'stock-mentions.js'],
  [
    ASSET + 'news-store.js?v=tickerNoDup20260810',
    ASSET + 'iflux-news-api-bridge.js?v=calFeedFix20260808',
    ASSET + 'profile-users-store.js',
    ASSET + 'profile-links.js'
  ],
  [
    ASSET + 'iflux-market-quotes.js?v=comQuoteRuntime20260809',
    ASSET + 'watchlist-store.js?v=followFound20260724',
    ADMIN + 'foundation/heart-action.js?v=followFound20260724',
    ASSET + 'news-ui.js?v=comQuoteRuntime20260809',
    ASSET + 'news-daily-feed.js?v=comQuoteRuntime20260809',
    ASSET + 'interaction/boot.js?v=b5ixFlat20260727',
    ASSET + 'news-post-page.js?v=scrollWave4early_20260811'
  ]
];

var LAYOUT_HTML = `<div data-ifx-community-story></div>`;

async function mountFromHostTree(root) {
  if (!root || !window.IfluxPageLayoutEngine) {
    if (window.console && console.warn) {
      console.warn('[WGT-NEWS-POST-PAGE] thiếu Layout Engine');
    }
    return;
  }
  var tree = await IfluxPageLayoutEngine.buildHostTree(root, PUBLISH_KEY);
  if (!tree || !tree.length) return;
  await mountPublishedWidgets(tree, { logPrefix: '[WGT-NEWS-POST-PAGE]' });
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
  /* Sidebar Widget Host (100826_Scroll — Owner request 2026-08-11): bridge ensureSections()
   * ESM cho news-post-page.js (legacy IIFE) dựng Sidebar phải canonical trong paintPost().
   * iflux-context-ready = signal DOM aside đã build xong (dispatch cuối paintPost()). */
  window.IfluxRuntimeSections = { ensureSections: ensureSections };
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
