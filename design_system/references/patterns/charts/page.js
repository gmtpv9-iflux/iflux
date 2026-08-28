/**
 * P6-W09 harness — IfxTabs + IfxChart.
 * Không sở hữu chart / tabs / dropdown / theme.
 */
(function () {
  'use strict';
  window.addEventListener('message', function (e) {
    if (e.data && e.data.type === 'ifx-theme' && window.IfxTheme) window.IfxTheme.apply(e.data.theme);
  });
  if (window.IfxTabs) window.IfxTabs.initAll();
  if (window.IfxChart) window.IfxChart.init();
})();
