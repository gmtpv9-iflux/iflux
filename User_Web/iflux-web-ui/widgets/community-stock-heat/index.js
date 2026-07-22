/**
 * WGT-COM-001 — Heatmap cổ phiếu cộng đồng (ESM)
 * Cùng luồng Widget khác: ensureSequence deps → mount producer.
 * Template SoT: TMP-COM-STOCK-HEAT → Implementation community-stock-heat.
 */
import { ensureSequence, loadStyles } from '../../runtime/legacy-bridge.js?v=phaseCW420260721';

var ASSET = '/User_Web/iflux-web-ui/';
var V = 'comStockHeat20260722b';

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
    ASSET + 'block-templates.css',
    ASSET + 'watchlist.css'
  ]);

  await ensureSequence([
    { global: 'IfluxMockMarket', src: ASSET + 'mock-market.js' },
    { global: 'IfluxCommunityStore', src: ASSET + 'community-store.js' },
    { global: 'IfluxWatchlistStore', src: ASSET + 'watchlist-store.js' },
    { global: 'IfluxSquarifiedTreemap', src: ASSET + 'squarified-treemap.js' },
    { global: 'IfluxWatchlistUI', src: ASSET + 'watchlist-ui.js' },
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
