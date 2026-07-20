/* Phân loại CP — Ngành / Họ CP / Chủ đề (sandbox) */
(function (global) {
  'use strict';

  /* Fallback khi chưa có Admin registry (offline / chưa seed) */
  var SECTOR_FALLBACK = [
    { id: '1', slug: 'ngan-hang', name: 'Ngân hàng', tickers: ['VCB', 'STB', 'TCB', 'MBB', 'ACB'] },
    { id: '2', slug: 'bat-dong-san', name: 'Bất động sản', tickers: ['VHM', 'VIC', 'NVL', 'PDR', 'KDH'] },
    { id: '3', slug: 'cong-nghe', name: 'Công nghệ', tickers: ['FPT', 'CMG', 'ELC'] },
    { id: '4', slug: 'thep', name: 'Thép', tickers: ['HPG', 'HSG', 'NKG'] },
    { id: '5', slug: 'chung-khoan', name: 'Chứng khoán', tickers: ['SSI', 'VND', 'HCM', 'SHS', 'VCI'] },
    { id: '6', slug: 'ban-le', name: 'Bán lẻ', tickers: ['MWG', 'FRT', 'DGW'] }
  ];

  function familyGroups() {
    var seeds = global.IfluxMarketEcosystemSeeds;
    if (seeds && typeof seeds.list === 'function') return seeds.list();
    return [
      { id: 'vingroup', name: 'Họ Vingroup', tickers: ['VIC', 'VHM', 'VRE', 'VPL', 'VEF'] },
      { id: 'fpt', name: 'Họ FPT', tickers: ['FPT', 'FOX', 'FRT'] }
    ];
  }

  /* ── Ngành THẬT từ Admin registry (map ticker → sectorId) ── */
  function registrySectors() {
    var reg = global.IfluxMarketRegistryStore;
    if (!reg || typeof reg.listSectors !== 'function' || typeof reg.listStocks !== 'function') return null;
    try {
      var sectors = reg.listSectors().filter(function (s) { return s.status !== 'inactive'; });
      if (!sectors.length) return null;
      var stocks = reg.listStocks({ status: 'active' }) || [];
      var bySector = {};
      stocks.forEach(function (s) {
        var sid = String(s.sectorId == null ? '' : s.sectorId);
        if (!sid) return;
        (bySector[sid] = bySector[sid] || []).push(String(s.ticker || '').toUpperCase());
      });
      return sectors.map(function (s) {
        var id = String(s.id);
        return { id: id, slug: slugifyLocal(s.name), name: s.name, tickers: bySector[id] || [] };
      }).filter(function (g) { return g.tickers.length > 0; });
    } catch (e) { return null; }
  }

  /* ── Hệ sinh thái THẬT từ Admin registry (ecosystems) ── */
  function registryFamilies() {
    var reg = global.IfluxMarketRegistryStore;
    if (!reg || typeof reg.listEcosystems !== 'function') return null;
    try {
      var list = reg.listEcosystems().filter(function (e) { return e.status !== 'inactive'; });
      if (!list.length) return null;
      return list.map(function (e) {
        return {
          id: e.id,
          slug: slugifyLocal(e.name),
          name: e.name,
          tickers: (e.tickers || []).map(function (t) { return String(t).toUpperCase(); })
        };
      }).filter(function (g) { return g.tickers.length > 0; });
    } catch (e) { return null; }
  }

  var CHU_DE_FALLBACK = [
    { id: 'chien-tranh-my-iran', name: 'Chiến tranh Mỹ - Iran', tickers: ['PVD', 'PVS', 'PLX', 'GAS', 'PVT'] },
    { id: 'dau-tu-cong', name: 'Đầu tư công', tickers: ['HPG', 'VCG', 'HHV', 'CII', 'PC1', 'NKG'] },
    { id: 'thoai-von-nn', name: 'Thoái vốn nhà nước', tickers: ['VNM', 'SAB', 'BVH', 'MSN', 'HPG'] },
    { id: 'my-ap-thue-quan', name: 'Mỹ áp thuế quan', tickers: ['VHC', 'ASM', 'GIL', 'KBC', 'SIP', 'IDC'] },
    { id: 'nang-hang-ftse', name: 'Nâng hạng thị trường FTSE', tickers: ['VCB', 'VHM', 'FPT', 'HPG', 'MWG', 'VIC'] },
    { id: 'giai-ngan-dau-tu-cong', name: 'Giải ngân đầu tư công', tickers: ['VCG', 'HHV', 'IDC', 'CII', 'HPG', 'NKG'] }
  ];

  var GROUPS = {
    sector: registrySectors() || SECTOR_FALLBACK,
    family: registryFamilies() || familyGroups(),
    'chu-de': CHU_DE_FALLBACK.slice()
  };
  GROUPS.story = GROUPS['chu-de'];

  var SOURCE_LABELS = {
    sector: 'Ngành',
    family: 'Hệ sinh thái',
    'chu-de': 'Chủ đề',
    story: 'Chủ đề'
  };

  function knownTickers() {
    var snap = global.IfluxMockMarket && IfluxMockMarket.getSnapshot();
    if (!snap || !snap.entities || !snap.entities.stocks) return null;
    return snap.entities.stocks;
  }

  function filterAvailable(tickers) {
    var stocks = knownTickers();
    if (!stocks) return tickers.slice();
    return tickers.filter(function (t) { return !!stocks[t]; });
  }

  function getGroups(source) {
    source = normalizeSource(source);
    return (GROUPS[source] || []).slice();
  }

  function normalizeStoryStatus(raw, lifecycle) {
    var s = String(raw || '').toLowerCase();
    if (s === 'mature' || s === 'truong_thanh') return 'mature';
    if (s === 'new' || s === 'moi') return 'new';
    if (s === 'declining' || s === 'suy_yeu' || s === 'retired') return 'declining';
    if (s === 'archived' || s === 'merged') return 'archived';
    var lc = String(lifecycle || '').toLowerCase();
    if (lc === 'archived') return 'archived';
    if (lc === 'fading') return 'declining';
    if (lc === 'peak' || lc === 'trending') return 'mature';
    return 'new';
  }

  function hydrateChuDeFromApi() {
    function unwrap(body) {
      if (!body) return {};
      if (body.success === false) {
        var err = body.error;
        throw new Error((err && err.message) || body.message || 'API error');
      }
      return body.data != null ? body.data : body;
    }

    /* Production User Web thường dataMode=sandbox → IfluxApi không fetch.
       Chủ đề là SoT trên DB nên luôn đọc /api/content/* trực tiếp. */
    function apiGet(path) {
      if (global.IfluxApi && global.IfluxData && IfluxData.isApi && IfluxData.isApi() && global.IfluxApiConfig && IfluxApiConfig.isEnabled && IfluxApiConfig.isEnabled()) {
        if (path.indexOf('/content/chu-de') === 0) {
          return IfluxApi.listContentStories({ limit: 100 }).then(unwrap);
        }
        if (path.indexOf('/content/mappings') === 0) {
          return IfluxApi.listContentMappings({ limit: 500 }).then(unwrap);
        }
      }
      return fetch('/api' + path, { headers: { Accept: 'application/json' }, credentials: 'same-origin' })
        .then(function (res) {
          return res.json().catch(function () { return {}; }).then(function (body) {
            if (!res.ok) {
              var e = body && body.error;
              throw new Error((e && e.message) || body.message || ('HTTP ' + res.status));
            }
            return unwrap(body);
          });
        });
    }

    return Promise.all([
      apiGet('/content/chu-de?limit=100'),
      apiGet('/content/mappings?limit=500')
    ]).then(function (parts) {
      var list = parts[0]['chu-de'] || parts[0].stories || [];
      var maps = parts[1].mappings || [];
      var byId = {};
      maps.forEach(function (m) {
        if (m.status && m.status !== 'active') return;
        var id = m.chu_de_id || m.story_id;
        if (!id) return;
        if (!byId[id]) byId[id] = [];
        var tk = String(m.ticker || '').toUpperCase();
        if (tk && byId[id].indexOf(tk) < 0) byId[id].push(tk);
      });
      if (!list.length) return GROUPS['chu-de'].slice();
      GROUPS['chu-de'] = list.filter(function (s) {
        return s.status !== 'archived' && s.status !== 'retired';
      }).map(function (s) {
        return {
          id: s.slug || s.id,
          slug: s.slug || s.id,
          name: s.label || s.name,
          tickers: byId[s.id] || [],
          status: s.status || '',
          lifecycle: s.lifecycle || '',
          normalizedStatus: normalizeStoryStatus(s.status, s.lifecycle)
        };
      });
      GROUPS.story = GROUPS['chu-de'];
      return GROUPS['chu-de'].slice();
    }).catch(function () {
      return GROUPS['chu-de'].slice();
    });
  }

  function slugifyLocal(text) {
    return String(text || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /** Resolve theo id số, slug tên, hoặc slugify(name) — tương thích link cũ lẫn mới. */
  function normalizeSource(source) {
    if (source === 'story' || source === 'chu_de' || source === 'chuDe') return 'chu-de';
    return source;
  }

  function getGroup(source, sourceId) {
    var groups = getGroups(source);
    var key = String(sourceId == null ? '' : sourceId);
    var keySlug = slugifyLocal(key);
    for (var i = 0; i < groups.length; i++) {
      var g = groups[i];
      if (String(g.id) === key) return g;
      if (g.slug && (g.slug === key || g.slug === keySlug)) return g;
      if (slugifyLocal(g.name) === keySlug && keySlug) return g;
    }
    return null;
  }

  /** Slug chuẩn của group (ưu tiên slug khai báo → slugify tên → id). */
  function groupSlug(source, sourceId) {
    var g = getGroup(source, sourceId);
    if (!g) return slugifyLocal(sourceId) || String(sourceId == null ? '' : sourceId);
    return g.slug || slugifyLocal(g.name) || String(g.id);
  }

  function getGroupTickers(source, sourceId) {
    var group = getGroup(source, sourceId);
    if (!group) return [];
    var available = filterAvailable(group.tickers);
    if (available.length) return available;
    /* Chủ đề từ DB: vẫn trả tickers dù mock snapshot chưa có mã */
    var src = normalizeSource(source);
    if ((src === 'chu-de' || source === 'story') && group.tickers && group.tickers.length) {
      return group.tickers.slice();
    }
    return [];
  }

  function sourceLabel(source) {
    return SOURCE_LABELS[source] || source;
  }

  function getTickerMemberships(ticker) {
    var t = (ticker || '').toUpperCase();
    var result = { sector: null, family: null, chuDe: null, 'chu-de': null, story: null };
    ['sector', 'family', 'chu-de', 'story'].forEach(function (source) {
      getGroups(source).some(function (g) {
        if (g.tickers.indexOf(t) >= 0) {
          var entry = { id: String(g.id), name: g.name };
          if (source === 'chu-de' || source === 'story') {
            result['chu-de'] = entry;
            result.chuDe = entry;
            result.story = entry;
          } else {
            result[source] = entry;
          }
          return true;
        }
        return false;
      });
    });
    return result;
  }

  function hashRank(source, sourceId) {
    var s = source + ':' + sourceId;
    var h = 0;
    var i;
    for (i = 0; i < s.length; i++) {
      h = ((h << 5) - h) + s.charCodeAt(i);
      h |= 0;
    }
    return (Math.abs(h) % 15) + 1;
  }

  function getGroupRank(source, sourceId) {
    return hashRank(source, sourceId);
  }

  function getTickerGroupRank(source, ticker) {
    var m = getTickerMemberships(ticker)[source];
    if (!m) return null;
    return { group: m, rank: getGroupRank(source, m.id) };
  }

  global.IfluxWatchlistTaxonomy = {
    GROUPS: GROUPS,
    SOURCE_LABELS: SOURCE_LABELS,
    getGroups: getGroups,
    getGroup: getGroup,
    groupSlug: groupSlug,
    getGroupTickers: getGroupTickers,
    getTickerMemberships: getTickerMemberships,
    getGroupRank: getGroupRank,
    getTickerGroupRank: getTickerGroupRank,
    sourceLabel: sourceLabel,
    filterAvailable: filterAvailable,
    hydrateChuDeFromApi: hydrateChuDeFromApi
  };
})(window);
