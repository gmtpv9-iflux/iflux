/**
 * P6-W08 harness — theme toggle + IfxDataList + toast.
 * Không sở hữu stat-strip / form / table / theme.
 */
(function () {
  'use strict';
  var btn = document.getElementById('refThemeToggle');
  function sync(theme) {
    if (!btn) return;
    btn.textContent = 'Theme: ' + (theme === 'light' ? 'Light' : 'Dark');
  }
  if (btn && window.IfxTheme) {
    btn.addEventListener('click', function () { window.IfxTheme.toggle(); });
    window.addEventListener('ifx-theme-change', function (e) { sync(e.detail.theme); });
    sync(window.IfxTheme.get());
  }
  if (window.IfxDataList) window.IfxDataList.init();
  document.querySelectorAll('[data-ifx-toast]').forEach(function (el) {
    el.addEventListener('click', function () {
      if (window.IfxToast) {
        window.IfxToast.show(el.getAttribute('data-ifx-toast-msg') || 'Đã lưu', el.getAttribute('data-ifx-toast'));
      }
    });
  });
})();
