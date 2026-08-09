/* iFlux Market Quotes — Internal API runtime proxy (BR-11A).
 * FE không gọi host provider trực tiếp. Trace: meta.source_code. */
(function (global) {
  'use strict';

  var QUOTE_TTL = 5 * 60 * 1000;
  var OHLC_TTL = 15 * 60 * 1000;
  var CHUNK = 40;

  var quoteCache = {};
  var ohlcCache = {};
  var inflight = {};

  function norm(t) {
    return String(t == null ? '' : t).trim().toUpperCase();
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

  function priceState(close, ref, ceil, floor) {
    if (close == null || ref == null) return 'ref';
    if (ceil != null && close >= ceil) return 'ceiling';
    if (floor != null && close <= floor) return 'floor';
    if (close > ref) return 'up';
    if (close < ref) return 'down';
    return 'ref';
  }

  function unwrap(data) {
    if (data && data.data != null) return data.data;
    return data || {};
  }

  function fetchJson(url) {
    if (inflight[url]) return inflight[url];
    var p = fetch(url, { headers: { Accept: 'application/json' } })
      .then(function (res) {
        return res.json().then(function (d) {
          return { ok: res.ok, d: d };
        });
      })
      .catch(function () {
        return { ok: false, d: null };
      })
      .then(function (pack) {
        delete inflight[url];
        return pack;
      });
    inflight[url] = p;
    return p;
  }

  function getQuotes(tickers) {
    var now = Date.now();
    var out = {};
    var need = [];
    (tickers || []).forEach(function (raw) {
      var t = norm(raw);
      if (!t) return;
      var c = quoteCache[t];
      if (c && now - c._ts < QUOTE_TTL) out[t] = c;
      else if (need.indexOf(t) < 0) need.push(t);
    });
    if (!need.length) return Promise.resolve(out);

    var chunks = [];
    var i;
    for (i = 0; i < need.length; i += CHUNK) chunks.push(need.slice(i, i + CHUNK));
    var base = apiBase();

    return Promise.all(
      chunks.map(function (ch) {
        var url = base + '/market/runtime/quotes?tickers=' + encodeURIComponent(ch.join(','));
        return fetchJson(url).then(function (pack) {
          if (!pack.ok) return;
          var map = unwrap(pack.d) || {};
          var src =
            (pack.d && pack.d.meta && pack.d.meta.source_code) || 'vndirect_finfo';
          Object.keys(map).forEach(function (code) {
            var q = map[code] || {};
            q.ticker = q.ticker || code;
            if (q.change_pct == null && q.pctChange != null) {
              q.change_pct = Number(q.pctChange);
            }
            q._ts = now;
            q.source_code = src;
            quoteCache[code] = q;
            out[code] = q;
          });
        });
      })
    ).then(function () {
      return out;
    });
  }

  function getQuote(ticker) {
    return getQuotes([ticker]).then(function (m) {
      return m[norm(ticker)] || null;
    });
  }

  function getOHLC(ticker, days) {
    var t = norm(ticker);
    days = days || 160;
    var key = t + '|' + days;
    var now = Date.now();
    var c = ohlcCache[key];
    if (c && now - c._ts < OHLC_TTL) return Promise.resolve(c.data);
    var url = apiBase() + '/market/runtime/ohlc/' + encodeURIComponent(t) + '?days=' + encodeURIComponent(days);
    return fetchJson(url).then(function (pack) {
      if (!pack.ok) return [];
      var body = unwrap(pack.d) || {};
      var rows = body.data || [];
      ohlcCache[key] = { _ts: now, data: rows };
      return rows;
    });
  }

  function peekQuote(ticker) {
    return quoteCache[norm(ticker)] || null;
  }

  global.IfluxMarketQuotes = {
    getQuote: getQuote,
    getQuotes: getQuotes,
    peekQuote: peekQuote,
    getOHLC: getOHLC,
    priceState: priceState
  };
})(window);
