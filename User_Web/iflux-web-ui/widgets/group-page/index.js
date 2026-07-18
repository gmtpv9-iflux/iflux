/**
 * WGT-GROUP-PAGE — Composite chi tiết nhóm (ngành / họ CP / chủ đề)
 * config.kind | pageKey → IfluxGroupPage.init(source).
 */
import { loadScriptTiers, loadScript } from '../../runtime/legacy-bridge.js?v=lazyAll20260713k';

var ASSET = '/User_Web/iflux-web-ui/';
var ADMIN = '/Admin_Design_system/iflux-admin-ui/';

export const meta = { id: 'WGT-GROUP-PAGE', title: 'Chi tiết nhóm' };

var KIND_BY_PAGE = {
  sector: 'sector',
  family: 'family',
  chuDeDetail: 'chu-de'
};

var CORE_TIERS = [
  [
    ADMIN + 'iflux-admin-ui.js',
    ASSET + 'iflux-user-data-sync.js',
    ADMIN + 'iflux-market-registry-store.js',
    ASSET + 'watchlist-taxonomy.js',
    ASSET + 'block-templates.js',
    'https://cdn.jsdelivr.net/npm/apexcharts@3.54.0/dist/apexcharts.min.js'
  ],
  [
    ADMIN + 'iflux-market-seed-data.js',
    ADMIN + 'iflux-market-ecosystem-seeds.js',
    ASSET + 'seo-url.js'
  ],
  [
    ASSET + 'mock-market.js',
    ASSET + 'watchlist-store.js',
    ASSET + 'stock-store.js',
    ASSET + 'community-store.js'
  ],
  [
    ASSET + 'watchlist-ui.js',
    ASSET + 'community-ui.js',
    ASSET + 'stock-mentions.js',
    ASSET + 'stock-comments-ui.js',
    ASSET + 'entity-timeline-feed.js',
    ASSET + 'community-daily-feed.js',
    ASSET + 'market-liquidity.js'
  ],
  [
    ASSET + 'entity-detail-center.js',
    ASSET + 'group-page.js'
  ]
];

function resolveKind(ctx) {
  var slot = (ctx && ctx.slot) || {};
  var cfg = slot.config || (ctx && ctx.config) || {};
  if (cfg.kind) return cfg.kind;
  var pk = (ctx && ctx.pageKey) || '';
  return KIND_BY_PAGE[pk] || 'sector';
}

export async function mount(el, ctx) {
  var kind = resolveKind(ctx);
  el.innerHTML = '<div data-ifx-group-page></div>';
  await loadScriptTiers(CORE_TIERS);
  loadScript(ASSET + 'iflux-header-search.js').then(function () {
    if (window.IfluxWebUI && IfluxWebUI.syncTopnav) IfluxWebUI.syncTopnav();
    if (window.IfluxHeaderSearch && IfluxHeaderSearch.init) IfluxHeaderSearch.init();
  });
  if (window.IfluxAuth && !IfluxAuth.requireAuth()) return { unmount: function () { if (el) el.innerHTML = ''; } };
  if (window.IfluxGroupPage) IfluxGroupPage.init(kind);
  return {
    unmount: function () { if (el) el.innerHTML = ''; }
  };
}

export function unmount(el) {
  if (el) el.innerHTML = '';
}
