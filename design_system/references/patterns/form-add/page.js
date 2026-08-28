/**
 * P6-W02 harness — theme toggle + IfxTabs + toast.
 * Không sở hữu form / tabs / action-bar / theme.
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
  window.addEventListener('message', function (e) {
    if (e.data && e.data.type === 'ifx-theme' && window.IfxTheme) window.IfxTheme.apply(e.data.theme);
  });
  if (window.IfxTabs) window.IfxTabs.initAll();
  document.querySelectorAll('[data-ifx-toast]').forEach(function (el) {
    el.addEventListener('click', function () {
      if (window.IfxToast) {
        window.IfxToast.show(el.getAttribute('data-ifx-toast-msg') || 'Đã lưu', el.getAttribute('data-ifx-toast'));
      }
    });
  });
})();
