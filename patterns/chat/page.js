/**
 * Pattern Chat host — theme từ Workbench + IfxChat.init.
 */
(function () {
  'use strict';
  window.addEventListener('message', function (e) {
    if (e.data && e.data.type === 'ifx-theme' && window.IfxTheme) window.IfxTheme.apply(e.data.theme);
  });
  if (window.IfxChat) window.IfxChat.init();
})();
