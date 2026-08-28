/**
 * P6-W08 harness — IfxDataList + toast.
 * Không sở hữu stat-strip / form / table / theme.
 */
(function () {
  'use strict';
  window.addEventListener('message', function (e) {
    if (e.data && e.data.type === 'ifx-theme' && window.IfxTheme) window.IfxTheme.apply(e.data.theme);
  });
  if (window.IfxDataList) window.IfxDataList.init();
  document.querySelectorAll('[data-ifx-toast]').forEach(function (el) {
    el.addEventListener('click', function () {
      if (window.IfxToast) {
        window.IfxToast.show(el.getAttribute('data-ifx-toast-msg') || 'Đã lưu', el.getAttribute('data-ifx-toast'));
      }
    });
  });
})();
