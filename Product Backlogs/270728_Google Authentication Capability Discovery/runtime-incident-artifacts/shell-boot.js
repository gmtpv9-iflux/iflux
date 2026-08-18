/* ===== IFX-AUDIT-BEGIN =====
AUDIT-ID: T5A-IGNORE-002
Priority: IGNORE
STATUS: IGNORE
OWNER: Runtime
Candidate Owner: Runtime
Usage audit: N/A
Dep động: N/A
Migration ROI: 1
Khả năng bỏ load: Không
P1 Gate: N/A
Refs: Task5 PhaseA — không audit / không tối ưu
===== IFX-AUDIT-END ===== */
/**
 * iFlux Runtime — Shell Boot (ESM)
 * Nạp tối thiểu App Shell deps: Router, Auth, Guest shell, Entitlements, header UI.
 * KHÔNG nạp widget implementation.
 */

import { loadScript } from './legacy-bridge.js?v=phaseCW420260721';

var ASSET = '/User_Web/iflux-web-ui/';
var ADMIN = '/Admin_Design_system/';
var ADMIN_UI = '/Admin_Design_system/iflux-admin-ui/';
var MARKET_PLATFORM_VER = 'metaSotB20260725';
var booted = null;

/**
 * W2/W4 — Platform market đầy đủ (seed + registry + mock + SEO).
 * Cộng đồng / bài viết / viết bài / bình luận: không nằm đây — MARKET_CORE (RC-IR-05).
 */
var MARKET_PLATFORM_PAGES = {
  stock: 1, flow: 1,
  market: 1,
  stocks: 1, sectors: 1, ecosystems: 1, chuDe: 1, cauChuyen: 1,
  sector: 1, family: 1, chuDeDetail: 1, cauChuyenDetail: 1,
  watchlist: 1, search: 1, messages: 1,
  account: 1, checkout: 1, stockComment: 1
};

/**
 * Task5 Lazy L08 — Cộng đồng + Comments + Nhà: taxonomy + mock + SEO (không seed registry).
 * Seed / ecosystem / registry chỉ khi Search mở (ensureDeps) hoặc vào trang market.
 * Nhà: chrome nav không phụ thuộc seed — widget dashboard lazy dep riêng.
 */
var MARKET_CORE_PAGES = {
  community: 1,
  communityPost: 1,
  communityWrite: 1,
  comments: 1,
  home: 1,
  dashboard: 1
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

/**
 * Task5 Lazy L07 — stub Search: Focus / ⌘K mới tải iflux-header-search.js.
 * Không await lúc bootShell (không chặn Critical Path).
 */
function installHeaderSearchLazy(scriptSrc) {
  if (window.__ifxHeaderSearchLazyInstalled) return;
  window.__ifxHeaderSearchLazyInstalled = true;

  var loadPromise = null;

  function loadModule() {
    if (window.IfluxHeaderSearch) {
      window.__ifxHeaderSearchReady = true;
      return Promise.resolve(window.IfluxHeaderSearch);
    }
    if (loadPromise) return loadPromise;
    loadPromise = loadScript(scriptSrc).then(function () {
      if (window.IfluxHeaderSearch && IfluxHeaderSearch.init) {
        IfluxHeaderSearch.init();
      }
      window.__ifxHeaderSearchReady = true;
      return window.IfluxHeaderSearch;
    });
    return loadPromise;
  }

  function focusSearchInput() {
    var input = document.querySelector('[data-ifx-header-search] input');
    if (!input) return;
    try {
      input.removeAttribute('readonly');
      input.focus();
      input.select();
    } catch (e) { /* ignore */ }
  }

  /* ⌘K / Ctrl+K — tải module rồi focus (module tự mở recent khi focus). */
  document.addEventListener('keydown', function (e) {
    if (!((e.ctrlKey || e.metaKey) && String(e.key || '').toLowerCase() === 'k')) return;
    if (window.__ifxHeaderSearchReady && window.IfluxHeaderSearch) return;
    e.preventDefault();
    e.stopPropagation();
    loadModule().then(function () {
      focusSearchInput();
      /* Focus lại để listener showRecent trong module chạy. */
      setTimeout(focusSearchInput, 0);
    });
  }, true);

  /* Focus / click / touch vào ô tìm — tải lần đầu, không chặn event. */
  function onSearchIntent(e) {
    if (window.__ifxHeaderSearchReady) return;
    var wrap = e.target && e.target.closest && e.target.closest('[data-ifx-header-search]');
    if (!wrap) return;
    loadModule().then(function () {
      setTimeout(focusSearchInput, 0);
    });
  }

  document.addEventListener('focusin', onSearchIntent, true);
  document.addEventListener('mousedown', onSearchIntent, true);
  document.addEventListener('touchstart', onSearchIntent, true);
}

export async function bootShell(pageKey) {
  /* Nếu module còn booted nhưng window globals đã mất (soft-nav) → boot lại. */
  if (booted && !(window.IfluxGuestShell && window.PlansRuntimeReader && window.IfluxRoutes)) {
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

  /*
   * Phase Chrome (giống mọi trang App Shell — kể cả Nhà):
   * Chỉ Routes + Api + Auth → paint topnav ngay (appOnly «Nhà của tôi» nếu đã login).
   * Cấm chờ MARKET_CORE / entitlements / web-ui trước khi có menu.
   */
  await ensureParallel([
    { global: 'IfluxRoutes', src: ASSET + 'iflux-platform-boot.js?v=navSlice4ux_20260727' },
    { global: 'IfluxApiClient', src: ASSET + 'iflux-api-bundle.js' },
    { global: 'IfluxAuth', src: ASSET + 'auth.js?v=regSoT_20260728' }
  ]);
  if (window.IfluxAppShellHeader && IfluxAppShellHeader.render) {
    try { IfluxAppShellHeader.render(); } catch (eChrome) { /* ignore */ }
  }

  // Phần còn lại App Shell — không chặn chrome đã paint.
  // ABH E4/E5 — Runtime readers + pure normalize (no Admin subscription on shell)
  await ensureParallel([
    { global: 'PlansRuntimeReader', src: ASSET + 'readers/plans-runtime-reader.js?v=abhE620260727' },
    { global: 'L4RuntimeReader', src: ASSET + 'readers/l4-runtime-reader.js?v=abhE620260727' },
    { global: 'IfluxEntitlements', src: ASSET + 'iflux-entitlements.js?v=abhE620260727' },
    { global: 'IfluxBlockTemplates', src: ASSET + 'block-templates.js?v=feedCard20260723c' },
    { global: 'IfluxWidgetShell', src: ASSET + 'iflux-widget-shell.js?v=entShell20260720' },
    { global: 'IfluxBlockPaywall', src: ASSET + 'iflux-block-paywall.js?v=entShell20260720' },
    { global: 'IfluxBlockGate', src: ASSET + 'iflux-block-gate.js?v=abhE620260727' },
    { global: 'IfluxGuestShell', src: ASSET + 'iflux-guest-shell.js?v=b4w3_20260727' }
  ]);
  /* Legacy ABH E4/E5 removed — không boot Admin Store / EntitlementCatalog trên User Web shell:
  { global: 'EntitlementCatalog', src: ADMIN + 'app/subscription/entitlement-catalog.js' },
  { global: 'PlatformLayersWidgets', src: ADMIN + 'app/system/platform-layers-widgets.js' },
  { global: 'PlansStore', src: ADMIN + 'app/subscription/plans-store.js' },
  */

  /* W2/W4: Platform market — Shell Runtime Owner (page-gated). */
  if (MARKET_PLATFORM_PAGES[pageKey]) {
    await ensureParallel([
      { global: 'IfluxMarketSeedData', src: ADMIN_UI + 'iflux-market-seed-data.js?v=' + MARKET_PLATFORM_VER },
      { global: 'IfluxMarketEcosystemSeeds', src: ADMIN_UI + 'iflux-market-ecosystem-seeds.js?v=' + MARKET_PLATFORM_VER },
      { global: 'IfluxMarketRegistryStore', src: ADMIN_UI + 'iflux-market-registry-store.js?v=' + MARKET_PLATFORM_VER },
      { global: 'IfluxWatchlistTaxonomy', src: ASSET + 'watchlist-taxonomy.js?v=' + MARKET_PLATFORM_VER },
      { global: 'IfluxMockMarket', src: ASSET + 'mock-market.js?v=' + MARKET_PLATFORM_VER },
      { global: 'IfluxSeoUrl', src: ASSET + 'seo-url.js?v=b5wp1_20260727' }
    ]);
  } else if (MARKET_CORE_PAGES[pageKey]) {
    /* Community + Nhà: bỏ seed/registry khỏi Critical Path. */
    await ensureParallel([
      { global: 'IfluxWatchlistTaxonomy', src: ASSET + 'watchlist-taxonomy.js?v=' + MARKET_PLATFORM_VER },
      { global: 'IfluxMockMarket', src: ASSET + 'mock-market.js?v=' + MARKET_PLATFORM_VER },
      { global: 'IfluxSeoUrl', src: ASSET + 'seo-url.js?v=b5wp1_20260727' }
    ]);
  }

  /* AS-SEARCH — Task5 Lazy L07 */
  if (document.querySelector('[data-ifx-header-search]')) {
    installHeaderSearchLazy(ASSET + 'iflux-header-search.js?v=b4w3_20260727');
  }

  await ensureParallel([
    { global: 'IfluxBreakpoint', src: ADMIN_UI + 'foundation/iflux-breakpoint.js?v=bpSlice3_20260727' },
    { global: 'IfluxWebUI', src: ASSET + 'iflux-web-ui.js?v=bpSlice3_20260727' }
  ]);
  if (window.IfluxWebUI && IfluxWebUI.syncTopnav) IfluxWebUI.syncTopnav();
  /* Tabbar mobile dùng cùng getPrimaryNav — sync sau WebUI, không đổi HTML menu desktop. */
  if (window.IfluxWebUI && IfluxWebUI.syncMobileTabbar) {
    try { IfluxWebUI.syncMobileTabbar(); } catch (eTb) { /* ignore */ }
  }

  try {
    var RETIRED_KEY = 'iflux_stock_comments_v6';
    if (localStorage.getItem(RETIRED_KEY)) {
      localStorage.removeItem(RETIRED_KEY);
      document.dispatchEvent(new CustomEvent('iflux-stock-comments-change'));
    }
  } catch (ePurge) { /* ignore */ }

  if (window.PlansRuntimeReader && PlansRuntimeReader.load) {
    try {
      await PlansRuntimeReader.load();
      if (window.L4RuntimeReader && L4RuntimeReader.load) {
        await L4RuntimeReader.load();
      }
    } catch (e) { /* ignore */ }
  }

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

  /* Re-paint sau auth gate (cùng renderer mọi trang). */
  if (window.IfluxAppShellHeader && IfluxAppShellHeader.render) {
    try { IfluxAppShellHeader.render(); } catch (eNav) { /* ignore */ }
  }

  if (window.IfluxGuestShell && IfluxGuestShell.bootstrapPage) {
    await new Promise(function (resolve) {
      var done = false;
      function finish() { if (!done) { done = true; resolve(); } }
      try {
        IfluxGuestShell.bootstrapPage(pageKey, finish);
      } catch (e) { finish(); }
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
