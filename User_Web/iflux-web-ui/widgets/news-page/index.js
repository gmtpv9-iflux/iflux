/**
 * WGT-NEWS-PAGE — Composite Cộng đồng
 *
 * Phase C W3: Feature Manifest + Runtime (NOT_LOADED→READY→DISPOSED).
 * W1/W2: Shell owns templates + market platform — không trong modules[].
 */
import { createFeatureRuntime } from '../../runtime/feature-runtime.js?v=r20260928q';
import { mountPageWidgets } from '../../runtime/page-widgets.js?v=r20260929e';
import { buildPageFrame } from '../../runtime/app-shell.js?v=appHeader20260928';
import featureManifest from '../../features/news.manifest.js?v=r20261002c';

export const meta = { id: 'WGT-NEWS-PAGE', title: 'Tin tức' };

var featureRt = null;

/** Trang con Tin tức có cấu hình Widget Placement riêng (Admin: news-topic / news-cat / news-author). */
function publishKeyForPath() {
  var path = String((typeof location !== 'undefined' && location.pathname) || '');
  if (/^\/(tin-tuc|cong-dong)\/chu-de\/[^/]+/.test(path)) return 'news-topic';
  if (/^\/(tin-tuc|cong-dong)\/danh-muc\/[^/]+/.test(path)) return 'news-cat';
  if (/^\/(tin-tuc|cong-dong)\/tac-gia\/[^/]+/.test(path)) return 'news-author';
  return 'news';
}

function mountFromHostTree(root) {
  return mountPageWidgets(root, publishKeyForPath(), { gateKey: 'news' });
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
  /* Bridge khung trang chung cho news-page.js (IIFE) — renderShell() dựng qua buildPageFrame. */
  window.IfluxRuntimeSections = { buildPageFrame: buildPageFrame };
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
