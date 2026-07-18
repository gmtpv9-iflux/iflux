/* Mã giảm giá — sandbox localStorage */
(function (global) {
  'use strict';

  var STORAGE_KEY = 'iflux_loyalty_coupons_v1';

  var CATALOG = [
    { code: 'IFLUX20', label: 'Giảm 10% gói Premium/Elite', discount_pct: 10, min_order: 0, expires_at: '2026-12-31', scope: 'Gói cước', active: true },
    { code: 'WELCOME', label: 'Chào mừng thành viên mới', discount_pct: 10, min_order: 0, expires_at: '2026-08-31', scope: 'Gói cước', active: true },
    { code: 'ELITE15', label: 'Giảm 15% nâng cấp Elite', discount_pct: 15, min_order: 500000, expires_at: '2026-09-30', scope: 'Elite', active: true },
    { code: 'ANNUAL50K', label: 'Giảm 50.000₫ gói năm', discount_fixed: 50000, min_order: 1000000, expires_at: '2026-06-30', scope: 'Gói năm', active: true }
  ];

  var CATALOG_KEY = 'iflux_loyalty_coupon_catalog_v1';

  function getCatalog() {
    try {
      var raw = localStorage.getItem(CATALOG_KEY);
      if (raw) {
        var list = JSON.parse(raw);
        if (Array.isArray(list) && list.length) {
          return list.filter(function (c) { return c.active !== false; });
        }
      }
    } catch (e) { /* fallback */ }
    return CATALOG;
  }

  function readAll() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function writeAll(map) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  }

  function userId() {
    var u = global.IfluxAuth && IfluxAuth.getUser();
    return u && u.id ? u.id : 'guest';
  }

  function ensureSeed(uid) {
    var map = readAll();
    if (!map[uid] || !map[uid].length) {
      map[uid] = ['IFLUX20', 'WELCOME'];
      writeAll(map);
    }
    return map[uid];
  }

  function listMine() {
    var uid = userId();
    var codes = ensureSeed(uid);
    return codes.map(function (code) {
      var c = getCatalog().find(function (x) { return x.code === code; });
      return c ? Object.assign({ code: code, status: isExpired(c) ? 'expired' : 'active' }, c) : null;
    }).filter(Boolean);
  }

  function isExpired(c) {
    if (!c || !c.expires_at) return false;
    return new Date(c.expires_at).getTime() < Date.now();
  }

  function findCode(code) {
    return getCatalog().find(function (c) { return c.code === String(code || '').toUpperCase(); }) || null;
  }

  function redeem(code) {
    code = String(code || '').trim().toUpperCase();
    var c = findCode(code);
    if (!c) return { ok: false, error: 'Mã không tồn tại' };
    if (isExpired(c)) return { ok: false, error: 'Mã đã hết hạn' };
    var uid = userId();
    var map = readAll();
    var list = map[uid] || [];
    if (list.indexOf(code) !== -1) return { ok: false, error: 'Bạn đã có mã này' };
    list.push(code);
    map[uid] = list;
    writeAll(map);
    return { ok: true, coupon: Object.assign({ code: code, status: 'active' }, c) };
  }

  function validateForCheckout(code) {
    code = String(code || '').trim().toUpperCase();
    var mine = listMine();
    var owned = mine.find(function (c) { return c.code === code && c.status === 'active'; });
    if (owned) return { ok: true, coupon: owned };
    var c = findCode(code);
    if (c && !isExpired(c)) return { ok: true, coupon: Object.assign({ code: code, status: 'active' }, c) };
    return { ok: false };
  }

  global.IfluxLoyaltyCouponStore = {
    CATALOG: CATALOG,
    getCatalog: getCatalog,
    listMine: listMine,
    redeem: redeem,
    validateForCheckout: validateForCheckout,
    findCode: findCode
  };
})(window);
