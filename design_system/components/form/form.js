/**
 * IfxForm — password reveal. OTP / group / label stay CSS-only.
 */
(function (global) {
  'use strict';

  function bindToggle(btn) {
    if (btn.getAttribute('data-ifx-bound') === '1') return;
    btn.setAttribute('data-ifx-bound', '1');
    btn.addEventListener('click', function () {
      var wrap = btn.closest('.ifx-input-password');
      var input = wrap && wrap.querySelector('.ifx-input');
      if (!input) return;
      var show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      var icon = btn.querySelector('i');
      if (icon) {
        icon.classList.toggle('ti-eye', show);
        icon.classList.toggle('ti-eye-off', !show);
      }
      btn.setAttribute('aria-label', show ? 'Ẩn mật khẩu' : 'Hiện mật khẩu');
    });
  }

  function initAll(root) {
    (root || document).querySelectorAll('.ifx-input-password-toggle').forEach(bindToggle);
  }

  global.IfxForm = { initAll: initAll };
})(window);
