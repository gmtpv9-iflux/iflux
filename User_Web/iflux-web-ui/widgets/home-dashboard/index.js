/**
 * WGT-HOME-DASH — Shell Main "Nhà của tôi" (ESM lazy module)
 *
 * Chỉ vùng Main: toolbar Mặc định / Phổ biến / Tùy chỉnh + canvas + modal.
 * Sidebar (PRF) do App Shell / composition mount riêng — không ôm cả trang.
 *
 * Resource Ownership (Blueprint): Dashboard KHÔNG hardcode JS/CSS widget.
 * JS/dependency của từng widget dashboard do Widget Manifest
 * (widget-module-catalog) sở hữu; Dashboard chỉ đọc qua
 * resolveDashboardWidgetDeps() và lazy-load khi widget thực sự render.
 * User override lưu IfluxUserStorage (dashboard-engine).
 */

import { ensureSequence } from '../../runtime/legacy-bridge.js?v=phaseCW420260721';
import { resolveDashboardWidgetDeps } from '../../runtime/widget-module-catalog.js?v=phaseBExit20260721c';

var A = '/User_Web/iflux-web-ui/';
var V = 'ui00120260723';

export const meta = { id: 'WGT-HOME-DASH', title: 'Bảng điều khiển' };

function dep(g, s) { return { global: g, src: A + s + (s.indexOf('?') >= 0 ? '' : '?v=' + V) }; }

var BASE = [
  /* W4: seo-url = Shell MARKET_CORE (home) — seed registry lazy theo widget.
     WP-4: widget-renderers/dashboard-engine bỏ module mock thị trường — bump cache riêng. */
  dep('IfluxWidgetRegistry', 'widget-registry.js'),
  dep('IfluxWidgetRenderers', 'widget-renderers.js?v=mockRmWp4_20260809'),
  dep('IfluxDashboardEngine', 'dashboard-engine.js?v=mockRmWp4_20260809')
];

var LAYOUT_HTML =
  '<div class="ifx-dash-toolbar">' +
    '<div class="ifx-dash-toolbar__hint" data-ifx-dash-hint></div>' +
    '<div class="ifx-dash-toolbar__cluster">' +
      '<div class="ifx-dash-toolbar__primary" data-ifx-dash-primary>' +
        '<button type="button" class="ix-btn ix-btn-outline ix-btn-sm" data-ifx-dash-default><i class="ti ti-layout-grid"></i> Mặc định</button>' +
        '<button type="button" class="ix-btn ix-btn-outline ix-btn-sm" data-ifx-dash-popular><i class="ti ti-flame"></i> Phổ biến</button>' +
        '<button type="button" class="ix-btn ix-btn-primary ix-btn-sm" data-ifx-dash-edit><i class="ti ti-adjustments"></i> Tùy chỉnh</button>' +
      '</div>' +
      '<div class="ifx-dash-toolbar__confirm" data-ifx-dash-confirm hidden>' +
        '<button type="button" class="ix-btn ix-btn-outline ix-btn-sm" data-ifx-dash-cancel><i class="ti ti-x"></i> Hủy</button>' +
        '<button type="button" class="ix-btn ix-btn-primary ix-btn-sm" data-ifx-dash-done><i class="ti ti-check"></i> Xong</button>' +
      '</div>' +
    '</div>' +
  '</div>' +
  '<div class="ifx-dash-canvas" data-ifx-dash-canvas></div>' +
  /* Modal: Thêm tiện ích (danh mục) */
  '<div class="ix-modal-overlay" data-ifx-modal id="widgetRegistryModal">' +
    '<div class="ix-modal-box" style="max-width:560px">' +
      '<button type="button" class="ix-modal-close" data-ix-registry-close><i class="ti ti-x"></i></button>' +
      '<div class="ix-modal-title">Danh mục tiện ích</div>' +
      '<div class="ix-modal-sub">Chọn tiện ích để thêm vào bảng tổng quan</div>' +
      '<div class="ifx-registry-list" data-ifx-registry-list></div>' +
    '</div>' +
  '</div>' +
  /* Modal: Bố cục phổ biến */
  '<div class="ix-modal-overlay" data-ifx-modal id="popularWidgetsModal">' +
    '<div class="ix-modal-box" style="max-width:520px">' +
      '<button type="button" class="ix-modal-close" data-ifx-popular-close><i class="ti ti-x"></i></button>' +
      '<div class="ix-modal-title">Bố cục phổ biến</div>' +
      '<div class="ix-modal-sub">Tiện ích được nhiều người dùng nhất</div>' +
      '<div class="ifx-registry-list" data-ifx-popular-list></div>' +
      '<div class="ix-modal-actions" style="display:flex;justify-content:flex-end;gap:var(--ifx-space-8);margin-top:var(--ifx-space-16)">' +
        '<button type="button" class="ix-btn ix-btn-outline" data-ifx-popular-close>Đóng</button>' +
        '<button type="button" class="ix-btn ix-btn-primary" data-ifx-popular-apply><i class="ti ti-eye"></i> Xem trước bố cục</button>' +
      '</div>' +
    '</div>' +
  '</div>';

/* Bọc IfluxWidgetRenderers.render để lazy-load dep của từng widget khi render. */
function installLazyRenderer() {
  var R = window.IfluxWidgetRenderers;
  if (!R || R._ifxLazyWrapped) return;
  var orig = R.render;
  R._ifxLazyWrapped = true;
  R.render = function (type, el, config) {
    var reg = window.IfluxWidgetRegistry;
    var m = reg && reg.byType ? reg.byType(type) : null;
    var key = (m && m.renderAs) || type;
    var rt = resolveDashboardWidgetDeps(key);
    var deps = rt && rt.deps;
    if (!deps || !deps.length) return orig.call(R, type, el, config);
    var missing = deps.some(function (d) { return !window[d.global]; });
    if (!missing) return orig.call(R, type, el, config);
    if (el) el.innerHTML = '<div class="ifx-wl-empty">Đang tải tiện ích…</div>';
    ensureSequence(deps).then(function () {
      if (rt.afterLoad) rt.afterLoad();
      try { orig.call(R, type, el, config); }
      catch (e) {
        if (el) el.innerHTML = '<div class="ifx-wl-empty">Không tải được tiện ích</div>';
      }
    }).catch(function () {
      if (el) el.innerHTML = '<div class="ifx-wl-empty">Không tải được tiện ích</div>';
    });
  };
}

export async function mount(el) {
  el.innerHTML = LAYOUT_HTML;
  await ensureSequence(BASE);
  installLazyRenderer();
  if (window.IfluxDashboardEngine && IfluxDashboardEngine.init) {
    IfluxDashboardEngine.init();
  }
  return {
    unmount: function () { if (el) el.innerHTML = ''; }
  };
}

export function unmount(el) {
  if (el) el.innerHTML = '';
}
