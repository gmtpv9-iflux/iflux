/* Thông báo in-app — server inbox (Platform) + localStorage chỉ cho client-only chưa migrate */
(function (global) {
  'use strict';

  var STORAGE_KEY = 'iflux_inapp_notifications_v1';
  var DEMO_USER_ID = 'usr_demo_001';

  function clientLocalTypes() {
    return global.IfluxClientLocalNotificationTypes || null;
  }

  function isClientLocalType(type) {
    var cl = clientLocalTypes();
    if (cl && cl.isClientLocalType) return cl.isClientLocalType(type);
    return false;
  }

  var TYPE_META = {
    community_post: { icon: 'ti-users', category: 'community', menuKey: 'community' },
    community_message: { icon: 'ti-message', category: 'community', menuKey: 'community' },
    referral_signup: { icon: 'ti-user-plus', category: 'loyalty', menuKey: 'loyalty' },
    affiliate_commission: { icon: 'ti-coin', category: 'loyalty', menuKey: 'loyalty' },
    subscription_order: { icon: 'ti-receipt', category: 'loyalty', menuKey: 'loyalty' },
    alert_triggered: { icon: 'ti-bell-ringing', category: 'alert', menuKey: 'dashboard' }
  };

  var CATEGORY_LABELS = {
    community: 'Cộng đồng',
    loyalty: 'Membership',
    alert: 'Cảnh báo thiết lập'
  };

  function us() { return global.IfluxUserStorage; }

  function normalizeList(raw) {
    return Array.isArray(raw) ? raw : [];
  }

  function migrateLegacyOnce() {
    var store = us();
    if (!store) return;
    var userId = store.currentUserId();
    if (!userId || userId === 'anon') return;
    var scoped = store.scopedKey(STORAGE_KEY, userId);
    if (localStorage.getItem(scoped)) return;
    try {
      var legacy = localStorage.getItem(STORAGE_KEY);
      if (!legacy) return;
      var list = normalizeList(JSON.parse(legacy));
      var mine = list.filter(function (n) { return n && String(n.userId) === String(userId); });
      if (mine.length) store.writeJson(STORAGE_KEY, mine, userId);
    } catch (e) { /* ignore */ }
  }

  function readAll() {
    migrateLegacyOnce();
    var store = us();
    if (store) return normalizeList(store.readJson(STORAGE_KEY, [], store.currentUserId()));
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return normalizeList(raw ? JSON.parse(raw) : []);
    } catch (e) {
      return [];
    }
  }

  function writeAll(list) {
    list = normalizeList(list);
    var store = us();
    if (store) store.writeJson(STORAGE_KEY, list, store.currentUserId());
    else localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    if (global.IfluxUserDataSync && IfluxUserDataSync.scheduleNotificationsSync) {
      IfluxUserDataSync.scheduleNotificationsSync(list);
    }
    if (typeof document !== 'undefined') {
      document.dispatchEvent(new CustomEvent('iflux-notifications-change'));
    }
  }

  function hydrateFromServer(payload) {
    var list = normalizeList(payload);
    var store = us();
    if (store) store.writeJson(STORAGE_KEY, list, store.currentUserId());
    else localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    if (typeof document !== 'undefined') {
      document.dispatchEvent(new CustomEvent('iflux-notifications-change'));
    }
  }

  function exportForSync() {
    return readAll();
  }

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function formatVnd(n) {
    return '₫' + Number(n || 0).toLocaleString('vi-VN');
  }

  function metaForType(type) {
    return TYPE_META[type] || { icon: 'ti-bell', category: 'community', menuKey: 'community' };
  }

  function enrichItem(item) {
    var meta = metaForType(item.type);
    if (!item.menuKey) item.menuKey = meta.menuKey;
    if (!item.category) item.category = meta.category;
    if (!item.icon) item.icon = meta.icon;
    return item;
  }

  function push(item) {
    if (!item || !item.type) return null;
    var cl = clientLocalTypes();
    if (cl && cl.assertClientLocalWrite && !cl.assertClientLocalWrite(item.type)) return null;
    if (!isClientLocalType(item.type)) return null;
    item = enrichItem(item);
    var list = readAll();
    if (list.some(function (n) { return n.id === item.id; })) return item;
    list.unshift(item);
    if (list.length > 200) list = list.slice(0, 200);
    writeAll(list);
    return item;
  }

  function pushOrderStatus(userId, data) {
    if (!userId || !data) return null;
    var status = data.status;
    var title = 'Đơn nâng cấp gói';
    var message = '';
    var toastType = 'success';
    if (status === 'pending') {
      title = 'Đã gửi yêu cầu nâng cấp';
      message = 'Đơn ' + (data.planName || '') + ' (' + formatVnd(data.amount) + ') đang chờ Admin xác nhận chuyển khoản.';
      if (data.transferRef) message += ' Nội dung CK: ' + data.transferRef + '.';
      toastType = 'info';
    } else if (status === 'approved') {
      title = 'Gói đã được kích hoạt';
      message = 'Admin đã duyệt — ' + (data.planName || 'Gói') + ' đã được áp dụng cho tài khoản của bạn.';
    } else if (status === 'rejected') {
      title = 'Đơn nâng cấp bị từ chối';
      message = 'Đơn ' + (data.planName || '') + ' không được duyệt.' + (data.reason ? ' Lý do: ' + data.reason : '');
      toastType = 'danger';
    } else {
      return null;
    }
    var item = push({
      id: 'notif_ord_' + (data.orderId || Date.now()) + '_' + status,
      userId: userId,
      type: 'subscription_order',
      title: title,
      message: message,
      read: false,
      at: new Date().toISOString(),
      href: '../home/index.html?tab=account'
    });
    item._toastType = toastType;
    return item;
  }

  function pushAffiliateCommission(userId, evt) {
    if (!userId || !evt) return null;
    return push({
      id: 'notif_' + evt.id,
      userId: userId,
      type: 'affiliate_commission',
      title: 'Hoa hồng Affiliate',
      message: 'Bạn vừa nhận ' + formatVnd(evt.commission) + ' (' + evt.layer + ' · ' + evt.commissionPct + '%) từ ' + evt.buyerName + ' mua ' + evt.productLabel,
      amount: evt.commission,
      layer: evt.layer,
      read: false,
      at: new Date().toISOString(),
      href: '../home/index.html?tab=affiliate'
    });
  }

  function pushCommunityMessage(userId, data) {
    if (!userId || !data) return null;
    var sender = data.sender || {};
    var preview = String(data.preview || '').slice(0, 120);
    return push({
      id: 'notif_msg_' + (data.messageId || sender.id + '_' + Date.now()),
      userId: userId,
      type: 'community_message',
      title: 'Tin nhắn mới',
      message: (sender.display_name || 'Thành viên') + ': ' + preview,
      read: false,
      at: new Date().toISOString(),
      href: '../home/index.html?tab=messages&peer=' + encodeURIComponent(sender.id || '')
    });
  }

  function pushAlertTriggered(userId, alert) {
    if (!userId || !alert) return null;
    var st = global.IfluxAlertStore;
    var cond = st ? st.formatCondition(alert) : (alert.ticker || 'CP');
    return push({
      id: 'notif_alert_' + alert.id + '_triggered',
      userId: userId,
      type: 'alert_triggered',
      title: 'Cảnh báo kích hoạt · ' + alert.ticker,
      message: cond,
      read: false,
      at: new Date().toISOString(),
      href: '../home/index.html'
    });
  }

  function listForUser(userId, opts) {
    opts = opts || {};
    var uid = String(userId || '');
    /* community_message thuộc biểu tượng tin nhắn — không đưa vào chuông / menu badge */
    var list = readAll().filter(function (n) {
      if (String(n.userId) !== uid || n.type === 'community_message') return false;
      if (!isClientLocalType(n.type)) return false;
      return true;
    }).map(enrichItem);
    if (opts.unreadOnly) list = list.filter(function (n) { return !n.read; });
    if (opts.menuKey) list = list.filter(function (n) { return n.menuKey === opts.menuKey; });
    if (opts.category) list = list.filter(function (n) { return n.category === opts.category; });
    if (opts.limit) list = list.slice(0, opts.limit);
    return list;
  }

  /* FN-001 — server inbox (Need Now summary / Need Soon panel). App Shell only. */
  var serverUnread = null;
  var serverPanelCache = null;

  function notifApiBase() {
    try {
      var host = String((global.location && location.hostname) || '').toLowerCase();
      if (host === 'iflux.vn' || host === 'www.iflux.vn' || host.indexOf('staging.') === 0) return '/api';
    } catch (e) { /* ignore */ }
    if (global.IfluxApiConfig && IfluxApiConfig.getBaseUrl) {
      var b = IfluxApiConfig.getBaseUrl();
      if (b) return String(b).replace(/\/$/, '');
    }
    return '/api';
  }

  function notifAuthHeaders() {
    var h = { Accept: 'application/json' };
    try {
      if (global.IfluxAuth && IfluxAuth.getToken) {
        var t = IfluxAuth.getToken();
        if (t) h.Authorization = 'Bearer ' + t;
      }
    } catch (e) { /* ignore */ }
    return h;
  }

  function mapServerItem(n) {
    return enrichItem({
      id: n.id,
      type: n.templateCode || 'server',
      templateCode: n.templateCode,
      title: n.title,
      message: n.body || '',
      icon: n.icon,
      read: !!n.read,
      at: n.createdAt,
      href: n.href || '#'
    });
  }

  function fetchSummary() {
    return fetch(notifApiBase() + '/notifications/summary', {
      headers: notifAuthHeaders(),
      credentials: 'same-origin'
    }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (data) {
        if (!res.ok) return null;
        var body = (data && data.data) || data || {};
        serverUnread = Number(body.unreadCount) || 0;
        return serverUnread;
      });
    }).catch(function () { return null; });
  }

  function fetchInboxPage(opts) {
    opts = opts || {};
    var qs = ['limit=' + encodeURIComponent(opts.limit || 15)];
    if (opts.cursor) qs.push('cursor=' + encodeURIComponent(opts.cursor));
    return fetch(notifApiBase() + '/notifications?' + qs.join('&'), {
      headers: notifAuthHeaders(),
      credentials: 'same-origin'
    }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (data) {
        if (!res.ok) throw new Error('inbox_fail');
        var body = (data && data.data) || data || {};
        serverPanelCache = {
          items: (body.items || []).map(mapServerItem),
          next_cursor: body.next_cursor || null
        };
        return serverPanelCache;
      });
    });
  }

  function markServerRead(ids) {
    var list = Array.isArray(ids) ? ids : (ids ? [ids] : []);
    if (!list.length) return Promise.resolve();
    return Promise.all(list.map(function (id) {
      return fetch(notifApiBase() + '/notifications/' + encodeURIComponent(id) + '/read', {
        method: 'POST',
        headers: notifAuthHeaders(),
        credentials: 'same-origin'
      }).then(function () {
        if (serverUnread != null && serverUnread > 0) serverUnread -= 1;
      }).catch(function () { /* ignore */ });
    })).then(function () {
      try { document.dispatchEvent(new CustomEvent('iflux-notifications-change')); } catch (e) { /* ignore */ }
    });
  }

  function unreadCount(userId) {
    if (serverUnread != null) return serverUnread;
    return listForUser(userId, { unreadOnly: true }).length;
  }

  function unreadCountByMenu(userId, menuKey) {
    return listForUser(userId, { unreadOnly: true, menuKey: menuKey }).length;
  }

  function groupedUnread(userId) {
    var counts = { community: 0, loyalty: 0, dashboard: 0 };
    listForUser(userId, { unreadOnly: true }).forEach(function (n) {
      if (counts[n.menuKey] != null) counts[n.menuKey] += 1;
    });
    return counts;
  }

  function groupedForUser(userId, opts) {
    opts = opts || {};
    var list = listForUser(userId, { limit: opts.limit || 12 });
    var groups = [
      { key: 'community', label: CATEGORY_LABELS.community, items: [] },
      { key: 'loyalty', label: CATEGORY_LABELS.loyalty, items: [] },
      { key: 'alert', label: CATEGORY_LABELS.alert, items: [] }
    ];
    var map = { community: groups[0], loyalty: groups[1], alert: groups[2] };
    list.forEach(function (n) {
      var g = map[n.category];
      if (g) g.items.push(n);
    });
    return groups.filter(function (g) { return g.items.length > 0; });
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

  function markAllRead(userId) {
    var uid = String(userId || '');
    var list = readAll();
    list.forEach(function (n) {
      if (String(n.userId) === uid) n.read = true;
    });
    writeAll(list);
    serverUnread = 0;
    fetch(notifApiBase() + '/notifications/read-all', {
      method: 'POST',
      headers: notifAuthHeaders(),
      credentials: 'same-origin'
    }).catch(function () { /* ignore */ });
  }

  function markMenuRead(userId, menuKey) {
    var uid = String(userId || '');
    var list = readAll();
    list.forEach(function (n) {
      if (String(n.userId) === uid && n.menuKey === menuKey) n.read = true;
    });
    writeAll(list);
  }

  function seedDemoIfEmpty(userId) {
    /* Không seed lại thông báo demo khi đã đọc/đã xóa — tránh badge “ảo” lúc đăng nhập lại */
    if (!userId || userId !== DEMO_USER_ID) return;
    if (listForUser(userId).length) return;
    var store = us();
    var flagKey = 'iflux_notif_seeded_v1';
    if (store && store.readJson(flagKey, null, userId)) return;
    try {
      if (localStorage.getItem(flagKey + '_' + userId) === '1') return;
    } catch (e) { /* ignore */ }

    push({
      id: 'notif_ord_demo_pending',
      userId: userId,
      type: 'subscription_order',
      title: 'Đã gửi yêu cầu nâng cấp',
      message: 'Đơn Premium / 1 tháng (₫830.000) đang chờ Admin xác nhận.',
      read: false,
      at: new Date(Date.now() - 86400000).toISOString(),
      href: '../home/index.html?tab=account'
    });
    pushAffiliateCommission(userId, {
      id: 'evt_seed_notif_1',
      commission: 83000,
      layer: 'F0',
      commissionPct: 10,
      buyerName: 'Trần Thị B',
      productLabel: 'Premium / 1 tháng'
    });
    push({
      id: 'notif_ord_demo_pending',
      userId: userId,
      type: 'subscription_order',
      title: 'Đã gửi yêu cầu nâng cấp',
      message: 'Đơn Premium / 1 tháng (₫830.000) đang chờ Admin xác nhận.',
      read: false,
      at: new Date(Date.now() - 86400000).toISOString(),
      href: '../home/index.html?tab=account'
    });
    pushAlertTriggered(userId, {
      id: 'alr_demo_seed',
      ticker: 'HPG',
      type: 'rank',
      groupName: 'Thép',
      topN: 5
    });
    if (store) store.writeJson(flagKey, { at: Date.now() }, userId);
    try { localStorage.setItem(flagKey + '_' + userId, '1'); } catch (e2) { /* ignore */ }
  }

  global.IfluxInAppNotifications = {
    pushOrderStatus: pushOrderStatus,
    pushAffiliateCommission: pushAffiliateCommission,
    pushCommunityMessage: pushCommunityMessage,
    pushAlertTriggered: pushAlertTriggered,
    listForUser: listForUser,
    unreadCount: unreadCount,
    unreadCountByMenu: unreadCountByMenu,
    groupedUnread: groupedUnread,
    groupedForUser: groupedForUser,
    markRead: markRead,
    markAllRead: markAllRead,
    markMenuRead: markMenuRead,
    seedDemoIfEmpty: seedDemoIfEmpty,
    hydrateFromServer: hydrateFromServer,
    exportForSync: exportForSync,
    fetchSummary: fetchSummary,
    fetchInboxPage: fetchInboxPage,
    markServerRead: markServerRead,
    getServerPanelCache: function () { return serverPanelCache; },
    CATEGORY_LABELS: CATEGORY_LABELS,
    initForCurrentUser: function () {
      fetchSummary().catch(function () { /* offline */ });
      if (global.IfluxUserNotificationsUI) IfluxUserNotificationsUI.init();
    }
  };
})(window);
