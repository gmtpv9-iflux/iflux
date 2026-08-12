/**
 * WGT-COM-001 — Heatmap cổ phiếu cộng đồng (ESM)
 * Heart = Foundation; Store = Watchlist data — không load watchlist-ui.
 */
import { ensureSequence, loadStyles } from '../../runtime/legacy-bridge.js?v=stickyFix20260811';

var ASSET = '/User_Web/iflux-web-ui/';
var FOUNDATION = '/Admin_Design_system/iflux-admin-ui/foundation/';
var V = 'mockRmWp1_20260809';

export const meta = {
  id: 'WGT-COM-001',
  templateId: 'TMP-COM-STOCK-HEAT',
  title: 'Cổ phiếu được quan tâm hàng đầu'
};

export async function mount(el, ctx) {
  if (!el) return;
  ctx = ctx || {};
  var config = Object.assign({ stocksOnly: true }, (ctx.slot && ctx.slot.config) || {}, ctx.config || {});

  await loadStyles([
    ASSET + 'community.css',
    ASSET + 'block-templates.css'
  ]);

  await ensureSequence([
    { global: 'IfluxMarketMaster', src: ASSET + 'iflux-market-master.js?v=' + V },
    { global: 'IfluxMarketQuotes', src: ASSET + 'iflux-market-quotes.js?v=' + V },
    { global: 'IfluxCommunityStore', src: ASSET + 'community-store.js' },
    { global: 'IfluxWatchlistStore', src: ASSET + 'watchlist-store.js?v=' + V },
    { global: 'IfluxHeartAction', src: FOUNDATION + 'heart-action.js?v=' + V },
    { global: 'IfluxSquarifiedTreemap', src: ASSET + 'squarified-treemap.js' },
    { global: 'IfluxCommunityTrending', src: ASSET + 'community-trending.js?v=' + V }
  ]);

  if (!window.IfluxCommunityTrending || typeof IfluxCommunityTrending.mountInto !== 'function') {
    el.innerHTML = '<div class="ifx-wl-empty">Thiếu community-trending.js</div>';
    return;
  }
  if (!window.IfluxSquarifiedTreemap) {
    el.innerHTML = '<div class="ifx-wl-empty">Thiếu squarified-treemap.js</div>';
    return;
  }

  IfluxCommunityTrending.mountInto(el, {
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
