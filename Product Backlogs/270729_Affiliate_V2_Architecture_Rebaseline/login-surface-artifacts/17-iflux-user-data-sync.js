/* iFlux — đồng bộ localStorage ↔ PostgreSQL khi API bật */
(function (global) {
  'use strict';

  var syncTimers = {};
  var hydrated = false;

  function apiOn() {
    return global.IfluxAuth && IfluxAuth.useApi && IfluxAuth.useApi()
      && global.IfluxApiClient && IfluxApiClient.getUserDataSync;
  }

  function token() {
    return global.IfluxAuth ? IfluxAuth.getToken() : null;
  }

  function debounce(key, fn, ms) {
    if (syncTimers[key]) clearTimeout(syncTimers[key]);
    syncTimers[key] = setTimeout(fn, ms || 400);
  }

  function hydrateFromServer() {
    if (!apiOn() || hydrated) return Promise.resolve(null);
    var t = token();
    if (!t || t.indexOf('mock_jwt_') === 0) return Promise.resolve(null);

    return IfluxApiClient.getUserDataSync(t).then(function (payload) {
      hydrated = true;
      var store = global.IfluxUserStorage;
      if (!store) return payload;

      if (payload.watchlist && payload.watchlist.folders) {
        store.writeJson('iflux_watchlist_v1', payload.watchlist);
      }
      if (payload.alerts && payload.alerts.alerts) {
        store.writeJson('iflux_alerts_v1', payload.alerts);
      }
      if (payload.dashboard && payload.dashboard.widgets) {
        store.writeJson('iflux_web_dashboard_layout_v2', payload.dashboard);
      }
      if (payload.payment && global.IfluxProfilePaymentStore && global.IfluxAuth && IfluxAuth.getUser()) {
        IfluxProfilePaymentStore.hydrateFromServer(IfluxAuth.getUser().id, payload.payment);
        if (global.IfluxProfilePaymentPage && IfluxProfilePaymentPage.refresh) {
          IfluxProfilePaymentPage.refresh();
        } else if (global.IfluxProfileMyPage && IfluxProfileMyPage.refresh) {
          IfluxProfileMyPage.refresh();
        }
      }
      if (Array.isArray(payload.notifications) && global.IfluxInAppNotifications && IfluxInAppNotifications.hydrateFromServer) {
        IfluxInAppNotifications.hydrateFromServer(payload.notifications);
      }
      if (payload.messages && typeof payload.messages === 'object' && global.IfluxProfileChatStore && IfluxProfileChatStore.hydrateFromServer) {
        IfluxProfileChatStore.hydrateFromServer(payload.messages);
      }
      if (typeof document !== 'undefined') {
        document.dispatchEvent(new CustomEvent('iflux-user-data-hydrated'));
      }
      return payload;
    }).catch(function () {
      hydrated = true;
      return null;
    });
  }

  function pushWatchlist(state) {
    if (!apiOn()) return Promise.resolve();
    var t = token();
    if (!t) return Promise.resolve();
    return IfluxApiClient.saveWatchlist(t, state).catch(function () { /* offline */ });
  }

  function pushAlerts(state) {
    if (!apiOn()) return Promise.resolve();
    var t = token();
    if (!t) return Promise.resolve();
    return IfluxApiClient.saveAlerts(t, state).catch(function () { /* offline */ });
  }

  function pushDashboard(state) {
    if (!apiOn()) return Promise.resolve();
    var t = token();
    if (!t) return Promise.resolve();
    return IfluxApiClient.saveDashboard(t, state).catch(function () { /* offline */ });
  }

  function pushNotifications(state) {
    if (!apiOn() || !IfluxApiClient.saveNotifications) return Promise.resolve();
    var t = token();
    if (!t) return Promise.resolve();
    return IfluxApiClient.saveNotifications(t, state).catch(function () { /* offline */ });
  }

  function pushMessages(state) {
    if (!apiOn() || !IfluxApiClient.saveMessages) return Promise.resolve();
    var t = token();
    if (!t) return Promise.resolve();
    return IfluxApiClient.saveMessages(t, state).catch(function () { /* offline */ });
  }

  function scheduleWatchlistSync(state) {
    debounce('watchlist', function () { pushWatchlist(state); });
  }

  function scheduleAlertsSync(state) {
    debounce('alerts', function () { pushAlerts(state); });
  }

  function scheduleDashboardSync(state) {
    debounce('dashboard', function () { pushDashboard(state); });
  }

  function scheduleNotificationsSync(state) {
    debounce('notifications', function () { pushNotifications(state); }, 500);
  }

  function scheduleMessagesSync(state) {
    debounce('messages', function () { pushMessages(state); }, 500);
  }

  function resetHydration() {
    hydrated = false;
  }

  global.IfluxUserDataSync = {
    hydrateFromServer: hydrateFromServer,
    scheduleWatchlistSync: scheduleWatchlistSync,
    scheduleAlertsSync: scheduleAlertsSync,
    scheduleDashboardSync: scheduleDashboardSync,
    scheduleNotificationsSync: scheduleNotificationsSync,
    scheduleMessagesSync: scheduleMessagesSync,
    resetHydration: resetHydration
  };

  if (global.IfluxAuth && IfluxAuth.isLoggedIn && IfluxAuth.isLoggedIn()) {
    hydrateFromServer();
  }
})(window);
