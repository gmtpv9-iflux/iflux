/* Hoạt động gần đây — không gồm tương tác xã hội (Timeline / follow / chat) */
(function (global) {
  'use strict';

  var STORAGE_KEY = 'iflux_profile_activity_v1';

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
      document.dispatchEvent(new CustomEvent('iflux-profile-activity-change'));
    }
  }

  function log(userId, item) {
    if (!userId || !item) return null;
    var entry = {
      id: item.id || ('act_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6)),
      userId: userId,
      type: item.type || 'system',
      icon: item.icon || 'ti-activity',
      iconClass: item.iconClass || 'accent',
      title: item.title || '',
      desc: item.desc || '',
      at: item.at || new Date().toISOString()
    };
    var list = readAll();
    list.unshift(entry);
    if (list.length > 300) list = list.slice(0, 300);
    writeAll(list);
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
    var list = readAll();
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
    writeAll(list);
  }

  function seedIfEmpty(userId) {
    var list = readAll().filter(function (a) { return a.userId === userId; });
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
      },
      {
        type: 'alert',
        icon: 'ti-bell',
        iconClass: 'warning',
        title: 'Tạo cảnh báo giá',
        desc: 'Cảnh báo HPG vượt ngưỡng 28.500 — push & email.',
        at: new Date(now - 86400000 * 4).toISOString()
      },
      {
        type: 'watchlist',
        icon: 'ti-bookmark',
        iconClass: 'success',
        title: 'Thêm mã vào Watchlist',
        desc: 'FPT, VCB được thêm vào tab "Ngân hàng".',
        at: new Date(now - 86400000 * 6).toISOString()
      },
      {
        type: 'widget',
        icon: 'ti-layout-grid',
        iconClass: 'accent',
        title: 'Thêm tiện ích Dashboard',
        desc: 'Widget "Độ rộng thị trường" được ghim lên dashboard.',
        at: new Date(now - 86400000 * 9).toISOString()
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
    var list = readAll().filter(function (a) { return a.userId === userId; });
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
