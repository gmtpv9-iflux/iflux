/* iFlux Runtime — environment + dataMode (không chặn fetch theo host) */
(function (global) {
  'use strict';
  if (global.IfluxRuntime) return;

  var MANIFEST = {
    deployments: [
      { environment: 'staging', match: { port: '8888' } },
      { environment: 'staging', match: { hostnamePrefix: 'staging.' } },
      { environment: 'staging', match: { hostname: '103.154.177.157', port: '8888' } },
      { environment: 'production', match: { hostname: ['iflux.vn', 'www.iflux.vn'] } },
      { environment: 'production', match: { hostname: '103.154.177.157', port: ['80', '443', ''] } },
      { environment: 'development', match: { hostname: ['localhost', '127.0.0.1'] } },
      { environment: 'development', match: { protocol: 'file:' } }
    ],
    defaults: {
      production: { dataMode: 'api', apiBaseUrl: 'https://iflux.vn/api' },
      staging: { dataMode: 'sandbox' },
      development: { dataMode: 'mock', apiBaseUrl: 'http://localhost:3001/api' }
    },
    dataModes: {
      api: { provider: 'api', label: 'ApiDataProvider' },
      sandbox: { provider: 'sandbox', label: 'SandboxDataProvider' },
      mock: { provider: 'mock', label: 'MockDataProvider' },
      replay: { provider: 'replay', label: 'ReplayDataProvider' },
      test: { provider: 'test', label: 'TestDataProvider' }
    }
  };

  var VALID_MODES = Object.keys(MANIFEST.dataModes);

  function loc() {
    return global.location || {};
  }

  function matchRule(rule, l) {
    var m = rule.match || rule;
    var host = String(l.hostname || '').toLowerCase();
    var port = String(l.port || '');
    var proto = String(l.protocol || '');

    if (m.protocol && proto !== m.protocol) return false;

    if (m.hostname) {
      var hosts = Array.isArray(m.hostname) ? m.hostname : [m.hostname];
      if (hosts.indexOf(host) < 0) return false;
    }

    if (m.hostnamePrefix) {
      if (host.indexOf(String(m.hostnamePrefix).toLowerCase()) !== 0) return false;
    }

    if (m.port !== undefined) {
      var ports = Array.isArray(m.port) ? m.port : [m.port];
      if (ports.indexOf(port) < 0) return false;
    }

    return true;
  }

  function resolveEnvironment() {
    if (global.IFLUX_ENVIRONMENT) return String(global.IFLUX_ENVIRONMENT);

    var l = loc();
    try {
      var qEnv = new URLSearchParams(l.search || '').get('iflux_env');
      if (qEnv === 'staging') return 'staging';
      if (qEnv === 'production') return 'production';
      if (qEnv === 'development' || qEnv === 'local') return 'development';
    } catch (e) { /* ignore */ }

    var i;
    for (i = 0; i < MANIFEST.deployments.length; i++) {
      if (matchRule(MANIFEST.deployments[i], l)) {
        return MANIFEST.deployments[i].environment;
      }
    }

    return 'development';
  }

  function normalizeMode(mode) {
    mode = String(mode || '').toLowerCase();
    return VALID_MODES.indexOf(mode) >= 0 ? mode : '';
  }

  function resolveDataMode(environment) {
    if (global.IFLUX_DATA_MODE) {
      var forced = normalizeMode(global.IFLUX_DATA_MODE);
      if (forced) return forced;
    }

    var l = loc();
    try {
      var qMode = normalizeMode(new URLSearchParams(l.search || '').get('dataMode'));
      if (qMode) return qMode;
    } catch (e1) { /* ignore */ }

    try {
      var stored = normalizeMode(global.localStorage.getItem('iflux_data_mode'));
      if (stored) return stored;
    } catch (e2) { /* ignore */ }

    var def = MANIFEST.defaults[environment] || MANIFEST.defaults.staging;
    return normalizeMode(def.dataMode) || 'sandbox';
  }

  function resolveApiBaseUrl(environment, dataMode) {
    if (dataMode !== 'api') return '';
    if (global.IFLUX_API_BASE) return String(global.IFLUX_API_BASE).replace(/\/$/, '');
    var def = MANIFEST.defaults[environment] || {};
    return def.apiBaseUrl ? String(def.apiBaseUrl).replace(/\/$/, '') : '';
  }

  var environment = resolveEnvironment();
  var dataMode = resolveDataMode(environment);
  var providerMeta = MANIFEST.dataModes[dataMode] || MANIFEST.dataModes.sandbox;
  var config = {
    environment: environment,
    dataMode: dataMode,
    provider: providerMeta.provider,
    providerLabel: providerMeta.label,
    apiBaseUrl: resolveApiBaseUrl(environment, dataMode)
  };

  global.IfluxRuntime = {
    manifest: MANIFEST,
    getConfig: function () {
      return {
        environment: config.environment,
        dataMode: config.dataMode,
        provider: config.provider,
        providerLabel: config.providerLabel,
        apiBaseUrl: config.apiBaseUrl
      };
    },
    getEnvironment: function () { return config.environment; },
    getDataMode: function () { return config.dataMode; },
    getProvider: function () { return config.provider; },
    getApiBaseUrl: function () { return config.apiBaseUrl; },
    isApiMode: function () { return config.dataMode === 'api'; },
    setDataMode: function (mode) {
      mode = normalizeMode(mode);
      if (!mode) return;
      try { global.localStorage.setItem('iflux_data_mode', mode); } catch (e) { /* ignore */ }
      dataMode = mode;
      providerMeta = MANIFEST.dataModes[dataMode] || MANIFEST.dataModes.sandbox;
      config.dataMode = dataMode;
      config.provider = providerMeta.provider;
      config.providerLabel = providerMeta.label;
      config.apiBaseUrl = resolveApiBaseUrl(config.environment, dataMode);
    }
  };

  global.IFLUX_RUNTIME_ENV = environment;
})(window);
