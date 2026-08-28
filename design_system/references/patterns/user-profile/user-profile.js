/* P6a forensic clone — User Profile page JS.
 * Copied from Legacy Admin UI + notifications + pattern-user-profile + iflux-theme.
 * iflux-admin-ui.js dynamically loads notifications via script path; that loader
 * cannot resolve from this file, so notifications.js is inlined here instead.
 * Not Canonical Ifx* abstractions.
 */

/* ===== SOURCE: Admin_Design_system/iflux-admin-ui/iflux-admin-ui.js ===== */
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

/* ===== SOURCE: Admin_Design_system/iflux-admin-ui/iflux-admin-notifications.js ===== */
/* Thông báo Admin — đơn hàng mới (localStorage, sandbox GĐ1) */
(function (global) {
  'use strict';

  var STORAGE_KEY = 'iflux_admin_notifications_v1';
  var READ_CURSOR_KEY = 'iflux_admin_notif_last_seen';
  var TOAST_SEEN_KEY = 'iflux_admin_notif_toast_seen_v1';

  function isAdminShell() {
    if (typeof location !== 'undefined') {
      var path = location.pathname || '';
      if (path.indexOf('/app/') >= 0 || path.indexOf('Admin_Design_system') >= 0) return true;
    }
    return !!document.querySelector('.ix-nav-actions');
  }

  function readToastSeen() {
    try {
      var raw = sessionStorage.getItem(TOAST_SEEN_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function markToastSeen(id) {
    if (!id) return;
    try {
      var map = readToastSeen();
      map[id] = true;
      sessionStorage.setItem(TOAST_SEEN_KEY, JSON.stringify(map));
    } catch (e) { /* ignore */ }
  }

  function readAll() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function writeAll(list) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    if (typeof document !== 'undefined') {
      document.dispatchEvent(new CustomEvent('iflux-admin-notif-changed'));
    }
  }

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function fmtTime(iso) {
    if (!iso) return '—';
    try { return new Date(iso).toLocaleString('vi-VN'); } catch (e) { return iso; }
  }

  function transactionsPageHref() {
    var parts = location.pathname.split('/');
    var appIdx = parts.indexOf('app');
    if (appIdx < 0) return '../subscription/transactions.html';
    var depth = parts.length - appIdx - 2;
    var prefix = '';
    var i;
    for (i = 0; i < depth; i++) prefix += '../';
    return prefix + 'subscription/transactions.html';
  }

  function push(item) {
    var list = readAll();
    var exists = list.some(function (n) { return n.id === item.id; });
    if (exists) return { item: item, isNew: false };
    list.unshift(item);
    if (list.length > 100) list = list.slice(0, 100);
    writeAll(list);
    return { item: item, isNew: true };
  }

  function syncOrdersFromStore() {
    var Store = global.IfluxSubscriptionOrdersStore;
    if (!Store) return;
    var known = {};
    readAll().forEach(function (n) {
      if (n.orderId) known[n.orderId] = true;
    });
    Store.listOrders().forEach(function (o) {
      if (!known[o.id]) pushNewOrder(o);
    });
  }

  function pushNewOrder(order) {
    if (!order) return null;
    var Store = global.IfluxSubscriptionOrdersStore;
    var payLbl = Store ? Store.payMethodLabel(order.payMethod) : order.payMethod;
    var amt = Store ? Store.fmt(order.amount) : order.amount;
    var status = order.status === 'pending' ? 'Chờ duyệt' : 'Đã thanh toán';
    var vars = {
      'Tên khách hàng': order.userName || order.email || 'Khách',
      'Email khách': order.email || '',
      'Tên gói': order.planName || order.planTier || '',
      'Số tiền': amt,
      'Phương thức thanh toán': payLbl,
      'Trạng thái đơn': status,
      'Mã đơn hàng': order.id
    };
    var title = 'Đơn hàng mới · ' + (order.planName || order.planTier);
    var message = vars['Tên khách hàng'] + ' · ' + amt + ' · ' + payLbl + ' · ' + status;
    if (global.IfluxSystemNotificationTemplates) {
      var rendered = IfluxSystemNotificationTemplates.render('ADMIN_NEW_ORDER', vars);
      title = rendered.title;
      message = rendered.message;
    } else {
      try {
        var raw = localStorage.getItem('iflux_sys_notif_templates_v1');
        var ov = raw ? JSON.parse(raw).ADMIN_NEW_ORDER : null;
        if (ov) {
          var apply = function (s) {
            var out = String(s || '');
            Object.keys(vars).forEach(function (k) {
              out = out.split('{' + k + '}').join(vars[k]);
            });
            return out;
          };
          if (ov.title) title = apply(ov.title);
          if (ov.message) message = apply(ov.message);
        }
      } catch (e) { /* ignore */ }
    }
    var item = {
      id: 'adm_notif_' + order.id,
      type: 'new_order',
      orderId: order.id,
      title: title,
      message: message,
      read: false,
      at: order.createdAt || new Date().toISOString(),
      href: transactionsPageHref()
    };
    var result = push(item);
    if (result.isNew && isAdminShell()) toastOnce(result.item);
    return result.item;
  }

  function toastOnce(n) {
    if (!global.ixToast || !n || !n.id) return;
    var seen = readToastSeen();
    if (seen[n.id]) return;
    markToastSeen(n.id);
    ixToast(n.message, n.type === 'new_order' ? 'info' : 'success');
  }

  function showUnreadToasts() {
    if (!isAdminShell() || !global.ixToast) return;
    var unread = readAll().filter(function (n) { return !n.read; }).slice(0, 3);
    unread.forEach(function (n, i) {
      var seen = readToastSeen();
      if (seen[n.id]) return;
      setTimeout(function () { toastOnce(n); }, 500 + i * 900);
    });
  }

  function listRecent(limit) {
    return readAll().slice(0, limit || 20);
  }

  function unreadCount() {
    return readAll().filter(function (n) { return !n.read; }).length;
  }

  function markRead(ids) {
    if (!ids || !ids.length) return;
    var set = {};
    ids.forEach(function (id) { set[id] = true; });
    var list = readAll();
    list.forEach(function (n) {
      if (set[n.id]) n.read = true;
    });
    writeAll(list);
  }

  function markAllRead() {
    var list = readAll();
    list.forEach(function (n) { n.read = true; });
    writeAll(list);
    try { localStorage.setItem(READ_CURSOR_KEY, new Date().toISOString()); } catch (e) { /* ignore */ }
  }

  function mountBell(container) {
    if (!container || container.querySelector('[data-ifx-admin-notif-bell]')) return;

    container.insertAdjacentHTML('beforeend',
      '<div class="ix-dropdown ifx-admin-notif" data-ifx-admin-notif-wrap>' +
        '<button type="button" class="ix-nav-btn" data-ix-toggle="dropdown" data-ifx-admin-notif-bell aria-label="Thông báo">' +
          '<i class="ti ti-bell"></i>' +
          '<span class="ix-nav-dot" data-ifx-admin-notif-dot style="display:none"></span>' +
        '</button>' +
        '<div class="ix-dropdown-menu ifx-admin-notif-menu" style="min-width:320px;max-width:380px;right:0;left:auto">' +
          '<div class="ifx-admin-notif-menu__head">' +
            '<span style="font-weight:600;font-size:13px">Thông báo</span>' +
            '<button type="button" class="ix-btn ix-btn-ghost ix-btn-sm" data-ifx-admin-notif-read-all>Đánh dấu đã đọc</button>' +
          '</div>' +
          '<div data-ifx-admin-notif-list style="max-height:360px;overflow-y:auto"></div>' +
          '<a class="ix-dropdown-item" href="' + esc(transactionsPageHref()) + '" style="justify-content:center;font-weight:600;border-top:1px solid var(--ix-border)">' +
            '<i class="ti ti-receipt"></i> Xem danh sách đơn hàng</a>' +
        '</div>' +
      '</div>'
    );

    function renderList() {
      var listEl = container.querySelector('[data-ifx-admin-notif-list]');
      var dot = container.querySelector('[data-ifx-admin-notif-dot]');
      if (!listEl) return;
      var count = unreadCount();
      if (dot) dot.style.display = count > 0 ? 'block' : 'none';

      var items = listRecent(12);
      if (!items.length) {
        listEl.innerHTML = '<div style="padding:20px;text-align:center;font-size:13px;color:var(--ix-text-muted)">Chưa có thông báo</div>';
        return;
      }

      listEl.innerHTML = items.map(function (n) {
        var unread = !n.read ? ' style="background:rgba(105,108,255,.08)"' : '';
        return '<a href="' + esc(n.href || transactionsPageHref()) + '" class="ix-dropdown-item ifx-admin-notif-item"' + unread +
          ' data-ifx-admin-notif-id="' + esc(n.id) + '">' +
          '<i class="ti ti-shopping-cart"></i>' +
          '<div><div style="font-size:13px;font-weight:600">' + esc(n.title) + '</div>' +
          '<div style="font-size:12px;color:var(--ix-text-muted);margin-top:2px">' + esc(n.message) + '</div>' +
          '<div style="font-size:11px;color:var(--ix-text-muted);margin-top:4px">' + esc(fmtTime(n.at)) + '</div></div></a>';
      }).join('');
    }

    container.querySelector('[data-ifx-admin-notif-read-all]').addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      markAllRead();
      renderList();
    });

    container.addEventListener('click', function (e) {
      var item = e.target.closest('[data-ifx-admin-notif-id]');
      if (!item) return;
      markRead([item.getAttribute('data-ifx-admin-notif-id')]);
    });

    renderList();
    document.addEventListener('iflux-admin-notif-changed', renderList);
    document.addEventListener('iflux-orders-changed', function () {
      syncOrdersFromStore();
      renderList();
      showUnreadToasts();
    });
    window.addEventListener('storage', function (e) {
      if (e.key === 'iflux_checkout_orders_v1') {
        syncOrdersFromStore();
        renderList();
        showUnreadToasts();
      } else if (e.key === STORAGE_KEY) {
        renderList();
        showUnreadToasts();
      }
    });
  }

  function initNavbarBell() {
    if (!isAdminShell()) return;
    document.querySelectorAll('.ix-nav-actions').forEach(function (actions) {
      if (actions.querySelector('[data-ifx-admin-notif-bell]')) return;
      var avatar = actions.querySelector('.ix-avatar');
      var holder = document.createElement('div');
      holder.className = 'ifx-admin-notif-slot';
      mountBell(holder);
      var node = holder.firstElementChild;
      if (!node) return;
      // Chỉ insertBefore khi avatar là con trực tiếp của actions; nếu không thì chèn trước phần tử tổ tiên phù hợp hoặc append.
      var ref = avatar;
      while (ref && ref.parentNode !== actions) ref = ref.parentNode;
      if (ref && ref.parentNode === actions) actions.insertBefore(node, ref);
      else actions.appendChild(node);
    });
    syncOrdersFromStore();
    showUnreadToasts();
  }

  global.IfluxAdminNotifications = {
    pushNewOrder: pushNewOrder,
    syncOrdersFromStore: syncOrdersFromStore,
    listRecent: listRecent,
    unreadCount: unreadCount,
    markRead: markRead,
    markAllRead: markAllRead,
    showUnreadToasts: showUnreadToasts,
    mountBell: mountBell,
    initNavbarBell: initNavbarBell,
    transactionsPageHref: transactionsPageHref
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNavbarBell);
  } else {
    initNavbarBell();
  }
})(window);

/* ===== SOURCE: Admin_Design_system/iflux-admin-ui/pattern-user-profile.js ===== */
/* User profile pattern — patterns/user-profile.html */
(function (global) {
  'use strict';

  function openProfileModal(id) {
    var el = document.getElementById(id);
    if (el) el.classList.add('open');
  }

  function closeProfileModal(id) {
    var el = document.getElementById(id);
    if (el) el.classList.remove('open');
  }

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
      if (global.ixToast) global.ixToast('Không có nội dung để sao chép', 'warning');
      return;
    }
    function notify(ok) {
      if (!global.ixToast) return;
      global.ixToast(
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

    scope.querySelectorAll('[data-ix-profile-modal-open]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        openProfileModal(btn.getAttribute('data-ix-profile-modal-open'));
      });
    });

    scope.querySelectorAll('[data-ix-profile-modal-close]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-ix-profile-modal-close');
        closeProfileModal(id || (btn.closest('[data-profile-modal]') && btn.closest('[data-profile-modal]').id));
      });
    });

    scope.querySelectorAll('[data-profile-modal]').forEach(function (overlay) {
      overlay.addEventListener('click', function (e) {
        if (e.target === overlay) closeProfileModal(overlay.id);
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
    openModal: openProfileModal,
    closeModal: closeProfileModal,
    copyRef: copyRef,
    copyText: copyText
  };
})(window);

/* ===== SOURCE: Admin_Design_system/iflux-admin-ui/iflux-theme.js ===== */
/* iFlux Theme — dark / light toggle + persistence */
(function (global) {
  'use strict';

  var STORAGE_KEY = 'iflux-theme';
  var MODES = { dark: 'dark', light: 'light' };

  function normalize(mode) {
    return mode === MODES.light ? MODES.light : MODES.dark;
  }

  function get() {
    try {
      return normalize(localStorage.getItem(STORAGE_KEY) || MODES.dark);
    } catch (e) {
      return MODES.dark;
    }
  }

  function apply(mode) {
    mode = normalize(mode);
    var root = document.documentElement;
    root.setAttribute('data-theme', mode);
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch (e) { /* ignore */ }

    document.querySelectorAll('.ifx-theme-toggle').forEach(function (btn) {
      var icon = btn.querySelector('[data-ifx-theme-icon]') || btn.querySelector('i');
      if (icon) {
        icon.className = mode === MODES.light ? 'ti ti-moon' : 'ti ti-sun';
      }
      btn.setAttribute('aria-pressed', mode === MODES.light ? 'true' : 'false');
      btn.title = mode === MODES.light ? 'Bật Dark mode' : 'Bật Light mode';
      btn.setAttribute('aria-label', btn.title);
    });

    global.dispatchEvent(new CustomEvent('iflux-theme-change', { detail: { theme: mode } }));
  }

  function set(mode) {
    apply(normalize(mode));
  }

  function toggle() {
    set(get() === MODES.dark ? MODES.light : MODES.dark);
  }

  function createToggleButton(className) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = (className || 'ix-nav-btn') + ' ifx-theme-toggle';
    btn.setAttribute('data-ifx-theme-toggle', '1');
    btn.innerHTML = '<i class="ti ti-sun" data-ifx-theme-icon></i>';
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      toggle();
    });
    return btn;
  }

  function mountToggle() {
    document.querySelectorAll('[data-ifx-theme-toggle]:not(.ifx-theme-mounted)').forEach(function (el) {
      el.classList.add('ifx-theme-mounted');
      if (!el.getAttribute('data-ifx-theme-bound')) {
        el.setAttribute('data-ifx-theme-bound', '1');
        el.addEventListener('click', function (e) {
          e.preventDefault();
          toggle();
        });
      }
    });

    document.querySelectorAll('.ix-nav-actions .ix-nav-btn').forEach(function (btn) {
      if (btn.getAttribute('data-ifx-theme-bound')) return;
      var icon = btn.querySelector('i.ti-sun, i.ti-moon');
      if (!icon) return;
      btn.setAttribute('data-ifx-theme-toggle', '1');
      btn.classList.add('ifx-theme-toggle', 'ifx-theme-mounted');
      btn.setAttribute('data-ifx-theme-bound', '1');
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        toggle();
      });
    });

    document.querySelectorAll('.ifx-topnav-actions').forEach(function (actions) {
      if (actions.querySelector('[data-ifx-theme-toggle]')) return;
      var btn = createToggleButton('ix-nav-btn');
      var tier = actions.querySelector('[data-ifx-tier]');
      if (tier) actions.insertBefore(btn, tier);
      else actions.insertBefore(btn, actions.firstChild);
    });

    document.querySelectorAll('.ix-nav-actions').forEach(function (actions) {
      if (actions.querySelector('[data-ifx-theme-toggle]')) return;
      var btn = createToggleButton('ix-nav-btn');
      var chip = actions.querySelector('.ix-chip');
      if (chip) actions.insertBefore(btn, chip);
      else actions.insertBefore(btn, actions.firstChild);
    });

    apply(get());
  }

  apply(get());

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountToggle);
  } else {
    mountToggle();
  }

  global.IfluxTheme = {
    STORAGE_KEY: STORAGE_KEY,
    MODES: MODES,
    get: get,
    set: set,
    toggle: toggle,
    apply: apply,
    mountToggle: mountToggle
  };
})(window);
