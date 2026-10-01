/**
 * WGT-STOCK-PAGE — Composite chi tiết cổ phiếu
 * Phase C W3: Feature Manifest + Runtime State Machine.
 */
import { createFeatureRuntime } from '../../runtime/feature-runtime.js?v=r20260928q';
import { mountPageWidgets } from '../../runtime/page-widgets.js?v=r20260929e';
import { buildPageFrame } from '../../runtime/app-shell.js?v=appHeader20260928';
import featureManifest from '../../features/stock.manifest.js?v=r20261002a';

var PUBLISH_KEY = 'stock-detail';
var featureRt = null;

export const meta = { id: 'WGT-STOCK-PAGE', title: 'Chi tiết cổ phiếu' };

function mountFromHostTree(root) {
  return mountPageWidgets(root, PUBLISH_KEY);
}

export async function mount(el) {
  el.innerHTML = '<div data-ifx-stock-page></div>';
  featureRt = createFeatureRuntime(featureManifest);
  await featureRt.boot({
    init: function () {
      if (window.IfluxWebUI && IfluxWebUI.syncTopnav) IfluxWebUI.syncTopnav();
    }
  });
  /* Bridge khung trang chung cho script trang (IIFE) — render() dựng qua buildPageFrame. */
  window.IfluxRuntimeSections = { buildPageFrame: buildPageFrame };
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
