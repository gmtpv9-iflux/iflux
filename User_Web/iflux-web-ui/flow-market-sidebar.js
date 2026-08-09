/* Sidebar Dòng tiền — vùng Hỗ trợ/Kháng cự + rủi ro thị trường (cố định khi đổi tab)
 * Ngữ cảnh vùng giá / rủi ro thị trường không có nguồn xác thực runtime (SOL-UNAVAIL)
 * → UNAVAIL, reuse empty state hiện hữu (.ifx-flow-sidebar-empty). */
(function (global) {
  'use strict';

  function render(container) {
    if (!container) return;
    container.innerHTML = '<p class="ifx-flow-sidebar-empty">Không có dữ liệu thị trường.</p>';
  }

  function mount(el) {
    if (!el) return;
    render(el);
  }

  function refresh(el) {
    render(el || document.getElementById('ifx-flow-market-sidebar'));
  }

  global.IfluxFlowMarketSidebar = { mount: mount, refresh: refresh, render: render };
})(window);
