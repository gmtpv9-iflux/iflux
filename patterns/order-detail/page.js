/**
 * P6-W04 harness — toast.
 * Không sở hữu header / card / table / timeline / theme.
 */
(function () {
  'use strict';
  window.addEventListener('message', function (e) {
    if (e.data && e.data.type === 'ifx-theme' && window.IfxTheme) window.IfxTheme.apply(e.data.theme);
  });
  document.querySelectorAll('[data-ifx-toast]').forEach(function (el) {
    el.addEventListener('click', function () {
      if (window.IfxToast) {
        window.IfxToast.show(el.getAttribute('data-ifx-toast-msg') || 'Đã lưu', el.getAttribute('data-ifx-toast'));
      }
    });
  });
})();
