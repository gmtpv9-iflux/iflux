/* Đơn nâng cấp gói — User Web ↔ Admin (localStorage, sandbox GĐ1) */
(function (global) {
  'use strict';

  var STORAGE_KEY = 'iflux_checkout_orders_v1';
  var ADMIN_NOTIF_KEY = 'iflux_admin_notifications_v1';
  var SESSION_KEY = 'iflux_user_session';
  var apiOrdersCache = null;
  var adminPollTimer = null;
  var ADMIN_POLL_MS = 15000;

  function notifyAdminNewOrder(order) {
    if (!order || !order.id) return;
    if (global.IfluxAdminNotifications && IfluxAdminNotifications.pushNewOrder) {
      IfluxAdminNotifications.pushNewOrder(order);
      return;
    }
    try {
      var raw = localStorage.getItem(ADMIN_NOTIF_KEY);
      var list = raw ? JSON.parse(raw) : [];
      var notifId = 'adm_notif_' + order.id;
      if (list.some(function (n) { return n.id === notifId; })) return;
      var status = order.status === 'pending' ? 'Chờ duyệt' : 'Đã thanh toán';
      list.unshift({
        id: notifId,
        type: 'new_order',
        orderId: order.id,
        title: 'Đơn hàng mới · ' + (order.planName || order.planTier),
        message: (order.userName || order.email || 'Khách') + ' · ' + fmt(order.amount) + ' · ' +
          payMethodLabel(order.payMethod) + ' · ' + status,
        read: false,
        at: order.createdAt || new Date().toISOString(),
        href: ''
      });
      if (list.length > 100) list = list.slice(0, 100);
      localStorage.setItem(ADMIN_NOTIF_KEY, JSON.stringify(list));
      if (typeof document !== 'undefined') {
        document.dispatchEvent(new CustomEvent('iflux-admin-notif-changed'));
      }
    } catch (e) { /* ignore */ }
  }

  function useApi() {
    return global.IfluxData ? IfluxData.isApi() : false;
  }

  function isAdminPage() {
    try {
      return String(global.location.pathname || '').indexOf('Admin_Design_system') >= 0;
    } catch (e) {
      return false;
    }
  }

  function readAllLocal() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function writeAllLocal(list) {
    var serialized = JSON.stringify(list);
    var prev = null;
    try { prev = localStorage.getItem(STORAGE_KEY); } catch (e) { /* ignore */ }
    try { localStorage.setItem(STORAGE_KEY, serialized); } catch (e2) { /* ignore */ }
    if (prev !== serialized && typeof document !== 'undefined') {
      document.dispatchEvent(new CustomEvent('iflux-orders-changed'));
    }
  }

  function invalidateCache() {
    apiOrdersCache = null;
  }

  function syncAdminNotifications() {
    if (!isAdminPage() || !global.IfluxAdminNotifications) return;
    IfluxAdminNotifications.syncOrdersFromStore();
  }

  function startAdminPolling() {
    if (adminPollTimer || !isAdminPage() || !useApi()) return;
    adminPollTimer = setInterval(function () {
      refreshFromApi().catch(function () { /* offline */ });
    }, ADMIN_POLL_MS);
  }

  function readAll() {
    if (apiOrdersCache) return apiOrdersCache.slice();
    return readAllLocal();
  }

  function writeAll(list) {
    apiOrdersCache = list.slice();
    writeAllLocal(list);
  }

  function refreshFromApi() {
    if (!useApi()) return Promise.resolve(readAllLocal());
    if (isAdminPage() && IfluxApiClient.listSubscriptionOrdersAdmin) {
      return IfluxApiClient.listSubscriptionOrdersAdmin({}).then(function (res) {
        apiOrdersCache = res.orders || [];
        writeAllLocal(apiOrdersCache);
        reconcileReferralCommissions();
        syncAdminNotifications();
        return apiOrdersCache.slice();
      }).catch(function () {
        return readAllLocal();
      });
    }
    var token = global.IfluxAuth && IfluxAuth.getToken && IfluxAuth.getToken();
    if (!token || token.indexOf('mock_jwt_') === 0) return Promise.resolve(readAllLocal());
    return IfluxApiClient.listMySubscriptionOrders(token).then(function (res) {
      apiOrdersCache = res.orders || [];
      writeAllLocal(apiOrdersCache);
      reconcileReferralCommissions();
      return apiOrdersCache.slice();
    }).catch(function () {
      return readAllLocal();
    });
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', function (e) {
      if (e.key === STORAGE_KEY) invalidateCache();
    });
  }

  if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function () {
      refreshFromApi().finally(function () {
        if (isAdminPage()) startAdminPolling();
      });
    });
  }

  function fmt(n) {
    return '₫' + Math.round(Number(n) || 0).toLocaleString('vi-VN');
  }

  function payMethodLabel(method) {
    if (method === 'transfer') return 'Chuyển khoản';
    if (method === 'momo') return 'MoMo';
    if (method === 'vnpay') return 'VNPay';
    return 'Thẻ tín dụng';
  }

  function statusLabel(status) {
    if (status === 'pending') return 'Chờ duyệt';
    if (status === 'approved') return 'Đã duyệt';
    if (status === 'rejected') return 'Từ chối';
    if (status === 'refunded') return 'Đã hoàn tiền';
    if (status === 'paid') return 'Đã thanh toán';
    return status || '—';
  }

  function cycleLabel(cycle) {
    if (cycle === 'lifetime') return 'Trọn đời';
    if (cycle === 'annual') return 'Hàng năm';
    if (cycle === 'monthly') return 'Hàng tháng';
    return cycle || '—';
  }

  function resolvePlanFields(payload) {
    var tier = String(payload.planTier || '').toLowerCase();
    if (!tier) tier = 'premium';
    var plan = null;
    if (global.IfluxPlansCatalog && IfluxPlansCatalog.getPlan) {
      plan = IfluxPlansCatalog.getPlan(tier);
    } else if (global.PlansRuntimeReader && PlansRuntimeReader.getPlan) {
      plan = PlansRuntimeReader.getPlan(tier);
    }
    var planName = plan ? (plan.name || tier) : (payload.planName || tier);
    return {
      planTier: tier,
      planName: planName
    };
  }

  function planDays(cycle) {
    if (cycle === 'annual') return 365;
    if (cycle === 'lifetime') return null;
    return 30;
  }

  function patchSessionUser(userId, patch) {
    try {
      var raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      var s = JSON.parse(raw);
      if (!s.user || s.user.id !== userId) return null;
      s.user = Object.assign({}, s.user, patch);
      if (patch.plan) {
        s.user.plan = Object.assign({}, s.user.plan || {}, patch.plan);
      }
      localStorage.setItem(SESSION_KEY, JSON.stringify(s));
      if (global.IfluxCustomersStore && IfluxCustomersStore.upsertFromAppUser) {
        IfluxCustomersStore.upsertFromAppUser(s.user);
      }
      return s.user;
    } catch (e) {
      return null;
    }
  }

  function resolveReferrerUserId(userId) {
    if (!userId || !global.IfluxLoyaltyAffiliateStore) return null;
    var fromParents = IfluxLoyaltyAffiliateStore.getReferrerId(userId);
    if (fromParents) return fromParents;
    try {
      var raw = localStorage.getItem('iflux_user_profiles_v1');
      if (raw) {
        var data = JSON.parse(raw);
        var u = data.byId && data.byId[userId];
        if (u && u.referred_by) return String(u.referred_by);
      }
    } catch (e) { /* ignore */ }
    if (global.IfluxAuth && IfluxAuth.getUser && IfluxAuth.getUser()) {
      var sessionUser = IfluxAuth.getUser();
      if (sessionUser.id === userId && sessionUser.referred_by) return String(sessionUser.referred_by);
    }
    return null;
  }

  function syncBuyerReferralForOrder(order, buyer) {
    if (!global.IfluxLoyaltyAffiliateStore || !buyer || !buyer.id) return;
    var referrerId = (order && order.referrerUserId) || buyer.referred_by || resolveReferrerUserId(buyer.id);
    if (referrerId && IfluxLoyaltyAffiliateStore.applyReferralFromServer) {
      IfluxLoyaltyAffiliateStore.applyReferralFromServer(String(buyer.id), String(referrerId), '');
    } else if (referrerId) {
      IfluxLoyaltyAffiliateStore.setReferrer(String(buyer.id), String(referrerId));
    }
    IfluxLoyaltyAffiliateStore.ensureBuyerReferralLink(buyer, referrerId);
  }

  function resolveBuyer(order) {
    var sessionUser = global.IfluxAuth && IfluxAuth.getUser && IfluxAuth.getUser();
    if (sessionUser && sessionUser.id === order.userId) return sessionUser;
    if (global.IfluxCustomersStore) {
      var c = IfluxCustomersStore.getCustomerById(order.userId);
      if (c) {
        return {
          id: c.id,
          display_name: c.name,
          email: c.email,
          phone: c.phone,
          referred_by: resolveReferrerUserId(c.id) || ''
        };
      }
    }
    return {
      id: order.userId,
      display_name: order.userName,
      email: order.email,
      referred_by: resolveReferrerUserId(order.userId) || ''
    };
  }

  function applyPlanToUser(order) {
    var days = planDays(order.cycle);
    var patch = {
      tier: order.planTier,
      tier_label: order.planName,
      subscription_phase: 'paid',
      trial_expiry_pending: false,
      plan: {
        name: order.planName,
        tier: order.planTier,
        cycle: order.cycle,
        price: order.amount,
        days_left: days,
        days_total: days,
        expires_at: order.cycle === 'lifetime' ? null : undefined
      }
    };

    var updated = null;
    if (global.IfluxAuth && IfluxAuth.patchUserById) {
      updated = IfluxAuth.patchUserById(order.userId, patch);
    } else if (global.IfluxAuth && IfluxAuth.updateUser && global.IfluxAuth.getUser && IfluxAuth.getUser() &&
        IfluxAuth.getUser().id === order.userId) {
      updated = IfluxAuth.updateUser(patch);
    } else {
      updated = patchSessionUser(order.userId, patch);
    }

    var buyer = resolveBuyer(order);
    if (order.referrerUserId) buyer.referred_by = order.referrerUserId;
    syncBuyerReferralForOrder(order, buyer);
    if (global.IfluxLoyaltyAffiliateStore && buyer) {
      IfluxLoyaltyAffiliateStore.processPurchase(buyer, order.amount, {
        productLabel: order.planName + ' / ' + cycleLabel(order.cycle),
        orderId: order.id,
        referrerUserId: order.referrerUserId || buyer.referred_by || null
      });
    }

    if (global.IfluxInAppNotifications && IfluxInAppNotifications.pushOrderStatus) {
      IfluxInAppNotifications.pushOrderStatus(order.userId, {
        orderId: order.id,
        status: 'approved',
        planName: order.planName,
        cycle: order.cycle,
        amount: order.amount
      });
    }

    return updated;
  }

  function createOrder(payload) {
    var planFields = resolvePlanFields(payload);
    payload = Object.assign({}, payload, planFields);

    if (useApi() && global.IfluxAuth && IfluxAuth.getToken) {
      var token = IfluxAuth.getToken();
      if (token && token.indexOf('mock_jwt_') !== 0) {
        return IfluxApiClient.createSubscriptionOrder(token, payload).then(function (res) {
          var order = res.order;
          if (order && !order.referrerUserId) {
            order.referrerUserId = resolveReferrerUserId(order.userId);
          }
          var list = readAll();
          list.unshift(order);
          writeAll(list);
          notifyAdminNewOrder(order);
          if (order.status === 'pending' && global.IfluxInAppNotifications && IfluxInAppNotifications.pushOrderStatus) {
            IfluxInAppNotifications.pushOrderStatus(order.userId, {
              orderId: order.id,
              status: 'pending',
              planName: order.planName,
              cycle: order.cycle,
              amount: order.amount,
              transferRef: order.transferRef
            });
          }
          if (order.status === 'paid' || order.status === 'approved') {
            applyPlanToUser(order);
            if (global.IfluxAuth.refreshSessionFromApi) {
              IfluxAuth.refreshSessionFromApi();
            }
          }
          return order;
        });
      }
    }

    var list = readAll();
    list.forEach(function (o) {
      if (o.userId === payload.userId && o.status === 'pending' && o.payMethod === 'transfer') {
        o.status = 'rejected';
        o.rejectedAt = new Date().toISOString();
        o.rejectReason = 'Thay bằng đơn mới';
      }
    });

    var order = {
      id: 'ord_' + Date.now(),
      userId: payload.userId,
      userName: payload.userName || '',
      email: payload.email || '',
      planTier: payload.planTier,
      planName: payload.planName,
      cycle: payload.cycle,
      amount: payload.amount,
      couponDiscount: payload.couponDiscount || 0,
      payMethod: payload.payMethod,
      transferRef: payload.transferRef || '',
      referrerUserId: resolveReferrerUserId(payload.userId),
      status: payload.payMethod === 'transfer' ? 'pending' : 'paid',
      createdAt: new Date().toISOString(),
      approvedAt: null,
      rejectedAt: null,
      rejectReason: '',
      approvedBy: null
    };

    list.unshift(order);
    writeAll(list);

    notifyAdminNewOrder(order);

    if (order.status === 'pending' && global.IfluxInAppNotifications && IfluxInAppNotifications.pushOrderStatus) {
      IfluxInAppNotifications.pushOrderStatus(order.userId, {
        orderId: order.id,
        status: 'pending',
        planName: order.planName,
        cycle: order.cycle,
        amount: order.amount,
        transferRef: order.transferRef
      });
    }

    if (order.status === 'paid') {
      applyPlanToUser(order);
      order.approvedAt = new Date().toISOString();
      writeAll(list);
    }

    return order;
  }

  function updateOrder(id, patch) {
    var list = readAll();
    var idx = -1;
    var i;
    for (i = 0; i < list.length; i++) {
      if (list[i].id === id) { idx = i; break; }
    }
    if (idx < 0) return null;
    list[idx] = Object.assign({}, list[idx], patch);
    writeAll(list);
    return list[idx];
  }

  function approveOrder(id, meta) {
    meta = meta || {};
    if (useApi() && isAdminPage() && IfluxApiClient.approveSubscriptionOrderAdmin) {
      return IfluxApiClient.approveSubscriptionOrderAdmin(id).then(function (res) {
        if (!res.ok) return { ok: false, error: 'invalid_order' };
        var order = res.order;
        if (res.buyerReferredBy && order && order.userId && global.IfluxLoyaltyAffiliateStore) {
          IfluxLoyaltyAffiliateStore.setReferrer(order.userId, res.buyerReferredBy);
          order.referrerUserId = res.buyerReferredBy;
        }
        applyPlanToUser(order);
        var list = readAll().map(function (o) { return o.id === id ? order : o; });
        writeAll(list);
        return { ok: true, order: order };
      }).catch(function () {
        return approveOrderLocal(id, meta);
      });
    }
    return Promise.resolve(approveOrderLocal(id, meta));
  }

  function approveOrderLocal(id, meta) {
    meta = meta || {};
    var order = getById(id);
    if (!order || order.status !== 'pending') return { ok: false, error: 'invalid_order' };

    applyPlanToUser(order);
    return {
      ok: true,
      order: updateOrder(id, {
        status: 'approved',
        approvedAt: new Date().toISOString(),
        approvedBy: meta.adminName || 'Admin'
      })
    };
  }

  function rejectOrder(id, reason, meta) {
    meta = meta || {};
    if (useApi() && isAdminPage() && IfluxApiClient.rejectSubscriptionOrderAdmin) {
      return IfluxApiClient.rejectSubscriptionOrderAdmin(id, reason).then(function (res) {
        if (!res.ok) return { ok: false, error: 'invalid_order' };
        var order = res.order;
        var list = readAll().map(function (o) { return o.id === id ? order : o; });
        writeAll(list);
        if (global.IfluxInAppNotifications && IfluxInAppNotifications.pushOrderStatus) {
          IfluxInAppNotifications.pushOrderStatus(order.userId, {
            orderId: order.id,
            status: 'rejected',
            planName: order.planName,
            cycle: order.cycle,
            amount: order.amount,
            reason: order.rejectReason
          });
        }
        return { ok: true, order: order };
      }).catch(function () {
        return rejectOrderLocal(id, reason, meta);
      });
    }
    return Promise.resolve(rejectOrderLocal(id, reason, meta));
  }

  function rejectOrderLocal(id, reason, meta) {
    meta = meta || {};
    var order = getById(id);
    if (!order || order.status !== 'pending') return { ok: false, error: 'invalid_order' };

    var updated = updateOrder(id, {
      status: 'rejected',
      rejectedAt: new Date().toISOString(),
      rejectReason: reason || 'Không xác nhận được thanh toán',
      approvedBy: meta.adminName || 'Admin'
    });

    if (global.IfluxInAppNotifications && IfluxInAppNotifications.pushOrderStatus) {
      IfluxInAppNotifications.pushOrderStatus(order.userId, {
        orderId: order.id,
        status: 'rejected',
        planName: order.planName,
        cycle: order.cycle,
        amount: order.amount,
        reason: updated.rejectReason
      });
    }

    return { ok: true, order: updated };
  }

  function refundOrder(id, meta) {
    meta = meta || {};
    var order = getById(id);
    if (!order || (order.status !== 'approved' && order.status !== 'paid')) {
      return { ok: false, error: 'invalid_order' };
    }
    return {
      ok: true,
      order: updateOrder(id, {
        status: 'refunded',
        refundedAt: new Date().toISOString(),
        refundReason: meta.reason || 'Admin hoàn tiền',
        approvedBy: meta.adminName || 'Admin'
      })
    };
  }

  function getById(id) {
    return readAll().find(function (o) { return o.id === id; }) || null;
  }

  function listOrders(opts) {
    opts = opts || {};
    var list = readAll();
    if (opts.status) list = list.filter(function (o) { return o.status === opts.status; });
    if (opts.userId) list = list.filter(function (o) { return o.userId === opts.userId; });
    if (opts.payMethod) list = list.filter(function (o) { return o.payMethod === opts.payMethod; });
    if (opts.limit) list = list.slice(0, opts.limit);
    if (opts.q) {
      var q = String(opts.q).toLowerCase();
      list = list.filter(function (o) {
        return (o.email || '').toLowerCase().indexOf(q) >= 0 ||
          (o.userName || '').toLowerCase().indexOf(q) >= 0 ||
          (o.id || '').toLowerCase().indexOf(q) >= 0 ||
          (o.transferRef || '').toLowerCase().indexOf(q) >= 0;
      });
    }
    return list;
  }

  function getPendingForUser(userId) {
    return listOrders({ userId: userId, status: 'pending' })[0] || null;
  }

  function reconcileReferralCommissions() {
    if (useApi()) return;
    if (!global.IfluxLoyaltyAffiliateStore) return;
    listOrders().forEach(function (order) {
      if (order.status !== 'approved' && order.status !== 'paid') return;
      var buyer = resolveBuyer(order);
      syncBuyerReferralForOrder(order, buyer);
      IfluxLoyaltyAffiliateStore.processPurchase(buyer, order.amount, {
        productLabel: order.planName + ' / ' + cycleLabel(order.cycle),
        orderId: order.id
      });
    });
  }

  function stats() {
    var list = readAll();
    var pending = list.filter(function (o) { return o.status === 'pending'; });
    var approved = list.filter(function (o) { return o.status === 'approved' || o.status === 'paid'; });
    var totalAmount = approved.reduce(function (s, o) { return s + (o.amount || 0); }, 0);
    return {
      total: list.length,
      pending: pending.length,
      approved: approved.length,
      rejected: list.filter(function (o) { return o.status === 'rejected'; }).length,
      pendingTransfer: pending.filter(function (o) { return o.payMethod === 'transfer'; }).length,
      revenue: totalAmount
    };
  }

  global.IfluxSubscriptionOrdersStore = {
    createOrder: createOrder,
    listOrders: listOrders,
    getById: getById,
    getPendingForUser: getPendingForUser,
    approveOrder: approveOrder,
    rejectOrder: rejectOrder,
    refundOrder: refundOrder,
    stats: stats,
    refreshFromApi: refreshFromApi,
    invalidateCache: invalidateCache,
    reconcileReferralCommissions: reconcileReferralCommissions,
    fmt: fmt,
    payMethodLabel: payMethodLabel,
    statusLabel: statusLabel,
    cycleLabel: cycleLabel
  };
})(window);
