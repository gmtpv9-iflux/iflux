/**
 * Widget WGT-WAT-001 — Watchlist (ESM lazy module, dedicated /home)
 * Nạp on-demand: watchlist store/ui/taxonomy/block + mock-market + renderers.
 * KHÔNG nạp dashboard-engine / chat / affiliate / community.
 */

import { ensureSequence } from '../../runtime/legacy-bridge.js?v=lazyAll20260713k';

var ASSET = '/User_Web/iflux-web-ui/';

export const meta = { id: 'WGT-WAT-001', title: 'Watchlist' };

export async function mount(el, ctx) {
  ctx = ctx || {};
  await ensureSequence([
    { global: 'IfluxSeoUrl', src: ASSET + 'seo-url.js' },
    { global: 'IfluxMockMarket', src: ASSET + 'mock-market.js' },
    { global: 'IfluxBlockTemplates', src: ASSET + 'block-templates.js' },
    { global: 'IfluxWatchlistTaxonomy', src: ASSET + 'watchlist-taxonomy.js' },
    { global: 'IfluxWatchlistStore', src: ASSET + 'watchlist-store.js' },
    { global: 'IfluxWatchlistUI', src: ASSET + 'watchlist-ui.js' },
    { global: 'IfluxWatchlistBlock', src: ASSET + 'watchlist-block.js' },
    { global: 'IfluxWidgetRegistry', src: ASSET + 'widget-registry.js' },
    { global: 'IfluxWidgetRenderers', src: ASSET + 'widget-renderers.js' }
  ]);

  try {
    if (window.IfluxWatchlistStore && IfluxWatchlistStore.ensureSeedFromDemo) {
      IfluxWatchlistStore.ensureSeedFromDemo();
    }
  } catch (e) { /* ignore */ }

  var cfg = (ctx.slot && ctx.slot.config) || {};
  window.IfluxWidgetRenderers.render('WGT-WAT-001', el, {
    withHead: cfg.withHead !== false,
    title: cfg.title || 'Watchlist',
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
