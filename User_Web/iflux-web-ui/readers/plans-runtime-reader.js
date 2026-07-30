/**
 * PlansRuntimeReader — AB-07 read adapter (User Web Runtime).
 * GET /api/plans/runtime → consume published artifact `plans[]` only (ABH E6).
 * No client-side normalize / interpret business rules.
 */
(function (global) {
  'use strict';

  var TIERS = ['guest', 'free', 'premium', 'elite'];
  var _cache = null;
  var _loadPromise = null;

  function apiUrls() {
    var urls = ['/api/plans/runtime'];
    if (global.location && global.location.origin && global.location.protocol !== 'file:') {
      urls.push(global.location.origin + '/api/plans/runtime');
    }
    return urls;
  }

  function fetchJson(url) {
    var bust = (url.indexOf('?') >= 0 ? '&' : '?') + '_=' + Date.now();
    return fetch(url + bust, { cache: 'no-store', headers: { Accept: 'application/json' } })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      });
  }

  function hasPlanData(data) {
    if (!data) return false;
    if (Array.isArray(data.plans) && data.plans.length) return true;
    if ((data.updatedAt || 0) > 0) return true;
    var ovs = data.overrides || {};
    return Object.keys(ovs).some(function (tierKey) {
      var o = ovs[tierKey];
      if (!o || typeof o !== 'object') return false;
      if (o.blocks && Object.keys(o.blocks).some(function (id) { return !!o.blocks[id]; })) return true;
      if (o.pages && Object.keys(o.pages).some(function (id) { return !!o.pages[id]; })) return true;
      return false;
    });
  }

  function fetchRuntime() {
    var urls = apiUrls();
    function tryNext(idx) {
      if (idx >= urls.length) return Promise.resolve(null);
      return fetchJson(urls[idx]).then(function (data) {
        if (hasPlanData(data)) return data;
        throw new Error('empty');
      }).catch(function () { return tryNext(idx + 1); });
    }
    return tryNext(0);
  }

  function storeData() {
    return _cache || { version: 1, updatedAt: 0, plans: [], overrides: {}, custom: [] };
  }

  function findPlan(key) {
    key = String(key || '').toLowerCase();
    if (key === 'new') return null;
    var store = storeData();
    var plans = store.plans || [];
    var i;
    for (i = 0; i < plans.length; i++) {
      if (plans[i].id === key || plans[i].tier === key) return plans[i];
    }
    return null;
  }

  global.PlansRuntimeReader = {
    load: function (opts) {
      opts = opts || {};
      if (opts.force) {
        _cache = null;
        _loadPromise = null;
      }
      if (_loadPromise) return _loadPromise;
      if (_cache && !opts.force) return Promise.resolve(_cache);
      _loadPromise = fetchRuntime().then(function (remote) {
        _cache = remote || { version: 1, updatedAt: 0, plans: [], overrides: {}, custom: [] };
        _loadPromise = null;
        return _cache;
      }).catch(function () {
        _cache = { version: 1, updatedAt: 0, plans: [], overrides: {}, custom: [] };
        _loadPromise = null;
        return _cache;
      });
      return _loadPromise;
    },

    isReady: function () { return !!_cache; },

    getPlan: function (key) {
      var plan = findPlan(key);
      return plan ? JSON.parse(JSON.stringify(plan)) : null;
    },

    listTiers: function () { return TIERS.slice(); },

    listPlans: function () {
      var store = storeData();
      return (store.plans || []).slice().sort(function (a, b) {
        return (a.sort || 99) - (b.sort || 99);
      });
    },

    formatVnd: function (n) {
      if (!n) return '₫0';
      return '₫' + Number(n).toLocaleString('vi-VN');
    }
  };
})(window);
