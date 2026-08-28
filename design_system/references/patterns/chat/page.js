/**
 * P6-W07 harness — IfxChat.
 * Không sở hữu chat / theme.
 */
(function () {
  'use strict';
  window.addEventListener('message', function (e) {
    if (e.data && e.data.type === 'ifx-theme' && window.IfxTheme) window.IfxTheme.apply(e.data.theme);
  });
  if (window.IfxChat) window.IfxChat.init();
})();
