/**
 * WGT-NEWS-PAGE — Composite Cộng đồng
 *
 * Phase C W3: Feature Manifest + Runtime (NOT_LOADED→READY→DISPOSED).
 * W1/W2: Shell owns templates + market platform — không trong modules[].
 */
import { createFeatureRuntime } from '../../runtime/feature-runtime.js?v=8e1baf6d7a';
import { mountPageWidgets } from '../../runtime/page-widgets.js?v=3313b52579';
import { buildPageFrame } from '../../runtime/app-shell.js?v=7b8f128322';
import featureManifest from '../../features/news.manifest.js?v=f5933d60a6';

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
  if (new URLSearchParams(location.search).get('view') === 'group') return Promise.resolve([]);
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
  var mobile = !!(window.IfluxBreakpoint && window.IfluxBreakpoint.isMobileShell && window.IfluxBreakpoint.isMobileShell());

  /* Mobile (Bottom Nav Cấp 2) — Sidebar trái (Widget Host, Owner tự cấu hình qua Cài đặt trang >
     Widget Placement > Tin tức > Sidebar trái — hiển thị ở Cấp 2 với nhãn "Thịnh hành") chỉ mount
     khi region 'sidebar-left' được chọn LẦN ĐẦU — không mount/fetch trước khi user bấm. ĐĂNG KÝ
     LISTENER TRƯỚC applyCommunity() bên dưới — cold-load thẳng URL có ?view=sidebar-left khiến
     applyCommunity()->boot() tự phát 'iflux-level2-change' ĐỒNG BỘ ngay trong lúc chạy (qua
     applyViewFromUrl() — news-page.js); nếu đăng ký SAU, listener chưa tồn tại lúc event bắn ra
     → bỏ lỡ (y hệt bug đã gặp + đã sửa ở Cộng đồng). Desktop/tablet giữ nguyên hành vi CŨ: mount
     ngay, không qua cơ chế này. */
  var sidebarMounted = false;
  var onLevel2Change = null;
  if (mobile) {
    onLevel2Change = function (e) {
      var d = (e && e.detail) || {};
      if (sidebarMounted || indexOnly || d.regionKey !== 'sidebar-left') return;
      sidebarMounted = true;
      mountFromHostTree(el);
    };
    document.addEventListener('iflux-level2-change', onLevel2Change);
  }

  function onPlans() {
    applyCommunity(el);
    if (!indexOnly && !mobile) mountFromHostTree(el);
  }
  function onRemount() {
    if (!indexOnly && !mobile) mountFromHostTree(el);
  }
  applyCommunity(el);
  if (!indexOnly && !mobile) await mountFromHostTree(el);
  document.addEventListener('iflux-plans-updated', onPlans);
  document.addEventListener('iflux-news-remount-widgets', onRemount);
  return {
    unmount: function () {
      document.removeEventListener('iflux-plans-updated', onPlans);
      document.removeEventListener('iflux-news-remount-widgets', onRemount);
      if (onLevel2Change) document.removeEventListener('iflux-level2-change', onLevel2Change);
      if (window.IfluxNewsPage && IfluxNewsPage.dispose) IfluxNewsPage.dispose();
      el.querySelectorAll('[data-ifx-feed-key]').forEach(function (pane) { if (window.IfluxDailyFeed) IfluxDailyFeed.dispose(pane); });
      document.querySelectorAll('.ifx-app-header[data-ifx-header-mode="news-group"]').forEach(function (header) {
        header.removeAttribute('data-ifx-header-mode');
        if (header._ifxSyncContextBack) header._ifxSyncContextBack();
      });
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
