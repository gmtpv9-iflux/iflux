/**
 * WGT-COM-CHUDE-TOP — Chủ đề tích cực hàng đầu (ESM lazy Widget module)
 * User Web phải mount module Widget này (không render thẳng Template).
 */
import { loadScriptTiers } from '../../runtime/legacy-bridge.js?v=phaseCW420260721';

var ASSET = '/User_Web/iflux-web-ui/';

export const meta = {
  id: 'WGT-COM-CHUDE-TOP',
  title: 'Chủ đề tích cực hàng đầu'
};

/** Giữ nguyên URL deps; nhóm tiers theo pattern Blueprint (community-page / flow-page). */
var DEPS_TIERS = [
  [
    /* W4: seo-url = Shell trên community */
    ASSET + 'community-store.js',
    ASSET + 'watchlist-store.js?v=followFound20260724'
  ],
  [
    '/Admin_Design_system/iflux-admin-ui/foundation/heart-action.js?v=followFound20260724'
  ],
  [
    ASSET + 'community-trending.js?v=mockRmWp1_20260809'
  ]
];

export async function mount(el, ctx) {
  if (!el) return;
  ctx = ctx || {};
  var config = Object.assign(
    { storyOnly: true, limit: 5, period: 'week' },
    (ctx.slot && ctx.slot.config) || {},
    ctx.config || {}
  );
  await loadScriptTiers(DEPS_TIERS);
  if (!window.IfluxCommunityTrending) {
    el.innerHTML = '<div class="ifx-wl-empty">Thiếu community-trending.js</div>';
    return;
  }
  window.IfluxCommunityTrending.mountInto(el, {
    storyOnly: true,
    /* limit/period mặc định lấy từ Tầng 4 (top_n); config slot có thể override */
    limit: config.limit,
    period: config.period || 'week'
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
