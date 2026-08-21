/**
 * WGT-NEWS-PAGE — Composite Cộng đồng
 *
 * Phase C W3: Feature Manifest + Runtime (NOT_LOADED→READY→DISPOSED).
 * W1/W2: Shell owns templates + market platform — không trong modules[].
 */
import { createFeatureRuntime } from '../../runtime/feature-runtime.js?v=calFeedFix20260808';
import { mountPublishedWidgets } from '../../runtime/mount-published-widgets.js?v=calFeedFix20260808';
import { ensureSections } from '../../runtime/app-shell.js?v=sidebarVR02_20260811';
import featureManifest from '../../features/news.manifest.js?v=calFeedFix20260808';

export const meta = { id: 'WGT-NEWS-PAGE', title: 'Tin tức' };

var featureRt = null;

async function mountFromHostTree(root) {
  if (!root || !window.IfluxPageLayoutEngine) {
    if (window.console && console.warn) {
      console.warn('[WGT-NEWS-PAGE] thiếu Layout Engine');
    }
    if (window.IfluxNewsPage && IfluxNewsPage.syncEmptyHostChrome) {
      IfluxNewsPage.syncEmptyHostChrome(root);
    }
    return;
  }
  var tree = await IfluxPageLayoutEngine.buildHostTree(root, 'news');
  if (window.IfluxBlockGate && IfluxBlockGate.apply) IfluxBlockGate.apply('news');

  if (tree && tree.length) {
    await mountPublishedWidgets(tree, { logPrefix: '[WGT-NEWS-PAGE]' });
  } else if (window.console && console.warn) {
    console.warn('[WGT-NEWS-PAGE] Host Tree rỗng — chưa có placements Published');
  }

  if (window.IfluxNewsPage && IfluxNewsPage.syncEmptyHostChrome) {
    IfluxNewsPage.syncEmptyHostChrome(root);
  }
}

function isCollectionIndexPath() {
  var path = String((typeof location !== 'undefined' && location.pathname) || '').replace(/\/+$/, '') || '/';
  return (path === '/tin-tuc/chu-de' || path === '/cong-dong/chu-de') ||
    (path === '/tin-tuc/tac-gia' || path === '/cong-dong/tac-gia') ||
    (path === '/tin-tuc/danh-muc' || path === '/cong-dong/danh-muc');
}

function applyCommunity(root) {
  if (window.IfluxNewsPage && IfluxNewsPage.init) IfluxNewsPage.init();
  /* Share Action không preload trên Community — click Share mới load Foundation. */
}

export async function mount(el) {
  el.innerHTML = '<div data-ifx-community-feed></div>';
  /* AppShell Foundation VR-02 (100826): bridge ensureSections() ESM cho
   * news-page.js (legacy IIFE) dựng Right Sidebar canonical trong renderShell(). */
  window.IfluxRuntimeSections = { ensureSections: ensureSections };
  featureRt = createFeatureRuntime(featureManifest);
  await featureRt.boot({
    init: function () {
      /* modules đã nạp — sync shell UI nếu cần */
      if (window.IfluxWebUI && IfluxWebUI.syncTopnav) IfluxWebUI.syncTopnav();
    }
  });

  /* WP-0: không hydrate limit=36 ở đây — Initial Acquisition = IfluxDailyFeed */
  var indexOnly = isCollectionIndexPath();
  function onPlans() {
    applyCommunity(el);
    if (!indexOnly) mountFromHostTree(el);
  }
  function onRemount() {
    if (!indexOnly) mountFromHostTree(el);
  }
  applyCommunity(el);
  if (!indexOnly) await mountFromHostTree(el);
  document.addEventListener('iflux-plans-updated', onPlans);
  document.addEventListener('iflux-news-remount-widgets', onRemount);
  return {
    unmount: function () {
      document.removeEventListener('iflux-plans-updated', onPlans);
      document.removeEventListener('iflux-news-remount-widgets', onRemount);
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
