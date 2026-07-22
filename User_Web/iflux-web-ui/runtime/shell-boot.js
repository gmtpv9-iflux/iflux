/**
 * iFlux Runtime — Shell Boot (ESM)
 * Nạp tối thiểu App Shell deps: Router, Auth, Guest shell, Entitlements, header UI.
 * KHÔNG nạp widget implementation.
 */

import { loadScript } from './legacy-bridge.js?v=phaseCW420260721';

var ASSET = '/User_Web/iflux-web-ui/';
var ADMIN = '/Admin_Design_system/';
var ADMIN_UI = '/Admin_Design_system/iflux-admin-ui/';
var MARKET_PLATFORM_VER = 'phaseCW420260721';
var booted = null;

/**
 * W2/W4 — Platform market: Runtime Owner = Shell trên trang cần market.
 * Không nạp faq / pricing / loyalty / share (lazy §0.3).
 */
var MARKET_PLATFORM_PAGES = {
  community: 1, stock: 1, flow: 1,
  home: 1, dashboard: 1, market: 1,
  stocks: 1, sectors: 1, ecosystems: 1, chuDe: 1, cauChuyen: 1,
  sector: 1, family: 1, chuDeDetail: 1, cauChuyenDetail: 1,
  watchlist: 1, search: 1, messages: 1,
  communityPost: 1, communityWrite: 1,
  account: 1, checkout: 1, stockComment: 1
};

/**
 * Nạp SONG SONG một tầng script cổ điển, GIỮ ĐÚNG THỨ TỰ THỰC THI.
 * loadScript đặt script.async=false ⇒ dù tải đồng thời, trình duyệt vẫn THỰC THI
 * theo đúng thứ tự chèn (đúng thứ tự trong mảng). Mọi script boot chỉ "define global"
 * lúc load; lời gọi chéo thật (bootstrapPage/hydrate/syncTopnav/refreshSessionFromApi)
 * chỉ chạy SAU khi cả tầng đã nạp. Nhờ vậy chỉ cần MỘT tầng xếp đúng thứ tự phụ thuộc
 * (providers → data → entitlements → gate/consumers) là đủ — không phải chờ nhiều đợt.
 * @param {Array<{global:string, src:string}>} specs
 */
async function ensureParallel(specs) {
  await Promise.all((specs || []).map(function (spec) {
    if (!spec) return Promise.resolve();
    if (window[spec.global]) return Promise.resolve();
    return loadScript(spec.src);
  }));
}

export async function bootShell(pageKey) {
  /* Nếu module còn booted nhưng window globals đã mất (soft-nav) → boot lại. */
  if (booted && !(window.IfluxGuestShell && window.PlansStore && window.IfluxRoutes)) {
    booted = null;
  }
  if (booted && booted.pageKey === pageKey && window.IfluxGuestShell) {
    await new Promise(function (resolve) {
      var done = false;
      function finish() { if (!done) { done = true; resolve(); } }
      try {
        IfluxGuestShell.bootstrapPage(pageKey, finish);
      } catch (e) { finish(); }
      setTimeout(finish, 4000);
    });
    return booted;
  }

  // MỘT tầng: tải toàn bộ stack App Shell SONG SONG, thực thi theo đúng thứ tự phụ thuộc.
  //  1 platform-boot  → IfluxRoutes/IfluxRuntime/IfluxData/IfluxApiConfig
  //  2 api-bundle     → IfluxApiClient (cần IfluxApiConfig từ #1)
  //  3 auth           → IfluxAuth (cần IfluxApiClient từ #2)
  //  4 platform-layers-widgets · 5 entitlement-catalog · 6 plans-store (providers/data)
  //  7 iflux-entitlements (đọc EntitlementCatalog + PlansStore trong hàm)
  //  8 block-templates · 9 widget-shell · 10 block-paywall · 11 block-gate · 12 guest-shell
  await ensureParallel([
    { global: 'IfluxRoutes', src: ASSET + 'iflux-platform-boot.js?v=cauChuyen20260720' },
    { global: 'IfluxApiClient', src: ASSET + 'iflux-api-bundle.js' },
    { global: 'IfluxAuth', src: ASSET + 'auth.js' },
    { global: 'PlatformLayersWidgets', src: ADMIN + 'app/system/platform-layers-widgets.js?v=comFix20260714' },
    { global: 'EntitlementCatalog', src: ADMIN + 'app/subscription/entitlement-catalog.js?v=entL4Scope20260721' },
    { global: 'PlansStore', src: ADMIN + 'app/subscription/plans-store.js?v=bpPhaseD20260716' },
    { global: 'IfluxEntitlements', src: ASSET + 'iflux-entitlements.js?v=entPostGuest20260721' },
    { global: 'IfluxBlockTemplates', src: ASSET + 'block-templates.js?v=entEntity20260720' },
    { global: 'IfluxWidgetShell', src: ASSET + 'iflux-widget-shell.js?v=entShell20260720' },
    { global: 'IfluxBlockPaywall', src: ASSET + 'iflux-block-paywall.js?v=entShell20260720' },
    { global: 'IfluxBlockGate', src: ASSET + 'iflux-block-gate.js?v=entL4Scope20260721' },
    { global: 'IfluxGuestShell', src: ASSET + 'iflux-guest-shell.js?v=phaseA20260721c' }
  ]);

  /* W2/W4: Platform market — Shell Runtime Owner (page-gated). */
  if (MARKET_PLATFORM_PAGES[pageKey]) {
    await ensureParallel([
      { global: 'IfluxMarketSeedData', src: ADMIN_UI + 'iflux-market-seed-data.js?v=' + MARKET_PLATFORM_VER },
      { global: 'IfluxMarketEcosystemSeeds', src: ADMIN_UI + 'iflux-market-ecosystem-seeds.js?v=' + MARKET_PLATFORM_VER },
      { global: 'IfluxMarketRegistryStore', src: ADMIN_UI + 'iflux-market-registry-store.js?v=' + MARKET_PLATFORM_VER },
      { global: 'IfluxWatchlistTaxonomy', src: ASSET + 'watchlist-taxonomy.js?v=' + MARKET_PLATFORM_VER },
      { global: 'IfluxMockMarket', src: ASSET + 'mock-market.js?v=' + MARKET_PLATFORM_VER },
      { global: 'IfluxSeoUrl', src: ASSET + 'seo-url.js?v=' + MARKET_PLATFORM_VER }
    ]);
  }

  /* AS-SEARCH — One Entry / One Owner: chỉ App Shell nạp + init khi có slot. */
  if (document.querySelector('[data-ifx-header-search]')) {
    await ensureParallel([
      { global: 'IfluxHeaderSearch', src: ASSET + 'iflux-header-search.js?v=phaseA20260721' }
    ]);
    if (window.IfluxHeaderSearch && IfluxHeaderSearch.init) IfluxHeaderSearch.init();
  }

  // Header interactions (user menu + idle extras) — chỉ khi đã đăng nhập.
  if (window.IfluxAuth && IfluxAuth.isLoggedIn()) {
    await ensureParallel([
      { global: 'IfluxWebUI', src: ASSET + 'iflux-web-ui.js?v=phaseA20260721' }
    ]);
    if (window.IfluxWebUI && IfluxWebUI.syncTopnav) IfluxWebUI.syncTopnav();
  }

  if (window.PlansStore && PlansStore.hydrate) {
    try { await PlansStore.hydrate(); } catch (e) { /* ignore */ }
  }

  // Trang bắt buộc đăng nhập (danh sách / chi tiết entity + Nhà).
  // communityPost (Tin tức / bài viết) = nội dung công khai — vãng lai được xem.
  var AUTH_PAGES = {
    home: 1, dashboard: 1,
    stocks: 1, sectors: 1, ecosystems: 1, chuDe: 1, cauChuyen: 1,
    stock: 1, sector: 1, family: 1, chuDeDetail: 1, cauChuyenDetail: 1,
    watchlist: 1, messages: 1, search: 1,
    account: 1, checkout: 1, communityWrite: 1, stockComment: 1
  };
  if (AUTH_PAGES[pageKey]) {
    if (window.IfluxAuth && !IfluxAuth.requireAuth()) return null;
  }

  if (window.IfluxGuestShell && IfluxGuestShell.bootstrapPage) {
    await new Promise(function (resolve) {
      var done = false;
      function finish() { if (!done) { done = true; resolve(); } }
      try {
        IfluxGuestShell.bootstrapPage(pageKey, finish);
      } catch (e) { finish(); }
      /* An toàn: không để shell-boot treo nếu callback không được gọi. */
      setTimeout(finish, 4000);
    });
  } else if (pageKey === 'dashboard' || pageKey === 'home') {
    if (window.IfluxAuth && !IfluxAuth.requireAuth()) return null;
  }

  booted = { pageKey: pageKey };
  return booted;
}

export async function ensureScript(src) {
  return loadScript(src);
}
