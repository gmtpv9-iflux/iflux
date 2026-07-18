/* Kho Market Intelligence — sandbox localStorage (ADM-MKT, GĐ1) */
(function (global) {
  'use strict';

  var STORAGE_KEY = 'iflux_admin_market_registry_v2';
  var ECOSYSTEM_CATALOG_VERSION = 1;
  var OBSOLETE_ECOSYSTEM_IDS = ['vin', 'hpg', 'tcb', 'mwg', 'ssi', 'vcb'];
  var NOW = new Date().toISOString();

  var STOCK_NAMES = {
    HPG: 'Hòa Phát', VCB: 'Vietcombank', FPT: 'FPT', MWG: 'Thế Giới Di Động', VHM: 'Vinhomes',
    VIC: 'Vingroup', VND: 'VNDirect', STB: 'Sacombank', HCM: 'CK TP.HCM', SSI: 'SSI',
    TCB: 'Techcombank', MBB: 'MB Bank', ACB: 'ACB', NVL: 'Novaland', PDR: 'Phát Đạt', KDH: 'Khải Hoàn Land',
    CMG: 'CMC', ELC: 'ELCOM', HSG: 'Hoa Sen', NKG: 'Nam Kim', SHS: 'SHS', VCI: 'Viet Capital',
    FRT: 'FPT Retail', DGW: 'Digiworld', VRE: 'Vincom Retail', VPL: 'Vinpearl', FOX: 'FPT Telecom',
    FTS: 'FPT Software', TCX: 'Techcom Securities', BHX: 'Bách Hóa Xanh', VCG: 'Vinaconex', REE: 'REE'
  };

  var LOT_TIER_DEFAULTS = {
    large: 1000000000,
    mid: 500000000,
    small: 200000000
  };

  function isoNow() {
    return new Date().toISOString();
  }

  function normTicker(ticker) {
    return String(ticker || '').trim().toUpperCase();
  }

  function normId(id) {
    return String(id == null ? '' : id);
  }

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function getFamilySeeds() {
    var seeds = global.IfluxMarketEcosystemSeeds;
    if (seeds && typeof seeds.list === 'function') return seeds.list();
    return [
      { id: 'vingroup', name: 'Họ Vingroup', tickers: ['VIC', 'VHM', 'VRE', 'VPL', 'VEF'] },
      { id: 'fpt', name: 'Họ FPT', tickers: ['FPT', 'FOX', 'FRT'] }
    ];
  }

  function mergeEcosystemCatalog(store) {
    if (!store.ecosystems) store.ecosystems = [];
    store.ecosystems = store.ecosystems.filter(function (eco) {
      return OBSOLETE_ECOSYSTEM_IDS.indexOf(eco.id) < 0;
    });
    getFamilySeeds().forEach(function (seed) {
      var idx = findIndexById(store.ecosystems, seed.id);
      if (idx < 0) {
        store.ecosystems.push({
          id: seed.id,
          name: seed.name,
          tickers: seed.tickers.slice(),
          divisor: seed.tickers.length,
          status: 'active',
          updatedAt: isoNow()
        });
        return;
      }
      var row = store.ecosystems[idx];
      row.name = seed.name;
      var merged = (row.tickers || []).slice();
      seed.tickers.forEach(function (tk) {
        if (merged.indexOf(tk) < 0) merged.push(tk);
      });
      row.tickers = merged;
      row.divisor = merged.length;
      row.updatedAt = isoNow();
    });
    store.ecosystemCatalogVersion = ECOSYSTEM_CATALOG_VERSION;
    return store;
  }

  function buildSeed() {
    var real = global.IfluxMarketSeedData;
    var sectors = [
      { id: '1', name: 'Ngân hàng', divisor: 5, status: 'active', updatedAt: NOW },
      { id: '2', name: 'BĐS', divisor: 6, status: 'active', updatedAt: NOW },
      { id: '3', name: 'Công nghệ', divisor: 7, status: 'active', updatedAt: NOW },
      { id: '4', name: 'Thép', divisor: 8, status: 'active', updatedAt: NOW },
      { id: '5', name: 'Chứng khoán', divisor: 10, status: 'active', updatedAt: NOW },
      { id: '6', name: 'Bán lẻ', divisor: 12, status: 'active', updatedAt: NOW }
    ];

    var familySeeds = getFamilySeeds();

    var ecosystems = familySeeds.map(function (f) {
      return {
        id: f.id,
        name: f.name,
        tickers: f.tickers.slice(),
        divisor: f.tickers.length,
        status: 'active',
        updatedAt: NOW
      };
    });

    var stockMeta = {
      HPG: { sectorId: '4', capTier: 'large', exchange: 'HSX' },
      VCB: { sectorId: '1', capTier: 'large', exchange: 'HSX' },
      FPT: { sectorId: '3', capTier: 'large', exchange: 'HSX' },
      MWG: { sectorId: '6', capTier: 'large', exchange: 'HSX' },
      VHM: { sectorId: '2', capTier: 'large', exchange: 'HSX' },
      VIC: { sectorId: '2', capTier: 'large', exchange: 'HSX' },
      VND: { sectorId: '5', capTier: 'mid', exchange: 'HSX' },
      STB: { sectorId: '1', capTier: 'mid', exchange: 'HSX' },
      HCM: { sectorId: '5', capTier: 'mid', exchange: 'HSX' },
      SSI: { sectorId: '5', capTier: 'mid', exchange: 'HSX' },
      TCB: { sectorId: '1', capTier: 'large', exchange: 'HSX' },
      MBB: { sectorId: '1', capTier: 'large', exchange: 'HSX' },
      ACB: { sectorId: '1', capTier: 'mid', exchange: 'HSX' },
      NVL: { sectorId: '2', capTier: 'mid', exchange: 'HSX' },
      PDR: { sectorId: '2', capTier: 'mid', exchange: 'HSX' },
      KDH: { sectorId: '2', capTier: 'mid', exchange: 'HSX' },
      CMG: { sectorId: '3', capTier: 'mid', exchange: 'HSX' },
      ELC: { sectorId: '3', capTier: 'small', exchange: 'HSX' },
      HSG: { sectorId: '4', capTier: 'mid', exchange: 'HSX' },
      NKG: { sectorId: '4', capTier: 'small', exchange: 'HNX' },
      SHS: { sectorId: '5', capTier: 'small', exchange: 'HNX' },
      VCI: { sectorId: '5', capTier: 'mid', exchange: 'HSX' },
      FRT: { sectorId: '6', capTier: 'mid', exchange: 'HSX' },
      DGW: { sectorId: '6', capTier: 'mid', exchange: 'HSX' },
      VRE: { sectorId: '6', capTier: 'mid', exchange: 'HSX' },
      VPL: { sectorId: '2', capTier: 'mid', exchange: 'HSX' },
      FOX: { sectorId: '3', capTier: 'mid', exchange: 'HSX' },
      FTS: { sectorId: '3', capTier: 'mid', exchange: 'HSX' },
      TCX: { sectorId: '5', capTier: 'small', exchange: 'HNX' },
      BHX: { sectorId: '6', capTier: 'mid', exchange: 'HSX' },
      VCG: { sectorId: '2', capTier: 'mid', exchange: 'HSX' },
      REE: { sectorId: '2', capTier: 'mid', exchange: 'HSX' }
    };

    var tickers = [
      'HPG', 'VCB', 'FPT', 'MWG', 'VHM', 'VIC', 'VND', 'STB', 'HCM', 'SSI',
      'TCB', 'MBB', 'ACB', 'NVL', 'PDR', 'KDH', 'CMG', 'ELC', 'HSG', 'NKG',
      'SHS', 'VCI', 'FRT', 'DGW', 'VRE', 'VPL', 'FOX', 'FTS', 'TCX', 'BHX', 'VCG', 'REE'
    ];

    var stocks = tickers.map(function (tk) {
      var meta = stockMeta[tk] || { sectorId: '3', capTier: 'mid', exchange: 'HSX' };
      return {
        ticker: tk,
        name: STOCK_NAMES[tk] || tk,
        exchange: meta.exchange,
        sectorId: meta.sectorId,
        capTier: meta.capTier,
        lotThreshold: LOT_TIER_DEFAULTS[meta.capTier] || LOT_TIER_DEFAULTS.mid,
        status: 'active',
        updatedAt: NOW
      };
    });

    var rankingConfig = {
      weights: {
        performance: { pg: 40, flow: 35, volume: 25 }
      },
      lookbackDays: 7,
      flowLookback: 5,
      minLiquidity: 500000000,
      sectorTopN: 10,
      updatedAt: NOW
    };

    var formulas = [
      {
        key: 'money_flow_score',
        name: 'Money Flow Score',
        version: '1.2.0',
        status: 'active',
        category: 'flow',
        description: 'Đo lường cường độ dòng tiền vào/ra theo 4 chủ thể (tổ chức, cá nhân, khối ngoại, tự doanh).',
        formulaText: 'MFS = w1*active_buy_ratio + w2*net_foreign_norm + w3*net_retail_norm + w4*proprietary_norm',
        updatedBy: 'Admin',
        updatedAt: NOW
      },
      {
        key: 'sector_pg',
        name: 'Sector Performance Grade',
        version: '1.0.1',
        status: 'active',
        category: 'sector',
        description: 'Điểm xếp hạng ngành (PG) dựa trên hiệu suất trung bình có trọng số vốn hóa.',
        formulaText: 'PG_sector = SUM(cap_weight_i * return_i) / divisor_sector',
        updatedBy: 'Admin',
        updatedAt: NOW
      },
      {
        key: 'ecosystem_ig',
        name: 'Ecosystem Index Grade (Ig)',
        version: '1.1.0',
        status: 'active',
        category: 'ecosystem',
        description: 'Chỉ số Ig của họ cổ phiếu — trung bình hiệu suất thành viên chia cho divisor.',
        formulaText: 'Ig = SUM(member_return_i) / MAX(divisor, member_count)',
        updatedBy: 'Admin',
        updatedAt: NOW
      },
      {
        key: 'ranking_performance',
        name: 'Ranking Performance Composite',
        version: '2.0.0',
        status: 'active',
        category: 'ranking',
        description: 'Điểm tổng hợp xếp hạng cổ phiếu theo PG, dòng tiền và thanh khoản.',
        formulaText: 'RANK = 0.40*PG_norm + 0.35*FLOW_norm + 0.25*VOL_norm',
        updatedBy: 'Admin',
        updatedAt: NOW
      },
      {
        key: 'large_lot_detect',
        name: 'Large Lot Detection',
        version: '1.0.0',
        status: 'draft',
        category: 'lot',
        description: 'Phát hiện lệnh lô lớn khi giá trị giao dịch vượt ngưỡng theo cap tier hoặc override từng mã.',
        formulaText: 'is_large_lot = trade_value >= COALESCE(stock.lotThreshold, lotTiers[capTier])',
        updatedBy: 'Admin',
        updatedAt: NOW
      }
    ];

    var seededSectors = sectors;
    var seededStocks = stocks;

    if (real && Array.isArray(real.sectors) && real.sectors.length && Array.isArray(real.stocks) && real.stocks.length) {
      seededSectors = real.sectors.map(function (s) {
        return {
          id: normId(s.id),
          name: s.name,
          divisor: s.divisor != null ? s.divisor : 5,
          status: s.status || 'active',
          updatedAt: NOW
        };
      });
      seededStocks = real.stocks.map(function (s) {
        var tier = s.capTier || 'mid';
        return {
          ticker: normTicker(s.ticker),
          name: s.name || s.ticker,
          exchange: s.exchange || 'UPCOM',
          sectorId: normId(s.sectorId),
          capTier: tier,
          lotThreshold: s.lotThreshold != null ? s.lotThreshold : (LOT_TIER_DEFAULTS[tier] || LOT_TIER_DEFAULTS.mid),
          status: s.status || 'active',
          updatedAt: NOW
        };
      });
    }

    return {
      sectors: seededSectors,
      ecosystems: ecosystems,
      stocks: seededStocks,
      lotTiers: clone(LOT_TIER_DEFAULTS),
      lotOverrides: {},
      rankingConfig: rankingConfig,
      formulas: formulas,
      ecosystemCatalogVersion: ECOSYSTEM_CATALOG_VERSION
    };
  }

  function readRaw() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function writeRaw(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function load() {
    var data = readRaw();
    if (!data || !data.stocks || !data.sectors) {
      data = buildSeed();
      writeRaw(data);
      return data;
    }
    if ((data.ecosystemCatalogVersion || 0) < ECOSYSTEM_CATALOG_VERSION) {
      data = mergeEcosystemCatalog(data);
      save(data);
    }
    return data;
  }

  function save(data) {
    writeRaw(data);
    return data;
  }

  function findIndexById(list, id, idField) {
    idField = idField || 'id';
    var key = normId(id);
    var i;
    for (i = 0; i < list.length; i++) {
      if (normId(list[i][idField]) === key) return i;
    }
    return -1;
  }

  function findStockIndex(data, ticker) {
    var tk = normTicker(ticker);
    var i;
    for (i = 0; i < data.stocks.length; i++) {
      if (normTicker(data.stocks[i].ticker) === tk) return i;
    }
    return -1;
  }

  function matchesStockFilters(stock, filters) {
    if (!filters) return true;
    if (filters.exchange && stock.exchange !== filters.exchange) return false;
    if (filters.sectorId != null && normId(stock.sectorId) !== normId(filters.sectorId)) return false;
    if (filters.capTier && stock.capTier !== filters.capTier) return false;
    if (filters.status && stock.status !== filters.status) return false;
    if (filters.q) {
      var q = String(filters.q).trim().toLowerCase();
      if (q && stock.ticker.toLowerCase().indexOf(q) < 0 && (stock.name || '').toLowerCase().indexOf(q) < 0) {
        return false;
      }
    }
    return true;
  }

  function mockIg(tickers) {
    var list = tickers || [];
    if (!list.length) return 0;
    var sum = 0;
    var i;
    for (i = 0; i < list.length; i++) {
      var h = 0;
      var s = normTicker(list[i]);
      var j;
      for (j = 0; j < s.length; j++) h = ((h << 5) - h) + s.charCodeAt(j);
      sum += 8 + (Math.abs(h) % 120) / 10;
    }
    return Math.round((sum / list.length) * 100) / 100;
  }

  function listStocks(filters) {
    var data = load();
    return data.stocks.filter(function (s) {
      return matchesStockFilters(s, filters);
    }).map(clone);
  }

  function getStock(ticker) {
    var data = load();
    var idx = findStockIndex(data, ticker);
    return idx >= 0 ? clone(data.stocks[idx]) : null;
  }

  function updateStock(ticker, patch) {
    var data = load();
    var idx = findStockIndex(data, ticker);
    if (idx < 0) return null;
    var next = Object.assign({}, data.stocks[idx], patch || {}, {
      ticker: data.stocks[idx].ticker,
      updatedAt: isoNow()
    });
    data.stocks[idx] = next;
    save(data);
    return clone(next);
  }

  function archiveStock(ticker) {
    return updateStock(ticker, { status: 'archived' });
  }

  function listSectors() {
    return load().sectors.map(clone);
  }

  function getSector(id) {
    var data = load();
    var idx = findIndexById(data.sectors, id);
    return idx >= 0 ? clone(data.sectors[idx]) : null;
  }

  function upsertSector(data) {
    if (!data) return null;
    var store = load();
    var id = normId(data.id);
    if (!id) return null;
    var idx = findIndexById(store.sectors, id);
    var row = Object.assign({}, idx >= 0 ? store.sectors[idx] : {}, data, {
      id: id,
      updatedAt: isoNow()
    });
    if (idx >= 0) {
      store.sectors[idx] = row;
    } else {
      store.sectors.push(row);
    }
    save(store);
    return clone(row);
  }

  function toggleSector(id) {
    var store = load();
    var idx = findIndexById(store.sectors, id);
    if (idx < 0) return null;
    store.sectors[idx].status = store.sectors[idx].status === 'active' ? 'inactive' : 'active';
    store.sectors[idx].updatedAt = isoNow();
    save(store);
    return clone(store.sectors[idx]);
  }

  function listEcosystems() {
    return load().ecosystems.map(clone);
  }

  function getEcosystem(id) {
    var data = load();
    var idx = findIndexById(data.ecosystems, id);
    return idx >= 0 ? clone(data.ecosystems[idx]) : null;
  }

  function upsertEcosystem(data) {
    if (!data) return null;
    var store = load();
    var id = normId(data.id);
    if (!id) return null;
    var idx = findIndexById(store.ecosystems, id);
    var tickers = (data.tickers || (idx >= 0 ? store.ecosystems[idx].tickers : [])).map(normTicker);
    var row = Object.assign({}, idx >= 0 ? store.ecosystems[idx] : {}, data, {
      id: id,
      tickers: tickers,
      divisor: data.divisor != null ? data.divisor : tickers.length,
      updatedAt: isoNow()
    });
    if (idx >= 0) {
      store.ecosystems[idx] = row;
    } else {
      store.ecosystems.push(row);
    }
    save(store);
    return clone(row);
  }

  function toggleEcosystem(id) {
    var store = load();
    var idx = findIndexById(store.ecosystems, id);
    if (idx < 0) return null;
    store.ecosystems[idx].status = store.ecosystems[idx].status === 'active' ? 'inactive' : 'active';
    store.ecosystems[idx].updatedAt = isoNow();
    save(store);
    return clone(store.ecosystems[idx]);
  }

  function previewEcosystemIg(id, tickers) {
    var eco = getEcosystem(id);
    if (!eco) return null;
    var before = (eco.tickers || []).map(normTicker);
    var after = (tickers || before).map(normTicker);
    var igBefore = mockIg(before);
    var igAfter = mockIg(after);
    var divisorNew = after.length || 1;
    var changePct = igBefore === 0
      ? 0
      : Math.round(((igAfter - igBefore) / igBefore) * 10000) / 100;
    return {
      igBefore: igBefore,
      igAfter: igAfter,
      divisorNew: divisorNew,
      changePct: changePct
    };
  }

  function getLotTiers() {
    return clone(load().lotTiers);
  }

  function setLotTiers(patch) {
    var store = load();
    store.lotTiers = Object.assign({}, store.lotTiers, patch || {});
    save(store);
    return clone(store.lotTiers);
  }

  function listLotOverrides() {
    var data = load();
    var out = [];
    Object.keys(data.lotOverrides || {}).forEach(function (tk) {
      out.push({ ticker: tk, lotThreshold: data.lotOverrides[tk] });
    });
    return out;
  }

  function setStockLotThreshold(ticker, value) {
    var tk = normTicker(ticker);
    if (!tk) return null;
    var store = load();
    if (!store.lotOverrides) store.lotOverrides = {};
    store.lotOverrides[tk] = Number(value);
    var idx = findStockIndex(store, tk);
    if (idx >= 0) {
      store.stocks[idx].lotThreshold = Number(value);
      store.stocks[idx].updatedAt = isoNow();
    }
    save(store);
    return { ticker: tk, lotThreshold: Number(value) };
  }

  function getRankingConfig() {
    return clone(load().rankingConfig);
  }

  function saveRankingConfig(patch) {
    var store = load();
    store.rankingConfig = Object.assign({}, store.rankingConfig, patch || {}, { updatedAt: isoNow() });
    if (patch && patch.weights) {
      store.rankingConfig.weights = Object.assign(
        {},
        store.rankingConfig.weights,
        patch.weights
      );
      if (patch.weights.performance) {
        store.rankingConfig.weights.performance = Object.assign(
          {},
          store.rankingConfig.weights.performance,
          patch.weights.performance
        );
      }
    }
    save(store);
    return clone(store.rankingConfig);
  }

  function matchesFormulaFilters(formula, filters) {
    if (!filters) return true;
    if (filters.status && formula.status !== filters.status) return false;
    if (filters.category && formula.category !== filters.category) return false;
    if (filters.q) {
      var q = String(filters.q).trim().toLowerCase();
      if (q && formula.key.toLowerCase().indexOf(q) < 0 && (formula.name || '').toLowerCase().indexOf(q) < 0) {
        return false;
      }
    }
    return true;
  }

  function listFormulas(filters) {
    return load().formulas.filter(function (f) {
      return matchesFormulaFilters(f, filters);
    }).map(clone);
  }

  function getFormula(key) {
    var data = load();
    var k = String(key || '').trim();
    var i;
    for (i = 0; i < data.formulas.length; i++) {
      if (data.formulas[i].key === k) return clone(data.formulas[i]);
    }
    return null;
  }

  function upsertFormula(data) {
    if (!data || !data.key) return null;
    var store = load();
    var key = String(data.key).trim();
    var idx = -1;
    var i;
    for (i = 0; i < store.formulas.length; i++) {
      if (store.formulas[i].key === key) { idx = i; break; }
    }
    var row = Object.assign({}, idx >= 0 ? store.formulas[idx] : {}, data, {
      key: key,
      updatedBy: data.updatedBy || 'Admin',
      updatedAt: isoNow()
    });
    if (idx >= 0) {
      store.formulas[idx] = row;
    } else {
      store.formulas.push(row);
    }
    save(store);
    return clone(row);
  }

  function setFormulaActive(key) {
    var store = load();
    var k = String(key || '').trim();
    var idx = -1;
    var i;
    for (i = 0; i < store.formulas.length; i++) {
      if (store.formulas[i].key === k) { idx = i; break; }
    }
    if (idx < 0) return null;
    store.formulas[idx].status = 'active';
    store.formulas[idx].updatedAt = isoNow();
    store.formulas[idx].updatedBy = 'Admin';
    save(store);
    return clone(store.formulas[idx]);
  }

  global.IfluxMarketRegistryStore = {
    STORAGE_KEY: STORAGE_KEY,
    load: load,
    save: save,
    listStocks: listStocks,
    getStock: getStock,
    updateStock: updateStock,
    archiveStock: archiveStock,
    listSectors: listSectors,
    getSector: getSector,
    upsertSector: upsertSector,
    toggleSector: toggleSector,
    listEcosystems: listEcosystems,
    getEcosystem: getEcosystem,
    upsertEcosystem: upsertEcosystem,
    toggleEcosystem: toggleEcosystem,
    previewEcosystemIg: previewEcosystemIg,
    getLotTiers: getLotTiers,
    setLotTiers: setLotTiers,
    listLotOverrides: listLotOverrides,
    setStockLotThreshold: setStockLotThreshold,
    getRankingConfig: getRankingConfig,
    saveRankingConfig: saveRankingConfig,
    listFormulas: listFormulas,
    getFormula: getFormula,
    upsertFormula: upsertFormula,
    setFormulaActive: setFormulaActive
  };
})(window);
