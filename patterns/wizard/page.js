/**
 * P6-W06 harness — IfxWizard.
 * Không sở hữu wizard / form / toast / theme.
 */
(function () {
  'use strict';
  window.addEventListener('message', function (e) {
    if (e.data && e.data.type === 'ifx-theme' && window.IfxTheme) window.IfxTheme.apply(e.data.theme);
  });
  if (window.IfxWizard) window.IfxWizard.init();
})();
