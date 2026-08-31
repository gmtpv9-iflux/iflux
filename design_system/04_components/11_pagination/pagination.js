/**
 * IfxPagination — page switch UI only.
 * Sở hữu: render nút trang, state is-active, event ifx-page-change.
 * Không sở hữu: tbody, search, page-size policy, row visibility.
 */
(function (global) {
  'use strict';

  function init(root) {
    var wrap = root || document.querySelector('[data-ifx-pagination]');
    if (!wrap || wrap.getAttribute('data-ifx-bound') === '1') return wrap;
    wrap.setAttribute('data-ifx-bound', '1');
    wrap.addEventListener('click', function (e) {
      var btn = e.target.closest('.ifx-page-btn');
      if (!btn || btn.disabled) return;
      if (btn.hasAttribute('data-ifx-page')) {
        var page = parseInt(btn.getAttribute('data-ifx-page'), 10);
        if (!page) return;
        wrap.dispatchEvent(new CustomEvent('ifx-page-change', {
          bubbles: true,
          detail: { page: page }
        }));
        return;
      }
      if (btn.hasAttribute('data-ifx-page-nav')) return;
      wrap.querySelectorAll('.ifx-page-btn:not([data-ifx-page-nav])').forEach(function (b) {
        b.classList.toggle('is-active', b === btn);
      });
      var info = wrap.querySelector('.ifx-page-info');
      if (info) info.textContent = 'Trang ' + btn.textContent.trim();
    });
    return wrap;
  }

  function render(wrap, state) {
    if (!wrap) return;
    var page = state.page || 1;
    var pages = Math.max(1, state.pages || 1);
    var total = state.total || 0;
    wrap.textContent = '';
    function btn(label, target, disabled, active) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'ifx-page-btn' + (active ? ' is-active' : '');
      b.textContent = label;
      b.disabled = !!disabled;
      if (!disabled) b.setAttribute('data-ifx-page', String(target));
      return b;
    }
    wrap.appendChild(btn('‹', page - 1, page <= 1, false));
    for (var p = 1; p <= pages; p += 1) {
      wrap.appendChild(btn(String(p), p, false, p === page));
    }
    wrap.appendChild(btn('›', page + 1, page >= pages, false));
    var info = document.createElement('span');
    info.className = 'ifx-page-info';
    info.textContent = total ? ('Trang ' + page + ' / ' + pages) : '0';
    wrap.appendChild(info);
  }

  global.IfxPagination = { init: init, render: render };
})(window);
