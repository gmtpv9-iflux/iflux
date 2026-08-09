/**
 * Widget WGT-WAT-001 — Watchlist (ESM lazy module, dedicated /home)
 * Nạp on-demand: watchlist store/ui/taxonomy/block + Master/Quotes + renderers.
 * KHÔNG nạp dashboard-engine / chat / affiliate / community.
 */

import { ensureSequence } from '../../runtime/legacy-bridge.js?v=phaseCW420260721';

var ASSET = '/User_Web/iflux-web-ui/';
var V = 'mockRmWp3_20260809';
var FOUNDATION = '/Admin_Design_system/iflux-admin-ui/foundation/';

export const meta = { id: 'WGT-WAT-001', title: 'Theo dõi' };

export async function mount(el, ctx) {
  ctx = ctx || {};
  await ensureSequence([
    { global: 'IfluxMarketMaster', src: ASSET + 'iflux-market-master.js?v=' + V },
    { global: 'IfluxMarketQuotes', src: ASSET + 'iflux-market-quotes.js?v=' + V },
    /* W1/OI-H2: IfluxBlockTemplates do Shell — skip list Feature */
    { global: 'IfluxWatchlistTaxonomy', src: ASSET + 'watchlist-taxonomy.js?v=' + V },
    { global: 'IfluxWatchlistStore', src: ASSET + 'watchlist-store.js?v=' + V },
    { global: 'IfluxHeartAction', src: FOUNDATION + 'heart-action.js?v=' + V },
    { global: 'IfluxWatchlistUI', src: ASSET + 'watchlist-ui.js?v=' + V },
    { global: 'IfluxWatchlistBlock', src: ASSET + 'watchlist-block.js?v=' + V },
    { global: 'IfluxWidgetRegistry', src: ASSET + 'widget-registry.js?v=' + V },
    { global: 'IfluxWidgetRenderers', src: ASSET + 'widget-renderers.js?v=mockRmWp4_20260809' }
  ]);

  try {
    if (window.IfluxWatchlistStore && IfluxWatchlistStore.ensureSeedFromDemo) {
      IfluxWatchlistStore.ensureSeedFromDemo();
    }
  } catch (e) { /* ignore */ }

  var cfg = (ctx.slot && ctx.slot.config) || {};
  window.IfluxWidgetRenderers.render('WGT-WAT-001', el, {
    withHead: cfg.withHead !== false,
    title: cfg.title || 'Theo dõi',
    description: cfg.description || 'Danh sách mã do user chủ động theo dõi — không qua công thức hệ thống.'
  });

  function onChange() {
    if (window.IfluxWatchlistBlock) IfluxWatchlistBlock.refreshAll();
  }
  document.addEventListener('iflux-watchlist-change', onChange);

  return {
    unmount: function () {
      document.removeEventListener('iflux-watchlist-change', onChange);
      if (el) el.innerHTML = '';
    }
  };
}

export function unmount(el) {
  if (el) el.innerHTML = '';
}
