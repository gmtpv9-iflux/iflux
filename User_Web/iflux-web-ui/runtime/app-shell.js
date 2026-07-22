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
        '<h1 class="ix-page-title" data-ifx-page-def-title style="margin:0">' + esc(manifest.title) + '</h1>' +
        '<span class="ifx-flow-exclusive"><i class="ti ti-sparkles"></i> Độc quyền iFlux</span>' +
      '</div>')
    : ('<h1 class="ix-page-title" data-ifx-page-def-title>' + esc(manifest.title) + '</h1>');
  var html =
    titleHtml +
    '<p class="ifx-page-intro"' + (intro ? '' : ' hidden') + ' data-ifx-page-def-intro>' + esc(intro) + '</p>';
  var head = document.createElement('div');
  head.className = 'ifx-rt-page-head';
  head.style.gridColumn = '1 / -1';
  head.innerHTML = html;
  root.insertBefore(head, root.firstChild);
}

