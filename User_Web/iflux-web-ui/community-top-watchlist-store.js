/* Top Watchlist thị trường — mock portfolios + hiệu suất theo kỳ (sandbox) */
(function (global) {
  'use strict';

  var PERIODS = {
    t2: { label: 'T+2', days: 3 },
    week: { label: 'Tuần', days: 7 },
    month: { label: 'Tháng', days: 30 },
    quarter: { label: 'Quý', days: 92 },
    year: { label: 'Năm', days: 365 }
  };

  var LEADERBOARDS = [
    {
      userId: 'usr_elite_01',
      displayName: 'Trần Minh Khôi',
      initials: 'TK',
      avatarCls: 'ix-avatar-accent',
      tier: 'elite',
      items: [
        { ticker: 'HPG', added_at: '2024-08-12' },
        { ticker: 'FPT', added_at: '2024-06-01' },
        { ticker: 'VCB', added_at: '2025-01-20' },
        { ticker: 'MWG', added_at: '2024-11-05' }
      ]
    },
    {
      userId: 'usr_demo_001',
      displayName: 'Nguyễn Văn Minh',
      initials: 'NM',
      avatarCls: 'ix-avatar-success',
      tier: 'premium',
      items: [
        { ticker: 'FPT', added_at: '2024-09-10' },
        { ticker: 'HPG', added_at: '2025-02-01' },
        { ticker: 'SSI', added_at: '2024-12-15' }
      ]
    },
    {
      userId: 'usr_elite_02',
      displayName: 'Lê Thảo An',
      initials: 'LA',
      avatarCls: 'ix-avatar-warning',
      tier: 'elite',
      items: [
        { ticker: 'VHM', added_at: '2024-05-18' },
        { ticker: 'VIC', added_at: '2024-07-22' },
        { ticker: 'STB', added_at: '2025-03-08' },
        { ticker: 'VND', added_at: '2024-10-30' },
        { ticker: 'HCM', added_at: '2025-01-12' }
      ]
    },
    {
      userId: 'usr_elite_03',
      displayName: 'Phạm Hoàng Long',
      initials: 'PL',
      avatarCls: 'ix-avatar-info',
      tier: 'elite',
      items: [
        { ticker: 'MWG', added_at: '2024-04-02' },
        { ticker: 'FPT', added_at: '2024-04-02' },
        { ticker: 'HPG', added_at: '2024-12-20' }
      ]
    },
    {
      userId: 'usr_elite_04',
      displayName: 'Võ Thị Mai',
      initials: 'VM',
      avatarCls: 'ix-avatar-danger',
      tier: 'elite',
      items: [
        { ticker: 'VCB', added_at: '2023-11-01' },
        { ticker: 'SSI', added_at: '2024-02-14' },
        { ticker: 'FPT', added_at: '2024-08-01' },
        { ticker: 'HPG', added_at: '2025-04-01' }
      ]
    }
  ];

  function hashStr(s) {
    var h = 0;
    var i;
    for (i = 0; i < s.length; i++) h = ((h << 5) - h) + s.charCodeAt(i) | 0;
    return Math.abs(h);
  }

  function periodWindowStart(periodKey) {
    var p = PERIODS[periodKey] || PERIODS.month;
    var d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - p.days);
    return d;
  }

  function tickerReturnSinceAdd(ticker, addedAt, windowStart, userId) {
    var mk = global.IfluxMockMarket;
    var stock = mk ? mk.getStock(ticker) : null;
    if (!stock || stock.price == null) return null;

    var added = new Date(addedAt);
    var start = added.getTime() > windowStart.getTime() ? added : windowStart;
    var days = (Date.now() - start.getTime()) / 86400000;
    if (days < 0.5) return null;

    var h = hashStr(userId + ':' + ticker + ':' + addedAt);
    var bias = ((h % 280) / 10) - 8;
    var dailyDrift = ((stock.change_pct || 0) / 100) * 0.35 + bias / 365;
    var ret = (Math.pow(1 + dailyDrift, days) - 1) * 100;
    return Math.round(ret * 100) / 100;
  }

  function portfolioPerformance(entry, periodKey) {
    var windowStart = periodWindowStart(periodKey);
    var sum = 0;
    var n = 0;
    entry.items.forEach(function (item) {
      var r = tickerReturnSinceAdd(item.ticker, item.added_at, windowStart, entry.userId);
      if (r != null) {
        sum += r;
        n += 1;
      }
    });
    if (!n) return null;
    return Math.round((sum / n) * 100) / 100;
  }

  function getTickers(entry) {
    return entry.items.map(function (i) { return i.ticker; });
  }

  function listRanked(periodKey) {
    periodKey = periodKey || 'month';
    return LEADERBOARDS.map(function (entry) {
      return {
        userId: entry.userId,
        displayName: entry.displayName,
        initials: entry.initials,
        avatarCls: entry.avatarCls,
        tier: entry.tier,
        tickers: getTickers(entry),
        stockCount: entry.items.length,
        performance: portfolioPerformance(entry, periodKey)
      };
    }).filter(function (row) {
      return row.performance != null;
    }).sort(function (a, b) {
      return b.performance - a.performance;
    });
  }

  function getEntry(userId) {
    return LEADERBOARDS.find(function (e) { return e.userId === userId; }) || null;
  }

  global.IfluxCommunityTopWatchlistStore = {
    PERIODS: PERIODS,
    listRanked: listRanked,
    getEntry: getEntry,
    getTickers: getTickers
  };
})(window);
