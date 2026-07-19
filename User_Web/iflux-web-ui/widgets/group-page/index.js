/**
 * WGT-GROUP-PAGE — Composite chi tiết nhóm (ngành / họ CP / chủ đề)
 * Page Feature: header/chart/tabs → Layout Engine mount placements vào Host sidebar + trading.
 */
import { loadScriptTiers, loadScript } from '../../runtime/legacy-bridge.js?v=lazyAll20260713k';
import { mountPublishedWidgets } from '../../runtime/mount-published-widgets.js?v=phase4Pub20260716b';

var ASSET = '/User_Web/iflux-web-ui/';
var ADMIN = '/Admin_Design_system/iflux-admin-ui/';
var P4_VER = 'phase4Pub20260716b';

export const meta = { id: 'WGT-GROUP-PAGE', title: 'Chi tiết nhóm' };

var KIND_BY_PAGE = {
  sector: 'sector',
  family: 'family',
  chuDeDetail: 'chu-de'
};

var PUBLISH_BY_KIND = {
  sector: 'sector-detail',
  family: 'eco-detail',
  'chu-de': 'chu-de-detail'
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
    ASSET + 'group-page.js',
    ASSET + 'runtime/page-layout-engine.js?v=' + P4_VER
  ]
];

function resolveKind(ctx) {
  var slot = (ctx && ctx.slot) || {};
  var cfg = slot.config || (ctx && ctx.config) || {};
  if (cfg.kind) return cfg.kind;
  var pk = (ctx && ctx.pageKey) || '';
  return KIND_BY_PAGE[pk] || 'sector';
}

function publishKeyForKind(kind) {
  return PUBLISH_BY_KIND[kind] || 'sector-detail';
}

async function mountFromHostTree(root, publishKey) {
  if (!root || !window.IfluxPageLayoutEngine) {
    if (window.console && console.warn) {
      console.warn('[WGT-GROUP-PAGE] thiếu Layout Engine');
    }
    return;
  }
  var tree = await IfluxPageLayoutEngine.buildHostTree(root, publishKey);
  if (!tree || !tree.length) {
    if (window.console && console.warn) {
      console.warn('[WGT-GROUP-PAGE] Host Tree rỗng — chưa có placements Published:', publishKey);
    }
    return;
  }
  await mountPublishedWidgets(tree, { logPrefix: '[WGT-GROUP-PAGE/' + publishKey + ']' });
}

export async function mount(el, ctx) {
  var kind = resolveKind(ctx);
  var publishKey = publishKeyForKind(kind);
  el.innerHTML = '<div data-ifx-group-page></div>';
  await loadScriptTiers(CORE_TIERS);
  loadScript(ASSET + 'iflux-header-search.js').then(function () {
    if (window.IfluxWebUI && IfluxWebUI.syncTopnav) IfluxWebUI.syncTopnav();
    if (window.IfluxHeaderSearch && IfluxHeaderSearch.init) IfluxHeaderSearch.init();
  });
  if (window.IfluxAuth && !IfluxAuth.requireAuth()) return { unmount: function () { if (el) el.innerHTML = ''; } };
  if (window.IfluxGroupPage) IfluxGroupPage.init(kind);
  function onRemount() {
    mountFromHostTree(el, publishKey);
  }
  function onPlans() {
    mountFromHostTree(el, publishKey);
  }
  await mountFromHostTree(el, publishKey);
  document.addEventListener('iflux-knowledge-remount-widgets', onRemount);
  document.addEventListener('iflux-plans-updated', onPlans);
  return {
    unmount: function () {
      document.removeEventListener('iflux-knowledge-remount-widgets', onRemount);
      document.removeEventListener('iflux-plans-updated', onPlans);
      if (el) el.innerHTML = '';
    }
  };
}

export function unmount(el) {
  if (el) el.innerHTML = '';
}
