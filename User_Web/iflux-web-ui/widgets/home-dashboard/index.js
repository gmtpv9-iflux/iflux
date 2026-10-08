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

import { ensureSequence } from '../../runtime/legacy-bridge.js?v=r20261002communityfix';

var A = '/User_Web/iflux-web-ui/';
var V = 'r20261009d';

export const meta = { id: 'WGT-HOME-DASH', title: 'Bảng điều khiển' };

function dep(g, s) { return { global: g, src: A + s + (s.indexOf('?') >= 0 ? '' : '?v=' + V) }; }

var BASE = [
  /* Nội dung mỗi widget = Template DS đã publish (dashboard-engine.js tự fetch artifact +
     mount qua IfxTemplateLoader/IfxTemplates — một đường DUY NHẤT, giống mọi trang khác). */
  dep('IfluxWidgetRegistry', 'widget-registry.js?v=r20261009c'),
  dep('IfluxDashboardEngine', 'dashboard-engine.js'),
  /* Watchlist là widget tương tác (thêm/bớt mã) — chưa publish qua Template, dùng component
     riêng; nạp sẵn ở đây vì hầu như dashboard nào cũng có. */
  dep('IfluxWatchlistStore', 'watchlist-store.js?v=r20260928n'),
  dep('IfluxWatchlistTaxonomy', 'watchlist-taxonomy.js?v=r20260928q'),
  { global: 'IfluxHeartAction', src: '/design_system/04_components/29_follow/follow.js?v=r20261002a' },
  dep('IfluxWatchlistUI', 'watchlist-ui.js?v=r20260928q'),
  dep('IfluxWatchlistBlock', 'watchlist-block.js?v=r20260928q')
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

export async function mount(el) {
  el.innerHTML = LAYOUT_HTML;
  await ensureSequence(BASE);
  if (window.IfluxWatchlistStore && IfluxWatchlistStore.ensureSeedFromDemo) {
    try { IfluxWatchlistStore.ensureSeedFromDemo(); } catch (e) { /* ignore */ }
  }
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
