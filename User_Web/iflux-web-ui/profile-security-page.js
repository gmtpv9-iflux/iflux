/* Owner: tab-security (#tab-security · #ifx-security-password-form) — một entry bind DOM */
(function (global) {
  'use strict';

  function token() {
    return global.IfluxAuth && IfluxAuth.getToken ? IfluxAuth.getToken() : null;
  }

  function bindPasswordToggles(root) {
    if (!root) return;
    root.querySelectorAll('[data-ix-toggle-password]').forEach(function (btn) {
      if (btn.dataset.ifxSecToggleBound) return;
      btn.dataset.ifxSecToggleBound = '1';
      btn.addEventListener('click', function () {
        var input = document.getElementById(btn.getAttribute('data-ix-toggle-password'));
        if (!input) return;
        var isPw = input.type === 'password';
        input.type = isPw ? 'text' : 'password';
        var icon = btn.querySelector('i');
        if (icon) icon.className = isPw ? 'ti ti-eye' : 'ti ti-eye-off';
      });
    });
  }

  function applyPasswordCapability(user) {
    var form = document.getElementById('ifx-security-password-form');
    var banner = document.getElementById('ifx-security-no-password');
    if (!form || !banner) return;
    var hasPassword = !user || user.has_password !== false;
    if (user && user.has_password === false) {
      banner.hidden = false;
      form.hidden = true;
      return;
    }
    banner.hidden = true;
    form.hidden = false;
  }

  function loadPasswordCapability() {
    var t = token();
    if (!t || t.indexOf('mock_jwt_') === 0) {
      applyPasswordCapability(null);
      return Promise.resolve();
    }
    if (!global.IfluxApiClient || !IfluxApiClient.authMe) {
      applyPasswordCapability(null);
      return Promise.resolve();
    }
    return IfluxApiClient.authMe(t).then(function (user) {
      applyPasswordCapability(user || {});
    }).catch(function () {
      applyPasswordCapability(null);
    });
  }

  function bindSubmit() {
    var form = document.getElementById('ifx-security-password-form');
    if (!form || form.dataset.ifxSecurityOwnerBound) return;
    form.dataset.ifxSecurityOwnerBound = '1';

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var current = (form.querySelector('[data-sec-field="current"]') || {}).value || '';
      var next = (form.querySelector('[data-sec-field="new"]') || {}).value || '';
      var confirm = (form.querySelector('[data-sec-field="confirm"]') || {}).value || '';
      var btn = form.querySelector('[data-ifx-save-password]');

      if (next.length < 8) {
        if (global.ixToast) ixToast('Mật khẩu mới phải có ít nhất 8 ký tự', 'warning');
        return;
      }
      if (next !== confirm) {
        if (global.ixToast) ixToast('Xác nhận mật khẩu không khớp', 'warning');
        return;
      }

      var t = token();
      if (!t || t.indexOf('mock_jwt_') === 0) {
        if (global.ixToast) ixToast('Chế độ demo — không đổi mật khẩu qua API', 'warning');
        return;
      }
      if (!global.IfluxApiClient || !IfluxApiClient.changePassword) {
        if (global.ixToast) ixToast('Chưa kết nối API đổi mật khẩu', 'warning');
        return;
      }

      if (btn) btn.disabled = true;
      IfluxApiClient.changePassword(t, current, next).then(function () {
        form.reset();
        if (global.ixToast) ixToast('Đã cập nhật mật khẩu', 'success');
      }).catch(function (err) {
        var msg = (err && err.message) || 'Không đổi được mật khẩu';
        if (global.ixToast) ixToast(msg, 'warning');
      }).finally(function () {
        if (btn) btn.disabled = false;
      });
    });
  }

  function init() {
    var root = document.getElementById('tab-security');
    bindPasswordToggles(root);
    bindSubmit();
    loadPasswordCapability();
  }

  global.IfluxProfileSecurityPage = { init: init };
})(window);
