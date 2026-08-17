/**
 * Staging 2 — cổng trang quản trị đã đăng nhập
 * Chỉ gác phiên. Hiển thị danh tính và nút đăng xuất thuộc App Shell.
 */
(function () {
  'use strict';

  var LOGIN = '/admin/login';

  function toLogin() {
    if (window.IfluxAdminSession) IfluxAdminSession.clearSession();
    window.location.replace(LOGIN);
  }

  if (!window.IfluxAdminSession || !IfluxAdminSession.isAuthenticated()) {
    toLogin();
    return;
  }

  if (!window.IfluxAdminAuthApi) {
    toLogin();
    return;
  }

  IfluxAdminAuthApi.me().then(function (out) {
    if (!out.ok || !out.data || !out.data.admin || !out.data.admin.email) {
      toLogin();
      return;
    }
    if (window.IfluxAdminShell) IfluxAdminShell.setAdmin(out.data.admin);
  }).catch(function () {
    toLogin();
  });
})();
