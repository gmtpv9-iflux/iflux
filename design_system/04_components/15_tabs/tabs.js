/**
 * IfxTabs — [data-ifx-tabs] > .ifx-tab[data-ifx-tab] + .ifx-tab-panel[data-ifx-panel]
 */
(function (global) {
  'use strict';
  function init(root) {
    var wrap = root && root.matches && root.matches('[data-ifx-tabs]')
      ? root
      : (root || document).querySelector('[data-ifx-tabs]');
    if (!wrap || wrap.getAttribute('data-ifx-bound') === '1') return wrap;
    wrap.setAttribute('data-ifx-bound', '1');
    var scope = wrap.closest('[data-ifx-tabs-root]') || wrap.parentElement;
    wrap.addEventListener('click', function (e) {
      var tab = e.target.closest('.ifx-tab');
      if (!tab || !wrap.contains(tab)) return;
      var id = tab.getAttribute('data-ifx-tab');
      wrap.querySelectorAll('.ifx-tab').forEach(function (t) { t.classList.toggle('is-active', t === tab); });
      scope.querySelectorAll('[data-ifx-panel]').forEach(function (p) {
        p.classList.toggle('is-active', p.getAttribute('data-ifx-panel') === id);
      });
    });
    return wrap;
  }
  function initAll() {
    document.querySelectorAll('[data-ifx-tabs]').forEach(init);
  }
  global.IfxTabs = { init: init, initAll: initAll };
})(window);
