/* ADM-SUB-004 — Affiliate admin (đọc events chung User Web) */
(function (global) {
  'use strict';

  var CONFIG_KEY = 'iflux_loyalty_affiliate_config_v1';
  var EVENTS_KEY = 'iflux_loyalty_affiliate_events_v1';

  var DEFAULT_CONFIG = {
    enabled: true,
    f0_pct: 10,
    f1_pct: 5,
    f2_pct: 2.5,
    min_payout: 100000,
    cookie_days: 30
  };

  function readJson(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function writeJson(key, val) {
    localStorage.setItem(key, JSON.stringify(val));
  }

  function readConfig() {
    return Object.assign({}, DEFAULT_CONFIG, readJson(CONFIG_KEY, {}));
  }

  function writeConfig(cfg) {
    writeJson(CONFIG_KEY, cfg);
  }

  function readEvents() {
    return readJson(EVENTS_KEY, []);
  }

  function writeEvents(list) {
    writeJson(EVENTS_KEY, list);
  }

  function formatVnd(n) {
    return '₫' + Number(n || 0).toLocaleString('vi-VN');
  }

  function statusLabel(e) {
    if (e.paid || e.status === 'paid') return { text: 'Đã trả', chip: 'ix-chip-success' };
    if (e.status === 'cancelled') return { text: 'Đã hủy', chip: 'ix-chip-danger' };
    if (e.status === 'pending_order') return { text: 'Chờ đơn', chip: 'ix-chip-warning' };
    return { text: 'Chờ trả', chip: 'ix-chip-info' };
  }

  function eventToAdminRow(e) {
    return {
      id: e.id,
      referrer: e.beneficiaryName,
      referrerId: e.beneficiaryId,
      initials: initialsFromName(e.beneficiaryName),
      avatarCls: avatarClassFromName(e.beneficiaryName),
      referred: e.buyerName,
      referredId: e.buyerId,
      level: e.layer,
      commissionStatus: e.status || 'confirmed',
      status: e.paid || e.status === 'paid' ? 'paid' : (e.status === 'cancelled' ? 'cancelled' : 'unpaid'),
      orderValue: e.orderAmount,
      commission: e.commission,
      paid: !!e.paid,
      at: e.at,
      productLabel: e.productLabel,
      sourceNote: e.sourceNote
    };
  }

  function initialsFromName(name) {
    var parts = String(name || '').trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    return String(name || 'U').trim().slice(0, 2).toUpperCase();
  }

  function avatarClassFromName(name) {
    var classes = ['ix-avatar-accent', 'ix-avatar-success', 'ix-avatar-warning', 'ix-avatar-danger', 'ix-avatar-info'];
    var sum = 0;
    var i;
    for (i = 0; i < (name || '').length; i++) sum += name.charCodeAt(i);
    return classes[sum % classes.length];
  }

  function computeStats(list) {
    var totalEarn = 0;
    var unpaid = 0;
    var converted = 0;
    list.forEach(function (r) {
      totalEarn += r.commission || 0;
      if (!r.paid && r.commissionStatus !== 'cancelled') unpaid += r.commission || 0;
      if (r.orderValue > 0) converted++;
    });
    var convRate = list.length ? Math.round((converted / list.length) * 100) : 0;
    return { totalEarn: totalEarn, unpaid: unpaid, signups: list.length, convRate: convRate };
  }

  global.LoyaltyAffiliateStore = {
    getConfig: readConfig,

    saveConfig: function (data) {
      var cfg = Object.assign({}, readConfig(), {
        enabled: !!data.enabled,
        f0_pct: parseFloat(data.f0_pct) || 0,
        f1_pct: parseFloat(data.f1_pct) || 0,
        f2_pct: parseFloat(data.f2_pct) || 0,
        min_payout: parseInt(data.min_payout, 10) || 0,
        cookie_days: parseInt(data.cookie_days, 10) || 30
      });
      writeConfig(cfg);
      return { ok: true, config: cfg };
    },

    listReferrals: function (filters) {
      filters = filters || {};
      var q = (filters.q || '').toLowerCase();
      return readEvents().map(eventToAdminRow).filter(function (r) {
        if (filters.status && r.status !== filters.status) return false;
        if (filters.level && r.level !== filters.level) return false;
        if (q) {
          var hay = [r.referrer, r.referred, r.referredId, r.referrerId, r.productLabel].join(' ').toLowerCase();
          if (hay.indexOf(q) < 0) return false;
        }
        return true;
      });
    },

    getStats: function () {
      return computeStats(readEvents().map(eventToAdminRow));
    },

    markPaid: function (id) {
      var list = readEvents();
      var item = list.find(function (r) { return r.id === id; });
      if (!item) return { ok: false, error: 'Không tìm thấy' };
      item.paid = true;
      item.status = 'paid';
      writeEvents(list);
      return { ok: true };
    },

    markPaidForUser: function (userId, amount) {
      var list = readEvents();
      var left = Math.round(Number(amount) || 0);
      list.forEach(function (e) {
        if (left <= 0) return;
        if (String(e.beneficiaryId) !== String(userId) || e.paid) return;
        e.paid = true;
        e.status = 'paid';
        left -= e.commission || 0;
      });
      writeEvents(list);
      return { ok: true };
    },

    updateStatus: function (id, status) {
      var list = readEvents();
      var item = list.find(function (r) { return r.id === id; });
      if (!item) return { ok: false, error: 'Không tìm thấy' };
      item.status = status;
      if (status === 'cancelled') {
        item.commission = 0;
        item.orderAmount = 0;
      }
      writeEvents(list);
      return { ok: true };
    },

    formatVnd: formatVnd,
    statusLabel: statusLabel
  };
})(window);
