/**
 * Auth reference harness — theme, tabs, form eye, toast. Không auth runtime.
 */
(function () {
  'use strict';

  window.addEventListener('message', function (e) {
    if (e.data && e.data.type === 'ifx-theme' && window.IfxTheme) {
      window.IfxTheme.apply(e.data.theme);
    }
  });

  var state = document.documentElement.getAttribute('data-auth-state') || 'login';
  if (window.parent && window.parent !== window) {
    window.parent.postMessage({ type: 'ifx-auth-state', state: state }, '*');
  }

  if (window.IfxTabs) window.IfxTabs.initAll();
  if (window.IfxForm) window.IfxForm.initAll();

  document.querySelectorAll('[data-ifx-toast]').forEach(function (el) {
    el.addEventListener('click', function () {
      if (window.IfxToast) {
        window.IfxToast.show(el.getAttribute('data-ifx-toast-msg') || 'Đã lưu', el.getAttribute('data-ifx-toast'));
      }
    });
  });

  var otpBtn = document.getElementById('otp-submit');
  var otpInput = document.getElementById('otp-code');
  if (otpBtn && otpInput) {
    otpBtn.addEventListener('click', function () {
      var code = (otpInput.value || '').trim();
      if (!window.IfxToast) return;
      if (code.length !== 6) {
        window.IfxToast.show('Nhập đủ 6 số TOTP', 'warning');
        return;
      }
      window.IfxToast.show('2FA xác thực thành công', 'success');
    });
  }

  var hub = document.getElementById('auth-hub-demo');
  if (hub) {
    hub.addEventListener('click', function (e) {
      e.preventDefault();
      if (window.IfxToast) window.IfxToast.show('Hub checklist — demo', 'info');
    });
  }
})();
