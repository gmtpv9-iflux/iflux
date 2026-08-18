/* =================================================================
   VUEXY DARK — System JS
   Không phụ thuộc jQuery hay Bootstrap
   ================================================================= */

(function () {
  'use strict';

  /* ------------------------------------------------------------------
     0. Sidebar menu — SoT: IfluxAdminNavRegistry → IfluxAdminAppShell → Sidebar
     ------------------------------------------------------------------ */

  /* ------------------------------------------------------------------
     1. SIDEBAR TOGGLE
     Desktop: thu gọn menu còn icon (ix-sidebar-collapsed)
     Mobile: drawer trượt + overlay
     ------------------------------------------------------------------ */
  const layout = document.querySelector('.ix-layout');
  const sidebar = document.querySelector('.ix-sidebar');
  const overlay = document.getElementById('ix-overlay');
  const mqDesktop = window.matchMedia('(min-width: 1200px)');
  const STORAGE_COLLAPSED = 'ix-sidebar-collapsed';

  function isDesktop() {
    return mqDesktop.matches;
  }

  function setCollapsed(collapsed) {
    if (!layout) return;
    layout.classList.toggle('ix-sidebar-collapsed', collapsed);
  }

  function loadCollapsedPreference() {
    if (!isDesktop()) {
      setCollapsed(false);
      return;
    }
    setCollapsed(localStorage.getItem(STORAGE_COLLAPSED) === '1');
  }

  function toggleDesktopCollapse() {
    if (!layout) return;
    const next = !layout.classList.contains('ix-sidebar-collapsed');
    setCollapsed(next);
    localStorage.setItem(STORAGE_COLLAPSED, next ? '1' : '0');
  }

  function openMobileSidebar() {
    if (!sidebar) return;
    sidebar.classList.add('ix-sidebar-open');
    if (overlay) overlay.classList.add('ix-overlay-visible');
    document.body.classList.add('ix-body-noscroll');
  }

  function closeMobileSidebar() {
    if (!sidebar) return;
    sidebar.classList.remove('ix-sidebar-open');
    if (overlay) overlay.classList.remove('ix-overlay-visible');
    document.body.classList.remove('ix-body-noscroll');
  }

  document.querySelectorAll('[data-ix-toggle="sidebar"]').forEach(function (el) {
    el.addEventListener('click', function () {
      if (isDesktop()) {
        toggleDesktopCollapse();
        return;
      }
      sidebar && sidebar.classList.contains('ix-sidebar-open')
        ? closeMobileSidebar()
        : openMobileSidebar();
    });
  });
  if (overlay) overlay.addEventListener('click', closeMobileSidebar);

  mqDesktop.addEventListener('change', function () {
    closeMobileSidebar();
    loadCollapsedPreference();
  });

  loadCollapsedPreference();


  /* ------------------------------------------------------------------
     1b. SIDEBAR SCROLL — giữ vị trí menu khi chuyển trang
     ------------------------------------------------------------------ */
  const STORAGE_SCROLL = 'ix-sidebar-scroll-top';

  function saveSidebarScroll() {
    if (!sidebar) return;
    try {
      sessionStorage.setItem(STORAGE_SCROLL, String(sidebar.scrollTop));
    } catch (e) { /* ignore */ }
  }

  function restoreSidebarScroll() {
    if (!sidebar) return;
    try {
      var raw = sessionStorage.getItem(STORAGE_SCROLL);
      if (raw == null) return;
      var top = parseInt(raw, 10);
      if (!isFinite(top) || top < 0) return;
      sidebar.scrollTop = top;
    } catch (e) { /* ignore */ }
  }

  if (sidebar) {
    var scrollSaveTimer;
    sidebar.addEventListener('scroll', function () {
      clearTimeout(scrollSaveTimer);
      scrollSaveTimer = setTimeout(saveSidebarScroll, 80);
    }, { passive: true });

    sidebar.querySelectorAll('.ix-menu-item[href]').forEach(function (link) {
      link.addEventListener('click', saveSidebarScroll);
    });

    window.addEventListener('beforeunload', saveSidebarScroll);
    window.addEventListener('pagehide', saveSidebarScroll);

    restoreSidebarScroll();
    requestAnimationFrame(function () {
      restoreSidebarScroll();
      requestAnimationFrame(restoreSidebarScroll);
    });
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', restoreSidebarScroll);
    }
    window.addEventListener('load', restoreSidebarScroll);
  }


  /* ------------------------------------------------------------------
     2. MENU — SUBMENU ACCORDION
     Parent có submenu: không điều hướng; toggle do App Shell Sidebar bind.
     ------------------------------------------------------------------ */
  /* no-op legacy — behavior ở iflux-admin-app-shell-sidebar.js */

  /* Active: App Shell Sidebar. Không mở parent theo path (D-04). Không render lần 2. */


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

/* ------------------------------------------------------------------
   16. ADMIN NOTIFICATIONS — bell trên navbar (chỉ trang Admin)
   ------------------------------------------------------------------ */
(function loadAdminNotifications() {
  function isAdminShell() {
    if (typeof location !== 'undefined') {
      var path = location.pathname || '';
      if (path.indexOf('/app/') >= 0 || path.indexOf('Admin_Design_system') >= 0) return true;
    }
    return !!document.querySelector('.ix-nav-actions');
  }
  if (window.IfluxAdminNotifications || !isAdminShell()) return;
  var scripts = document.getElementsByTagName('script');
  var base = '';
  var i;
  for (i = scripts.length - 1; i >= 0; i--) {
    var src = scripts[i].src || '';
    if (src.indexOf('iflux-admin-ui.js') !== -1) {
      base = src.replace(/iflux-admin-ui\.js(\?.*)?$/, '');
      break;
    }
  }
  if (!base) return;
  var el = document.createElement('script');
  el.src = base + 'iflux-admin-notifications.js';
  document.head.appendChild(el);
})();

if (window.IfluxAdminAuth && IfluxAdminAuth.patchNavbarAdmin) {
  IfluxAdminAuth.patchNavbarAdmin();
}

/* Chip môi trường: hiển thị đúng theo host thật thay vì hardcode "Môi trường local". */
(function () {
  function apply() {
    var host = (window.location && window.location.hostname) || '';
    var isLocal = !host || host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0' ||
      /^192\.168\./.test(host) || /^10\./.test(host) || window.location.protocol === 'file:';
    var chips = document.querySelectorAll('.ix-nav-actions .ix-chip');
    chips.forEach(function (chip) {
      if ((chip.textContent || '').trim().indexOf('Môi trường local') !== 0) return;
      if (isLocal) return;
      chip.textContent = 'Production';
      chip.classList.remove('ix-chip-warning');
      chip.classList.add('ix-chip-success');
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', apply);
  } else {
    apply();
  }
})();
