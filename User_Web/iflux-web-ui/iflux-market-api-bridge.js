/* iFlux — nạp snapshot thị trường từ API (Contract /snapshot/market) */
(function (global) {
  'use strict';

  function enabled() {
    return global.IfluxApiConfig && global.IfluxData && IfluxData.isApi()
      && global.IfluxApiClient && IfluxApiClient.getMarketSnapshot;
  }

  function applyOverlay(data) {
    if (!data) return;
    global.__ifluxMarketApiOverlay = {
      meta: { data_as_of: data.as_of, source: 'api' },
      entities: {
        market: data.market,
        exchanges: data.exchanges,
        breadth: data.breadth,
        flow: data.flow
      },
      movers: data.movers
    };
    document.dispatchEvent(new CustomEvent('iflux-market-api-ready'));
  }

  function hydrate() {
    if (!enabled()) return Promise.resolve();
    return IfluxApiClient.getMarketSnapshot().then(function (res) {
      if (res.success && res.data) applyOverlay(res.data);
      else if (res.data) applyOverlay(res.data);
    }).catch(function () { /* fallback mock */ });
  }

  global.IfluxMarketApiBridge = { hydrate: hydrate };
  hydrate();
})(window);
