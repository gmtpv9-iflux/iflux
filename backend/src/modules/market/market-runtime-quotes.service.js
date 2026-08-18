'use strict';

/**
 * BR-11A — Runtime quotes.
 * Public FE: Internal API đọc Current Market Price State (stock_prices).
 * Provider fetch chỉ dùng cho Price Ingest / bổ sung miss.
 */

const SOURCE_CODE = 'vndirect_finfo';
const BASE = 'https://api-finfo.vndirect.com.vn/v4/stock_prices';
/* Chunk nhỏ + size=chunk: tránh cap size API làm mất mã trong batch lớn */
const CHUNK = 20;

function norm(t) {
  return String(t == null ? '' : t)
    .trim()
    .toUpperCase();
}

function recentFromDate() {
  const d = new Date(Date.now() - 21 * 86400000);
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
    trading_value: r.nmValue,
    ceiling: r.ceilingPrice,
    floor: r.floorPrice,
    state: priceState(r.close, r.basicPrice, r.ceilingPrice, r.floorPrice)
  };
}

async function fetchJson(url) {
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) return null;
  return res.json();
}

/** Fetch trực tiếp VNDirect — dùng bởi Price Ingest. */
async function fetchProviderQuotes(tickers) {
  const list = [];
  const seen = new Set();
  (tickers || []).forEach(function (raw) {
    const t = norm(raw);
    if (!t || seen.has(t)) return;
    seen.add(t);
    list.push(t);
  });
  const out = {};
  if (!list.length) {
    return { quotes: out, meta: { source_code: SOURCE_CODE, count: 0 } };
  }

  const from = recentFromDate();
  async function fetchCodes(codes) {
    if (!codes.length) return;
    const url =
      BASE +
      '?q=code:' +
      codes.join(',') +
      '~date:gte:' +
      from +
      '&sort=date:desc&size=' +
      codes.length;
    const d = await fetchJson(url);
    if (!d) {
      const err = new Error('VNDirect stock_prices fetch failed');
      err.code = 'VNDIRECT_FETCH';
      throw err;
    }
    const seenCode = {};
    ((d && d.data) || []).forEach(function (r) {
      if (!r || !r.code || seenCode[r.code]) return;
      seenCode[r.code] = 1;
      out[r.code] = normalizeRow(r);
    });
  }
  for (let i = 0; i < list.length; i += CHUNK) {
    const ch = list.slice(i, i + CHUNK);
    await fetchCodes(ch);
    const missing = ch.filter(function (t) {
      return !out[t];
    });
    for (let j = 0; j < missing.length; j++) {
      await fetchCodes([missing[j]]);
    }
  }

  return {
    quotes: out,
    meta: {
      source_code: SOURCE_CODE,
      count: Object.keys(out).length,
      requested: list.length
    }
  };
}

/**
 * Internal API quotes: ưu tiên stock_prices; thiếu thì ingest provider rồi UPSERT.
 */
async function getQuotes(tickers) {
  const priceSync = require('./market-price-sync.service');
  const list = [];
  const seen = new Set();
  (tickers || []).forEach(function (raw) {
    const t = norm(raw);
    if (!t || seen.has(t)) return;
    seen.add(t);
    list.push(t);
  });

  const fromDb = await priceSync.getQuotesFromDb(list);
  const missing = list.filter(function (t) {
    return !fromDb.quotes[t];
  });

  if (missing.length) {
    try {
      await priceSync.ingestTickersNow(missing);
      const again = await priceSync.getQuotesFromDb(list);
      return {
        quotes: again.quotes,
        meta: Object.assign({}, again.meta, { filled_from_provider: missing.length })
      };
    } catch (err) {
      return {
        quotes: fromDb.quotes,
        meta: Object.assign({}, fromDb.meta, {
          provider_fill_error: err && err.message ? err.message : String(err)
        })
      };
    }
  }

  return fromDb;
}

async function getOhlc(ticker, days) {
  const t = norm(ticker);
  const n = Math.min(Math.max(Number(days) || 60, 1), 365);
  if (!t) return { ticker: t, data: [], meta: { source_code: SOURCE_CODE } };
  const from = new Date(Date.now() - (n + 14) * 86400000).toISOString().slice(0, 10);
  const url =
    BASE + '?q=code:' + t + '~date:gte:' + from + '&sort=date:asc&size=' + (n + 20);
  const d = await fetchJson(url);
  const rows = ((d && d.data) || []).map(normalizeRow);
  return {
    ticker: t,
    data: rows.slice(-n),
    meta: { source_code: SOURCE_CODE, count: rows.length }
  };
}

module.exports = { getQuotes, getOhlc, fetchProviderQuotes, SOURCE_CODE, normalizeRow };
