/* P6a User Profile — template isolation.
 * AppShell sidebar / navbar / notifications / theme-toggle JS removed.
 * Legacy Edit Profile modal removed.
 * Profile tabs, copy-ref, table search/paginate retained.
 * Toast: Canonical IfxToast.show (Legacy ixToast removed).
 */

/* ===== SOURCE: Admin_Design_system/iflux-admin-ui/iflux-admin-ui.js (AppShell trimmed) ===== */
/* =================================================================
   VUEXY DARK — System JS
   Không phụ thuộc jQuery hay Bootstrap
   ================================================================= */

(function () {
  'use strict';

  /* ------------------------------------------------------------------
     3. DROPDOWN
     ------------------------------------------------------------------ */
  document.addEventListener('click', function (e) {
    var trigger = e.target.closest && e.target.closest('[data-ix-toggle="dropdown"]');
    if (trigger) {
      e.stopPropagation();
      var dropdown = trigger.closest('.ix-dropdown');
      if (!dropdown) return;
      var isOpen = dropdown.classList.contains('open');
      document.querySelectorAll('.ix-dropdown.open').forEach(function (d) {
        d.classList.remove('open');
      });
      if (!isOpen) dropdown.classList.add('open');
      return;
    }
    document.querySelectorAll('.ix-dropdown.open').forEach(function (d) {
      d.classList.remove('open');
    });
  });


  /* ------------------------------------------------------------------
     4. MODAL
     ------------------------------------------------------------------ */
  function openModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    setTimeout(function () { modal.classList.add('ix-modal-visible'); }, 10);
  }
  function closeModal(id) {
    const modal = id
      ? document.getElementById(id)
      : document.querySelector('.ix-modal-overlay.ix-modal-visible');
    if (!modal) return;
    modal.classList.remove('ix-modal-visible');
    document.body.style.overflow = '';
    setTimeout(function () { modal.style.display = 'none'; }, 200);
  }

  document.addEventListener('click', function (e) {
    var openBtn = e.target.closest && e.target.closest('[data-ix-modal]');
    if (openBtn) {
      openModal(openBtn.dataset.ixModal);
      return;
    }
    var dismiss = e.target.closest && e.target.closest('[data-ix-dismiss="modal"]');
    if (dismiss) {
      var modal = dismiss.closest('.ix-modal-overlay');
      if (modal) closeModal(modal.id);
      return;
    }
    if (e.target.classList && e.target.classList.contains('ix-modal-overlay')) {
      closeModal(e.target.id);
    }
  });

  /* Expose globally */
  window.ixOpenModal  = openModal;
  window.ixCloseModal = closeModal;


  /* ------------------------------------------------------------------
     5. TOAST — Canonical IfxToast (P6a Step 3B). Legacy ixToast removed.
     ------------------------------------------------------------------ */


  /* ------------------------------------------------------------------
     6. PROGRESS BAR — animate on scroll into view
     ------------------------------------------------------------------ */
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          const bar = entry.target;
          const target = bar.dataset.ixProgress || '0';
          bar.style.width = target + '%';
          observer.unobserve(bar);
        }
      });
    }, { threshold: 0.3 });

    document.querySelectorAll('.ix-progress-bar[data-ix-progress]').forEach(function (bar) {
      bar.style.width = '0%';
      bar.style.transition = 'width 0.8s ease';
      observer.observe(bar);
    });
  }


  /* ------------------------------------------------------------------
     7. RIPPLE EFFECT on buttons
     ------------------------------------------------------------------ */
  document.addEventListener('click', function (e) {
    const btn = e.target.closest('.ifx-btn:not(.ifx-btn-icon)');
    if (!btn) return;
    const circle = document.createElement('span');
    const rect   = btn.getBoundingClientRect();
    const size   = Math.max(rect.width, rect.height);
    Object.assign(circle.style, {
      position:      'absolute',
      width:         size + 'px',
      height:        size + 'px',
      borderRadius:  '50%',
      background:    'rgba(255,255,255,0.15)',
      top:           (e.clientY - rect.top  - size / 2) + 'px',
      left:          (e.clientX - rect.left - size / 2) + 'px',
      transform:     'scale(0)',
      pointerEvents: 'none',
      transition:    'transform 0.5s, opacity 0.5s',
    });
    btn.style.position = 'relative';
    btn.style.overflow = 'hidden';
    btn.appendChild(circle);
    requestAnimationFrame(function () {
      circle.style.transform = 'scale(2.5)';
      circle.style.opacity   = '0';
    });
    setTimeout(function () { circle.remove(); }, 600);
  });


  /* ------------------------------------------------------------------
     8. ESC closes generic modals and dropdowns
     ------------------------------------------------------------------ */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      document.querySelectorAll('.ix-dropdown.open').forEach(function (d) {
        d.classList.remove('open');
      });
      closeModal();
    }
  });


  /* ------------------------------------------------------------------
     9. TABLE — sortable columns
     Usage: <th data-ix-sort="colIndex">
     ------------------------------------------------------------------ */
  document.addEventListener('click', function (e) {
    var th = e.target.closest && e.target.closest('th[data-ix-sort]');
    if (!th) return;
    var table = th.closest('table.ix-table');
    if (!table) return;
    var tbody = table.querySelector('tbody');
    if (!tbody) return;
    th.style.cursor = 'pointer';
    var dir = th.dataset.ixSortDir === '1' ? -1 : 1;
    var col = parseInt(th.dataset.ixSort, 10);
    var rows = Array.from(tbody.querySelectorAll('tr'));
    rows.sort(function (a, b) {
      var aText = (a.cells[col] || {}).textContent || '';
      var bText = (b.cells[col] || {}).textContent || '';
      return aText.localeCompare(bText, undefined, { numeric: true }) * dir;
    });
    rows.forEach(function (r) { tbody.appendChild(r); });
    table.querySelectorAll('th[data-ix-sort]').forEach(function (other) {
      other.dataset.sortDir = '';
    });
    th.dataset.ixSortDir = String(dir);
    th.dataset.sortDir = dir === -1 ? 'asc' : 'desc';
  });

})();

/* ------------------------------------------------------------------
   10. OFFCANVAS / DRAWER
   Usage: data-ix-offcanvas="drawer-id"  /  data-ix-dismiss="offcanvas"
   ------------------------------------------------------------------ */
function ixOpenOffcanvas(id) {
  var el = document.getElementById(id);
  if (!el) return;
  el.classList.add('open');
  var ov = document.getElementById(id + '-overlay');
  if (ov) ov.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function ixCloseOffcanvas(id) {
  var el = id ? document.getElementById(id) : document.querySelector('.ix-offcanvas.open');
  if (!el) return;
  el.classList.remove('open');
  var ov = document.getElementById(el.id + '-overlay');
  if (ov) ov.classList.remove('open');
  document.body.style.overflow = '';
}
window.ixOpenOffcanvas  = ixOpenOffcanvas;
window.ixCloseOffcanvas = ixCloseOffcanvas;

document.addEventListener('click', function (e) {
  var openOc = e.target.closest && e.target.closest('[data-ix-offcanvas]');
  if (openOc) {
    ixOpenOffcanvas(openOc.dataset.ixOffcanvas);
    return;
  }
  var closeOc = e.target.closest && e.target.closest('[data-ix-dismiss="offcanvas"]');
  if (closeOc) {
    var panel = closeOc.closest('.ix-offcanvas');
    if (panel) ixCloseOffcanvas(panel.id);
    return;
  }
  var ov = e.target.classList && e.target.classList.contains('ix-offcanvas-overlay') ? e.target : null;
  if (ov) ixCloseOffcanvas(ov.id.replace('-overlay', ''));
});

/* ------------------------------------------------------------------
   11. TABLE — select all checkbox
   ------------------------------------------------------------------ */
document.querySelectorAll('table.ix-table').forEach(function (table) {
  var selectAll = table.querySelector('thead .ix-checkbox');
  if (!selectAll) return;
  selectAll.addEventListener('change', function () {
    table.querySelectorAll('tbody .ix-checkbox').forEach(function (cb) {
      cb.checked = selectAll.checked;
      cb.closest('tr').style.background = cb.checked ? 'rgba(105,108,255,0.06)' : '';
    });
  });
  table.querySelectorAll('tbody .ix-checkbox').forEach(function (cb) {
    cb.addEventListener('change', function () {
      var all  = table.querySelectorAll('tbody .ix-checkbox');
      var checked = table.querySelectorAll('tbody .ix-checkbox:checked');
      selectAll.indeterminate = checked.length > 0 && checked.length < all.length;
      selectAll.checked = checked.length === all.length;
      cb.closest('tr').style.background = cb.checked ? 'rgba(105,108,255,0.06)' : '';
    });
  });
});

/* ------------------------------------------------------------------
   12. TABLE — live search filter
   Usage: <input data-ix-search="table-id" />
   ------------------------------------------------------------------ */
document.querySelectorAll('[data-ix-search]').forEach(function (input) {
  var table = document.getElementById(input.dataset.ixSearch);
  if (!table) return;
  input.addEventListener('input', function () {
    var q = input.value.toLowerCase();
    table.querySelectorAll('tbody tr').forEach(function (row) {
      row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none';
    });
  });
});

/* ------------------------------------------------------------------
   13. PAGINATION — simple client-side
   Usage: <div data-ix-paginate="table-id" data-per-page="10"></div>
   ------------------------------------------------------------------ */
document.querySelectorAll('[data-ix-paginate]').forEach(function (pager) {
  var tableId = pager.dataset.ixPaginate;
  var perPage = parseInt(pager.dataset.perPage || '10', 10);
  var table   = document.getElementById(tableId);
  if (!table) return;

  var rows = Array.from(table.querySelectorAll('tbody tr'));
  var total = rows.length;
  var pages = Math.ceil(total / perPage);
  var current = 1;

  function render(page) {
    current = Math.max(1, Math.min(page, pages));
    rows.forEach(function (r, i) {
      r.style.display = (i >= (current - 1) * perPage && i < current * perPage) ? '' : 'none';
    });
    pager.innerHTML = '';

    var info = document.createElement('span');
    info.className = 'ix-page-info';
    info.textContent = 'Showing ' + ((current - 1) * perPage + 1) + '–' + Math.min(current * perPage, total) + ' of ' + total;

    var nav = document.createElement('div');
    nav.style.display = 'flex';
    nav.style.gap = '4px';

    function makeBtn(label, page, disabled) {
      var b = document.createElement('button');
      b.className = 'ix-page-btn' + (page === current ? ' active' : '');
      b.textContent = label;
      b.disabled = disabled;
      b.addEventListener('click', function () { render(page); });
      return b;
    }

    nav.appendChild(makeBtn('‹', current - 1, current === 1));
    for (var p = 1; p <= pages; p++) nav.appendChild(makeBtn(p, p, false));
    nav.appendChild(makeBtn('›', current + 1, current === pages));

    pager.appendChild(nav);
    pager.appendChild(info);
  }

  pager.className = 'ix-pagination';
  render(1);
});

/* ------------------------------------------------------------------
   14. TABS — client-side tab switching
   Usage: <button class="ix-tab" data-ix-tab="panel-id"> / <div id="panel-id" class="ix-tab-panel">
   ------------------------------------------------------------------ */
document.addEventListener('click', function (e) {
  var btn = e.target.closest && e.target.closest('[data-ix-tab]');
  if (!btn) return;
  var container = btn.closest('[data-ix-tabs]') || btn.parentElement;
  container.querySelectorAll('[data-ix-tab]').forEach(function (b) { b.classList.remove('active'); });
  btn.classList.add('active');
  var targetId = btn.dataset.ixTab;
  var target = document.getElementById(targetId);
  if (!target) return;
  var panels = target.parentElement.querySelectorAll('.ix-tab-panel');
  panels.forEach(function (p) { p.style.display = 'none'; });
  target.style.display = '';
});

/* ------------------------------------------------------------------
   15. PERMISSION TABLE — select all row
   ------------------------------------------------------------------ */
document.querySelectorAll('.ix-perm-select-all').forEach(function (cb) {
  cb.addEventListener('change', function () {
    var row = cb.closest('tr');
    row.querySelectorAll('.ix-checkbox').forEach(function (c) { c.checked = cb.checked; });
  });
});

/* ===== SOURCE: Admin_Design_system/iflux-admin-ui/pattern-user-profile.js ===== */
/* User profile pattern — patterns/user-profile.html */
(function (global) {
  'use strict';

  function legacyCopyText(text, inputEl) {
    text = String(text || '');
    try {
      if (inputEl && (inputEl.tagName === 'INPUT' || inputEl.tagName === 'TEXTAREA')) {
        inputEl.focus();
        inputEl.select();
        inputEl.setSelectionRange(0, text.length);
        return document.execCommand('copy');
      }
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      var ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch (e) {
      return false;
    }
  }

  function copyText(text, inputEl) {
    text = String(text || '').trim();
    if (!text) {
      if (global.IfxToast) global.IfxToast.show('Không có nội dung để sao chép', 'warning');
      return;
    }
    function notify(ok) {
      if (!global.IfxToast) return;
      global.IfxToast.show(
        ok ? 'Đã sao chép!' : 'Không sao chép được — hãy chọn nội dung và copy thủ công (Ctrl/Cmd+C)',
        ok ? 'success' : 'warning'
      );
    }
    if (global.isSecureContext && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        notify(true);
      }).catch(function () {
        notify(legacyCopyText(text, inputEl));
      });
      return;
    }
    notify(legacyCopyText(text, inputEl));
  }

  function copyRef(inputId) {
    var el = document.getElementById(inputId);
    if (!el) return;
    copyText(el.value || el.textContent || '', el);
  }

  function initProfile(root) {
    var scope = root || document;

    scope.querySelectorAll('[data-ix-profile-tab]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var tabId = btn.getAttribute('data-ix-profile-tab');
        scope.querySelectorAll('.ix-profile-tab').forEach(function (b) {
          b.classList.remove('active');
        });
        scope.querySelectorAll('.ix-tab-content').forEach(function (t) {
          t.classList.remove('active');
        });
        btn.classList.add('active');
        var panel = document.getElementById(tabId);
        if (panel) panel.classList.add('active');
      });
    });

    scope.querySelectorAll('[data-ix-copy-ref]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        copyRef(btn.getAttribute('data-ix-copy-ref'));
      });
    });

    var firstTab = scope.querySelector('.ix-profile-tab.active');
    if (firstTab) {
      var firstId = firstTab.getAttribute('data-ix-profile-tab');
      if (firstId) {
        var firstPanel = document.getElementById(firstId);
        if (firstPanel) firstPanel.classList.add('active');
      }
    }
  }

  global.PatternUserProfile = {
    init: initProfile,
    copyRef: copyRef,
    copyText: copyText
  };
})(window);
