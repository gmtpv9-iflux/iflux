/**
 * P6-W01 harness — IfxDataList.init.
 * Không sở hữu table / search / pagination / theme / stat-strip.
 */
(function () {
  'use strict';
  window.addEventListener('message', function (e) {
    if (e.data && e.data.type === 'ifx-theme' && window.IfxTheme) window.IfxTheme.apply(e.data.theme);
  });
  if (window.IfxDataList) window.IfxDataList.init();
})();
