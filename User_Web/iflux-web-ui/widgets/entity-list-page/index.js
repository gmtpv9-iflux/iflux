/**
 * WGT-ELP-PAGE — Composite danh sách Entity (cổ phiếu / ngành / họ / chủ đề)
 * Page Feature: layout sidebar + main → nạp deps theo tầng → IfluxEntityListPage.init(kind).
 */
import { loadScriptTiers, loadScript } from '../../runtime/legacy-bridge.js?v=lazyAll20260713k';

var ASSET = '/User_Web/iflux-web-ui/';
var ADMIN = '/Admin_Design_system/iflux-admin-ui/';

export const meta = { id: 'WGT-ELP-PAGE', title: 'Danh sách entity' };

var KIND_BY_PAGE = {
  stocks: 'stocks',
  sectors: 'sectors',
  ecosystems: 'ecosystems',
  chuDe: 'chu-de'
};

var CORE_TIERS = [
  [
    ADMIN + 'iflux-admin-ui.js',
    ASSET + 'iflux-user-data-sync.js',
    ADMIN + 'iflux-market-registry-store.js',
    ASSET + 'watchlist-taxonomy.js',
    ASSET + 'block-templates.js'
  ],
  [
    ADMIN + 'iflux-market-seed-data.js',
    ADMIN + 'iflux-market-ecosystem-seeds.js',
    ASSET + 'seo-url.js'
  ],
  [
    ASSET + 'mock-market.js',
    ASSET + 'iflux-market-quotes.js',
    ASSET + 'watchlist-store.js',
    ASSET + 'alert-store.js'
  ],
  [
    ASSET + 'watchlist-ui.js',
    ASSET + 'alert-ui.js',
    ASSET + 'stock-mentions.js',
    ASSET + 'squarified-treemap.js',
    ASSET + 'market-heatmap.js',
    ASSET + 'market-rankings.js',
    ASSET + 'stock-scroll-feed.js'
  ],
  [
    ASSET + 'alert-page.js',
    ASSET + 'entity-list-page.js'
  ]
];

var LAYOUT_HTML =
  '<h1 class="ix-page-title" data-elp-title></h1>' +
  '<p class="ifx-page-intro" data-elp-intro></p>' +
  '<div class="ifx-mkt-layout">' +
    '<aside class="ifx-mkt-sidebar" data-elp-sidebar aria-label="Tổng quan chủ thể"></aside>' +
    '<div class="ifx-mkt-main" data-elp-main></div>' +
  '</div>';

function resolveKind(ctx) {
  var slot = (ctx && ctx.slot) || {};
  var cfg = slot.config || (ctx && ctx.config) || {};
  if (cfg.kind) return cfg.kind;
  var pk = (ctx && ctx.pageKey) || '';
  return KIND_BY_PAGE[pk] || 'stocks';
}

export async function mount(el, ctx) {
  var kind = resolveKind(ctx);
  el.innerHTML = LAYOUT_HTML;
  await loadScriptTiers(CORE_TIERS);
  loadScript(ASSET + 'iflux-header-search.js').then(function () {
    if (window.IfluxWebUI && IfluxWebUI.syncTopnav) IfluxWebUI.syncTopnav();
    if (window.IfluxHeaderSearch && IfluxHeaderSearch.init) IfluxHeaderSearch.init();
  });
  if (window.IfluxAuth && !IfluxAuth.requireAuth()) return { unmount: function () { if (el) el.innerHTML = ''; } };
  if (window.IfluxAlertPage) IfluxAlertPage.init();
  if (window.IfluxEntityListPage) IfluxEntityListPage.init(kind);
  return {
    unmount: function () { if (el) el.innerHTML = ''; }
  };
}

export function unmount(el) {
  if (el) el.innerHTML = '';
}
