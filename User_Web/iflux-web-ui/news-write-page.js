/**
 * Trang Viết bài Cộng đồng — tạm đóng trên User Web.
 * Bài viết chuyên gia sẽ được quản lý từ Admin ở giai đoạn sau.
 */
(function (global) {
  'use strict';

  function routeUrl(key) {
    var R = global.IfluxRoutes;
    if (R && R.to) return R.to(key);
    if (key === 'news') return '/tin-tuc';
    return '/';
  }

  function render(root) {
    if (!root) return;
    root.innerHTML =
      '<div class="ifx-com-empty">' +
        '<i class="ti ti-lock" style="font-size:32px;opacity:.5"></i>' +
        '<p>Chức năng <strong>Viết bài</strong> trên Cộng đồng tạm đóng.</p>' +
        '<p style="color:var(--ix-text-muted);font-size:14px;margin-top:8px">Bài viết chuyên gia sẽ được đăng từ hệ thống quản trị ở giai đoạn sau.</p>' +
        '<a href="' + routeUrl('news') + '" class="ix-btn ix-btn-primary ix-btn-sm" style="margin-top:16px">Quay lại Tin tức</a>' +
      '</div>';
  }

  function init() {
    render(document.querySelector('[data-ifx-community-write]'));
  }

  global.IfluxCommunityWritePage = { init: init };
})(window);
