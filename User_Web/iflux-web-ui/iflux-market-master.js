/* iFlux Market Master — identity client (SOL-IDENTITY / WP-0).
 * Authority: GET /api/market/master/{stocks|sectors|ecosystems}
 * Không qua IfluxMockMarket. Không chứa quote/price. */
(function (global) {
  'use strict';

  var _ready = null;
  var _stocks = null;
  var _sectors = null;
  var _ecosystems = null;
  var _error = null;

  function isProdHost() {
    try {
      var host = String((global.location && location.hostname) || '').toLowerCase();
      return host === 'iflux.vn' || host === 'www.iflux.vn' || host.indexOf('staging.') === 0;
    } catch (e) {
      return false;
    }
  }

  function apiBase() {
    try {
      var host = String((global.location && location.hostname) || '').toLowerCase();
      if (host === 'iflux.vn' || host === 'www.iflux.vn' || host.indexOf('staging.') === 0) {
        return '/api';
      }
    } catch (e) { /* ignore */ }
    if (global.IfluxApiConfig && IfluxApiConfig.getBaseUrl) {
      var b = IfluxApiConfig.getBaseUrl();
      if (b) return String(b).replace(/\/$/, '');
    }
    return '/api';
  }

  function unwrap(data) {
    if (data && data.data) return data.data;
    return data || {};
  }

  function ensureMasterReady() {
    if (_ready) return _ready;
    var base = apiBase();
    _ready = Promise.all([
      fetch(base + '/market/master/stocks', { headers: { Accept: 'application/json' } })
        .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); }),
      fetch(base + '/market/master/sectors', { headers: { Accept: 'application/json' } })
        .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); }),
      fetch(base + '/market/master/ecosystems', { headers: { Accept: 'application/json' } })
        .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
    ]).then(function (parts) {
      _error = null;
      if (parts[0].ok) {
        _stocks = unwrap(parts[0].d).items || [];
      } else if (isProdHost()) {
        _stocks = [];
        _error = 'Không tải được Market Master (cổ phiếu)';
      }
      if (parts[1].ok) {
        _sectors = unwrap(parts[1].d).items || [];
      } else if (isProdHost()) {
        _sectors = [];
      }
      if (parts[2].ok) {
        _ecosystems = unwrap(parts[2].d).items || [];
      } else if (isProdHost()) {
        _ecosystems = [];
      }
      return {
        stocks: _stocks || [],
        sectors: _sectors || [],
        ecosystems: _ecosystems || [],
        error: _error
      };
    }).catch(function () {
      _ready = null;
      if (isProdHost()) {
        _stocks = [];
        _sectors = [];
        _ecosystems = [];
        _error = 'Không tải được Market Master';
        return { stocks: [], sectors: [], ecosystems: [], error: _error };
      }
      return null;
    });
    return _ready;
  }

  function getMasterStocks() {
    return _stocks ? _stocks.slice() : null;
  }
  function getMasterSectors() {
    return _sectors ? _sectors.slice() : null;
  }
  function getMasterEcosystems() {
    return _ecosystems ? _ecosystems.slice() : null;
  }

  try { ensureMasterReady(); } catch (e) { /* ignore */ }

  global.IfluxMarketMaster = {
    ensureMasterReady: ensureMasterReady,
    getMasterStocks: getMasterStocks,
    getMasterSectors: getMasterSectors,
    getMasterEcosystems: getMasterEcosystems
  };
})(window);
