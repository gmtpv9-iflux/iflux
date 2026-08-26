/**
 * IfxPagination — generic page switch. Không Admin/business.
 */
(function (global) {
  'use strict';
  function init(root) {
    var wrap = root || document.querySelector('[data-ifx-pagination]');
    if (!wrap) return;
    var info = wrap.querySelector('.ifx-page-info');
    wrap.addEventListener('click', function (e) {
      var btn = e.target.closest('.ifx-page-btn');
      if (!btn || btn.disabled) return;
      if (btn.hasAttribute('data-ifx-page-nav')) return;
      wrap.querySelectorAll('.ifx-page-btn:not([data-ifx-page-nav])').forEach(function (b) {
        b.classList.toggle('is-active', b === btn);
      });
      if (info) info.textContent = 'Trang ' + btn.textContent.trim();
    });
  }
  global.IfxPagination = { init: init };
})(window);
