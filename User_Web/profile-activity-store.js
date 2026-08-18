/* Hoạt động gần đây — scoped theo userId (Wave B) */
(function (global) {
  'use strict';

  var STORAGE_KEY = 'iflux_profile_activity_v2';
  var LEGACY_KEY = 'iflux_profile_activity_v1';
  var migrated = false;

  function scope() {
    return global.IfluxProfileLocalScope || null;
  }

  function ensureMigrated() {
    if (migrated) return;
    migrated = true;
    var S = scope();
    if (S && S.migrateFlatListToMap) {
      S.migrateFlatListToMap(LEGACY_KEY, STORAGE_KEY, 'userId');
    }
  }

  function readMap() {
    ensureMigrated();
    var S = scope();
    if (S) return S.readMap(STORAGE_KEY, {});
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function writeMap(map) {
    var S = scope();
    if (S) S.writeMap(STORAGE_KEY, map);
    else localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
    if (typeof document !== 'undefined') {
      document.dispatchEvent(new CustomEvent('iflux-profile-activity-change'));
    }
  }

  function listRaw(userId) {
    if (!userId) return [];
    var map = readMap();
    return (map[String(userId)] || []).slice();
  }

  function saveList(userId, list) {
    if (!userId) return;
    var map = readMap();
    map[String(userId)] = list;
    writeMap(map);
  }

  function log(userId, item) {
    if (!userId || !item) return null;
    var entry = {
      id: item.id || ('act_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6)),
      userId: String(userId),
      type: item.type || 'system',
      icon: item.icon || 'ti-activity',
      iconClass: item.iconClass || 'accent',
      title: item.title || '',
      desc: item.desc || '',
      at: item.at || new Date().toISOString()
    };
    var list = listRaw(userId);
    list.unshift(entry);
    if (list.length > 300) list = list.slice(0, 300);
    saveList(userId, list);
    return entry;
  }

  function orderToActivity(order) {
    if (!order) return null;
    var status = order.status;
    var title = 'Đơn nâng cấp gói';
    var desc = (order.planName || '') + ' · ' + (global.IfluxSubscriptionOrdersStore
      ? IfluxSubscriptionOrdersStore.cycleLabel(order.cycle)
      : order.cycle);
    var icon = 'ti-crown';
    var iconClass = 'accent';

    if (status === 'pending') {
      title = 'Gửi yêu cầu thanh toán';
      desc += ' — chờ Admin duyệt (' + (global.IfluxSubscriptionOrdersStore
        ? IfluxSubscriptionOrdersStore.fmt(order.amount)
        : order.amount) + ')';
      iconClass = 'warning';
    } else if (status === 'rejected') {
      title = 'Đơn nâng cấp bị từ chối';
      desc += order.rejectReason ? ' — ' + order.rejectReason : '';
      icon = 'ti-x';
      iconClass = 'danger';
    } else {
      title = 'Gói đăng ký đã kích hoạt';
      desc += ' — ' + (global.IfluxSubscriptionOrdersStore
        ? IfluxSubscriptionOrdersStore.fmt(order.amount)
        : order.amount);
      icon = 'ti-star';
      iconClass = 'success';
    }

    return {
      id: 'act_ord_' + order.id + '_' + status,
      userId: order.userId,
      type: 'subscription',
      icon: icon,
      iconClass: iconClass,
      title: title,
      desc: desc,
      at: order.approvedAt || order.rejectedAt || order.createdAt
    };
  }

  function mergeOrders(userId) {
    if (!userId || !global.IfluxSubscriptionOrdersStore) return;
    var orders = IfluxSubscriptionOrdersStore.listOrders({ userId: userId });
    var list = listRaw(userId);
    var ids = {};
    list.forEach(function (a) { ids[a.id] = true; });

    orders.forEach(function (order) {
      var act = orderToActivity(order);
      if (act && !ids[act.id]) {
        list.push(act);
        ids[act.id] = true;
      }
    });

    list.sort(function (a, b) {
      return new Date(b.at).getTime() - new Date(a.at).getTime();
    });
    saveList(userId, list);
  }

  function seedIfEmpty(userId) {
    var S = scope();
    if (S && S.useApi && S.useApi()) return;
    var list = listRaw(userId);
    if (list.length) return;
    var now = Date.now();
    [
      {
        type: 'profile',
        icon: 'ti-user-check',
        iconClass: 'info',
        title: 'Cập nhật hồ sơ cá nhân',
        desc: 'Đã lưu thông tin hiển thị công khai trên hồ sơ.',
        at: new Date(now - 86400000 * 2).toISOString()
      }
    ].forEach(function (item) {
      log(userId, item);
    });
  }

  function listForUser(userId, opts) {
    opts = opts || {};
    if (!userId) return [];
    mergeOrders(userId);
    if (opts.seed !== false) seedIfEmpty(userId);
    var list = listRaw(userId);
    list.sort(function (a, b) {
      return new Date(b.at).getTime() - new Date(a.at).getTime();
    });
    if (opts.limit) list = list.slice(0, opts.limit);
    return list;
  }

  global.IfluxProfileActivityStore = {
    log: log,
    listForUser: listForUser,
    mergeOrders: mergeOrders
  };
})(window);
