/**
 * WGT-FLW-PAGE — Composite Dòng tiền
 *
 * Phase 4: Page Feature (title + tabs) + Layout Engine + mount(display.module).
 * Không HOST_SEL / catalog / page-composition / resolveWidgetModule.
 */
import { loadScriptTiers } from '../../runtime/legacy-bridge.js?v=lazyAll20260713k';
import { mountPublishedWidgets } from '../../runtime/mount-published-widgets.js?v=phase4Pub20260716b';

var ASSET = '/User_Web/iflux-web-ui/';
var ADMIN = '/Admin_Design_system/iflux-admin-ui/';
var P4_VER = 'phase4Pub20260716b';

export const meta = { id: 'WGT-FLW-PAGE', title: 'Dòng tiền' };

var CORE_TIERS = [
  [
    ASSET + 'iflux-user-data-sync.js',
    ADMIN + 'iflux-admin-ui.js',
    ADMIN + 'iflux-market-registry-store.js',
    ASSET + 'watchlist-taxonomy.js',
    ASSET + 'block-templates.js'
  ],
  [
    ADMIN + 'iflux-market-seed-data.js',
    ADMIN + 'iflux-market-ecosystem-seeds.js',
    ASSET + 'seo-url.js',
    ASSET + 'stock-mentions.js'
  ],
  [
    ASSET + 'mock-market.js',
    ASSET + 'widget-registry.js',
    ASSET + 'flow-page.js?v=bpPhaseD20260716',
    ASSET + 'runtime/page-layout-engine.js?v=' + P4_VER
  ],
  [
    ASSET + 'iflux-web-ui.js',
    ASSET + 'iflux-header-search.js'
  ]
];

/**
 * Page Feature shell — section hosts trống; Layout Engine đổ widgets từ placements.
 * Sections: sidebar | basic | advanced | exclusive (khớp PagePublished).
 */
var LAYOUT_HTML =
  '<div class="ifx-flow-title-row">' +
    '<h1 class="ix-page-title" style="margin:0">Dòng tiền</h1>' +
    '<span class="ifx-flow-exclusive"><i class="ti ti-sparkles"></i> Độc quyền iFlux</span>' +
  '</div>' +
  '<p class="ifx-page-intro">Top 10 sức mạnh dòng tiền và thống kê mua/bán ròng theo cổ phiếu, ngành, hệ sinh thái, chủ đề.</p>' +
  '<div class="ifx-flow-page-layout">' +
    '<aside class="ifx-flow-market-sidebar" aria-label="Widget đặc thù dòng tiền" data-ifx-section="sidebar" data-section="sidebar"></aside>' +
    '<div class="ifx-flow-main-col">' +
      '<div class="ifx-flow-score-wrap" data-ifx-ent-block="BLK-FLW-SCORE-BASIC">' +
        '<div class="ix-tabs ifx-flow-score-tabs" data-ifx-flow-score-tabs role="tablist">' +
          '<button type="button" class="ix-tab active" role="tab" aria-selected="true" data-ifx-flow-tab="basic"><i class="ti ti-chart-bar"></i> Thống kê cơ bản</button>' +
          '<button type="button" class="ix-tab" role="tab" aria-selected="false" data-ifx-flow-tab="advanced"><i class="ti ti-chart-dots-3"></i> Thống kê nâng cao</button>' +
          '<button type="button" class="ix-tab ifx-topnav-link--exclusive" role="tab" aria-selected="false" data-ifx-flow-tab="exclusive"><i class="ti ti-sparkles"></i><span class="ifx-topnav-link__stack"><span class="ifx-topnav-chip">Đột phá</span><span class="ifx-topnav-link__label">Độc quyền</span></span></button>' +
        '</div>' +
        '<div class="ifx-flow-tab-panel active" data-ifx-flow-panel="basic" role="tabpanel">' +
          '<div class="ifx-flow-score-grid" data-ifx-section="basic" data-section="basic" data-layout="grid-12"></div>' +
        '</div>' +
        '<div class="ifx-flow-tab-panel" data-ifx-flow-panel="advanced" role="tabpanel" hidden data-ifx-ent-block="BLK-FLW-SCORE-ADV">' +
          '<div class="ifx-flow-score-grid" data-ifx-section="advanced" data-section="advanced" data-layout="grid-12"></div>' +
        '</div>' +
        '<div class="ifx-flow-tab-panel" data-ifx-flow-panel="exclusive" role="tabpanel" hidden data-ifx-ent-block="BLK-FLW-SCORE-EX">' +
          '<div class="ifx-flow-score-grid" data-ifx-section="exclusive" data-section="exclusive" data-layout="grid-12"></div>' +
        '</div>' +
      '</div>' +
    '</div>' +
  '</div>';

async function mountFromHostTree(root) {
  if (!root || !window.IfluxPageLayoutEngine) {
    if (window.console && console.warn) {
      console.warn('[WGT-FLW-PAGE] thiếu Layout Engine');
    }
    return;
  }
  var tree = await IfluxPageLayoutEngine.buildHostTree(root, 'flow');
  if (!tree || !tree.length) {
    if (window.console && console.warn) {
      console.warn('[WGT-FLW-PAGE] Host Tree rỗng — chưa có placements Published');
    }
    return;
  }
  await mountPublishedWidgets(tree, { logPrefix: '[WGT-FLW-PAGE]' });
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
  if (window.IfluxFlowPage && IfluxFlowPage.init) IfluxFlowPage.init();
  bindFlowTabs(root || document);
  if (window.IfluxBlockGate && IfluxBlockGate.apply) IfluxBlockGate.apply('flow');
  if (window.IfluxInsightShare && IfluxInsightShare.patchAll) {
    IfluxInsightShare.patchAll(root || document);
  }
}

export async function mount(el) {
  el.innerHTML = LAYOUT_HTML;
  await loadScriptTiers(CORE_TIERS);
  if (window.IfluxWebUI && IfluxWebUI.syncTopnav) IfluxWebUI.syncTopnav();

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
      if (el) el.innerHTML = '';
    }
  };
}

export function unmount(el) {
  if (el) el.innerHTML = '';
}
