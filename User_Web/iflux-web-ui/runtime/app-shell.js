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

/**
 * Khung trang chung của User Web (platform/web/web.css) — mọi trang dùng:
 *
 *   .ifx-shell-layout
 *   ├─ aside.ifx-shell-sidebar   → host [sidebar] (widget đặt qua Widget Placement) + nội dung đặc thù
 *   └─ .ifx-shell-main           → host [main] (lưới widget 12 cột) + nội dung đặc thù (feed, tab, biểu đồ…)
 *
 * Host chỉ chứa widget (Layout Engine xoá/dựng lại); nội dung đặc thù nằm ở *Content, không bị xoá.
 * Host rỗng và Sidebar không có gì tự ẩn (CSS) — không cần JS theo dõi.
 * Tab host của trang (basic/advanced/exclusive/trading…) nằm trong mainContent do trang tự dựng.
 * Tỉ lệ ≥ md: Sidebar 3/12 · Main 9/12. Biến thể: opts.noSidebar (FAQ, Gói cước…) ·
 * opts.rightSidebar → thêm Sidebar phải 2/12, Main còn 7/12.
 */
function aside(cls, key, label) {
  return '<aside class="' + cls + '" aria-label="' + String(label).replace(/"/g, '&quot;') + '">' +
    '<div class="ifx-shell-host" data-section="' + key + '" data-ifx-section="' + key + '"></div>' +
    '<div class="ifx-shell-sidebar-content"></div>' +
  '</aside>';
}

export function buildPageFrame(root, opts) {
  opts = opts || {};
  var layout = document.createElement('div');
  layout.className = 'ifx-shell-layout' + (opts.rightSidebar ? ' ifx-shell-layout-right' : '');
  layout.innerHTML =
    (opts.noSidebar ? '' : aside('ifx-shell-sidebar', 'sidebar', opts.sidebarLabel || 'Sidebar')) +
    '<div class="ifx-shell-main">' +
      '<div class="ifx-shell-host ifx-grid" data-section="main" data-ifx-section="main" data-layout="grid-12"></div>' +
      '<div class="ifx-shell-main-content"></div>' +
    '</div>' +
    (opts.rightSidebar ? aside('ifx-shell-sidebar ifx-shell-sidebar-right', 'sidebar-right', 'Sidebar phải') : '');
  root.appendChild(layout);
  var left = layout.querySelector('.ifx-shell-sidebar:not(.ifx-shell-sidebar-right)');
  return {
    layout: layout,
    sidebarHost: left ? left.querySelector('[data-section="sidebar"]') : null,
    sidebarContent: left ? left.querySelector('.ifx-shell-sidebar-content') : null,
    mainHost: layout.querySelector('[data-section="main"]'),
    mainContent: layout.querySelector('.ifx-shell-main-content')
  };
}

/** Class nội bộ trang Nhà của tôi (hồ sơ / bảng tổng quan). */
export function applyHubLayout(root) {
  if (!root) return;
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

