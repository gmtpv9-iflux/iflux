/* =================================================================
   VUEXY DARK — System JS
   Không phụ thuộc jQuery hay Bootstrap
   ================================================================= */

(function () {
  'use strict';

  /* ------------------------------------------------------------------
     1. SIDEBAR TOGGLE (mobile)
     ------------------------------------------------------------------ */
  const sidebar = document.querySelector('.ix-sidebar');
  const overlay = document.getElementById('ix-overlay');

  function openSidebar() {
    if (!sidebar) return;
    sidebar.classList.add('ix-sidebar-open');
    if (overlay) overlay.style.display = 'block';
    document.body.style.overflow = 'hidden';
  }
  function closeSidebar() {
    if (!sidebar) return;
    sidebar.classList.remove('ix-sidebar-open');
    if (overlay) overlay.style.display = 'none';
    document.body.style.overflow = '';
  }

  document.querySelectorAll('[data-ix-toggle="sidebar"]').forEach(function (el) {
    el.addEventListener('click', function () {
      sidebar && sidebar.classList.contains('ix-sidebar-open')
        ? closeSidebar()
        : openSidebar();
    });
  });
  if (overlay) overlay.addEventListener('click', closeSidebar);


  /* ------------------------------------------------------------------
     2. MENU — SUBMENU ACCORDION
     ------------------------------------------------------------------ */
  document.querySelectorAll('.ix-menu-item[data-ix-submenu]').forEach(function (item) {
    item.addEventListener('click', function (e) {
      e.preventDefault();
      const isOpen = item.classList.contains('open');

      /* close all siblings */
      const parent = item.parentElement;
      parent.querySelectorAll('.ix-menu-item.open').forEach(function (sibling) {
        if (sibling !== item) sibling.classList.remove('open');
      });

      item.classList.toggle('open', !isOpen);
    });
  });

  /* Mark active item based on current page URL */
  const path = window.location.pathname.split('/').pop();
  document.querySelectorAll('.ix-menu-item[href]').forEach(function (link) {
    if (link.getAttribute('href') === path) {
      link.classList.add('active');
      /* open parent submenu if nested */
      const parent = link.closest('.ix-menu-sub');
      if (parent) {
        const toggle = parent.previousElementSibling;
        if (toggle) toggle.classList.add('open');
      }
    }
  });


  /* ------------------------------------------------------------------
     3. DROPDOWN
     ------------------------------------------------------------------ */
  document.querySelectorAll('[data-ix-toggle="dropdown"]').forEach(function (trigger) {
    trigger.addEventListener('click', function (e) {
      e.stopPropagation();
      const dropdown = trigger.closest('.ix-dropdown');
      const isOpen = dropdown.classList.contains('open');

      /* close all dropdowns */
      document.querySelectorAll('.ix-dropdown.open').forEach(function (d) {
        d.classList.remove('open');
      });

      if (!isOpen) dropdown.classList.add('open');
    });
  });

  /* Close dropdown on outside click */
  document.addEventListener('click', function () {
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

  document.querySelectorAll('[data-ix-modal]').forEach(function (trigger) {
    trigger.addEventListener('click', function () {
      openModal(trigger.dataset.ixModal);
    });
  });
  document.querySelectorAll('[data-ix-dismiss="modal"]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const modal = btn.closest('.ix-modal-overlay');
      if (modal) closeModal(modal.id);
    });
  });
  document.querySelectorAll('.ix-modal-overlay').forEach(function (overlay) {
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeModal(overlay.id);
    });
  });

  /* Expose globally */
  window.ixOpenModal  = openModal;
  window.ixCloseModal = closeModal;


  /* ------------------------------------------------------------------
     5. TOAST NOTIFICATION
     Usage: ixToast('Message', 'success') — types: success|danger|warning|info|primary
     ------------------------------------------------------------------ */
  function ixToast(message, type, duration) {
    type     = type     || 'primary';
    duration = duration || 3500;

    let container = document.getElementById('ix-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'ix-toast-container';
      Object.assign(container.style, {
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: '9999',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      });
      document.body.appendChild(container);
    }

    const icons = {
      success: 'ti-circle-check',
      danger:  'ti-alert-circle',
      warning: 'ti-alert-triangle',
      info:    'ti-info-circle',
      primary: 'ti-bell',
    };

    const toast = document.createElement('div');
    toast.className = 'ix-alert ix-alert-' + type;
    Object.assign(toast.style, {
      minWidth: '260px',
      maxWidth: '360px',
      boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
      transition: 'opacity 0.3s, transform 0.3s',
      opacity: '0',
      transform: 'translateX(20px)',
    });
    toast.innerHTML =
      '<i class="ti ' + (icons[type] || icons.primary) + '" style="font-size:18px;flex-shrink:0"></i>' +
      '<span style="font-size:13px">' + message + '</span>';

    container.appendChild(toast);
    requestAnimationFrame(function () {
      toast.style.opacity = '1';
      toast.style.transform = 'translateX(0)';
    });

    setTimeout(function () {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(20px)';
      setTimeout(function () { toast.remove(); }, 300);
    }, duration);
  }
  window.ixToast = ixToast;


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
    const btn = e.target.closest('.ix-btn:not(.ix-btn-icon)');
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
     8. SEARCH — keyboard shortcut Ctrl+K / Cmd+K
     ------------------------------------------------------------------ */
  document.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      const input = document.querySelector('.ix-search input');
      if (input) input.focus();
    }
    /* ESC closes modals and dropdowns */
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
  document.querySelectorAll('table.ix-table').forEach(function (table) {
    const tbody = table.querySelector('tbody');
    if (!tbody) return;

    table.querySelectorAll('th[data-ix-sort]').forEach(function (th) {
      th.style.cursor = 'pointer';
      th.style.userSelect = 'none';

      let dir = 1;
      th.addEventListener('click', function () {
        const col = parseInt(th.dataset.ixSort, 10);
        const rows = Array.from(tbody.querySelectorAll('tr'));

        rows.sort(function (a, b) {
          const aText = (a.cells[col] || {}).textContent || '';
          const bText = (b.cells[col] || {}).textContent || '';
          return aText.localeCompare(bText, undefined, { numeric: true }) * dir;
        });

        rows.forEach(function (r) { tbody.appendChild(r); });

        table.querySelectorAll('th[data-ix-sort]').forEach(function (other) {
          other.dataset.sortDir = '';
        });
        dir = dir * -1;
        th.dataset.sortDir = dir === -1 ? 'asc' : 'desc';
      });
    });
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

document.querySelectorAll('[data-ix-offcanvas]').forEach(function (trigger) {
  trigger.addEventListener('click', function () {
    ixOpenOffcanvas(trigger.dataset.ixOffcanvas);
  });
});
document.querySelectorAll('[data-ix-dismiss="offcanvas"]').forEach(function (btn) {
  btn.addEventListener('click', function () {
    var el = btn.closest('.ix-offcanvas');
    if (el) ixCloseOffcanvas(el.id);
  });
});
document.querySelectorAll('.ix-offcanvas-overlay').forEach(function (ov) {
  ov.addEventListener('click', function () {
    var targetId = ov.id.replace('-overlay', '');
    ixCloseOffcanvas(targetId);
  });
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
document.querySelectorAll('[data-ix-tab]').forEach(function (btn) {
  btn.addEventListener('click', function () {
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
