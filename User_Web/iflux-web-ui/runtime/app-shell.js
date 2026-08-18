/* ===== IFX-AUDIT-BEGIN =====
AUDIT-ID: T5A-IGNORE-005
Priority: IGNORE
STATUS: IGNORE
OWNER: Runtime
Candidate Owner: Runtime
Usage audit: N/A
Dep động: N/A
Migration ROI: 1
Khả năng bỏ load: Không
P1 Gate: N/A
Refs: Task5 PhaseA — không audit / không tối ưu
===== IFX-AUDIT-END ===== */
/**
 * iFlux Runtime — App Shell (ESM)
 * Chỉ chịu trách nhiệm bố cục: Header / Nav / Sidebar / Main / Footer / Runtime Host.
 * Không quản lý Page Title/Description (đã bỏ Page Header / ifx-rt-page-head).
 * Không chứa nội dung nghiệp vụ (SoT Product Architecture).
 */

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
    /* AppShell Foundation §13 (100826): sidebar-right dùng chung bán kính <aside>+aria-label
     * với sidebar (Left) — cả 2 đều là AppShell Sidebar capability, khác nhau ở vị trí. */
    var isSidebar = sec.key === 'sidebar' || sec.key === 'sidebar-right';
    var el = document.createElement(isSidebar ? 'aside' : 'div');
    el.className = 'ifx-rt-section ifx-rt-section--' + sec.key;
    el.setAttribute('data-section', sec.key);
    el.setAttribute('data-ifx-section', sec.key);
    if (isSidebar) {
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

/** Panel main Dòng tiền cho từng Widget ID. */
export function flowPanelForWidgetId(widgetId) {
  var id = String(widgetId || '');
  if (id.indexOf('WGT-FLW-EX_') === 0) return 'exclusive';
  if (id === 'WGT-FLW-STAT_STOCK') return 'basic';
  if (id.indexOf('WGT-FLW-STAT_') === 0) return 'advanced';
  return 'basic';
}

