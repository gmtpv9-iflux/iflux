'use strict';

/**
 * Entity Resolution — Stock + Ecosystem membership + occurrence binding.
 * Owner 2026-08-09: KHÔNG match ticker token 2–5 chữ (tránh tin→TIN, căn→CAN).
 * Chỉ match name / short_name / english_name trong Master; brand alias = ticker
 * khi ticker xuất hiện như từ trong name|short_name (match case-sensitive trên bản gốc).
 * Sector: OUT OF SCOPE (BR-AD-12).
 */

const marketMaster = require('../market/market-master.service');

const VENDOR_AUTHOR_RE = /^(vccorp\.?vn|vccorp)$/i;
const TICKER_LIKE_RE = /^[A-Z]{2,5}$/;

let _cache = null;
let _cacheAt = 0;
const CACHE_MS = 5 * 60 * 1000;

function stripTags(html) {
  return String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isWordChar(ch) {
  if (!ch) return false;
  const c = ch.charCodeAt(0);
  if ((c >= 48 && c <= 57) || (c >= 65 && c <= 90) || (c >= 97 && c <= 122)) return true;
  /* chữ có dấu / Latin mở rộng */
  return c > 127 && /\p{L}|\p{N}/u.test(ch);
}

function hasWordBoundary(plain, index, len) {
  const before = index > 0 ? plain.charAt(index - 1) : '';
  const after = plain.charAt(index + len) || '';
  return !isWordChar(before) && !isWordChar(after);
}

/** CTCP/Công ty… bị cắt trước "và …" → không phải short_name đầy đủ */
function isLegalFormPrefix(label) {
  return /^(ctcp|công ty|tong cong ty|tổng công ty)\b/i.test(String(label || '').trim());
}

function isTruncatedLegalName(plain, end) {
  return /^\s+(và|&)\s+\S/i.test(plain.slice(end));
}

function findAllIndexOf(haystack, needle) {
  const out = [];
  if (!haystack || !needle) return out;
  let from = 0;
  while (from <= haystack.length - needle.length) {
    const idx = haystack.indexOf(needle, from);
    if (idx < 0) break;
    out.push(idx);
    from = idx + Math.max(1, needle.length);
  }
  return out;
}

function nameContainsTickerWord(label, ticker) {
  if (!label || !ticker) return false;
  const upper = String(label).toUpperCase();
  const t = String(ticker).toUpperCase();
  const idxs = findAllIndexOf(upper, t);
  for (let i = 0; i < idxs.length; i++) {
    if (hasWordBoundary(upper, idxs[i], t.length)) return true;
  }
  return false;
}

async function loadMaster() {
  const now = Date.now();
  if (_cache && now - _cacheAt < CACHE_MS) return _cache;
  const [stocks, ecosystems] = await Promise.all([
    marketMaster.listStocks({ status: 'active' }),
    marketMaster.listEcosystems()
  ]);
  const byTicker = Object.create(null);
  const labels = [];

  (stocks || []).forEach(function (s) {
    const t = String(s.ticker || '').toUpperCase();
    if (!t) return;
    byTicker[t] = s;

    const name = String(s.name || '').trim();
    const shortName = String(s.short_name || '').trim();
    const englishName = String(s.english_name || '').trim();

    function pushLabel(label, kind, minLen, caseSensitive) {
      const text = String(label || '').trim();
      if (!text || text.length < minLen) return;
      labels.push({
        label: text,
        labelLower: caseSensitive ? null : text.toLocaleLowerCase('vi'),
        ticker: t,
        stock: s,
        kind: kind,
        len: text.length,
        caseSensitive: !!caseSensitive
      });
    }

    pushLabel(name, 'name', 6, false);
    if (shortName) {
      const upperShort = shortName.toUpperCase();
      const tickerLike = TICKER_LIKE_RE.test(upperShort) && upperShort === t;
      pushLabel(shortName, 'short_name', tickerLike ? 2 : 3, tickerLike);
    }
    pushLabel(englishName, 'english_name', 6, false);

    if (nameContainsTickerWord(name, t) || nameContainsTickerWord(shortName, t)) {
      labels.push({
        label: t,
        labelLower: null,
        ticker: t,
        stock: s,
        kind: 'ticker_alias',
        len: t.length,
        caseSensitive: true
      });
    }
  });

  labels.sort(function (a, b) {
    if (b.len !== a.len) return b.len - a.len;
    const rank = { name: 3, short_name: 2, english_name: 1, ticker_alias: 0 };
    return (rank[b.kind] || 0) - (rank[a.kind] || 0);
  });

  const ecoById = Object.create(null);
  (ecosystems || []).forEach(function (e) {
    if (e && e.id) ecoById[e.id] = e;
  });
  _cache = { byTicker: byTicker, labels: labels, ecoById: ecoById };
  _cacheAt = now;
  return _cache;
}

function pushOcc(out, seen, occ) {
  const key = occ.entity_kind + '|' + occ.code + '|' + occ.matched_text;
  if (seen[key]) return;
  seen[key] = true;
  out.push(occ);
}

/**
 * @param {{ title?: string, excerpt?: string, body_html?: string, body?: string }} article
 * @returns {Promise<{ tickers: string[], ecosystems: string[], sectors: [], entity_occurrences: object[], entities: object }>}
 */
async function resolveArticleEntities(article) {
  const master = await loadMaster();
  const title = String(article.title || '');
  const excerpt = String(article.excerpt || '');
  const bodyHtml = String(article.body_html || article.body || '');
  const plain = stripTags([title, excerpt, bodyHtml].join('\n'));
  const plainLower = plain.toLocaleLowerCase('vi');

  const tickers = [];
  const tickerSet = Object.create(null);
  const occurrences = [];
  const occSeen = Object.create(null);

  const spanOwner = Object.create(null);
  const pending = [];

  master.labels.forEach(function (row) {
    const needle = row.caseSensitive ? row.label : row.labelLower;
    const hay = row.caseSensitive ? plain : plainLower;
    if (!needle) return;
    const idxs = findAllIndexOf(hay, needle);
    for (let i = 0; i < idxs.length; i++) {
      const idx = idxs[i];
      if (!hasWordBoundary(hay, idx, needle.length)) continue;
      /* "CTCP Thiết bị và Truyền thông NGS" ≠ short_name "CTCP Thiết bị" (MA1) */
      if (
        isLegalFormPrefix(row.label) &&
        isTruncatedLegalName(plain, idx + needle.length)
      ) {
        continue;
      }
      const matched_text = plain.slice(idx, idx + needle.length);
      const spanKey = idx + ':' + (idx + needle.length);
      const prev = spanOwner[spanKey];
      if (prev && prev.ticker !== row.ticker) {
        spanOwner[spanKey] = { ticker: null, blocked: true, len: 0 };
        continue;
      }
      if (prev && prev.blocked) continue;
      if (prev && prev.len >= row.len) continue;
      spanOwner[spanKey] = {
        ticker: row.ticker,
        len: row.len,
        kind: row.kind,
        blocked: false
      };
      pending.push({
        spanKey: spanKey,
        ticker: row.ticker,
        matched_text: matched_text,
        kind: row.kind
      });
    }
  });

  pending.forEach(function (p) {
    const owner = spanOwner[p.spanKey];
    if (!owner || owner.blocked || owner.ticker !== p.ticker) return;
    const code = p.ticker;
    if (!tickerSet[code]) {
      tickerSet[code] = true;
      tickers.push(code);
    }
    pushOcc(occurrences, occSeen, {
      entity_kind: 'stock',
      code: code,
      matched_text: p.matched_text,
      presentation: p.kind === 'ticker_alias' ? 'ticker' : 'name_ticker',
      id: null
    });
  });

  const ecoCounts = Object.create(null);
  tickers.forEach(function (code) {
    const s = master.byTicker[code];
    if (!s || !s.ecosystem_id) return;
    const eid = s.ecosystem_id;
    if (!ecoCounts[eid]) ecoCounts[eid] = Object.create(null);
    ecoCounts[eid][code] = true;
  });

  const ecosystems = [];
  const ecoEntities = [];
  Object.keys(ecoCounts).forEach(function (eid) {
    const codes = Object.keys(ecoCounts[eid]);
    if (codes.length < 3) return;
    const eco = master.ecoById[eid];
    if (!eco) return;
    const slug = eco.slug || eco.code || eid;
    ecosystems.push(slug);
    ecoEntities.push({
      id: eco.id,
      slug: slug,
      code: eco.code,
      name: eco.name || eco.name_vi || slug
    });
    pushOcc(occurrences, occSeen, {
      entity_kind: 'ecosystem',
      code: slug,
      matched_text: eco.name || slug,
      presentation: 'membership',
      id: eco.id
    });
  });

  const stockEntities = tickers.map(function (code) {
    const s = master.byTicker[code];
    return {
      code: code,
      name: s && s.name ? s.name : code,
      short_name: s && s.short_name ? s.short_name : null,
      ecosystem_id: s && s.ecosystem_id ? s.ecosystem_id : null
    };
  });

  return {
    tickers: tickers.slice(0, 20),
    ecosystems: ecosystems.slice(0, 10),
    sectors: [],
    entity_occurrences: occurrences,
    entities: {
      stocks: stockEntities,
      ecosystems: ecoEntities
    }
  };
}

function normalizeAttribution(authorName, providerName) {
  const raw = String(authorName || '').trim();
  const provider = String(providerName || '').trim();
  const isVendor = !raw || VENDOR_AUTHOR_RE.test(raw);
  return {
    author: isVendor
      ? null
      : {
          id: 'rss-author',
          display_name: raw.slice(0, 160),
          tier: 'rss',
          tier_label: null
        },
    publisher: provider
      ? { name: provider }
      : null,
    provider: provider
      ? { name: provider }
      : null,
    vendor: isVendor && raw
      ? { name: raw.slice(0, 160) }
      : null
  };
}

function clearMasterCache() {
  _cache = null;
  _cacheAt = 0;
}

module.exports = {
  resolveArticleEntities,
  normalizeAttribution,
  clearMasterCache,
  loadMaster
};
