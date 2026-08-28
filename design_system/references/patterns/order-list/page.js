/**
 * P6-W03 harness — theme toggle + IfxDataList.init.
 * Không sở hữu table / search / pagination / theme / stat-strip.
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
  if (window.IfxDataList) window.IfxDataList.init();
})();
