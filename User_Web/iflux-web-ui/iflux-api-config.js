/* iFlux — API endpoint config (chỉ active khi dataMode = api) */
(function (global) {
  'use strict';

  function runtimeConfig() {
    return global.IfluxRuntime ? IfluxRuntime.getConfig() : null;
  }

  function getBaseUrl() {
    var c = runtimeConfig();
    return c && c.apiBaseUrl ? c.apiBaseUrl : '';
  }

  function isEnabled() {
    return global.IfluxData ? IfluxData.isApi() && !!getBaseUrl() : false;
  }

  function getRuntimeMode() {
    var c = runtimeConfig();
    if (!c) return 'unknown';
    if (c.dataMode !== 'api') return c.dataMode;
    return c.environment + '-api';
  }

  global.IfluxApiConfig = {
    getBaseUrl: getBaseUrl,
    isEnabled: isEnabled,
    getRuntimeMode: getRuntimeMode,
    /** @deprecated — dùng IfluxRuntime.getDataMode() === 'sandbox' */
    isRemoteSandboxHost: function () {
      return global.IfluxData ? !IfluxData.isApi() : true;
    },
    setBaseUrl: function (url) {
      if (url) global.IFLUX_API_BASE = String(url).replace(/\/$/, '');
      else delete global.IFLUX_API_BASE;
    }
  };
})(window);
