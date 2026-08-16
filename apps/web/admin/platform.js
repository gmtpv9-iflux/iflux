/**
 * Staging 2 — Platform Foundation (M00)
 *
 * Cấu hình môi trường · ranh giới lỗi · registry khóa lưu trữ.
 * Nạp đầu tiên trên mọi trang. Không tham chiếu script nạp sau nó.
 */
(function (global) {
  'use strict';

  /* production.iflux.vn hiện là hostname của Staging 2, không phải Production. */
  var ENVIRONMENTS = {
    'iflux.vn': { label: 'Production', variant: 'danger' },
    'staging.iflux.vn': { label: 'Staging 1', variant: 'warning' },
    'production.iflux.vn': { label: 'Staging 2', variant: 'success' }
  };

  var LOCAL = { label: 'Cục bộ', variant: 'info' };

  var KEYS = {
    session: 'iflux_admin_session',
    shellCollapsed: 'iflux_admin_shell_collapsed'
  };

  function env() {
    var host = (global.location && global.location.hostname) || '';
    return ENVIRONMENTS[host] || LOCAL;
  }

  function apiBase() {
    var loc = global.location;
    if (loc && loc.origin && loc.origin !== 'null') return loc.origin + '/api';
    return '/api';
  }

  var notice = null;

  function showNotice() {
    if (notice) return;
    var parent = document.querySelector('.ifx-shell__content') || document.body;
    if (!parent) return;
    notice = document.createElement('div');
    notice.className = 'ifx-alert ifx-alert--danger';
    notice.setAttribute('role', 'alert');
    notice.textContent = 'Đã xảy ra lỗi. Tải lại trang nếu giao diện không phản hồi.';
    parent.insertBefore(notice, parent.firstChild);
  }

  /* Chi tiết lỗi chỉ vào console. UI chỉ nhận thông báo cho người dùng. */
  function reportError(err) {
    if (global.console && global.console.error) global.console.error(err);
    if (document.body) {
      showNotice();
      return;
    }
    document.addEventListener('DOMContentLoaded', showNotice);
  }

  /* Không dùng capture: lỗi tải ảnh/script không bubble nên không kích hoạt nhầm. */
  global.addEventListener('error', function (e) {
    reportError(e.error || e.message);
  });

  global.addEventListener('unhandledrejection', function (e) {
    reportError(e.reason);
  });

  global.IfluxAdminPlatform = {
    KEYS: KEYS,
    env: env,
    apiBase: apiBase,
    reportError: reportError
  };
})(typeof window !== 'undefined' ? window : globalThis);
