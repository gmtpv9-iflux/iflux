/* Loyalty — catalog mã khuyến mãi (Voucher / Coupon) */
(function (global) {
  'use strict';

  var STORAGE_KEY = 'iflux_loyalty_coupon_catalog_v1';
  var USAGE_KEY = 'iflux_loyalty_promo_usage_v1';

  var DEFAULT = [
    { type: 'coupon', code: 'IFLUX20', value: 10, max_value: 200000, qty_limit: 0, starts_at: '', ends_at: '2026-12-31', used_count: 0, active: true },
    { type: 'voucher', code: 'ANNUAL50K', value: 50000, max_value: 10, qty_limit: 100, starts_at: '', ends_at: '2026-12-31', used_count: 0, active: true }
  ];

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

  function migrateItem(c) {
    if (!c) return null;
    if (c.type === 'voucher' || c.type === 'coupon') {
      return {
        type: c.type,
        code: String(c.code || '').toUpperCase(),
        value: Number(c.value) || 0,
        max_value: Number(c.max_value) || 0,
        qty_limit: Number(c.qty_limit) || 0,
        starts_at: c.starts_at || '',
        ends_at: c.ends_at || c.expires_at || '',
        used_count: Number(c.used_count) || 0,
        active: c.active !== false
      };
    }
    /* legacy */
    if (c.discount_fixed) {
      return {
        type: 'voucher',
        code: String(c.code || '').toUpperCase(),
        value: Number(c.discount_fixed) || 0,
        max_value: 0,
        qty_limit: 0,
        starts_at: '',
        ends_at: c.expires_at || '',
        used_count: 0,
        active: c.active !== false
      };
    }
    return {
      type: 'coupon',
      code: String(c.code || '').toUpperCase(),
      value: Number(c.discount_pct) || 0,
      max_value: 0,
      qty_limit: 0,
      starts_at: '',
      ends_at: c.expires_at || '',
      used_count: 0,
      active: c.active !== false
    };
  }

  function readAll() {
    var list = readJson(STORAGE_KEY, null);
    if (!list || !Array.isArray(list) || !list.length) {
      list = DEFAULT.map(function (c) { return Object.assign({}, c); });
      writeJson(STORAGE_KEY, list);
      return list;
    }
    var migrated = list.map(migrateItem).filter(Boolean);
    writeJson(STORAGE_KEY, migrated);
    return migrated;
  }

  function writeAll(list) {
    writeJson(STORAGE_KEY, list);
  }

  function findIndex(code) {
    var up = String(code || '').toUpperCase();
    return readAll().findIndex(function (c) { return c.code === up; });
  }

  function isExpired(c) {
    if (!c || !c.ends_at) return false;
    return new Date(c.ends_at).getTime() < Date.now();
  }

  function isNotStarted(c) {
    if (!c || !c.starts_at) return false;
    return new Date(c.starts_at).getTime() > Date.now();
  }

  function statusOf(c) {
    if (c.active === false) return { text: 'Tắt', chip: 'ix-chip-secondary' };
    if (isNotStarted(c)) return { text: 'Chưa mở', chip: 'ix-chip-info' };
    if (isExpired(c)) return { text: 'Hết hạn', chip: 'ix-chip-warning' };
    if (c.qty_limit > 0 && c.used_count >= c.qty_limit) return { text: 'Hết lượt', chip: 'ix-chip-warning' };
    return { text: 'Đang bán', chip: 'ix-chip-success' };
  }

  function formatValue(c) {
    if (c.type === 'voucher') return Number(c.value || 0).toLocaleString('vi-VN') + '₫';
    return (Number(c.value) || 0) + '%';
  }

  function formatMax(c) {
    if (!c.max_value) return '—';
    if (c.type === 'voucher') return Number(c.max_value) + '% ĐH';
    return Number(c.max_value).toLocaleString('vi-VN') + '₫';
  }

  function formatTime(c) {
    var a = c.starts_at ? new Date(c.starts_at).toLocaleDateString('vi-VN') : '—';
    var b = c.ends_at ? new Date(c.ends_at).toLocaleDateString('vi-VN') : '—';
    return a + ' → ' + b;
  }

  /* ── Usage log ── */
  function readUsage() {
    var list = readJson(USAGE_KEY, []);
    return Array.isArray(list) ? list : [];
  }

  function writeUsage(list) {
    writeJson(USAGE_KEY, list);
  }

  function syncUsedCounts() {
    var usage = readUsage();
    var counts = {};
    usage.forEach(function (u) {
      var code = String(u.code || '').toUpperCase();
      counts[code] = (counts[code] || 0) + 1;
    });
    var list = readAll();
    list.forEach(function (c) {
      c.used_count = counts[c.code] || 0;
    });
    writeAll(list);
  }

  global.LoyaltyPromoCatalogStore = {
    STORAGE_KEY: STORAGE_KEY,
    USAGE_KEY: USAGE_KEY,

    listAll: function () {
      syncUsedCounts();
      return readAll().slice().sort(function (a, b) { return a.code.localeCompare(b.code); });
    },

    get: function (code) {
      var idx = findIndex(code);
      return idx >= 0 ? Object.assign({}, readAll()[idx]) : null;
    },

    save: function (data, originalCode) {
      var list = readAll();
      var code = String(data.code || '').trim().toUpperCase();
      if (!code) return { ok: false, error: 'Mã là bắt buộc' };
      if (!/^[A-Z0-9_-]{3,20}$/.test(code)) return { ok: false, error: 'Mã 3–20 ký tự (A-Z, 0-9, _, -)' };
      var type = data.type === 'voucher' ? 'voucher' : 'coupon';
      var value = Number(data.value) || 0;
      if (value <= 0) return { ok: false, error: 'Giá trị phải > 0' };
      if (type === 'coupon' && value > 100) return { ok: false, error: 'Coupon tối đa 100%' };

      var item = {
        type: type,
        code: code,
        value: value,
        max_value: Number(data.max_value) || 0,
        qty_limit: Number(data.qty_limit) || 0,
        starts_at: data.starts_at || '',
        ends_at: data.ends_at || '',
        used_count: 0,
        active: data.active !== false && data.active !== 'false'
      };

      var orig = originalCode ? String(originalCode).toUpperCase() : '';
      var idx = orig ? list.findIndex(function (c) { return c.code === orig; }) : -1;
      if (idx >= 0) {
        item.used_count = list[idx].used_count || 0;
        if (orig !== code && findIndex(code) >= 0) return { ok: false, error: 'Mã đã tồn tại' };
        list[idx] = item;
      } else {
        if (findIndex(code) >= 0) return { ok: false, error: 'Mã đã tồn tại' };
        list.push(item);
      }
      writeAll(list);
      return { ok: true, item: item };
    },

    remove: function (code) {
      var list = readAll();
      var before = list.length;
      list = list.filter(function (c) { return c.code !== String(code || '').toUpperCase(); });
      if (list.length === before) return { ok: false, error: 'Không tìm thấy mã' };
      writeAll(list);
      return { ok: true };
    },

    listUsage: function () {
      syncUsedCounts();
      return readUsage().slice().sort(function (a, b) {
        return String(b.at || '').localeCompare(String(a.at || ''));
      });
    },

    recordUsage: function (entry) {
      var list = readUsage();
      list.push({
        id: 'uso_' + Date.now(),
        code: String(entry.code || '').toUpperCase(),
        orderId: entry.orderId || '',
        email: entry.email || '',
        orderAmount: Number(entry.orderAmount) || 0,
        discount: Number(entry.discount) || 0,
        at: entry.at || new Date().toISOString()
      });
      writeUsage(list);
      syncUsedCounts();
      return { ok: true };
    },

    usageStats: function () {
      var list = this.listUsage();
      var totalDiscount = 0;
      var byCode = {};
      list.forEach(function (u) {
        totalDiscount += Number(u.discount) || 0;
        var code = u.code;
        if (!byCode[code]) byCode[code] = { code: code, count: 0, discount: 0 };
        byCode[code].count += 1;
        byCode[code].discount += Number(u.discount) || 0;
      });
      return {
        orders: list.length,
        cost: totalDiscount,
        byCode: Object.keys(byCode).map(function (k) { return byCode[k]; })
      };
    },

    /* legacy alias for User Web / old pages */
    formatDiscount: formatValue,
    statusOf: statusOf,
    formatValue: formatValue,
    formatMax: formatMax,
    formatTime: formatTime,
    isExpired: isExpired
  };

  /* alias cũ */
  global.LoyaltyCouponCatalogStore = global.LoyaltyPromoCatalogStore;
})(window);
