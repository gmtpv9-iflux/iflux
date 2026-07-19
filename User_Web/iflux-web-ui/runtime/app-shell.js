/**
 * iFlux Runtime — App Shell (ESM)
 * Chỉ chịu trách nhiệm bố cục: Header / Nav / Sidebar / Main / Footer.
 * Không chứa nội dung nghiệp vụ (SoT Product Architecture).
 */

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/**
 * Vùng chrome App Shell (đã có sẵn trong HTML tĩnh: header/nav/footer).
 * KHÔNG render lại trong vùng nội dung page-runtime — nếu render sẽ tạo ô grid
 * rỗng phá layout 2 cột (sidebar/main). Chỉ dựng vùng nội dung thật.
 */
var SHELL_CHROME_KEYS = { header: 1, nav: 1, topnav: 1, bottomnav: 1, footer: 1 };

/** Tạo vùng section theo manifest (sidebar / main / sidebar-right). */
export function ensureSections(root, manifest) {
  var sections = (manifest && manifest.sections) || [];
  var map = {};

  sections.forEach(function (sec) {
    if (!sec || !sec.key || sec.visible === false) return;
    if (SHELL_CHROME_KEYS[sec.key] || sec.kind === 'shell') return;
    var el = document.createElement(sec.key === 'sidebar' ? 'aside' : 'div');
    el.className = 'ifx-rt-section ifx-rt-section--' + sec.key;
    el.setAttribute('data-section', sec.key);
    el.setAttribute('data-ifx-section', sec.key);
    if (sec.key === 'sidebar') {
      el.setAttribute('aria-label', sec.label || 'Sidebar');
    }
    if (sec.layout) {
      el.setAttribute('data-layout', sec.layout);
    }
    root.appendChild(el);
    map[sec.key] = el;
  });

  return map;
}

/** Layout 2 cột cho trang có sidebar (vd Thị trường). */
export function applyMarketLayout(root) {
  if (!root) return;
  root.classList.add('ifx-mkt-layout');
  var sidebar = root.querySelector('[data-section="sidebar"]');
  if (sidebar) {
    sidebar.classList.add('ifx-mkt-sidebar');
  }
  var main = root.querySelector('[data-section="main"]');
  if (main) {
    main.classList.add('ifx-mkt-main');
  }
}

/** Layout hub 2 cột cho trang Nhà của tôi (sidebar hồ sơ + main dashboard). */
export function applyHubLayout(root) {
  if (!root) return;
  root.classList.add('ifx-hub-grid');
  var sidebar = root.querySelector('[data-section="sidebar"]');
  if (sidebar) sidebar.classList.add('ifx-hub-sidebar');
  var main = root.querySelector('[data-section="main"]');
  if (main) main.classList.add('ifx-hub-main');
}

/* ==========================================================================
 * DETACHED (CG-1.0) — quarantine
 * Ownership removed under Single Render Rule.
 * Status: Detached from Production Runtime.
 * Allowed: read · audit · delete (Wave 5).
 * Forbidden: new callers · import · export · dependency · reuse ·
 *            feature · logic edits · move/refactor.
 * Pending: Wave 3 Orphan Register → Wave 4–5.
 * ==========================================================================
 */
/**
 * Layout Dòng tiền: sidebar + main với tab Cơ bản / Nâng cao / Độc quyền.
 * Chỉ chrome App Shell — không mount Widget.
 * @returns {{ panels: { basic, advanced, exclusive }, bindTabs: Function }}
 */
export function applyFlowLayout(root) {
  if (!root) return null;
  root.classList.add('ifx-flow-page-layout');

  var sidebar = root.querySelector('[data-section="sidebar"]');
  if (sidebar) sidebar.classList.add('ifx-flow-market-sidebar');

  var main = root.querySelector('[data-section="main"]');
  if (!main) return null;
  main.classList.add('ifx-flow-main-col');
  main.innerHTML =
    '<div class="ifx-flow-score-wrap" data-ifx-ent-block="BLK-FLW-SCORE-BASIC">' +
      '<div class="ix-tabs ifx-flow-score-tabs" data-ifx-flow-score-tabs role="tablist">' +
        '<button type="button" class="ix-tab active" role="tab" aria-selected="true" data-ifx-flow-tab="basic">' +
          '<i class="ti ti-chart-bar"></i> Thống kê cơ bản</button>' +
        '<button type="button" class="ix-tab" role="tab" aria-selected="false" data-ifx-flow-tab="advanced">' +
          '<i class="ti ti-chart-dots-3"></i> Thống kê nâng cao</button>' +
        '<button type="button" class="ix-tab ifx-topnav-link--exclusive" role="tab" aria-selected="false" data-ifx-flow-tab="exclusive">' +
          '<i class="ti ti-sparkles"></i>' +
          '<span class="ifx-topnav-link__stack">' +
            '<span class="ifx-topnav-chip">Đột phá</span>' +
            '<span class="ifx-topnav-link__label">Độc quyền</span>' +
          '</span></button>' +
      '</div>' +
      '<div class="ifx-flow-tab-panel active" data-ifx-flow-panel="basic" role="tabpanel">' +
        '<p class="ifx-flow-tab-panel__sub">Top 10 cổ phiếu — dòng tiền vào / ra mạnh nhất</p>' +
        '<div class="ifx-flow-score-grid" data-flow-panel-grid="basic"></div>' +
      '</div>' +
      '<div class="ifx-flow-tab-panel" data-ifx-flow-panel="advanced" role="tabpanel" hidden data-ifx-ent-block="BLK-FLW-SCORE-ADV">' +
        '<p class="ifx-flow-tab-panel__sub">Top 10 ngành · hệ sinh thái · chủ đề — vào / ra</p>' +
        '<div class="ifx-flow-score-grid" data-flow-panel-grid="advanced"></div>' +
      '</div>' +
      '<div class="ifx-flow-tab-panel" data-ifx-flow-panel="exclusive" role="tabpanel" hidden data-ifx-ent-block="BLK-FLW-SCORE-EX">' +
        '<div class="ifx-flow-tab-panel__head">' +
          '<p class="ifx-flow-tab-panel__sub">Top 10 dòng tiền thông minh (TM)</p>' +
          '<span class="ix-chip ix-chip-warning ix-chip-sm">Elite</span>' +
        '</div>' +
        '<div class="ifx-flow-score-grid" data-flow-panel-grid="exclusive"></div>' +
      '</div>' +
    '</div>';

  var panels = {
    basic: main.querySelector('[data-flow-panel-grid="basic"]'),
    advanced: main.querySelector('[data-flow-panel-grid="advanced"]'),
    exclusive: main.querySelector('[data-flow-panel-grid="exclusive"]')
  };

  function activateTab(tabKey) {
    var tabsRoot = main.querySelector('[data-ifx-flow-score-tabs]');
    if (!tabsRoot) return;
    tabsRoot.querySelectorAll('[data-ifx-flow-tab]').forEach(function (btn) {
      var on = btn.getAttribute('data-ifx-flow-tab') === tabKey;
      btn.classList.toggle('active', on);
      btn.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    main.querySelectorAll('[data-ifx-flow-panel]').forEach(function (panel) {
      var on = panel.getAttribute('data-ifx-flow-panel') === tabKey;
      panel.classList.toggle('active', on);
      panel.hidden = !on;
    });
    setTimeout(function () {
      window.dispatchEvent(new Event('resize'));
      document.dispatchEvent(new CustomEvent('iflux-flow-tab', { detail: { tab: tabKey } }));
      if (window.IfluxFlowScoreTop && IfluxFlowScoreTop.flushVisibleCharts) {
        IfluxFlowScoreTop.flushVisibleCharts(main);
      }
    }, 60);
  }

  var tabsRoot = main.querySelector('[data-ifx-flow-score-tabs]');
  if (tabsRoot && !tabsRoot._ifxFlowTabsBound) {
    tabsRoot._ifxFlowTabsBound = true;
    tabsRoot.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-ifx-flow-tab]');
      if (!btn || !tabsRoot.contains(btn)) return;
      activateTab(btn.getAttribute('data-ifx-flow-tab'));
    });
  }

  return { panels: panels, activateTab: activateTab };
}

/* END DETACHED (CG-1.0) */

/** Panel main Dòng tiền cho từng Widget ID. */
export function flowPanelForWidgetId(widgetId) {
  var id = String(widgetId || '');
  if (id.indexOf('WGT-FLW-EX_') === 0) return 'exclusive';
  if (id === 'WGT-FLW-STAT_STOCK') return 'basic';
  if (id.indexOf('WGT-FLW-STAT_') === 0) return 'advanced';
  return 'basic';
}

/** Tiêu đề trang (optional — manifest.title). */
export function renderPageHeader(root, manifest) {
  if (!manifest || !manifest.title) return;
  var intro = manifest.intro || '';
  var isFlow = manifest.pageKey === 'flow';
  var titleHtml = isFlow
    ? ('<div class="ifx-flow-title-row">' +
        '<h1 class="ix-page-title" style="margin:0">' + esc(manifest.title) + '</h1>' +
        '<span class="ifx-flow-exclusive"><i class="ti ti-sparkles"></i> Độc quyền iFlux</span>' +
      '</div>')
    : ('<h1 class="ix-page-title">' + esc(manifest.title) + '</h1>');
  var html =
    titleHtml +
    (intro ? '<p class="ifx-page-intro">' + esc(intro) + '</p>' : '');
  var head = document.createElement('div');
  head.className = 'ifx-rt-page-head';
  head.style.gridColumn = '1 / -1';
  head.innerHTML = html;
  root.insertBefore(head, root.firstChild);
}

