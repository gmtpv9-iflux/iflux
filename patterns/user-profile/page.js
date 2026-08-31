/**
 * Pattern User Profile — theme + init Profile / DataList / toast demo.
 */
(function () {
  'use strict';
  if (window.IfxTheme && !localStorage.getItem('ifx-theme')) window.IfxTheme.apply('dark');
  window.addEventListener('message', function (e) {
    if (e.data && e.data.type === 'ifx-theme' && window.IfxTheme) window.IfxTheme.apply(e.data.theme);
  });
  if (window.IfxProfile) window.IfxProfile.init();
  if (window.IfxDataList) window.IfxDataList.initAll();
  document.querySelectorAll('[data-ifx-toast-msg]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (window.IfxToast) {
        window.IfxToast.show(
          btn.getAttribute('data-ifx-toast-msg'),
          btn.getAttribute('data-ifx-toast-type') || 'info'
        );
      }
    });
  });
})();
