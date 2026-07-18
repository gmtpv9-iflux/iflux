/**
 * WGT-COM-001 — Heatmap cổ phiếu cộng đồng (ESM lazy Widget module)
 */
import { loadScriptTiers } from '../../runtime/legacy-bridge.js?v=lazyAll20260713k';

var ASSET = '/User_Web/iflux-web-ui/';

export const meta = {
  id: 'WGT-COM-001',
  title: 'Cổ phiếu được quan tâm hàng đầu'
};

/** Giữ nguyên URL deps; nhóm tiers theo pattern Blueprint (community-page / flow-page). */
var DEPS_TIERS = [
  [
    ASSET + 'seo-url.js',
    ASSET + 'community-store.js',
    ASSET + 'watchlist-store.js',
    ASSET + 'squarified-treemap.js',
    ASSET + 'block-templates.js'
  ],
  [
    ASSET + 'watchlist-ui.js'
  ],
  [
    ASSET + 'community-trending.js?v=span61220260714'
  ]
];

export async function mount(el, ctx) {
  if (!el) return;
  ctx = ctx || {};
  var config = Object.assign({ stocksOnly: true }, (ctx.slot && ctx.slot.config) || {}, ctx.config || {});
  await loadScriptTiers(DEPS_TIERS);
  if (!window.IfluxCommunityTrending) {
    el.innerHTML = '<div class="ifx-wl-empty">Thiếu community-trending.js</div>';
    return;
  }
  window.IfluxCommunityTrending.mountInto(el, {
    stocksOnly: true,
    limit: config.limit
  });
  return {
    unmount: function () {
      if (el) el.innerHTML = '';
    }
  };
}

export function unmount(el) {
  if (el) el.innerHTML = '';
}
