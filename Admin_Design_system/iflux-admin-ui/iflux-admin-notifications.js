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
