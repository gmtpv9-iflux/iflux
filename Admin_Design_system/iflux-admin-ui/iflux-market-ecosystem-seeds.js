/* iFlux — danh mục họ cổ phiếu (chỉ mã đã niêm yết) */
(function (global) {
  'use strict';

  var CATALOG_VERSION = 1;

  /** @type {Array<{id:string,name:string,tickers:string[]}>} */
  var FAMILIES = [
    { id: 'vingroup', name: 'Họ Vingroup', tickers: ['VIC', 'VHM', 'VRE', 'VPL', 'VEF'] },
    { id: 'gelex', name: 'Họ GELEX', tickers: ['GEX', 'GEE', 'VGC', 'EIB'] },
    { id: 'masan', name: 'Họ Masan', tickers: ['MSN', 'MCH', 'MML', 'TCB'] },
    { id: 'hoaphat', name: 'Họ Hòa Phát', tickers: ['HPG', 'HRC'] },
    { id: 'fpt', name: 'Họ FPT', tickers: ['FPT', 'FOX', 'FRT'] },
    { id: 'sovico', name: 'Họ Sovico', tickers: ['HDB', 'VJC'] },
    { id: 'tt', name: 'Họ T&T', tickers: ['SHB', 'SHS', 'BSH', 'VNR'] },
    { id: 'bcg', name: 'Họ Bamboo Capital (BCG)', tickers: ['BCG', 'TCD', 'BCR', 'BGE'] },
    { id: 'louis', name: 'Họ Louis', tickers: ['TGG'] },
    { id: 'dnp', name: 'Họ DNP', tickers: ['DNP', 'NDN', 'DNW'] },
    { id: 'ree', name: 'Họ REE', tickers: ['REE', 'VSH', 'TMP', 'PPC'] },
    { id: 'viettel', name: 'Họ Viettel', tickers: ['CTR', 'VTK', 'VTP'] },
    { id: 'petrolimex', name: 'Họ Petrolimex', tickers: ['PLX', 'PGC', 'PLC', 'PIT'] },
    { id: 'pvn', name: 'Họ PVN (Dầu khí)', tickers: ['GAS', 'BSR', 'PVS', 'PVD', 'PVB', 'PVC', 'PVT', 'OIL', 'POW'] },
    { id: 'evn', name: 'Họ EVN', tickers: ['GEG', 'TV2', 'PGV'] },
    { id: 'vinachem', name: 'Họ Vinachem', tickers: ['DDV', 'CSV', 'DPR'] },
    { id: 'geleximco', name: 'Họ Geleximco', tickers: ['ABB', 'ABW', 'SHN'] },
    { id: 'ttc', name: 'Họ Thành Thành Công (TTC)', tickers: ['SBT', 'SCR', 'GEG', 'VNG'] },
    { id: 'tng', name: 'Họ TNG Holdings (ROX)', tickers: ['MSB', 'TNI', 'TNS'] },
    { id: 'tuanmuot', name: 'Họ Tuấn Mượt (Gelex/VIX)', tickers: ['GEX', 'VIX', 'VGC', 'EIB'] },
    { id: 'apec', name: 'Họ Apec', tickers: ['APS', 'API', 'IDJ'] },
    { id: 'anphat', name: 'Họ An Phát Holdings', tickers: ['APH', 'AAA', 'NHH', 'HII'] },
    { id: 'pc1', name: 'Họ PC1', tickers: ['PC1'] }
  ];

  var OBSOLETE_IDS = ['vin', 'hpg', 'tcb', 'mwg', 'ssi', 'vcb'];

  function list() {
    return FAMILIES.map(function (f) {
      return { id: f.id, name: f.name, tickers: f.tickers.slice() };
    });
  }

  function byId(id) {
    var key = String(id || '');
    var hit = null;
    FAMILIES.some(function (f) { if (f.id === key) { hit = f; return true; } return false; });
    return hit ? { id: hit.id, name: hit.name, tickers: hit.tickers.slice() } : null;
  }

  global.IfluxMarketEcosystemSeeds = {
    CATALOG_VERSION: CATALOG_VERSION,
    OBSOLETE_IDS: OBSOLETE_IDS,
    list: list,
    byId: byId
  };
})(window);
