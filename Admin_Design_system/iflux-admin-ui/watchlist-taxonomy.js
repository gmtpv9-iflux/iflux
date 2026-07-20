/* Phân loại CP — Ngành / Họ CP / Chủ đề (sandbox) */
(function (global) {
  'use strict';

  function familyGroups() {
    var seeds = global.IfluxMarketEcosystemSeeds;
    if (seeds && typeof seeds.list === 'function') return seeds.list();
    return [
      { id: 'vingroup', name: 'Họ Vingroup', tickers: ['VIC', 'VHM', 'VRE', 'VPL', 'VEF'] },
      { id: 'fpt', name: 'Họ FPT', tickers: ['FPT', 'FOX', 'FRT'] }
    ];
  }

  var GROUPS = {
    sector: [
      { id: '1', name: 'Ngân hàng', tickers: ['VCB', 'STB', 'TCB', 'MBB', 'ACB'] },
      { id: '2', name: 'Bất động sản', tickers: ['VHM', 'VIC', 'NVL', 'PDR', 'KDH'] },
      { id: '3', name: 'Công nghệ', tickers: ['FPT', 'CMG', 'ELC'] },
      { id: '4', name: 'Thép', tickers: ['HPG', 'HSG', 'NKG'] },
      { id: '5', name: 'Chứng khoán', tickers: ['SSI', 'VND', 'HCM', 'SHS', 'VCI'] },
      { id: '6', name: 'Bán lẻ', tickers: ['MWG', 'FRT', 'DGW'] }
    ],
    family: familyGroups(),
    story: [
      { id: 'chien-tranh-my-iran', name: 'Chiến tranh Mỹ - Iran', tickers: ['PVD', 'PVS', 'PLX', 'GAS', 'PVT'] },
      { id: 'dau-tu-cong', name: 'Đầu tư công', tickers: ['HPG', 'VCG', 'HHV', 'CII', 'PC1', 'NKG'] },
      { id: 'thoai-von-nn', name: 'Thoái vốn nhà nước', tickers: ['VNM', 'SAB', 'BVH', 'MSN', 'HPG'] },
      { id: 'my-ap-thue-quan', name: 'Mỹ áp thuế quan', tickers: ['VHC', 'ASM', 'GIL', 'KBC', 'SIP', 'IDC'] },
      { id: 'nang-hang-ftse', name: 'Nâng hạng thị trường FTSE', tickers: ['VCB', 'VHM', 'FPT', 'HPG', 'MWG', 'VIC'] },
      { id: 'giai-ngan-dau-tu-cong', name: 'Giải ngân đầu tư công', tickers: ['VCG', 'HHV', 'IDC', 'CII', 'HPG', 'NKG'] }
    ]
  };

  var SOURCE_LABELS = {
    sector: 'Ngành',
    family: 'Hệ sinh thái',
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
    return (GROUPS[source] || []).slice();
  }

  function getGroup(source, sourceId) {
    var groups = getGroups(source);
    for (var i = 0; i < groups.length; i++) {
      if (String(groups[i].id) === String(sourceId)) return groups[i];
    }
    return null;
  }

  function getGroupTickers(source, sourceId) {
    var group = getGroup(source, sourceId);
    if (!group) return [];
    return filterAvailable(group.tickers);
  }

  function sourceLabel(source) {
    return SOURCE_LABELS[source] || source;
  }

  function getTickerMemberships(ticker) {
    var t = (ticker || '').toUpperCase();
    var result = { sector: null, family: null, story: null };
    ['sector', 'family', 'story'].forEach(function (source) {
      getGroups(source).some(function (g) {
        if (g.tickers.indexOf(t) >= 0) {
          result[source] = { id: String(g.id), name: g.name };
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
    getGroupTickers: getGroupTickers,
    getTickerMemberships: getTickerMemberships,
    getGroupRank: getGroupRank,
    getTickerGroupRank: getTickerGroupRank,
    sourceLabel: sourceLabel,
    filterAvailable: filterAvailable
  };
})(window);
