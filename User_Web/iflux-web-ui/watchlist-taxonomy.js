/* ===== IFX-AUDIT-BEGIN =====
AUDIT-ID: T5A-P2-004
Priority: P2
STATUS: Wrong-owner
OWNER (hiện tại): Watchlist
Owner đích (map): Watchlist
Usage audit: ✓ (symbol scan)
Dep động: Có thể
Migration ROI: 5
Khả năng bỏ load: Chưa
P1 Gate: N/A
Refs: docs/runtime-opt/task5/PhaseA-P1-Gate.json handoffP2
Note: requiresShell IfluxWatchlistTaxonomy
===== IFX-AUDIT-END ===== */
/* Phân loại CP — Ngành / Họ CP / Chủ đề (Market Master + API chủ đề) */
(function (global) {
  'use strict';

  /* ── Ngành từ Market Master API (PG SoT) — IfluxMarketMaster (WP-0) ── */
  function masterApi() {
    return global.IfluxMarketMaster || null;
  }

  function masterSectors() {
    var mk = masterApi();
    if (!mk || typeof mk.getMasterSectors !== 'function' || typeof mk.getMasterStocks !== 'function') return null;
    try {
      var sectors = mk.getMasterSectors();
      var stocks = mk.getMasterStocks();
      if (!sectors || !sectors.length || !stocks) return null;
      var bySector = {};
      stocks.forEach(function (s) {
        var sid = String(s.sector_id == null ? '' : s.sector_id);
        if (!sid) return;
        (bySector[sid] = bySector[sid] || []).push(String(s.ticker || '').toUpperCase());
      });
      return sectors.map(function (s) {
        var id = String(s.id);
        return {
          id: id,
          slug: slugifyLocal(s.name || s.name_vi),
          name: s.name || s.name_vi,
          tickers: bySector[id] || []
        };
      }).filter(function (g) { return g.tickers.length > 0; });
    } catch (e) { return null; }
  }

  function registrySectors() {
    return masterSectors();
  }

  /* ── Hệ sinh thái từ Market Master API — IfluxMarketMaster (WP-0) ── */
  function masterFamilies() {
    var mk = masterApi();
    if (!mk || typeof mk.getMasterEcosystems !== 'function') return null;
    try {
      var list = mk.getMasterEcosystems();
      if (!list || !list.length) return null;
      return list.map(function (e) {
        return {
          id: e.id,
          slug: slugifyLocal(e.name || e.name_vi),
          name: e.name || e.name_vi,
          tickers: (e.tickers || []).map(function (t) { return String(t).toUpperCase(); })
        };
      }).filter(function (g) { return g.tickers.length > 0; });
    } catch (e) { return null; }
  }

  function registryFamilies() {
    return masterFamilies();
  }

  var GROUPS = {
    /* Không dữ liệu giả: Ngành / HST từ Market Master (ensureMasterGroups), Chủ đề từ API (hydrateChuDeFromApi). */
    sector: [],
    family: [],
    'chu-de': []
  };
  GROUPS.story = GROUPS['chu-de'];

  function refreshMasterGroups() {
    var sec = registrySectors();
    if (sec && sec.length) GROUPS.sector = sec;
    var fam = registryFamilies();
    if (fam && fam.length) GROUPS.family = fam;
    return {
      sector: GROUPS.sector.slice(),
      family: GROUPS.family.slice()
    };
  }

  function ensureMasterGroups() {
    var mk = masterApi();
    if (mk && typeof mk.ensureMasterReady === 'function') {
      return mk.ensureMasterReady().then(function () {
        return refreshMasterGroups();
      }).catch(function () {
        return refreshMasterGroups();
      });
    }
    return Promise.resolve(refreshMasterGroups());
  }

  /* Không tự tải Market Master: getGroups() tự làm mới khi danh mục đã có; trang cần nhóm ngành/HST gọi ensureMasterGroups(). */

  var SOURCE_LABELS = {
    sector: 'Ngành',
    family: 'Hệ sinh thái',
    'chu-de': 'Chủ đề',
    story: 'Chủ đề'
  };

  function knownTickers() {
    var mm = global.IfluxMarketMaster;
    if (mm && typeof mm.getMasterStocks === 'function') {
      var list = mm.getMasterStocks();
      if (list && list.length) {
        var map = {};
        list.forEach(function (s) {
          var t = String(s.ticker || '').toUpperCase();
          if (t) map[t] = s;
        });
        return map;
      }
    }
    return null;
  }

  function filterAvailable(tickers) {
    var stocks = knownTickers();
    if (!stocks) return tickers.slice();
    return tickers.filter(function (t) { return !!stocks[t]; });
  }

  function getGroups(source) {
    source = normalizeSource(source);
    if (source === 'sector' || source === 'family') refreshMasterGroups();
    return (GROUPS[source] || []).slice();
  }

  /* Owner 2026-10 — Story (bảng `stories`) là entity Câu chuyện duy nhất, thay Content Engine cũ
     (content_chu_de*, đã retire Phase 0). Mã CP của Story đã được tính sẵn ở backend (Đại diện CP
     từ Topic, Topic_Engine V2) — KHÔNG cần JOIN mapping riêng như trước. */
  function hydrateChuDeFromApi() {
    function unwrap(body) {
      if (!body) return {};
      if (body.success === false) {
        var err = body.error;
        throw new Error((err && err.message) || body.message || 'API error');
      }
      return body.data != null ? body.data : body;
    }

    return fetch('/api/community/stories?sort=latest&limit=100', { headers: { Accept: 'application/json' }, credentials: 'same-origin' })
      .then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (body) {
          if (!res.ok) {
            var e = body && body.error;
            throw new Error((e && e.message) || body.message || ('HTTP ' + res.status));
          }
          return unwrap(body);
        });
      })
      .then(function (data) {
        var list = (data && data.items) || [];
        if (!list.length) return GROUPS['chu-de'].slice();
        GROUPS['chu-de'] = list.map(function (s) {
          return {
            id: s.slug || s.id,
            slug: s.slug || s.id,
            name: s.title,
            tickers: (s.stock_tags || []).slice(),
            status: s.status || 'active',
            lifecycle: '',
            normalizedStatus: 'mature',
            /* Owner 2026-10 (Phase 6) — Story hiển thị thẳng Like/Dislike/Comment/Share của
               Topic gốc (không còn "Đồng tình" riêng) — xem group-page.js renderHeader. */
            stats: s.stats || null
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

  global.IfluxWatchlistTaxonomy = {
    GROUPS: GROUPS,
    SOURCE_LABELS: SOURCE_LABELS,
    getGroups: getGroups,
    getGroup: getGroup,
    groupSlug: groupSlug,
    getGroupTickers: getGroupTickers,
    getTickerMemberships: getTickerMemberships,
    getGroupRank: getGroupRank,
    sourceLabel: sourceLabel,
    filterAvailable: filterAvailable,
    hydrateChuDeFromApi: hydrateChuDeFromApi,
    ensureMasterGroups: ensureMasterGroups,
    refreshMasterGroups: refreshMasterGroups
  };
})(window);
