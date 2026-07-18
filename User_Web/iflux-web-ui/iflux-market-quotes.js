/* iFlux Market Quotes — nguồn giá + OHLC thật (VNDirect finfo, CORS *) dùng chung Admin & User Web.
 * KHÔNG chứa UI. Chỉ fetch + chuẩn hóa + cache. */
(function (global) {
  'use strict';

  var BASE = 'https://api-finfo.vndirect.com.vn/v4/stock_prices';
  var QUOTE_TTL = 5 * 60 * 1000;   // 5 phút
  var OHLC_TTL = 15 * 60 * 1000;   // 15 phút
  var CHUNK = 40;

  var quoteCache = {};   // ticker -> quote (+ _ts)
  var ohlcCache = {};    // ticker|days -> { _ts, data }
  var inflight = {};     // url -> Promise

  function norm(t) { return String(t == null ? '' : t).trim().toUpperCase(); }

  function recentFromDate() {
    var d = new Date(Date.now() - 21 * 86400000);
    return d.toISOString().slice(0, 10);
  }

  function priceState(close, ref, ceil, floor) {
    if (close == null || ref == null) return 'ref';
    if (ceil != null && close >= ceil) return 'ceiling';
    if (floor != null && close <= floor) return 'floor';
    if (close > ref) return 'up';
    if (close < ref) return 'down';
    return 'ref';
  }

  function normalizeRow(r) {
    return {
      ticker: r.code,
      date: r.date,
      price: r.close,
      ref: r.basicPrice,
      open: r.open,
      high: r.high,
      low: r.low,
      close: r.close,
      change: r.change,
      pctChange: r.pctChange,
      volume: r.nmVolume,
      ceiling: r.ceilingPrice,
      floor: r.floorPrice,
      state: priceState(r.close, r.basicPrice, r.ceilingPrice, r.floorPrice)
    };
  }

  function fetchJson(url) {
    if (inflight[url]) return inflight[url];
    var p = fetch(url, { headers: { Accept: 'application/json' } })
      .then(function (res) { return res.ok ? res.json() : null; })
      .catch(function () { return null; })
      .then(function (data) { delete inflight[url]; return data; });
    inflight[url] = p;
    return p;
  }

  /* Lấy giá mới nhất cho nhiều mã (batch, cache). Trả Promise(map ticker -> quote). */
  function getQuotes(tickers) {
    var now = Date.now();
    var out = {};
    var need = [];
    (tickers || []).forEach(function (raw) {
      var t = norm(raw);
      if (!t) return;
      var c = quoteCache[t];
      if (c && (now - c._ts) < QUOTE_TTL) out[t] = c;
      else if (need.indexOf(t) < 0) need.push(t);
    });
    if (!need.length) return Promise.resolve(out);

    var chunks = [];
    var i;
    for (i = 0; i < need.length; i += CHUNK) chunks.push(need.slice(i, i + CHUNK));
    var from = recentFromDate();

    return Promise.all(chunks.map(function (ch) {
      var url = BASE + '?q=code:' + ch.join(',') + '~date:gte:' + from +
        '&sort=date:desc&size=' + (ch.length * 10);
      return fetchJson(url).then(function (d) {
        var seen = {};
        ((d && d.data) || []).forEach(function (r) {
          if (seen[r.code]) return;   // đã sort desc → bản đầu là mới nhất
          seen[r.code] = 1;
          var q = normalizeRow(r);
          q._ts = now;
          quoteCache[r.code] = q;
          out[r.code] = q;
        });
      });
    })).then(function () { return out; });
  }

  function getQuote(ticker) {
    return getQuotes([ticker]).then(function (m) { return m[norm(ticker)] || null; });
  }

  /* Lấy chuỗi nến OHLC (ngày) tăng dần theo thời gian. */
  function getOHLC(ticker, days) {
    var t = norm(ticker);
    days = days || 160;
    var key = t + '|' + days;
    var now = Date.now();
    var c = ohlcCache[key];
    if (c && (now - c._ts) < OHLC_TTL) return Promise.resolve(c.data);
    var url = BASE + '?q=code:' + t + '&sort=date:desc&size=' + days;
    return fetchJson(url).then(function (d) {
      var rows = ((d && d.data) || []).map(normalizeRow);
      rows.reverse(); // tăng dần theo ngày
      ohlcCache[key] = { _ts: now, data: rows };
      return rows;
    });
  }

  global.IfluxMarketQuotes = {
    getQuote: getQuote,
    getQuotes: getQuotes,
    getOHLC: getOHLC,
    priceState: priceState
  };
})(window);
