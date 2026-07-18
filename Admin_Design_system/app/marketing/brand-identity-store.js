/* ADM-MAR-001 — Nhận diện thương hiệu (localStorage sandbox) */
(function (global) {
  'use strict';

  var STORAGE_KEY = 'iflux_brand_identity_v1';

  var DEFAULTS = {
    logoUrl: '',
    logoLightUrl: '',
    logoMarkUrl: '',
    faviconUrl: '',
    appleTouchUrl: '',
    siteName: 'iFlux',
    updatedAt: null
  };

  function read() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return Object.assign({}, DEFAULTS, raw ? JSON.parse(raw) : {});
    } catch (e) {
      return Object.assign({}, DEFAULTS);
    }
  }

  function write(data) {
    data.updatedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    if (typeof document !== 'undefined') {
      document.dispatchEvent(new CustomEvent('iflux-brand-changed', { detail: data }));
    }
    return data;
  }

  function save(partial) {
    return write(Object.assign({}, read(), partial || {}));
  }

  function reset() {
    localStorage.removeItem(STORAGE_KEY);
    if (typeof document !== 'undefined') {
      document.dispatchEvent(new CustomEvent('iflux-brand-changed', { detail: read() }));
    }
    return read();
  }

  global.IfluxBrandIdentityStore = {
    read: read,
    save: save,
    reset: reset,
    DEFAULTS: DEFAULTS,
    STORAGE_KEY: STORAGE_KEY
  };
})(window);
