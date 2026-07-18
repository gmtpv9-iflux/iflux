/* Tài khoản thanh toán — đồng bộ localStorage ↔ PostgreSQL */
(function (global) {
  'use strict';

  var STORAGE_KEY = 'iflux_profile_payment_v1';

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

  function defaults() {
    return {
      payMethod: 'card',
      cardLast4: '',
      cardBrand: '',
      bankName: '',
      bankAccount: '',
      bankHolder: '',
      bankBranch: ''
    };
  }

  function useApi() {
    return !!(global.IfluxAuth && IfluxAuth.useApi && IfluxAuth.useApi()
      && global.IfluxApiClient && IfluxApiClient.saveUserPayment);
  }

  function pushToApi(userId, data) {
    if (!useApi() || !userId) return Promise.resolve();
    var token = global.IfluxAuth && IfluxAuth.getToken && IfluxAuth.getToken();
    if (!token || token.indexOf('mock_jwt_') === 0) return Promise.resolve();
    return IfluxApiClient.saveUserPayment(token, data).catch(function () { /* offline */ });
  }

  function get(userId) {
    if (!userId) return defaults();
    var map = readAll();
    return Object.assign(defaults(), map[userId] || {});
  }

  function save(userId, patch) {
    if (!userId) return null;
    var map = readAll();
    map[userId] = Object.assign(defaults(), map[userId] || {}, patch || {});
    writeAll(map);
    pushToApi(userId, map[userId]);
    return map[userId];
  }

  function saveAsync(userId, patch) {
    if (!userId) return Promise.resolve(null);
    var map = readAll();
    map[userId] = Object.assign(defaults(), map[userId] || {}, patch || {});
    writeAll(map);
    return pushToApi(userId, map[userId]).then(function () {
      return map[userId];
    });
  }

  function hydrateFromServer(userId, data) {
    if (!userId || !data) return;
    var map = readAll();
    map[userId] = Object.assign(defaults(), map[userId] || {}, data || {});
    writeAll(map);
  }

  global.IfluxProfilePaymentStore = {
    get: get,
    save: save,
    saveAsync: saveAsync,
    hydrateFromServer: hydrateFromServer,
    defaults: defaults
  };
})(window);
