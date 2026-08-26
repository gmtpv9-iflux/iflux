/**
 * Sandbox baseline pages — theme, nav active, bind Ifx* + local radio/copy.
 */
(function () {
  'use strict';

  var file = (location.pathname.split('/').pop() || '').replace('.html', '');
  document.querySelectorAll('[data-sb-nav]').forEach(function (a) {
    a.classList.toggle('is-active', a.getAttribute('data-sb-nav') === file);
  });

  var toggle = document.getElementById('sbThemeToggle');
  function syncTheme(theme) {
    if (toggle) toggle.textContent = 'Theme: ' + (theme === 'dark' ? 'Dark' : 'Light');
    if (window.IfxChart) window.IfxChart.paint();
  }
  if (toggle && window.IfxTheme) {
    toggle.addEventListener('click', function () { window.IfxTheme.toggle(); });
    window.addEventListener('ifx-theme-change', function (e) { syncTheme(e.detail.theme); });
    syncTheme(window.IfxTheme.get());
  }

  if (window.IfxPagination) window.IfxPagination.init();
  if (window.IfxTabs) window.IfxTabs.init();
  if (window.IfxWizard) window.IfxWizard.init();
  if (window.IfxChat) window.IfxChat.init();
  if (window.IfxChart) window.IfxChart.init();

  document.querySelectorAll('[data-ifx-toast]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (window.IfxToast) window.IfxToast.show(btn.getAttribute('data-ifx-toast-msg') || 'Đã lưu (demo)', btn.getAttribute('data-ifx-toast'));
    });
  });

  document.querySelectorAll('.sb-pat-radios').forEach(function (group) {
    group.addEventListener('click', function (e) {
      var card = e.target.closest('.sb-pat-radio');
      if (!card) return;
      group.querySelectorAll('.sb-pat-radio').forEach(function (c) {
        c.classList.toggle('is-selected', c === card);
      });
    });
  });

  document.querySelectorAll('[data-ifx-copy]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var id = btn.getAttribute('data-ifx-copy');
      var el = document.getElementById(id);
      var text = el ? (el.value || el.textContent || '') : '';
      if (!text || !navigator.clipboard) return;
      navigator.clipboard.writeText(text).then(function () {
        if (window.IfxToast) window.IfxToast.show('Đã sao chép', 'success');
      });
    });
  });
})();
