/**
 * P6-W09 harness — theme toggle + IfxTabs + IfxChart.
 * Không sở hữu chart / tabs / dropdown / theme.
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
  if (window.IfxTabs) window.IfxTabs.initAll();
  if (window.IfxChart) window.IfxChart.init();
})();
