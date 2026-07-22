/**
 * WGT-GROUP-PAGE — Composite chi tiết nhóm (ngành / họ CP / chủ đề)
 * Page Feature: header/chart/tabs → Layout Engine mount placements vào Host sidebar + trading.
 */
import { loadScriptTiers, loadScript } from '../../runtime/legacy-bridge.js?v=phaseCW420260721';
import { mountPublishedWidgets } from '../../runtime/mount-published-widgets.js?v=phase4Pub20260716b';

var ASSET = '/User_Web/iflux-web-ui/';
var ADMIN = '/Admin_Design_system/iflux-admin-ui/';
var P4_VER = 'phase4Pub20260716b';

export const meta = { id: 'WGT-GROUP-PAGE', title: 'Chi tiết nhóm' };

var KIND_BY_PAGE = {
  sector: 'sector',
  family: 'family',
  cauChuyenDetail: 'cau-chuyen',
  chuDeDetail: 'cau-chuyen'
};

var PUBLISH_BY_KIND = {
  sector: 'sector-detail',
  family: 'eco-detail',
  'cau-chuyen': 'cau-chuyen-detail',
  'chu-de': 'chu-de-detail'
};

/* W4: taxonomy/seeds/mock/registry/seo = Shell MARKET_PLATFORM */
var CORE_TIERS = [
  [
    ADMIN + 'iflux-admin-ui.js',
    ASSET + 'iflux-user-data-sync.js',
    'https://cdn.jsdelivr.net/npm/apexcharts@3.54.0/dist/apexcharts.min.js'
  ],
  [
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
  /* AS-SEARCH: App Shell Entry (shell-boot) — không tải từ composite. */
  if (window.IfluxWebUI && IfluxWebUI.syncTopnav) IfluxWebUI.syncTopnav();
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
