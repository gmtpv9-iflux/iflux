/**
 * WGT-FLW-PAGE — Composite Dòng tiền
 * Phase C W3: Feature Manifest + Runtime State Machine.
 */
import { createFeatureRuntime } from '../../runtime/feature-runtime.js?v=r20260928q';
import { mountPageWidgets } from '../../runtime/page-widgets.js?v=r20260929e';
import { buildPageFrame } from '../../runtime/app-shell.js?v=appHeader20260928';
import featureManifest from '../../features/flow.manifest.js?v=r20260928r';

var featureRt = null;

export const meta = { id: 'WGT-FLW-PAGE', title: 'Dòng tiền' };

var HEAD_HTML =
  '<div class="ifx-flow-title-row">' +
    '<h1 class="ix-page-title" style="margin:0">Dòng tiền</h1>' +
    '<span class="ifx-flow-exclusive"><i class="ti ti-sparkles"></i> Độc quyền iFlux</span>' +
  '</div>' +
  '<p class="ifx-page-intro">Top 10 sức mạnh dòng tiền và thống kê mua/bán ròng theo cổ phiếu, ngành, hệ sinh thái, chủ đề.</p>';

var MAIN_COL_HTML =
  '<div class="ifx-flow-main-col">' +
    '<div class="ifx-flow-score-wrap">' +
      '<div class="ix-tabs ifx-flow-score-tabs" data-ifx-flow-score-tabs role="tablist">' +
        '<button type="button" class="ix-tab active" role="tab" aria-selected="true" data-ifx-flow-tab="basic"><i class="ti ti-chart-bar"></i> Thống kê cơ bản</button>' +
        '<button type="button" class="ix-tab" role="tab" aria-selected="false" data-ifx-flow-tab="advanced"><i class="ti ti-chart-dots-3"></i> Thống kê nâng cao</button>' +
        '<button type="button" class="ix-tab ifx-app-header-link-exclusive" role="tab" aria-selected="false" data-ifx-flow-tab="exclusive"><i class="ti ti-sparkles"></i><span class="ifx-app-header-link-stack"><span class="ifx-app-header-chip">Đột phá</span><span class="ifx-app-header-link-label">Độc quyền</span></span></button>' +
      '</div>' +
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
  '</div>';

/* Khung trang chung (buildPageFrame); tab Thống kê (host basic/advanced/exclusive) = nội dung đặc thù Main. */
function buildFlowLayout(el) {
  el.innerHTML = HEAD_HTML;
  var frame = buildPageFrame(el, { sidebarLabel: 'Widget dòng tiền' });
  frame.mainContent.innerHTML = MAIN_COL_HTML;
}

function mountFromHostTree(root) {
  return mountPageWidgets(root, 'flow');
}

function bindFlowTabs(root) {
  var tabsRoot = root.querySelector('[data-ifx-flow-score-tabs]');
  if (!tabsRoot || tabsRoot.getAttribute('data-ifx-tabs-bound')) return;
  tabsRoot.setAttribute('data-ifx-tabs-bound', '1');

  function activate(tabKey) {
    tabsRoot.querySelectorAll('[data-ifx-flow-tab]').forEach(function (btn) {
      var on = btn.getAttribute('data-ifx-flow-tab') === tabKey;
      btn.classList.toggle('active', on);
      btn.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    root.querySelectorAll('[data-ifx-flow-panel]').forEach(function (panel) {
      var on = panel.getAttribute('data-ifx-flow-panel') === tabKey;
      panel.classList.toggle('active', on);
      panel.hidden = !on;
    });
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
  buildFlowLayout(el);
  featureRt = createFeatureRuntime(featureManifest);
  await featureRt.boot({
    init: function () {
      if (window.IfluxWebUI && IfluxWebUI.syncTopnav) IfluxWebUI.syncTopnav();
    }
  });

  function onPlans() {
    applyFlow(el);
    mountFromHostTree(el);
  }

  applyFlow(el);
  await mountFromHostTree(el);
  document.addEventListener('iflux-plans-updated', onPlans);
  return {
    unmount: function () {
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
