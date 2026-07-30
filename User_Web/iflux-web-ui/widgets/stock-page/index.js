/**
 * WGT-STOCK-PAGE — Composite chi tiết cổ phiếu
 * Phase C W3: Feature Manifest + Runtime State Machine.
 */
import { createFeatureRuntime } from '../../runtime/feature-runtime.js?v=phaseCW5gate20260721';
import { mountPublishedWidgets } from '../../runtime/mount-published-widgets.js?v=phase4Pub20260716b';
import featureManifest from '../../features/stock.manifest.js?v=feedDto20260724';

var PUBLISH_KEY = 'stock-detail';
var featureRt = null;

export const meta = { id: 'WGT-STOCK-PAGE', title: 'Chi tiết cổ phiếu' };

async function mountFromHostTree(root) {
  if (!root || !window.IfluxPageLayoutEngine) {
    if (window.console && console.warn) {
      console.warn('[WGT-STOCK-PAGE] thiếu Layout Engine');
    }
    return;
  }
  var tree = await IfluxPageLayoutEngine.buildHostTree(root, PUBLISH_KEY);
  if (!tree || !tree.length) {
    if (window.console && console.warn) {
      console.warn('[WGT-STOCK-PAGE] Host Tree rỗng — chưa có placements Published');
    }
    return;
  }
  await mountPublishedWidgets(tree, { logPrefix: '[WGT-STOCK-PAGE]' });
}

export async function mount(el) {
  el.innerHTML = '<div data-ifx-stock-page></div>';
  featureRt = createFeatureRuntime(featureManifest);
  await featureRt.boot({
    init: function () {
      if (window.IfluxWebUI && IfluxWebUI.syncTopnav) IfluxWebUI.syncTopnav();
    }
  });
  if (window.IfluxAuth && !IfluxAuth.requireAuth()) {
    featureRt.dispose();
    featureRt = null;
    return { unmount: function () { if (el) el.innerHTML = ''; } };
  }
  /* Entity Tin tức — FeedCard theo ticker (Data Provider), không dump posts?limit=100 */
  if (window.IfluxCommunityApiBridge && IfluxCommunityApiBridge.loadEntityFeed) {
    var tk = (window.IfluxSeoUrl && IfluxSeoUrl.parseStockTicker && IfluxSeoUrl.parseStockTicker())
      || (window.IfluxStockPage && IfluxStockPage.currentTicker)
      || null;
    try {
      await IfluxCommunityApiBridge.loadEntityFeed({ ticker: tk || undefined, limit: 20 });
    } catch (eHyd) { /* seed fallback */ }
  }
  if (window.IfluxStockPage) IfluxStockPage.init();
  function onRemount() {
    mountFromHostTree(el);
  }
  function onPlans() {
    mountFromHostTree(el);
  }
  await mountFromHostTree(el);
  document.addEventListener('iflux-knowledge-remount-widgets', onRemount);
  document.addEventListener('iflux-plans-updated', onPlans);
  return {
    unmount: function () {
      document.removeEventListener('iflux-knowledge-remount-widgets', onRemount);
      document.removeEventListener('iflux-plans-updated', onPlans);
      if (featureRt) {
        featureRt.dispose();
        featureRt = null;
      }
      if (el) el.innerHTML = '';
    }
  };
}

export function unmount(el) {
  if (featureRt) {
    try { featureRt.dispose(); } catch (e) { /* ignore */ }
    featureRt = null;
  }
  if (el) el.innerHTML = '';
}
