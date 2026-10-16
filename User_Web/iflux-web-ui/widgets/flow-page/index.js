/**
 * WGT-FLW-PAGE — Composite Dòng tiền
 * Phase C W3: Feature Manifest + Runtime State Machine.
 * Owner 2026-10-15: 3 tab "Thống kê cơ bản/nâng cao/Độc quyền" đổi tên hiển thị thành
 * "Thống kê/Chỉ báo kỹ thuật/Dòng tiền" (badge "Đột phá"→"Realtime") — chỉ đổi text, key
 * host (basic/advanced/exclusive) giữ nguyên, không đụng Widget Placement đã thiết lập.
 * Đồng thời thêm Bottom Nav Cấp 2 (mobile, Owner 2026-10-15) — Trở về · Tổng quan (Sidebar,
 * mặc định) · Thống kê · Chỉ báo kỹ thuật · Dòng tiền — lazy-load đúng vùng đang xem, giống
 * hệt kiến trúc đã làm cho Cộng đồng (IfluxAppShell.getLevel2Config('flow'), xem
 * iflux-platform-boot.js). Khác Cộng đồng ở chỗ Flow là 1 module ES import được thẳng
 * mountPageWidgets (không cần tách 2 file qua event như community-page.js).
 */
import { createFeatureRuntime } from '../../runtime/feature-runtime.js?v=8e1baf6d7a';
import { mountPageWidgets } from '../../runtime/page-widgets.js?v=3313b52579';
import { buildPageFrame } from '../../runtime/app-shell.js?v=7b8f128322';
import featureManifest from '../../features/flow.manifest.js?v=11307e14ef';

var featureRt = null;

export const meta = { id: 'WGT-FLW-PAGE', title: 'Dòng tiền' };

var HEAD_HTML =
  '<div class="ifx-flow-title-row">' +
    '<h1 class="ix-page-title" style="margin:0">Dòng tiền</h1>' +
    '<span class="ifx-flow-exclusive"><i class="ti ti-sparkles"></i> Độc quyền iFlux</span>' +
  '</div>' +
  '<p class="ifx-page-intro">Top 10 sức mạnh dòng tiền và thống kê mua/bán ròng theo cổ phiếu, ngành, hệ sinh thái, chủ đề.</p>';

/* Owner 2026-10-15: thanh tab (3 nút "Thống kê/Chỉ báo kỹ thuật/Dòng tiền") CHỈ render trên
   desktop — mobile dùng hoàn toàn Bottom Nav Cấp 2 để chuyển vùng, không tải/hiện thanh tab
   này (trước đó thanh tab vẫn render trên mobile, gây hiểu lầm "active" trùng với Cấp 2).
   3 khối panel (`.ifx-flow-tab-panel`) vẫn LUÔN cần — là host Widget Placement thật cho
   basic/advanced/exclusive, việc ẩn/hiện panel tách riêng khỏi việc có thanh nút hay không
   (xem activatePanel/activateFlowTab bên dưới). */
function mainColHtml(showTabsBar) {
  var tabsBar = showTabsBar
    ? '<div class="ix-profile-tabs ifx-flow-score-tabs" data-ifx-flow-score-tabs role="tablist">' +
        '<button type="button" class="ix-profile-tab active" role="tab" aria-selected="true" data-ifx-flow-tab="basic"><i class="ti ti-chart-bar"></i> Thống kê</button>' +
        '<button type="button" class="ix-profile-tab" role="tab" aria-selected="false" data-ifx-flow-tab="advanced"><i class="ti ti-chart-dots-3"></i> Chỉ báo kỹ thuật</button>' +
        '<button type="button" class="ix-profile-tab ifx-app-header-link-exclusive" role="tab" aria-selected="false" data-ifx-flow-tab="exclusive"><i class="ti ti-sparkles"></i><span class="ifx-app-header-link-stack"><span class="ifx-app-header-chip">Realtime</span><span class="ifx-app-header-link-label">Dòng tiền</span></span></button>' +
      '</div>'
    : '';
  return (
    '<div class="ifx-flow-main-col">' +
      '<div class="ifx-flow-score-wrap">' +
        tabsBar +
        '<div class="ifx-flow-tab-panel active" data-ifx-flow-panel="basic" role="tabpanel">' +
          '<div class="ifx-flow-score-grid" data-ifx-section="basic" data-section="basic" data-layout="grid-12"></div>' +
        '</div>' +
        '<div class="ifx-flow-tab-panel" data-ifx-flow-panel="advanced" role="tabpanel" hidden>' +
          '<div class="ifx-flow-score-grid" data-ifx-section="advanced" data-section="advanced" data-layout="grid-12"></div>' +
        '</div>' +
        '<div class="ifx-flow-tab-panel" data-ifx-flow-panel="exclusive" role="tabpanel" hidden>' +
          '<div class="ifx-flow-score-grid" data-ifx-section="exclusive" data-section="exclusive" data-layout="grid-12"></div>' +
        '</div>' +
      '</div>' +
    '</div>'
  );
}

/* Khung trang chung (buildPageFrame); tab Thống kê (host basic/advanced/exclusive) = nội dung đặc thù Main. */
function buildFlowLayout(el, showTabsBar) {
  el.innerHTML = HEAD_HTML;
  var frame = buildPageFrame(el, { sidebarLabel: 'Widget dòng tiền' });
  frame.mainContent.innerHTML = mainColHtml(showTabsBar);
  return frame;
}

function mountFromHostTree(root) {
  return mountPageWidgets(root, 'flow');
}

/* Lazy-load theo vùng (mobile, Bottom Nav Cấp 2) — xem docs/plan "Mobile Bottom Navigation
   2 cấp". Desktop/tablet (lazyMode=false) giữ nguyên hành vi CŨ 100%: mountFromHostTree(el)
   tải cả 4 vùng ngay trong mount(), không qua cơ chế dưới đây. */
var regionState = {
  sidebar: { mounted: false },
  basic: { mounted: false },
  advanced: { mounted: false },
  exclusive: { mounted: false }
};
var lazyMode = false;
var currentEl = null;
var currentFrame = null;

function ensureRegion(key) {
  var st = regionState[key];
  if (!st || st.mounted || !currentEl) return;
  st.mounted = true;
  mountPageWidgets(currentEl, 'flow', { sectionFilter: [key] });
}

/* Chỉ 1 trong 2 "khối" DOM hiển thị tại 1 thời điểm trên mobile (app-shell.css,
   [data-ifx-region-mode="single"]) — aside.ifx-shell-sidebar (Tổng quan) HOẶC
   .ifx-shell-main (Thống kê/Chỉ báo/Dòng tiền, bên trong lại tự chuyển bằng
   activateFlowTab() — 3 tab đó vốn đã có cơ chế ẩn/hiện riêng từ trước, không viết lại). */
function toggleRegionVisibility(key) {
  if (!currentFrame || !lazyMode) return;
  var layout = currentFrame.layout;
  layout.querySelectorAll('[data-ifx-region-visible]').forEach(function (n) {
    n.removeAttribute('data-ifx-region-visible');
  });
  if (key === 'sidebar') {
    var sidebarEl = layout.querySelector('.ifx-shell-sidebar');
    if (sidebarEl) sidebarEl.setAttribute('data-ifx-region-visible', '');
    return;
  }
  var mainEl = layout.querySelector('.ifx-shell-main');
  if (mainEl) mainEl.setAttribute('data-ifx-region-visible', '');
  activateFlowTab(key);
}

function applyViewFromUrl() {
  var shell = window.IfluxAppShell;
  if (!currentFrame || !shell || !shell.isLevel2Open || !shell.isLevel2Open()) return false;
  var region = shell.activeSectionKey() || 'sidebar';
  ensureRegion(region);
  toggleRegionVisibility(region);
  try {
    document.dispatchEvent(new CustomEvent('iflux-level2-change', {
      detail: { itemKey: shell.currentLevel2Item ? shell.currentLevel2Item() : null, regionKey: region, open: true }
    }));
  } catch (e) { /* ignore */ }
  return true;
}

function onLevel2Change(e) {
  if (!currentFrame) return;
  var d = (e && e.detail) || {};
  if (!d.open) { toggleRegionVisibility('sidebar'); return; }
  ensureRegion(d.regionKey);
  toggleRegionVisibility(d.regionKey);
}

/* Chỉ chuyển PANEL (basic/advanced/exclusive) — KHÔNG đụng nút bấm desktop. Tách riêng khỏi
   bindFlowTabs() vì trên mobile không có thanh nút (tabsRoot không tồn tại) nhưng Bottom Nav
   Cấp 2 (toggleRegionVisibility→activateFlowTab) VẪN PHẢI chuyển được panel đúng. */
function activatePanel(root, tabKey) {
  root.querySelectorAll('[data-ifx-flow-panel]').forEach(function (panel) {
    var on = panel.getAttribute('data-ifx-flow-panel') === tabKey;
    panel.classList.toggle('active', on);
    panel.hidden = !on;
  });
}

/* Gán NGAY LÚC KHAI BÁO (không đợi bindFlowTabs chạy) — trên mobile bindFlowTabs() return sớm
   (không có tabsRoot) nên KHÔNG BAO GIỜ gán lại biến này nếu để mặc định no-op như bản cũ;
   toggleRegionVisibility() gọi activateFlowTab khi tap Bottom Nav Cấp 2 sẽ không có tác dụng,
   panel không bao giờ chuyển trên mobile. */
var activateFlowTab = function (tabKey) {
  if (currentEl) activatePanel(currentEl, tabKey);
};

function bindFlowTabs(root) {
  var tabsRoot = root.querySelector('[data-ifx-flow-score-tabs]');
  if (!tabsRoot || tabsRoot.getAttribute('data-ifx-tabs-bound')) return; // mobile: không có thanh tab, bỏ qua phần nút — panel vẫn chuyển được nhờ activateFlowTab ở trên
  tabsRoot.setAttribute('data-ifx-tabs-bound', '1');

  function activate(tabKey) {
    tabsRoot.querySelectorAll('[data-ifx-flow-tab]').forEach(function (btn) {
      var on = btn.getAttribute('data-ifx-flow-tab') === tabKey;
      btn.classList.toggle('active', on);
      btn.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    activatePanel(root, tabKey);
    if (lazyMode) ensureRegion(tabKey);
  }

  tabsRoot.addEventListener('click', function (ev) {
    var btn = ev.target && ev.target.closest ? ev.target.closest('[data-ifx-flow-tab]') : null;
    if (!btn || !tabsRoot.contains(btn)) return;
    activate(btn.getAttribute('data-ifx-flow-tab'));
  });
  activate('basic');
}

function applyFlow(root) {
  bindFlowTabs(root || document);
  if (window.IfluxBlockGate && IfluxBlockGate.apply) IfluxBlockGate.apply('flow');
  /* Share: click stub Foundation — không ensure khi mount Flow page. */
}

export async function mount(el) {
  /* Owner 2026-10-15: phải biết mobile/desktop TRƯỚC khi dựng HTML — thanh tab chỉ build trên
     desktop (showTabsBar = !lazyMode), không phải ẩn bằng CSS sau đó (mobile không tải luôn). */
  lazyMode = !!(window.IfluxBreakpoint && window.IfluxBreakpoint.isMobileShell && window.IfluxBreakpoint.isMobileShell());
  var frame = buildFlowLayout(el, !lazyMode);
  currentEl = el;
  currentFrame = frame;
  featureRt = createFeatureRuntime(featureManifest);
  await featureRt.boot({
    init: function () {
      if (window.IfluxWebUI && IfluxWebUI.syncTopnav) IfluxWebUI.syncTopnav();
    }
  });

  function onPlans() {
    applyFlow(el);
    if (!lazyMode) mountFromHostTree(el);
    else Object.keys(regionState).forEach(function (k) { if (regionState[k].mounted) { regionState[k].mounted = false; ensureRegion(k); } });
  }

  applyFlow(el);

  if (!lazyMode) {
    /* Desktop/tablet — hành vi CŨ: tải cả 4 vùng ngay, không chờ tap. */
    await mountFromHostTree(el);
  } else {
    frame.layout.setAttribute('data-ifx-region-mode', 'single');
    toggleRegionVisibility('sidebar');
    window.__ifxPageRuntime = window.__ifxPageRuntime || {};
    window.__ifxPageRuntime.onSamePagePopState = applyViewFromUrl;
    document.addEventListener('iflux-level2-change', onLevel2Change);
    applyViewFromUrl(); // cold load thẳng vào URL có ?view=...
  }

  document.addEventListener('iflux-plans-updated', onPlans);
  return {
    unmount: function () {
      document.removeEventListener('iflux-plans-updated', onPlans);
      document.removeEventListener('iflux-level2-change', onLevel2Change);
      currentEl = null;
      currentFrame = null;
      lazyMode = false;
      regionState = {
        sidebar: { mounted: false },
        basic: { mounted: false },
        advanced: { mounted: false },
        exclusive: { mounted: false }
      };
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
