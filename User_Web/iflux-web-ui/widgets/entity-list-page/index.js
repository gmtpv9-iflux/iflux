/**
 * WGT-ELP-PAGE — Composite danh sách Entity (cổ phiếu / ngành / họ / câu chuyện)
 */
import { loadScriptTiers, loadScript } from '../../runtime/legacy-bridge.js?v=stickyFix20260811';
import { mountPublishedWidgets } from '../../runtime/mount-published-widgets.js?v=phase4Pub20260716b';
import { ensureSections } from '../../runtime/app-shell.js?v=sidebarVR03_20260811';

var ASSET = '/User_Web/iflux-web-ui/';
var ADMIN = '/Admin_Design_system/iflux-admin-ui/';
var P4_VER = 'phase4Pub20260716b';
var ELP_VER = 'sidebarVR03_20260811';
export const meta = { id: 'WGT-ELP-PAGE', title: 'Danh sách entity' };

var KIND_BY_PAGE = {
  stocks: 'stocks',
  sectors: 'sectors',
  ecosystems: 'ecosystems',
  cauChuyen: 'cau-chuyen',
  chuDe: 'cau-chuyen'
};

/* W4: taxonomy/seeds/mock/registry/seo = Shell MARKET_PLATFORM */
var CORE_TIERS = [
  [
    ADMIN + 'iflux-admin-ui.js',
    ASSET + 'iflux-user-data-sync.js'
  ],
  [
    ASSET + 'iflux-market-quotes.js',
    ASSET + 'watchlist-store.js',
    ASSET + 'alert-store.js',
    ADMIN + 'foundation/heart-action.js?v=followFound20260724'
  ],
  [
    ASSET + 'watchlist-ui.js',
    ASSET + 'alert-ui.js',
    ASSET + 'stock-mentions.js',
    ASSET + 'market-heatmap.js?v=mockRmWp4_20260809',
    ASSET + 'market-rankings.js?v=mockRmWp4_20260809',
    ASSET + 'stock-scroll-feed.js'
  ],
  [
    ASSET + 'alert-page.js',
    ASSET + 'entity-list-page.js?v=' + ELP_VER,
    ASSET + 'runtime/page-layout-engine.js?v=' + P4_VER
  ]
];

/* AppShell Foundation VR-03 (100826): Left Sidebar host phải qua ensureSections()
 * canonical (giống Home/Market/Flow/Community) — không tự dựng <aside> bằng HTML cứng. */
var LAYOUT_HTML =
  '<h1 class="ix-page-title" data-elp-title></h1>' +
  '<p class="ifx-page-intro" data-elp-intro></p>' +
  '<div class="ifx-mkt-layout"></div>';

var MAIN_COL_HTML =
  '<div class="ifx-mkt-main">' +
    '<div data-ifx-section="main" data-section="main" data-layout="grid-12"></div>' +
    '<div data-elp-main></div>' +
  '</div>';

function buildElpLayout(el) {
  el.innerHTML = LAYOUT_HTML;
  var layoutRoot = el.querySelector('.ifx-mkt-layout');
  var sections = ensureSections(layoutRoot, {
    sections: [{ key: 'sidebar', label: 'Tổng quan chủ thể' }]
  });
  if (sections.sidebar) sections.sidebar.classList.add('ifx-mkt-sidebar');
  layoutRoot.insertAdjacentHTML('beforeend', MAIN_COL_HTML);
}

function resolveKind(ctx) {
  var slot = (ctx && ctx.slot) || {};
  var cfg = slot.config || (ctx && ctx.config) || {};
  if (cfg.kind) return cfg.kind;
  var pk = (ctx && ctx.pageKey) || '';
  return KIND_BY_PAGE[pk] || 'stocks';
}

function publishKeyForKind(kind) {
  if (kind === 'chu-de' || kind === 'cau-chuyen' || kind === 'stories') return 'cau-chuyen';
  return kind;
}

async function mountFromHostTree(root, publishKey) {
  if (!root || !window.IfluxPageLayoutEngine) {
    if (window.console && console.warn) {
      console.warn('[WGT-ELP-PAGE] thiếu Layout Engine');
    }
    return;
  }
  var tree = await IfluxPageLayoutEngine.buildHostTree(root, publishKey);
  if (!tree || !tree.length) {
    if (window.console && console.warn) {
      console.warn('[WGT-ELP-PAGE] Host Tree rỗng — chưa có placements Published:', publishKey);
    }
    return;
  }
  await mountPublishedWidgets(tree, { logPrefix: '[WGT-ELP-PAGE/' + publishKey + ']' });
}

export async function mount(el, ctx) {
  var kind = resolveKind(ctx);
  var publishKey = publishKeyForKind(kind);
  buildElpLayout(el);
  await loadScriptTiers(CORE_TIERS);
  /* AS-SEARCH: App Shell Entry (shell-boot) — không tải từ composite. */
  if (window.IfluxWebUI && IfluxWebUI.syncTopnav) IfluxWebUI.syncTopnav();
if (window.IfluxAuth && !IfluxAuth.requireAuth()) return { unmount: function () { if (el) el.innerHTML = ''; } };

  if (window.IfluxAlertPage) IfluxAlertPage.init();
  if (window.IfluxEntityListPage) IfluxEntityListPage.init(kind);

  await mountFromHostTree(el, publishKey);
  /* Host trống = Residual Empty PASS — không fallback hardcode sidebar. */
  function onPlans() {
    mountFromHostTree(el, publishKey);
  }
  document.addEventListener('iflux-plans-updated', onPlans);
  return {
    unmount: function () {
      document.removeEventListener('iflux-plans-updated', onPlans);
      if (el) el.innerHTML = '';
    }
  };
}

export function unmount(el) {
  if (el) el.innerHTML = '';
}
