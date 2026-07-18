/* ADM-SUB-004 — Mã giảm giá catalog (localStorage, đồng bộ User Web checkout) */
(function (global) {
  'use strict';

  var STORAGE_KEY = 'iflux_loyalty_coupon_catalog_v1';

  var DEFAULT = [
    { code: 'IFLUX20', label: 'Giảm 10% gói Premium/Elite', discount_pct: 10, min_order: 0, expires_at: '2026-12-31', scope: 'Gói cước', active: true },
    { code: 'WELCOME', label: 'Chào mừng thành viên mới', discount_pct: 10, min_order: 0, expires_at: '2026-08-31', scope: 'Gói cước', active: true },
    { code: 'ELITE15', label: 'Giảm 15% nâng cấp Elite', discount_pct: 15, min_order: 500000, expires_at: '2026-09-30', scope: 'Elite', active: true },
    { code: 'ANNUAL50K', label: 'Giảm 50.000₫ gói năm', discount_fixed: 50000, min_order: 1000000, expires_at: '2026-06-30', scope: 'Gói năm', active: true }
  ];

  function readAll() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var list = JSON.parse(raw);
      return Array.isArray(list) ? list : null;
    } catch (e) {
      return null;
    }
  }

  function writeAll(list) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }

  function ensureCatalog() {
    var list = readAll();
    if (!list || !list.length) {
      list = DEFAULT.map(function (c) { return Object.assign({}, c); });
      writeAll(list);
    }
    return list;
  }

  function isExpired(c) {
    if (!c || !c.expires_at) return false;
    return new Date(c.expires_at).getTime() < Date.now();
  }

  function statusOf(c) {
    if (c.active === false) return { text: 'Tắt', chip: 'ix-chip-secondary' };
    if (isExpired(c)) return { text: 'Hết hạn', chip: 'ix-chip-warning' };
    return { text: 'Đang bán', chip: 'ix-chip-success' };
  }

  function formatDiscount(c) {
    if (c.discount_fixed) return '-' + Number(c.discount_fixed).toLocaleString('vi-VN') + '₫';
    if (c.discount_pct) return '-' + c.discount_pct + '%';
    return '—';
  }

  function findIndex(code) {
    return ensureCatalog().findIndex(function (c) {
      return c.code === String(code || '').toUpperCase();
    });
  }

  global.LoyaltyCouponCatalogStore = {
    STORAGE_KEY: STORAGE_KEY,
    DEFAULT: DEFAULT,

    listAll: function () {
      return ensureCatalog().slice().sort(function (a, b) {
        return a.code.localeCompare(b.code);
      });
    },

    listActive: function () {
      return this.listAll().filter(function (c) {
        return c.active !== false && !isExpired(c);
      });
    },

    get: function (code) {
      var idx = findIndex(code);
      return idx >= 0 ? Object.assign({}, ensureCatalog()[idx]) : null;
    },

    save: function (data, originalCode) {
      var list = ensureCatalog();
      var code = String(data.code || '').trim().toUpperCase();
      if (!code) return { ok: false, error: 'Mã coupon là bắt buộc' };
      if (!/^[A-Z0-9_-]{3,20}$/.test(code)) {
        return { ok: false, error: 'Mã chỉ gồm A-Z, 0-9, _ hoặc - (3–20 ký tự)' };
      }
      if (!data.label || !String(data.label).trim()) {
        return { ok: false, error: 'Mô tả là bắt buộc' };
      }
      if (!data.discount_pct && !data.discount_fixed) {
        return { ok: false, error: 'Nhập % giảm hoặc số tiền cố định' };
      }

      var item = {
        code: code,
        label: String(data.label).trim(),
        discount_pct: data.discount_pct ? parseInt(data.discount_pct, 10) : 0,
        discount_fixed: data.discount_fixed ? parseInt(data.discount_fixed, 10) : 0,
        min_order: parseInt(data.min_order, 10) || 0,
        expires_at: data.expires_at || '',
        scope: String(data.scope || 'Gói cước').trim(),
        active: data.active !== false && data.active !== 'false'
      };
      if (item.discount_pct) item.discount_fixed = 0;
      if (item.discount_fixed) item.discount_pct = 0;

      var orig = originalCode ? String(originalCode).toUpperCase() : code;
      var idx = list.findIndex(function (c) { return c.code === orig; });
      if (idx >= 0 && orig !== code && findIndex(code) >= 0) {
        return { ok: false, error: 'Mã "' + code + '" đã tồn tại' };
      }
      if (idx >= 0) {
        list[idx] = item;
      } else {
        if (findIndex(code) >= 0) return { ok: false, error: 'Mã đã tồn tại' };
        list.push(item);
      }
      writeAll(list);
      return { ok: true, coupon: item };
    },

    toggleActive: function (code) {
      var list = ensureCatalog();
      var idx = findIndex(code);
      if (idx < 0) return { ok: false, error: 'Không tìm thấy mã' };
      list[idx].active = list[idx].active === false;
      writeAll(list);
      return { ok: true, active: list[idx].active !== false };
    },

    remove: function (code) {
      var list = ensureCatalog();
      var before = list.length;
      list = list.filter(function (c) { return c.code !== String(code || '').toUpperCase(); });
      if (list.length === before) return { ok: false, error: 'Không tìm thấy mã' };
      writeAll(list);
      return { ok: true };
    },

    isExpired: isExpired,
    statusOf: statusOf,
    formatDiscount: formatDiscount
  };
})(window);
