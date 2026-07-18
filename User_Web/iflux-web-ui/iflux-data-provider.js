/* iFlux Data Layer — chọn provider theo dataMode (UI không biết nguồn dữ liệu) */
(function (global) {
  'use strict';
  if (global.IfluxData) return;

  var PROVIDERS = {
    api: {
      id: 'api',
      label: 'ApiDataProvider',
      usesHttp: true,
      usesBrowserStorage: false
    },
    sandbox: {
      id: 'sandbox',
      label: 'SandboxDataProvider',
      usesHttp: false,
      usesBrowserStorage: true
    },
    mock: {
      id: 'mock',
      label: 'MockDataProvider',
      usesHttp: false,
      usesBrowserStorage: true
    },
    replay: {
      id: 'replay',
      label: 'ReplayDataProvider',
      usesHttp: false,
      usesBrowserStorage: false
    },
    test: {
      id: 'test',
      label: 'TestDataProvider',
      usesHttp: false,
      usesBrowserStorage: true
    }
  };

  function runtime() {
    return global.IfluxRuntime || null;
  }

  function getMode() {
    return runtime() ? runtime().getDataMode() : 'sandbox';
  }

  function getProviderId() {
    return runtime() ? runtime().getProvider() : 'sandbox';
  }

  function getProvider() {
    return PROVIDERS[getProviderId()] || PROVIDERS.sandbox;
  }

  function isApi() {
    return getMode() === 'api';
  }

  function isLocalProvider() {
    return !isApi();
  }

  global.IfluxData = {
    providers: PROVIDERS,
    getMode: getMode,
    getProviderId: getProviderId,
    getProvider: getProvider,
    isApi: isApi,
    isLocalProvider: isLocalProvider,
    /** @deprecated dùng isApi() */
    useApi: isApi
  };
})(window);
