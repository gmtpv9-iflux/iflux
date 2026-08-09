'use strict';

/**
 * BR-31 — thin loadCandidates(sourceCode) abstraction.
 * Each provider is an adapter implementation; domain import stays in market-mdm.
 */

const { createDnseClient } = require('../dnse/dnse.client');
const { normalizeCapGroup, capGroupFromMarketCap } = require('./market-cap-group');

const VND_FINO = 'https://api-finfo.vndirect.com.vn/v4';

function mapDnseMarket(marketId) {
  const m = String(marketId || '').toUpperCase();
  if (m === 'STO' || m === 'HSX' || m === 'HOSE') return 'HOSE';
  if (m === 'STX' || m === 'HNX') return 'HNX';
  if (m === 'UPX' || m === 'UPCOM') return 'UPCOM';
  return m || 'HOSE';
}

function mapVndStatus(raw) {
  const s = String(raw || '')
    .trim()
    .toLowerCase();
  if (!s) return null;
  if (s === 'listed' || s === 'list') return 'active';
  if (s === 'delisted') return 'delisted';
  if (s === 'halt' || s === 'halted' || s === 'suspended') return 'halted';
  return null;
}

/**
 * VNDirect industryLevel:2 (19 ngành phổ biến) → sectors.code.
 * Catalog iFlux = L2; không dùng L4 (114) làm danh mục.
 */
function normalizeIndustryName(viName) {
  return String(viName || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

const VND_L2_NAME_TO_SECTOR_CODE = {
  'dầu khí': 'dau-khi',
  'hóa chất': 'hoa-chat',
  'tài nguyên': 'tai-nguyen',
  'xây dựng & vật liệu': 'xay-dung-vat-lieu',
  'hàng hóa và dịch vụ công nghiệp': 'hang-hoa-dich-vu-cn',
  'ôtô & linh kiện phụ tùng': 'oto-linh-kien',
  'ô tô & linh kiện phụ tùng': 'oto-linh-kien',
  'thực phẩm & đồ uống': 'thuc-pham-do-uong',
  'đồ dùng cá nhân và đồ gia dụng': 'do-dung-ca-nhan',
  'y tế': 'y-te',
  'dịch vụ bán lẻ': 'dich-vu-ban-le',
  'phương tiện truyền thông': 'truyen-thong',
  'du lịch & giải trí': 'du-lich-giai-tri',
  'viễn thông': 'vien-thong',
  'dịch vụ tiện ích': 'dich-vu-tien-ich',
  'ngân hàng': 'ngan-hang',
  'bảo hiểm': 'bao-hiem',
  'bất động sản': 'bat-dong-san',
  'dịch vụ tài chính': 'dich-vu-tai-chinh',
  'công nghệ': 'cong-nghe'
};

/** Map tên ngành VND L2 (hoặc alias) → sectors.code. */
function mapIndustryToSectorCode(viName) {
  const n = normalizeIndustryName(viName);
  if (!n) return null;
  return VND_L2_NAME_TO_SECTOR_CODE[n] || null;
}

function normalizeCandidate(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const ticker = String(raw.ticker || raw.symbol || raw.code || '')
    .trim()
    .toUpperCase();
  if (!ticker) return null;
  const shortName =
    raw.short_name != null
      ? String(raw.short_name).trim()
      : raw.shortName != null
        ? String(raw.shortName).trim()
        : null;
  const isin = raw.isin != null ? String(raw.isin).trim() : null;
  const marketCap =
    raw.market_cap != null && Number.isFinite(Number(raw.market_cap))
      ? Number(raw.market_cap)
      : null;
  let capGroup = normalizeCapGroup(raw.cap_group || raw.capGroup || null);
  if (!capGroup && marketCap != null) capGroup = capGroupFromMarketCap(marketCap);
  const shares =
    raw.shares_outstanding != null && Number.isFinite(Number(raw.shares_outstanding))
      ? Number(raw.shares_outstanding)
      : null;
  return {
    ticker: ticker,
    name: raw.name != null ? String(raw.name).trim() : shortName,
    short_name: shortName,
    english_name:
      raw.english_name != null
        ? String(raw.english_name).trim()
        : raw.companyNameEng != null
          ? String(raw.companyNameEng).trim()
          : null,
    exchange: raw.exchange != null ? String(raw.exchange) : mapDnseMarket(raw.marketId),
    isin: isin || null,
    market_cap: marketCap,
    cap_group: capGroup,
    shares_outstanding: shares,
    sector_code: raw.sector_code != null ? String(raw.sector_code).trim() : null,
    sector_id:
      raw.sector_id != null && Number.isFinite(Number(raw.sector_id))
        ? Number(raw.sector_id)
        : null,
    status: raw.status != null ? mapVndStatus(raw.status) || null : null,
    description: raw.description != null ? String(raw.description).trim() : null
  };
}

function parseCsv(text) {
  const lines = String(text || '')
    .split(/\r?\n/)
    .map(function (l) {
      return l.trim();
    })
    .filter(Boolean);
  if (!lines.length) return [];
  const header = lines[0].split(',').map(function (h) {
    return h.trim().toLowerCase();
  });
  const idx = function (name) {
    return header.indexOf(name);
  };
  const out = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(function (c) {
      return c.trim();
    });
    const row = {
      ticker: cols[idx('ticker')] || cols[0],
      name: idx('name') >= 0 ? cols[idx('name')] : cols[1],
      exchange: idx('exchange') >= 0 ? cols[idx('exchange')] : undefined,
      market_cap: idx('market_cap') >= 0 ? cols[idx('market_cap')] : undefined,
      cap_group: idx('cap_group') >= 0 ? cols[idx('cap_group')] : undefined
    };
    const n = normalizeCandidate(row);
    if (n) out.push(n);
  }
  return out;
}

function dnseAuxDate() {
  return new Date().toUTCString().replace('GMT', '+0000');
}

async function loadDnseCandidates(config) {
  config = config || {};
  const apiKey = config.DNSE_API_KEY || '';
  const apiSecret = config.DNSE_API_SECRET || '';
  const version = config.DNSE_API_VERSION || '2026-05-07';
  const base =
    config.DNSE_BASE_URL || config.DNSE_OPENAPI_URL || 'https://openapi.dnse.com.vn';
  /* DNSE OpenAPI dùng query `limit` + `page` (không phải pageSize) */
  const pageSize = Math.min(Math.max(Number(config.DNSE_PAGE_SIZE) || 500, 1), 500);
  const pathBase = '/instruments';

  const headers = {
    Accept: 'application/json',
    version: version
  };
  const auxDate = dnseAuxDate();
  headers['X-Aux-Date'] = auxDate;
  if (apiKey) headers['X-API-Key'] = apiKey;

  /* HMAC signature when secret configured (DNSE OpenAPI) */
  if (apiKey && apiSecret) {
    const crypto = require('crypto');
    const requestTarget = 'get ' + pathBase;
    const signingString =
      '(request-target): ' + requestTarget + '\nx-aux-date: ' + auxDate;
    const signature = encodeURIComponent(
      crypto.createHmac('sha256', apiSecret).update(signingString).digest('base64')
    );
    headers['X-Signature'] =
      'Signature keyId="' +
      apiKey +
      '",algorithm="hmac-sha256",headers="(request-target) x-aux-date",signature="' +
      signature +
      '"';
  }

  /* JWT login — OpenAPI instruments yêu cầu Authorization Bearer */
  if (config.DNSE_USERNAME && config.DNSE_PASSWORD) {
    const client = createDnseClient(
      Object.assign({}, config, {
        DNSE_AUTH_URL: config.DNSE_AUTH_URL || process.env.DNSE_AUTH_URL
      })
    );
    const login = await client.login(false);
    if (login.ok && login.token) {
      headers.Authorization = 'Bearer ' + login.token;
    } else {
      const err = new Error(login.error || 'DNSE login failed');
      err.code = 'DNSE_AUTH';
      err.detail = login;
      throw err;
    }
  } else if (!apiKey) {
    const err = new Error('DNSE_API_KEY hoặc DNSE_USERNAME/PASSWORD chưa cấu hình');
    err.code = 'DNSE_AUTH';
    throw err;
  }

  const all = [];
  let page = 1;
  const maxPages = 200;
  while (page <= maxPages) {
    const path = pathBase + '?limit=' + pageSize + '&page=' + page;
    const url = String(base).replace(/\/$/, '') + path;
    const res = await fetch(url, { headers: headers });
    const text = await res.text();
    let body = null;
    try {
      body = text ? JSON.parse(text) : null;
    } catch (e) {
      body = null;
    }
    if (!res.ok) {
      const err = new Error((body && (body.message || body.error)) || 'DNSE instruments failed');
      err.code = 'DNSE_INSTRUMENTS';
      err.status = res.status;
      err.detail = body;
      throw err;
    }
    const rows = Array.isArray(body)
      ? body
      : (body && (body.data || body.items || body.content)) || [];
    if (!rows.length) break;
    rows.forEach(function (r) {
      const c = normalizeCandidate(r);
      if (c) all.push(c);
    });
    const total = body && (body.total != null ? Number(body.total) : null);
    if (rows.length < pageSize) break;
    if (total != null && all.length >= total) break;
    page += 1;
  }
  return all;
}

function envDnseConfig(overrides) {
  const env = process.env || {};
  return Object.assign(
    {
      DNSE_API_KEY: env.DNSE_API_KEY,
      DNSE_API_SECRET: env.DNSE_API_SECRET,
      DNSE_API_VERSION: env.DNSE_API_VERSION,
      DNSE_BASE_URL: env.DNSE_BASE_URL || env.DNSE_OPENAPI_URL,
      DNSE_USERNAME: env.DNSE_USERNAME,
      DNSE_PASSWORD: env.DNSE_PASSWORD,
      DNSE_AUTH_URL: env.DNSE_AUTH_URL,
      DNSE_DATAFEED_HOST: env.DNSE_DATAFEED_HOST,
      DNSE_DATAFEED_PORT: env.DNSE_DATAFEED_PORT,
      DNSE_DATAFEED_PATH: env.DNSE_DATAFEED_PATH,
      DNSE_PAGE_SIZE: env.DNSE_PAGE_SIZE
    },
    overrides || {}
  );
}

async function loadCandidates(sourceCode, options) {
  options = options || {};
  const code = String(sourceCode || '').trim().toLowerCase();
  const config = envDnseConfig(options.config || {});

  if (code === 'dnse') {
    return loadDnseCandidates(config);
  }

  if (code === 'manual_csv' || code === 'internal_upload') {
    if (options.csvText) return parseCsv(options.csvText);
    if (Array.isArray(options.items)) {
      return options.items.map(normalizeCandidate).filter(Boolean);
    }
    const err = new Error('Cần csvText hoặc items cho nguồn ' + code);
    err.code = 'CANDIDATES_REQUIRED';
    throw err;
  }

  if (code === 'ssi_market_feed' || code === 'fiinpro_eod') {
    /* Governed intake: cho phép CSV/items qua MDM; live API adapter chưa wire. */
    if (options.csvText) return parseCsv(options.csvText);
    if (Array.isArray(options.items) && options.items.length) {
      return options.items.map(normalizeCandidate).filter(Boolean);
    }
    const err = new Error(
      'Adapter ' + code + ' chưa wire live API — truyền csv_text/items qua MDM Import để intake có kiểm soát (ADAPTER_NOT_IMPLEMENTED)'
    );
    err.code = 'ADAPTER_NOT_IMPLEMENTED';
    throw err;
  }

  if (code === 'vndirect_finfo') {
    /* Full-Universe instrument list (listed STOCK) — không thay Price Ingest quotes */
    return loadVndirectListedCandidates();
  }

  const err = new Error('Không có adapter cho source_code=' + code);
  err.code = 'ADAPTER_UNKNOWN';
  throw err;
}

async function fetchJson(url) {
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) return null;
  try {
    return await res.json();
  } catch (e) {
    return null;
  }
}

async function loadVndRatioLatestByCode(ratioCode) {
  const probe = await fetchJson(
    VND_FINO +
      '/ratios?q=ratioCode:' +
      encodeURIComponent(ratioCode) +
      '&size=1&sort=reportDate:desc'
  );
  const reportDate =
    probe && probe.data && probe.data[0] && probe.data[0].reportDate
      ? String(probe.data[0].reportDate).slice(0, 10)
      : null;
  if (!reportDate) return {};
  const byCode = {};
  for (let page = 1; page <= 40; page++) {
    const body = await fetchJson(
      VND_FINO +
        '/ratios?q=ratioCode:' +
        encodeURIComponent(ratioCode) +
        '~reportDate:' +
        reportDate +
        '&size=100&page=' +
        page
    );
    const rows = (body && body.data) || [];
    if (!rows.length) break;
    rows.forEach(function (r) {
      const code = String(r.code || '')
        .trim()
        .toUpperCase();
      if (!code || byCode[code] != null) return;
      const v = Number(r.value);
      if (Number.isFinite(v)) byCode[code] = v;
    });
    if (rows.length < 100) break;
  }
  return byCode;
}

/** Gán ticker → sectors.code từ VNDirect industryLevel:2 (19 nhóm). */
async function loadVndSectorCodeByTicker() {
  const byTicker = {};
  const body = await fetchJson(
    VND_FINO + '/industry_classification?q=industryLevel:2&size=50&page=1'
  );
  const rows = (body && body.data) || [];
  rows.forEach(function (r) {
    const sectorCode = mapIndustryToSectorCode(r.vietnameseName || r.englishName);
    if (!sectorCode) return;
    String(r.codeList || '')
      .split(',')
      .map(function (x) {
        return String(x || '')
          .trim()
          .toUpperCase();
      })
      .filter(Boolean)
      .forEach(function (t) {
        byTicker[t] = sectorCode;
      });
  });
  return byTicker;
}

/**
 * VNDirect finfo — listed STOCK + MARKETCAP + ngành L2 (codeList đủ) + KLCP.
 * Ngành: union L2 codeList — không phụ thuộc list niêm yết có đủ mã hay không.
 */
async function loadVndirectListedCandidates() {
  const pageSize = 100;
  const floors = ['HOSE', 'HNX', 'UPCOM'];
  const all = [];
  const seen = {};

  for (let f = 0; f < floors.length; f++) {
    const floor = floors[f];
    let page = 1;
    let floorNamed = 0;
    let floorTotal = null;
    for (; page <= 200; page++) {
      const url =
        VND_FINO +
        '/stocks?q=type:STOCK~status:LISTED~floor:' +
        floor +
        '&size=' +
        pageSize +
        '&page=' +
        page;
      const body = await fetchJson(url);
      const rows = (body && body.data) || [];
      if (!rows.length) break;
      if (body.totalElements != null) floorTotal = Number(body.totalElements);
      rows.forEach(function (r) {
        const c = normalizeCandidate({
          ticker: r.code,
          symbol: r.code,
          name: r.companyName || r.shortName || r.code,
          short_name: r.shortName,
          english_name: r.companyNameEng || r.shortNameEng,
          exchange: r.floor || floor,
          isin: r.isin,
          status: r.status
        });
        if (!c || seen[c.ticker]) return;
        seen[c.ticker] = true;
        floorNamed += 1;
        all.push(c);
      });
      if (rows.length < pageSize) break;
      /* BR-MS-01: ngưỡng dừng theo từng sàn — cấm dùng seen tích lũy 3 sàn */
      if (floorTotal != null && floorNamed >= floorTotal) break;
    }
  }

  const [mcapMap, sharesMap, sectorMap] = await Promise.all([
    loadVndRatioLatestByCode('MARKETCAP'),
    loadVndRatioLatestByCode('OUTSTANDING_SHARES'),
    loadVndSectorCodeByTicker()
  ]);

  all.forEach(function (c) {
    if (mcapMap[c.ticker] != null) {
      c.market_cap = mcapMap[c.ticker];
      if (!c.cap_group) c.cap_group = capGroupFromMarketCap(c.market_cap);
    }
    if (sharesMap[c.ticker] != null) c.shares_outstanding = sharesMap[c.ticker];
    if (sectorMap[c.ticker]) c.sector_code = sectorMap[c.ticker];
  });

  /* Ngành: L2 codeList = universe đủ. Union ticker có ngành dù list niêm yết bỏ sót.
     Chỉ mã cổ phiếu ngắn (≤10); bỏ mã quỹ/công cụ dài. Candidate sector-only (không ép name)
     để fill Master hiện có — tránh conflict tên / INSERT varchar vượt cột. */
  Object.keys(sectorMap).forEach(function (ticker) {
    if (seen[ticker]) return;
    if (!/^[A-Z][A-Z0-9]{0,9}$/.test(ticker)) return;
    const c = normalizeCandidate({ ticker: ticker, symbol: ticker });
    if (!c || seen[c.ticker]) return;
    c.name = null;
    c.short_name = null;
    c.sector_code = sectorMap[ticker];
    if (mcapMap[c.ticker] != null) {
      c.market_cap = mcapMap[c.ticker];
      if (!c.cap_group) c.cap_group = capGroupFromMarketCap(c.market_cap);
    }
    if (sharesMap[c.ticker] != null) c.shares_outstanding = sharesMap[c.ticker];
    seen[c.ticker] = true;
    all.push(c);
  });

  return all;
}

module.exports = {
  loadCandidates,
  normalizeCandidate,
  parseCsv,
  mapDnseMarket,
  mapIndustryToSectorCode,
  normalizeIndustryName,
  VND_L2_NAME_TO_SECTOR_CODE
};
