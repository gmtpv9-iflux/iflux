/* Sandbox market snapshot — shape mirror 09 §2.1 */
(function (global) {
  'use strict';

  /* Tên ngắn — UI / chip. */
  var STOCK_NAMES = {
    HPG: 'Hòa Phát', VCB: 'Vietcombank', FPT: 'FPT', MWG: 'Thế Giới Di Động', VHM: 'Vinhomes',
    VIC: 'Vingroup', VND: 'VNDirect', STB: 'Sacombank', HCM: 'CK TP.HCM', SSI: 'SSI',
    TCB: 'Techcombank', MBB: 'MB Bank', ACB: 'ACB', NVL: 'Novaland', PDR: 'Phát Đạt', KDH: 'Khải Hoàn Land',
    CMG: 'CMC', ELC: 'ELCOM', HSG: 'Hoa Sen', NKG: 'Nam Kim', SHS: 'SHS', VCI: 'Viet Capital',
    FRT: 'FPT Retail', DGW: 'Digiworld', VRE: 'Vincom Retail', VPL: 'Vinpearl', FOX: 'FPT Telecom',
    FTS: 'FPT Software', TCX: 'Techcom Securities', BHX: 'Bách Hóa Xanh', VCG: 'Vinaconex', REE: 'REE',
    SHB: 'SHB'
  };

  /* Tên pháp lý / thương mại đầy đủ — document.title kiểu FireAnt. */
  var STOCK_LEGAL_NAMES = {
    HPG: 'Công ty Cổ phần Tập đoàn Hòa Phát',
    SHB: 'Ngân hàng TMCP Sài Gòn - Hà Nội',
    VCB: 'Ngân hàng TMCP Ngoại Thương Việt Nam',
    FPT: 'Công ty Cổ phần FPT',
    MWG: 'Công ty Cổ phần Đầu tư Thế Giới Di Động',
    VHM: 'Công ty Cổ phần Vinhomes',
    VIC: 'Tập đoàn Vingroup',
    VND: 'Công ty Cổ phần Chứng khoán VNDirect',
    STB: 'Ngân hàng TMCP Sài Gòn Thương Tín',
    HCM: 'Công ty Cổ phần Chứng khoán TP.HCM',
    SSI: 'Công ty Cổ phần Chứng khoán SSI',
    TCB: 'Ngân hàng TMCP Kỹ Thương Việt Nam',
    MBB: 'Ngân hàng TMCP Quân Đội',
    ACB: 'Ngân hàng TMCP Á Châu',
    NVL: 'Công ty Cổ phần Tập đoàn Đầu tư Địa ốc No Va',
    PDR: 'Công ty Cổ phần Phát triển Bất động sản Phát Đạt',
    KDH: 'Công ty Cổ phần Đầu tư và Kinh doanh Nhà Khang Điền',
    CMG: 'Công ty Cổ phần Tập đoàn Công nghệ CMC',
    ELC: 'Công ty Cổ phần Đầu tư Phát triển Công nghệ và Truyền thông',
    HSG: 'Công ty Cổ phần Tập đoàn Hoa Sen',
    NKG: 'Công ty Cổ phần Thép Nam Kim',
    SHS: 'Công ty Cổ phần Chứng khoán Sài Gòn - Hà Nội',
    VCI: 'Công ty Cổ phần Chứng khoán Vietcap',
    FRT: 'Công ty Cổ phần Bán lẻ Kỹ thuật số FPT',
    DGW: 'Công ty Cổ phần Thế Giới Số',
    VRE: 'Công ty Cổ phần Vincom Retail',
    VPL: 'Công ty Cổ phần Vinpearl',
    FOX: 'Công ty Cổ phần Viễn thông FPT',
    FTS: 'Công ty TNHH Phần mềm FPT',
    TCX: 'Công ty Cổ phần Chứng khoán Techcom',
    BHX: 'Công ty Cổ phần Bách Hóa Xanh',
    VCG: 'Tổng Công ty Cổ phần Xuất nhập khẩu và Xây dựng Việt Nam',
    REE: 'Công ty Cổ phần Cơ Điện Lạnh'
  };

  function buildStock(ticker, overrides) {
    overrides = overrides || {};
    var h = hashStr(ticker);
    var price = overrides.price != null ? overrides.price : Math.round((12 + (h % 220) + (h % 17) * 0.37) * 100) / 100;
    var changePct = overrides.change_pct != null ? overrides.change_pct : Math.round(((h % 130) - 65) / 10 * 100) / 100;
    var cap = overrides.market_cap != null ? overrides.market_cap : 35000 + (h % 450000);
    var volM = (0.4 + (h % 18) * 0.35).toFixed(1);
    var shortLabel = overrides.short_name || STOCK_NAMES[ticker] || ticker;
    return {
      ticker: ticker,
      name: overrides.name || STOCK_LEGAL_NAMES[ticker] || STOCK_NAMES[ticker] || ticker,
      short_name: String(shortLabel).toUpperCase(),
      exchange: overrides.exchange || (h % 5 === 0 ? 'HNX' : 'HSX'),
      price: price,
      change_pct: changePct,
      volume: overrides.volume || (volM + 'M'),
      market_cap: cap,
      ts: new Date().toISOString()
    };
  }

  /** Bộ mã đầy đủ — khớp taxonomy Ngành / Họ / Chủ đề để test tính toán */
  function buildStockCatalog() {
    var seeds = {
      HPG: { price: 28.45, change_pct: 2.57, market_cap: 210000, volume: '12.4M' },
      VCB: { price: 92.1, change_pct: 1.82, market_cap: 295000, volume: '3.2M' },
      FPT: { price: 128.5, change_pct: 1.45, market_cap: 185000, volume: '1.8M' },
      MWG: { price: 71.2, change_pct: 0.98, market_cap: 155000, volume: '2.1M' },
      VHM: { price: 42.8, change_pct: 0.71, market_cap: 320000, volume: '4.5M' },
      VIC: { price: 38.2, change_pct: -1.24, market_cap: 480000, volume: '8.1M' },
      VND: { price: 22.15, change_pct: -1.89, market_cap: 68000, volume: '5.6M' },
      STB: { price: 34.6, change_pct: -2.12, market_cap: 92000, volume: '3.9M' },
      HCM: { price: 18.4, change_pct: -2.45, market_cap: 42000, volume: '1.2M' },
      SSI: { price: 29.7, change_pct: -3.01, market_cap: 98000, volume: '6.3M' },
      TCB: { price: 28.9, change_pct: 2.15, market_cap: 175000, volume: '4.8M' },
      MBB: { price: 24.3, change_pct: 1.62, market_cap: 142000, volume: '5.1M' },
      ACB: { price: 26.8, change_pct: 0.88, market_cap: 118000, volume: '2.7M' },
      NVL: { price: 14.2, change_pct: -0.95, market_cap: 88000, volume: '6.8M' },
      PDR: { price: 19.5, change_pct: 1.12, market_cap: 52000, volume: '3.4M' },
      KDH: { price: 21.8, change_pct: 0.45, market_cap: 48000, volume: '1.9M' },
      CMG: { price: 42.5, change_pct: 3.25, market_cap: 45000, volume: '0.9M' },
      ELC: { price: 15.6, change_pct: 2.88, market_cap: 28000, volume: '1.1M' },
      HSG: { price: 16.9, change_pct: 1.95, market_cap: 62000, volume: '4.2M' },
      NKG: { price: 18.2, change_pct: 0.62, market_cap: 38000, volume: '2.3M' },
      SHS: { price: 12.4, change_pct: -1.55, market_cap: 22000, volume: '2.8M' },
      VCI: { price: 31.5, change_pct: -0.72, market_cap: 35000, volume: '1.6M' },
      FRT: { price: 48.2, change_pct: 0.35, market_cap: 72000, volume: '0.7M' },
      DGW: { price: 38.7, change_pct: -0.48, market_cap: 41000, volume: '0.5M' },
      VRE: { price: 28.1, change_pct: 0.92, market_cap: 95000, volume: '1.4M' },
      VPL: { price: 52.0, change_pct: -0.35, market_cap: 78000, volume: '0.3M' },
      FOX: { price: 88.5, change_pct: 1.08, market_cap: 65000, volume: '0.4M' },
      FTS: { price: 45.2, change_pct: 1.75, market_cap: 55000, volume: '0.6M' },
      TCX: { price: 11.8, change_pct: 0.22, market_cap: 18000, volume: '0.8M' },
      BHX: { price: 15.2, change_pct: 0.18, market_cap: 85000, volume: '0.2M' },
      VCG: { price: 24.6, change_pct: 0.58, market_cap: 32000, volume: '1.0M' },
      REE: { price: 62.3, change_pct: -0.82, market_cap: 58000, volume: '0.9M' }
    };
    var tickers = [
      'HPG', 'VCB', 'FPT', 'MWG', 'VHM', 'VIC', 'VND', 'STB', 'HCM', 'SSI',
      'TCB', 'MBB', 'ACB', 'NVL', 'PDR', 'KDH', 'CMG', 'ELC', 'HSG', 'NKG',
      'SHS', 'VCI', 'FRT', 'DGW', 'VRE', 'VPL', 'FOX', 'FTS', 'TCX', 'VCG', 'REE', 'BHX'
    ];
    var stocks = {};

    /* Ưu tiên danh sách cổ phiếu THẬT từ Admin registry (map Admin ↔ User Web) */
    var reg = registryStocks();
    if (reg && reg.length) {
      reg.forEach(function (s) {
        var tk = String(s.ticker || '').trim().toUpperCase();
        if (!tk) return;
        stocks[tk] = buildStock(tk, Object.assign({
          name: s.name,
          exchange: normalizeExchange(s.exchange)
        }, seeds[tk] || {}));
      });
      if (Object.keys(stocks).length) return stocks;
    }

    tickers.forEach(function (tk) {
      stocks[tk] = buildStock(tk, seeds[tk] || {});
    });
    return stocks;
  }

  /* Đọc danh sách cổ phiếu đang hoạt động từ Admin registry (localStorage dùng chung) */
  function registryStocks() {
    var reg = global.IfluxMarketRegistryStore;
    if (!reg || typeof reg.listStocks !== 'function') return null;
    try {
      var list = reg.listStocks({ status: 'active' });
      return (list && list.length) ? list : null;
    } catch (e) { return null; }
  }

  /* Chuẩn hoá mã sàn của Admin (HOSE) về khoá nội bộ (HSX) để khớp tab sàn */
  function normalizeExchange(ex) {
    var v = String(ex || '').trim().toUpperCase();
    if (v === 'HOSE' || v === 'HSX') return 'HSX';
    if (v === 'HNX') return 'HNX';
    if (v === 'UPCOM' || v === 'UPCOM') return 'UPCOM';
    return v || 'HSX';
  }

  /* Danh sách ngành THẬT từ Admin registry — giữ shape snapshot cũ */
  function buildSectorSnapshot() {
    var fallback = {
      1: { id: 1, name: 'Ngân hàng', rank: 1, ig: 1.24, pg: 0.42, breadth_up: 18, breadth_down: 4, ts: '' },
      2: { id: 2, name: 'Bất động sản', rank: 2, ig: 0.88, pg: 0.31, breadth_up: 12, breadth_down: 9, ts: '' },
      3: { id: 3, name: 'Công nghệ', rank: 3, ig: 0.76, pg: 0.28, breadth_up: 8, breadth_down: 3, ts: '' },
      4: { id: 4, name: 'Thép', rank: 5, ig: -0.42, pg: -0.18, breadth_up: 2, breadth_down: 6, ts: '' },
      5: { id: 5, name: 'Chứng khoán', rank: 4, ig: 0.55, pg: 0.19, breadth_up: 7, breadth_down: 5, ts: '' },
      6: { id: 6, name: 'Bán lẻ', rank: 6, ig: -0.31, pg: -0.12, breadth_up: 3, breadth_down: 7, ts: '' }
    };
    var reg = global.IfluxMarketRegistryStore;
    if (!reg || typeof reg.listSectors !== 'function') return fallback;
    try {
      var list = reg.listSectors().filter(function (s) { return s.status !== 'inactive'; });
      if (!list.length) return fallback;
      var out = {};
      list.forEach(function (s, i) {
        out[String(s.id)] = {
          id: s.id, name: s.name, rank: i + 1,
          ig: 0, pg: 0, breadth_up: 0, breadth_down: 0, ts: ''
        };
      });
      return out;
    } catch (e) { return fallback; }
  }

  var _tickCounter = 0;

  function sessionBounds() {
    if (global.IfluxCoreConfig && IfluxCoreConfig.getSessionBounds) {
      return IfluxCoreConfig.getSessionBounds();
    }
    return {
      morningStart: 9 * 60,
      morningEnd: 11 * 60 + 30,
      afternoonStart: 13 * 60,
      afternoonEnd: 14 * 60 + 45,
      slotMinutes: 5,
      tickIntervalMs: 12000
    };
  }

  function getLiqSlots() {
    if (global.IfluxCoreConfig && IfluxCoreConfig.buildLiqSlots) {
      return IfluxCoreConfig.buildLiqSlots();
    }
    var b = sessionBounds();
    var slots = [];
    var m;
    for (m = b.morningStart; m <= b.morningEnd; m += b.slotMinutes) slots.push(minutesToTime(m));
    for (m = b.afternoonStart; m <= b.afternoonEnd; m += b.slotMinutes) slots.push(minutesToTime(m));
    return slots;
  }

  function getLiqUpdateMs() {
    return sessionBounds().slotMinutes * 60 * 1000;
  }

  var SESSION_LABELS = ['09:00', '09:15', '09:30', '09:45', '10:00', '10:15', '10:30', '10:45', '11:00', '11:15', '13:00', '13:30', '14:00', '14:30'];

  var _liqDayCache = {};

  function pad2(n) {
    return n < 10 ? '0' + n : String(n);
  }

  function minutesToTime(m) {
    return pad2(Math.floor(m / 60)) + ':' + pad2(m % 60);
  }

  function timeToMinutes(t) {
    var p = String(t || '0:0').split(':');
    return parseInt(p[0], 10) * 60 + parseInt(p[1], 10);
  }

  function dateKey(d) {
    if (global.IfluxCoreConfig && IfluxCoreConfig.getVietnamParts) {
      return IfluxCoreConfig.getVietnamParts(d).dateKey;
    }
    d = d || new Date();
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  }

  function slotTimestamp(timeStr, baseDate) {
    var p = timeStr.split(':');
    var h = parseInt(p[0], 10);
    var mi = parseInt(p[1], 10);
    if (global.IfluxCoreConfig && IfluxCoreConfig.getVietnamParts && IfluxCoreConfig.vnDateFromParts) {
      var parts = IfluxCoreConfig.getVietnamParts(baseDate || new Date());
      return IfluxCoreConfig.vnDateFromParts(parts, h, mi).getTime();
    }
    var d = new Date(baseDate || new Date());
    d.setHours(h, mi, 0, 0);
    return d.getTime();
  }

  function build5MinSlots() {
    return getLiqSlots();
  }

  function liqSlotsRef() {
    return getLiqSlots();
  }

  function exchangeMult(exchange) {
    return { vnindex: 1, hose: 0.72, hnx: 0.18, upcom: 0.09 }[exchange] || 1;
  }

  /** Sinh KLGD/GTGD lũy kế monotonic cho cả ngày — mỗi slot + increment dương */
  function generateDayCumulative(exchange, metric, dayKey) {
    var cacheId = dayKey + ':' + exchange + ':' + metric;
    if (_liqDayCache[cacheId]) return _liqDayCache[cacheId];

    var h = hashStr(cacheId);
    var mult = exchangeMult(exchange);
    var incBase = metric === 'volume' ? 82000 : 158;
    var total = 0;
    var slots = getLiqSlots();
    var b = sessionBounds();
    var series = slots.map(function (time, i) {
      var t = i / Math.max(slots.length - 1, 1);
      var wave = Math.sin(t * Math.PI) * 0.32 + 0.68;
      var lunchDip = timeToMinutes(time) >= b.afternoonStart ? 1.08 : 1;
      var increment = Math.max(1, Math.round(
        incBase * mult * wave * lunchDip * (0.82 + seededRand(h + i * 2.17) * 0.36)
      ));
      total += increment;
      return { time: time, minutes: timeToMinutes(time), value: total };
    });

    _liqDayCache[cacheId] = series;
    return series;
  }

  function generateAverageCumulative(exchange, metric, sessions, dayKey) {
    var slots = getLiqSlots();
    var avg = [];
    var i;
    for (i = 0; i < slots.length; i++) {
      var sum = 0;
      var s;
      for (s = 1; s <= sessions; s++) {
        var histKey = dayKey + '_hist_' + s;
        var daySeries = generateDayCumulative(exchange, metric, histKey);
        sum += daySeries[i].value;
      }
      avg.push({
        time: slots[i],
        minutes: timeToMinutes(slots[i]),
        value: Math.round(sum / sessions * (1 - sessions * 0.004))
      });
    }
    return avg;
  }

  function getTradingClock(now) {
    if (global.IfluxCoreConfig && IfluxCoreConfig.getTradingClock) {
      return IfluxCoreConfig.getTradingClock(now);
    }
    now = now || new Date();
    var b = sessionBounds();
    var mins = now.getHours() * 60 + now.getMinutes();
    var floored = Math.floor(mins / b.slotMinutes) * b.slotMinutes;

    if (mins < b.morningStart) {
      return { phase: 'pre', cutoffMinutes: null, cutoffTime: null };
    }
    if (mins >= b.morningStart && mins <= b.morningEnd) {
      var amCut = Math.min(floored, b.morningEnd);
      return { phase: 'am', cutoffMinutes: amCut, cutoffTime: minutesToTime(amCut) };
    }
    if (mins > b.morningEnd && mins < b.afternoonStart) {
      return { phase: 'lunch', cutoffMinutes: b.morningEnd, cutoffTime: minutesToTime(b.morningEnd) };
    }
    if (mins >= b.afternoonStart && mins <= b.afternoonEnd) {
      var pmCut = Math.min(floored, b.afternoonEnd);
      return { phase: 'pm', cutoffMinutes: pmCut, cutoffTime: minutesToTime(pmCut) };
    }
    return { phase: 'post', cutoffMinutes: b.afternoonEnd, cutoffTime: minutesToTime(b.afternoonEnd) };
  }

  function valueAtOrBefore(series, cutoffMinutes) {
    if (cutoffMinutes == null) return null;
    var last = null;
    series.forEach(function (pt) {
      if (pt.minutes <= cutoffMinutes) last = pt.value;
    });
    return last;
  }

  function pointsUpToCutoff(series, cutoffMinutes, baseDate) {
    if (cutoffMinutes == null) return [];
    return series.filter(function (pt) { return pt.minutes <= cutoffMinutes; }).map(function (pt) {
      return { x: slotTimestamp(pt.time, baseDate), y: pt.value };
    });
  }

  function labelPointsFromSeries(series, baseDate) {
    return SESSION_LABELS.map(function (lbl) {
      var m = timeToMinutes(lbl);
      return { x: slotTimestamp(lbl, baseDate), y: valueAtOrBefore(series, m) };
    }).filter(function (pt) { return pt.y != null; });
  }

  /** Cùng lưới slot thanh khoản — current cắt tại cutoff, average full ngày */
  function slotValuesFromSeries(series, cutoffMinutes) {
    return getLiqSlots().map(function (time) {
      var m = timeToMinutes(time);
      if (cutoffMinutes != null && m > cutoffMinutes) return null;
      return valueAtOrBefore(series, m);
    });
  }

  function slotValuesAverage(series) {
    return getLiqSlots().map(function (time) {
      return valueAtOrBefore(series, timeToMinutes(time));
    });
  }

  function getLiquiditySeries(exchange, metric, sessions, previewDemo) {
    sessions = sessions || 1;
    var now = previewDemo ? (function () {
      var d = new Date();
      if (global.IfluxCoreConfig && IfluxCoreConfig.vnDateFromParts && IfluxCoreConfig.getVietnamParts) {
        var vp = IfluxCoreConfig.getVietnamParts(d);
        return IfluxCoreConfig.vnDateFromParts(vp, 10, 30);
      }
      d.setHours(10, 30, 0, 0);
      return d;
    }()) : new Date();

    var ctx = (global.IfluxCoreConfig && IfluxCoreConfig.resolveStatsTradingContext)
      ? IfluxCoreConfig.resolveStatsTradingContext(now)
      : null;
    var dayKey = ctx ? ctx.referenceDateKey : dateKey(now);
    var refDate = ctx ? ctx.referenceDate : now;
    var clock = previewDemo
      ? { phase: 'am', cutoffMinutes: timeToMinutes('10:30'), cutoffTime: '10:30' }
      : (ctx ? ctx.clock : getTradingClock(now));

    if (previewDemo) {
      dayKey = dateKey(now);
      refDate = now;
    }

    var todaySeries = generateDayCumulative(exchange, metric, dayKey);
    var avgSeries = sessions <= 1
      ? todaySeries
      : generateAverageCumulative(exchange, metric, sessions, dayKey);

    var currentSlotVals = slotValuesFromSeries(todaySeries, clock.cutoffMinutes);
    var averageSlotVals = slotValuesAverage(avgSeries);
    var currentPts = pointsUpToCutoff(todaySeries, clock.cutoffMinutes, refDate);
    var averagePts = labelPointsFromSeries(avgSeries, refDate);

    var cutoffIdx = -1;
    var slots = getLiqSlots();
    if (clock.cutoffMinutes != null) {
      slots.forEach(function (t, i) {
        if (timeToMinutes(t) <= clock.cutoffMinutes) cutoffIdx = i;
      });
    }

    return {
      slotLabels: slots.slice(),
      labels: SESSION_LABELS.slice(),
      labelTimestamps: SESSION_LABELS.map(function (lbl) { return slotTimestamp(lbl, now); }),
      current: currentSlotVals,
      average: averageSlotVals,
      currentPoints: currentPts,
      averagePoints: averagePts,
      currentLegacy: SESSION_LABELS.map(function (lbl) {
        var m = timeToMinutes(lbl);
        if (clock.cutoffMinutes == null || m > clock.cutoffMinutes) return null;
        return valueAtOrBefore(todaySeries, m);
      }),
      averageLegacy: SESSION_LABELS.map(function (lbl) {
        return valueAtOrBefore(avgSeries, timeToMinutes(lbl));
      }),
      metric: metric,
      exchange: exchange,
      sessions: sessions,
      session_index: cutoffIdx,
      clock: clock,
      statsContext: ctx,
      data_as_of: liquidityDataAsOf(refDate, clock),
      slots_total: slots.length,
      slots_visible: currentSlotVals.filter(function (v) { return v != null; }).length
    };
  }

  function liquidityDataAsOf(refDate, clock) {
    var b = sessionBounds();
    if (clock.phase === 'post' || clock.phase === 'weekend') {
      return slotTimestamp(minutesToTime(b.afternoonEnd), refDate);
    }
    if (clock.phase === 'lunch') {
      return slotTimestamp(minutesToTime(b.morningEnd), refDate);
    }
    if (clock.phase === 'pre') {
      return slotTimestamp(minutesToTime(b.morningStart), refDate);
    }
    return (refDate && refDate.toISOString) ? refDate.toISOString() : new Date().toISOString();
  }

  function vnMinutesNow(now) {
    if (global.IfluxCoreConfig && IfluxCoreConfig.getVietnamParts) {
      return IfluxCoreConfig.getVietnamParts(now).minutesOfDay;
    }
    now = now || new Date();
    return now.getHours() * 60 + now.getMinutes();
  }

  function isTradingActive(now) {
    if (global.IfluxCoreConfig && IfluxCoreConfig.isTradingActive) {
      return IfluxCoreConfig.isTradingActive(now);
    }
    var phase = getTradingClock(now).phase;
    return phase === 'am' || phase === 'pm';
  }

  function msUntilNextLiquidityUpdate(now) {
    now = now || new Date();
    if (!isTradingActive(now)) return null;
    var b = sessionBounds();
    var clock = getTradingClock(now);
    if (clock.phase === 'post' || clock.phase === 'pre' || clock.phase === 'weekend') return null;
    var tailMs = now.getSeconds() * 1000 + now.getMilliseconds();
    if (clock.phase === 'lunch') {
      var waitLunch = (b.afternoonStart - vnMinutesNow(now)) * 60000 - tailMs;
      return waitLunch > 0 ? waitLunch : null;
    }
    var mins = vnMinutesNow(now);
    if (mins > b.afternoonEnd) return null;
    var slot = b.slotMinutes;
    var mod = mins % slot;
    var remain = (slot - mod) * 60000 - tailMs;
    if (remain <= 0) return getLiqUpdateMs();
    var nextSlotEnd = mins + (slot - mod);
    if (clock.phase === 'am' && nextSlotEnd > b.morningEnd) {
      var waitAm = (b.morningEnd - mins) * 60000 - tailMs;
      return waitAm > 0 ? waitAm : null;
    }
    return remain;
  }

  function marketStatusLabel(clock) {
    if (clock.phase === 'pre') return 'Trước giờ mở cửa';
    if (clock.phase === 'lunch') return 'Nghỉ trưa';
    if (clock.phase === 'post') return 'Hết phiên';
    return 'Đang giao dịch';
  }

  function syncMarketClockMeta() {
    var clock = getTradingClock();
    SNAPSHOT.entities.market.status = marketStatusLabel(clock);
    if (!isTradingActive()) {
      SNAPSHOT.meta.data_as_of = liquidityDataAsOf(new Date(), clock);
    }
  }

  var SNAPSHOT = {
    meta: {
      connection: 'connected',
      degraded: false,
      data_as_of: new Date().toISOString()
    },
    entities: {
      market: {
        index_name: 'VNINDEX',
        ig: 1245.32,
        pg: 0.68,
        breadth_up: 312,
        breadth_down: 198,
        status: 'Đang giao dịch'
      },
      stocks: buildStockCatalog(),
      sectors: buildSectorSnapshot(),
      flow: {
        foreign: { label: 'Khối ngoại', buy_pct: 54, sell_pct: 46, net_label: '+128.5 tỷ' },
        institutional: { label: 'Tổ chức', buy_pct: 52, sell_pct: 48, net_label: '+86.2 tỷ' },
        proprietary: { label: 'Tự doanh', buy_pct: 48, sell_pct: 52, net_label: '-42.1 tỷ' },
        retail: { label: 'Cá nhân', buy_pct: 51, sell_pct: 49, net_label: '+18.6 tỷ' }
      },
      breadth: {
        vnindex: { total: 562, up: 312, down: 198, ref: 52, ceiling_purple: 14, floor_green: 11 },
        hose: { total: 331, up: 186, down: 114, ref: 31, ceiling_purple: 9, floor_green: 7 },
        hnx: { total: 130, up: 68, down: 44, ref: 18, ceiling_purple: 4, floor_green: 3 },
        upcom: { total: 110, up: 58, down: 40, ref: 12, ceiling_purple: 3, floor_green: 2 }
      },
      exchanges: {
        vnindex: { name: 'VN-Index', value: 1245.32, change_pct: 0.68 },
        hose: { name: 'HOSE', value: 1289.45, change_pct: 0.72 },
        hnx: { name: 'HNX', value: 248.31, change_pct: -0.15 },
        upcom: { name: 'UPCOM', value: 92.18, change_pct: 0.21 }
      }
    },
    movers: {
      gainers: ['HPG', 'VCB', 'FPT', 'MWG', 'VHM'],
      losers: ['SSI', 'HCM', 'STB', 'VND', 'VIC']
    },
    watchlist: ['HPG', 'FPT', 'VCB', 'MWG', 'SSI']
  };

  /* Đọc snapshot nội bộ — KHÔNG deep-clone. SNAPSHOT là nguồn sống và các hàm
     dưới đây chỉ ĐỌC, nên tránh JSON.parse(JSON.stringify()) tốn kém ở hot path
     (getStock, groupPerformance… bị gọi hàng trăm lần mỗi lần render heatmap/rankings). */
  function readSnapshot() {
    var o = global.__ifluxMarketApiOverlay;
    if (!o || (!o.entities && !o.movers && !o.meta)) return SNAPSHOT;
    return {
      meta: o.meta ? Object.assign({}, SNAPSHOT.meta, o.meta) : SNAPSHOT.meta,
      entities: o.entities ? Object.assign({}, SNAPSHOT.entities, o.entities) : SNAPSHOT.entities,
      movers: o.movers || SNAPSHOT.movers,
      watchlist: SNAPSHOT.watchlist
    };
  }

  /* API công khai — trả bản sao sâu để bên ngoài không mutate được SNAPSHOT. */
  function getSnapshot() {
    syncMarketClockMeta();
    var snap = JSON.parse(JSON.stringify(readSnapshot()));
    if (global.IfluxWatchlistStore) {
      snap.watchlist = IfluxWatchlistStore.getAllWatchlistTickers();
    }
    return snap;
  }

  function hashStr(s) {
    var h = 0;
    for (var i = 0; i < s.length; i++) {
      h = ((h << 5) - h) + s.charCodeAt(i);
      h |= 0;
    }
    return Math.abs(h);
  }

  /** Hỗ trợ / Kháng cự N phiên — sandbox deterministic theo giá hiện tại */
  function getSrLevels(ticker, sessions) {
    var snap = readSnapshot();
    var stock = snap.entities.stocks[(ticker || '').toUpperCase()];
    if (!stock || stock.price == null) return null;
    var h = hashStr(ticker + ':' + sessions);
    var supportDist = 0.04 + (h % 13) * 0.004;
    var resistDist = 0.035 + (h % 11) * 0.004;
    var price = stock.price;
    return {
      support: Math.round(price * (1 - supportDist) * 100) / 100,
      resistance: Math.round(price * (1 + resistDist) * 100) / 100
    };
  }

  /** % chênh lệch giá hiện tại so với mức Hỗ trợ/Kháng cự */
  function getPriceVsSrPct(ticker, levelType, sessions) {
    var snap = readSnapshot();
    var stock = snap.entities.stocks[(ticker || '').toUpperCase()];
    var levels = getSrLevels(ticker, sessions);
    if (!stock || !levels) return null;
    var level = levelType === 'resistance' ? levels.resistance : levels.support;
    if (!level) return null;
    return Math.round(((stock.price - level) / level) * 10000) / 100;
  }

  function getBreadth(exchange) {
    var snap = readSnapshot();
    var map = snap.entities && snap.entities.breadth;
    if (!map) return null;
    var key = (exchange || 'vnindex').toLowerCase();
    return map[key] || map.vnindex || null;
  }

  function getExchanges() {
    var snap = readSnapshot();
    var map = snap.entities && snap.entities.exchanges;
    if (!map) return [];
    return ['vnindex', 'hose', 'hnx', 'upcom'].map(function (key) {
      var ex = map[key];
      if (!ex) return null;
      return { key: key, name: ex.name, value: ex.value, change_pct: ex.change_pct };
    }).filter(Boolean);
  }

  function getSectorPerf(sectorId) {
    var snap = readSnapshot();
    var sectors = snap.entities && snap.entities.sectors;
    if (!sectors) return null;
    var s = sectors[sectorId] || sectors[String(sectorId)];
    if (!s) return null;
    return { pg: s.pg, ig: s.ig, name: s.name };
  }

  /** Trạng thái giá VN: tăng / giảm / trần (tím) / sàn / tham chiếu */
  function getStockPriceState(ticker) {
    var snap = readSnapshot();
    var stock = snap.entities && snap.entities.stocks
      ? snap.entities.stocks[(ticker || '').toUpperCase()]
      : null;
    if (!stock || stock.change_pct == null) return 'ref';
    var pct = stock.change_pct;
    if (pct >= 6.5) return 'ceiling';
    if (pct <= -6.5) return 'floor';
    if (pct > 0.08) return 'up';
    if (pct < -0.08) return 'down';
    return 'ref';
  }

  function getStock(ticker) {
    var snap = readSnapshot();
    var stocks = snap.entities && snap.entities.stocks ? snap.entities.stocks : {};
    var s = stocks[(ticker || '').toUpperCase()];
    return s ? Object.assign({}, s) : null;
  }

  function getRefPrice(stock) {
    if (!stock || stock.price == null || stock.change_pct == null) return null;
    return Math.round((stock.price / (1 + stock.change_pct / 100)) * 100) / 100;
  }

  function getPriceChangeAbs(stock) {
    if (!stock || stock.price == null || stock.change_pct == null) return null;
    var ref = getRefPrice(stock);
    return Math.round((stock.price - ref) * 100) / 100;
  }

  function getStockChartData(ticker, sessions) {
    sessions = sessions || 22;
    var stock = getStock(ticker);
    if (!stock) return null;
    var h = hashStr(ticker + ':chart');
    var price = stock.price;
    var points = [];
    var v = price * (0.94 + (h % 7) * 0.01);
    var i;
    for (i = 0; i < sessions; i++) {
      var drift = (stock.change_pct || 0) * 0.04;
      v += (seededRand(h + i * 3.17) - 0.48) * price * 0.018 + drift;
      v = Math.max(price * 0.82, Math.min(price * 1.12, v));
      points.push(Math.round(v * 100) / 100);
    }
    points[points.length - 1] = price;
    return { ticker: stock.ticker, sessions: sessions, prices: points };
  }

  function seededRand(seed) {
    var x = Math.sin(seed * 12.9898) * 43758.5453;
    return x - Math.floor(x);
  }

  /** Giao dịch ròng 10 phiên theo chủ thể — từng phiên */
  function formatSessionDate(d) {
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
  }

  /** Rút gọn giá trị dòng tiền: 90M, 1.2B */
  function formatFlowCompact(million) {
    million = Number(million) || 0;
    if (million === 0) return '0';
    var sign = million < 0 ? '-' : '+';
    var abs = Math.abs(million);
    if (abs >= 1000) {
      var b = abs / 1000;
      var bStr = b % 1 === 0 ? String(b) : b.toFixed(1).replace(/\.0$/, '');
      return sign + bStr + 'B';
    }
    return sign + abs + 'M';
  }

  function tradingDates(count) {
    var dates = [];
    var d = new Date();
    var guard = 0;
    while (dates.length < count && guard < 40) {
      d.setDate(d.getDate() - 1);
      guard++;
      var day = d.getDay();
      if (day === 0 || day === 6) continue;
      dates.unshift(new Date(d.getTime()));
    }
    return dates;
  }

  function getStockNetFlow(ticker, sessions) {
    sessions = sessions || 10;
    var stock = getStock(ticker);
    if (!stock) return null;
    var h = hashStr(ticker + ':flow10');
    var dates = tradingDates(sessions);
    var subjects = [
      { key: 'retail', label: 'Cá nhân' },
      { key: 'foreign', label: 'Nước ngoài' },
      { key: 'institutional', label: 'Tổ chức' },
      { key: 'proprietary', label: 'Tự doanh' }
    ];
    return {
      sessions: sessions,
      subjects: subjects.map(function (s, si) {
        var series = [];
        var total = 0;
        var i;
        for (i = 0; i < sessions; i++) {
          var net = (seededRand(h + si * 17 + i * 5.31) - 0.45) * 180;
          net = Math.round(net);
          total += net;
          series.push({
            date: dates[i] ? dates[i].toISOString() : '',
            date_label: dates[i] ? formatSessionDate(dates[i]) : '',
            net_million: net,
            net_label: (net >= 0 ? '+' : '') + formatFlowCompact(net)
          });
        }
        return {
          key: s.key,
          label: s.label,
          series: series,
          total_net: total,
          total_label: (total >= 0 ? '+' : '') + formatFlowCompact(total)
        };
      })
    };
  }

  function getGroupChartData(source, id, tickers, sessions) {
    sessions = sessions || 22;
    if (!tickers || !tickers.length) return null;
    var seriesList = tickers.map(function (tk) {
      return getStockChartData(tk, sessions);
    }).filter(Boolean);
    if (!seriesList.length) return null;
    var tax = global.IfluxWatchlistTaxonomy;
    var group = tax ? tax.getGroup(source, id) : null;
    var name = group ? group.name : String(id);
    var points = [];
    var i;
    for (i = 0; i < sessions; i++) {
      var sum = 0;
      var n = 0;
      seriesList.forEach(function (s) {
        if (s.prices[i] != null) {
          sum += s.prices[i];
          n += 1;
        }
      });
      points.push(n ? Math.round((sum / n) * 100) / 100 : 0);
    }
    return { ticker: name, sessions: sessions, prices: points };
  }

  function getGroupNetFlow(source, id, tickers, sessions) {
    sessions = sessions || 10;
    if (!tickers || !tickers.length) return null;
    var flows = tickers.map(function (tk) {
      return getStockNetFlow(tk, sessions);
    }).filter(Boolean);
    if (!flows.length) return null;
    var subjects = flows[0].subjects.map(function (s) {
      return { key: s.key, label: s.label };
    });
    return {
      sessions: sessions,
      subjects: subjects.map(function (s, si) {
        var series = [];
        var total = 0;
        var i;
        for (i = 0; i < sessions; i++) {
          var net = 0;
          flows.forEach(function (flow) {
            var sub = flow.subjects[si];
            if (sub && sub.series[i]) net += sub.series[i].net_million || 0;
          });
          net = Math.round(net);
          total += net;
          series.push({
            date: flows[0].subjects[si].series[i] ? flows[0].subjects[si].series[i].date : '',
            date_label: flows[0].subjects[si].series[i] ? flows[0].subjects[si].series[i].date_label : '',
            net_million: net,
            net_label: (net >= 0 ? '+' : '') + formatFlowCompact(net)
          });
        }
        return {
          key: s.key,
          label: s.label,
          series: series,
          total_net: total,
          total_label: (total >= 0 ? '+' : '') + formatFlowCompact(total)
        };
      })
    };
  }

  function getGroupDetail(source, id) {
    var tax = global.IfluxWatchlistTaxonomy;
    if (!tax) return null;
    var group = tax.getGroup(source, id);
    if (!group) return null;
    var tickers = tax.getGroupTickers(source, id);
    /* Chủ đề DB vẫn hiện trang chi tiết dù tạm chưa có mã khớp mock */
    var isChuDe = source === 'story' || source === 'chu-de' || source === 'chu_de' || source === 'chuDe';
    if (!tickers.length && isChuDe) {
      tickers = (group.tickers || []).slice();
    }
    if (!tickers.length && !isChuDe) return null;
    var gp = tickers.length ? groupPerformance(tickers) : { perf: 0, weight: 0, count: 0 };
    var perf = gp.perf;
    var priceState = perf > 0.08 ? 'up' : perf < -0.08 ? 'down' : 'ref';
    var chart = tickers.length ? getGroupChartData(source, id, tickers, 22) : { labels: [], prices: [100] };
    var lastPrice = chart && chart.prices.length ? chart.prices[chart.prices.length - 1] : 100;
    var firstPrice = chart && chart.prices.length ? chart.prices[0] : lastPrice;
    var changeAbs = Math.round((lastPrice - firstPrice) * 100) / 100;
    return {
      kind: (source === 'story' || source === 'chu-de' || source === 'chu_de') ? 'chu-de' : source,
      id: group.id,
      name: group.name,
      type_label: tax.sourceLabel(source),
      tickers: tickers,
      ticker: tickers[0] || '',
      member_count: tickers.length,
      price: lastPrice,
      change_pct: perf,
      change_abs: changeAbs,
      ref_price: firstPrice,
      price_state: priceState,
      chart: chart,
      net_flow: tickers.length ? getGroupNetFlow(source, id, tickers, 10) : null
    };
  }

  function getStockDetail(ticker) {
    var stock = getStock(ticker);
    if (!stock) return null;
    var shortName = stock.short_name || String(stock.name || stock.ticker).toUpperCase();
    return {
      ticker: stock.ticker,
      name: stock.name,
      short_name: shortName,
      exchange: stock.exchange || 'HSX',
      price: stock.price,
      change_pct: stock.change_pct,
      change_abs: getPriceChangeAbs(stock),
      ref_price: getRefPrice(stock),
      volume: stock.volume,
      price_state: getStockPriceState(stock.ticker),
      chart: getStockChartData(stock.ticker, 22),
      net_flow: getStockNetFlow(stock.ticker, 10)
    };
  }

  /** Thông tin công ty (định giá) — sandbox deterministic theo mã. */
  function getStockInfo(ticker) {
    var stock = getStock(ticker);
    if (!stock) return null;
    var tk = stock.ticker;
    var h = hashStr('info:' + tk);
    var price = stock.price != null ? stock.price : 20; // nghìn đồng
    var cap = getMarketCap(tk);
    if (cap == null) cap = 20000 + (h % 300) * 500; // tỷ VND
    var eps = 1000 + (h % 60) * 200;                // đồng
    var pe = eps > 0 ? Math.round((price * 1000 / eps) * 10) / 10 : null;
    var bookMult = 2 + (h % 5);                     // 2..6
    var bvps = eps * bookMult;                      // đồng
    var pb = bvps > 0 ? Math.round((price * 1000 / bvps) * 100) / 100 : null;
    var shares = price > 0 ? Math.round(cap * 1e9 / (price * 1000)) : 0;
    var tax = global.IfluxWatchlistTaxonomy;
    var sectorName = '';
    if (tax && tax.getTickerMemberships) {
      var mem = tax.getTickerMemberships(tk) || {};
      if (mem.sector && mem.sector.name) sectorName = mem.sector.name;
    }
    return {
      ticker: tk,
      name: stock.name,
      exchange: stock.exchange || 'HSX',
      price: price,
      market_cap: cap,
      market_cap_label: formatMarketCap(cap),
      volume: stock.volume || 0,
      eps: eps,
      pe: pe,
      pb: pb,
      bvps: bvps,
      shares_outstanding: shares,
      sector_name: sectorName
    };
  }

  /** Chuỗi P/E & P/B N phiên — sandbox deterministic, kết thúc tại giá trị hiện tại. */
  function getStockValuationSeries(ticker, n) {
    n = n || 22;
    var info = getStockInfo(ticker);
    if (!info) return null;
    var basePe = info.pe && info.pe > 0 ? info.pe : 12;
    var basePb = info.pb && info.pb > 0 ? info.pb : 1.5;
    var pe = [];
    var pb = [];
    var labels = [];
    var today = new Date();
    for (var i = 0; i < n; i++) {
      var frac = n > 1 ? i / (n - 1) : 1;
      var np = ((hashStr(ticker + 'pe' + i) % 41) - 20) / 100;   // -0.20..0.20
      var nb = ((hashStr(ticker + 'pb' + i) % 41) - 20) / 100;
      pe.push(Math.round(basePe * (0.86 + 0.14 * frac) * (1 + np * 0.35) * 10) / 10);
      pb.push(Math.round(basePb * (0.88 + 0.12 * frac) * (1 + nb * 0.35) * 100) / 100);
      var d = new Date(today.getTime() - (n - 1 - i) * 86400000);
      labels.push(d.getDate() + '/' + (d.getMonth() + 1));
    }
    pe[n - 1] = basePe;
    pb[n - 1] = basePb;
    return { pe: pe, pb: pb, labels: labels };
  }

  var EVENT_TYPES = [
    { type: 'GDKHQ', label: 'Ngày GDKHQ', title: 'Giao dịch không hưởng quyền nhận cổ tức' },
    { type: 'DHDCD', label: 'ĐHĐCĐ', title: 'Đại hội đồng cổ đông thường niên' },
    { type: 'COTUC', label: 'Cổ tức', title: 'Thanh toán cổ tức bằng tiền mặt' },
    { type: 'KQKD', label: 'KQKD', title: 'Công bố kết quả kinh doanh quý' },
    { type: 'PHANHANH', label: 'Phát hành', title: 'Niêm yết & giao dịch cổ phiếu phát hành thêm' }
  ];

  /** Lịch sự kiện liên quan cổ phiếu — sandbox deterministic. */
  function getStockEvents(ticker) {
    var stock = getStock(ticker);
    if (!stock) return [];
    var tk = stock.ticker;
    var h = hashStr('evt:' + tk);
    var today = new Date();
    var out = [];
    for (var i = 0; i < EVENT_TYPES.length; i++) {
      var et = EVENT_TYPES[(h + i) % EVENT_TYPES.length];
      var offset = ((hashStr(tk + 'evt' + i) % 60)) - 24; // -24..+35 ngày
      var d = new Date(today.getTime() + offset * 86400000);
      var detail = '';
      if (et.type === 'COTUC' || et.type === 'GDKHQ') {
        detail = 'Tỷ lệ ' + (5 + (h + i) % 16) + '% · ' + (500 + ((h + i) % 20) * 100) + ' đ/CP';
      } else if (et.type === 'KQKD') {
        detail = 'Quý ' + (1 + (h + i) % 4) + '/' + today.getFullYear();
      }
      out.push({
        type: et.type,
        type_label: et.label,
        title: et.title,
        detail: detail,
        date: d,
        date_label: d.getDate() + '/' + (d.getMonth() + 1) + '/' + d.getFullYear(),
        upcoming: d.getTime() >= today.getTime()
      });
    }
    out.sort(function (a, b) { return a.date - b.date; });
    return out;
  }

  /** Vốn hóa demo — đơn vị tỷ VND */
  function getMarketCap(ticker) {
    var stock = getStock(ticker);
    return stock && stock.market_cap != null ? stock.market_cap : null;
  }

  function formatMarketCap(cap) {
    cap = Number(cap) || 0;
    if (cap >= 1000) {
      var k = cap / 1000;
      var kStr = k % 1 === 0 ? String(k) : k.toFixed(1).replace(/\.0$/, '');
      return kStr + 'K tỷ';
    }
    if (cap >= 100) return Math.round(cap) + ' tỷ';
    return cap.toFixed(0) + ' tỷ';
  }

  /** Hiệu suất nhóm — trung bình có trọng số vốn hóa (sandbox) */
  function parseVolumeNum(vol) {
    if (vol == null) return 0;
    if (typeof vol === 'number' && isFinite(vol)) return vol;
    var s = String(vol).trim().toUpperCase().replace(/,/g, '');
    var m = s.match(/^([\d.]+)\s*([KMB])?/);
    if (!m) return 0;
    var n = parseFloat(m[1]) || 0;
    if (m[2] === 'B') return n * 1e9;
    if (m[2] === 'M') return n * 1e6;
    if (m[2] === 'K') return n * 1e3;
    return n;
  }

  /** GTGD ước lượng = giá × khối lượng (đủ để xếp hạng relative trong mock). */
  function tradeValueOf(stock) {
    if (!stock) return 1;
    if (stock.trade_value != null && isFinite(Number(stock.trade_value))) {
      return Math.max(Number(stock.trade_value), 1);
    }
    var price = Number(stock.price) || 0;
    var vol = parseVolumeNum(stock.volume);
    return Math.max(price * vol, 1);
  }

  function groupPerformance(tickers) {
    var sumWeighted = 0;
    var totalVal = 0;
    var n = 0;
    var snapEnt = readSnapshot().entities;
    var stocks = (snapEnt && snapEnt.stocks) || {};
    (tickers || []).forEach(function (tk) {
      var s = stocks[String(tk || '').toUpperCase()];
      if (s && s.change_pct != null) {
        var tv = tradeValueOf(s);
        sumWeighted += s.change_pct * tv;
        totalVal += tv;
        n += 1;
      }
    });
    return {
      perf: totalVal ? Math.round((sumWeighted / totalVal) * 100) / 100 : 0,
      weight: Math.max(totalVal, 1),
      count: n
    };
  }

  function syncSectorFromStocks() {
    if (!global.IfluxWatchlistTaxonomy || !SNAPSHOT.entities.sectors) return;
    var sectors = SNAPSHOT.entities.sectors;
    var stocks = SNAPSHOT.entities.stocks || {};
    IfluxWatchlistTaxonomy.getGroups('sector').forEach(function (g) {
      var tickers = IfluxWatchlistTaxonomy.getGroupTickers('sector', g.id);
      var gp = groupPerformance(tickers);
      var sec = sectors[g.id] || sectors[String(g.id)];
      if (!sec || !gp.count) return;
      var up = 0, down = 0;
      tickers.forEach(function (tk) {
        var s = stocks[String(tk || '').toUpperCase()];
        if (!s || s.change_pct == null) return;
        if (s.change_pct > 0.08) up += 1;
        else if (s.change_pct < -0.08) down += 1;
      });
      sec.pg = gp.perf;
      sec.ig = Math.round((gp.perf * 18 + (hashStr(g.id) % 7) * 0.05) * 100) / 100;
      sec.breadth_up = up;
      sec.breadth_down = down;
    });
  }

  /** Heatmap/Top10 cấp cổ phiếu — mỗi mã là 1 tile (id/name = ticker). */
  function getStockHeatTiles() {
    var stocks = (SNAPSHOT.entities && SNAPSHOT.entities.stocks) || {};
    return Object.keys(stocks).map(function (tk) {
      var s = stocks[tk];
      if (!s || s.change_pct == null) return null;
      var tv = tradeValueOf(s);
      return {
        id: tk,
        name: tk,
        perf: s.change_pct,
        weight: Math.max(tv, 1),
        tickers: [tk],
        count: 1
      };
    }).filter(Boolean);
  }

  var HEATMAP_TOP_N = 10;

  /** Top N theo GTGD — chuẩn cho mọi heatmap (mã / ngành / họ / story). */
  function getHeatmapGroups(source) {
    var rows;
    if (source === 'stock') {
      rows = getStockHeatTiles();
    } else {
      if (!global.IfluxWatchlistTaxonomy) return [];
      if (source === 'sector') syncSectorFromStocks();
      var groups = IfluxWatchlistTaxonomy.getGroups(source) || [];
      var sectors = SNAPSHOT.entities && SNAPSHOT.entities.sectors;
      rows = groups.map(function (g) {
        var tickers = IfluxWatchlistTaxonomy.getGroupTickers(source, g.id);
        var gp = groupPerformance(tickers);
        var perf = gp.perf;
        var weight = gp.weight;
        if (source === 'sector' && sectors) {
          var sec = sectors[g.id] || sectors[String(g.id)];
          if (sec && sec.pg != null && gp.count) perf = sec.pg;
        }
        return {
          id: g.id,
          name: g.name,
          perf: perf,
          weight: weight,
          tickers: tickers,
          count: gp.count
        };
      }).filter(function (g) {
        /* Chủ đề: vẫn hiện dù chưa có mã khớp mock snapshot */
        if (source === 'story' || source === 'chu-de' || source === 'chu_de') return true;
        return g.count > 0;
      });
    }
    return rows
      .slice()
      .sort(function (a, b) { return (b.weight || 0) - (a.weight || 0); })
      .slice(0, HEATMAP_TOP_N);
  }

  function getTop10Today(source) {
    var items = getHeatmapGroups(source).map(function (g) {
      return { id: g.id, name: g.name, perf: g.perf, tickers: g.tickers };
    });
    items.sort(function (a, b) { return b.perf - a.perf; });
    return items.slice(0, 10);
  }

  /** Mô phỏng tick realtime — jitter giá CP, chỉ số (chỉ trong phiên) */
  function tickRealtime() {
    if (!isTradingActive()) return { tick: _tickCounter, clock: getTradingClock(), skipped: true };
    _tickCounter += 1;

    var stocks = SNAPSHOT.entities.stocks;
    var sumPct = 0;
    var n = 0;
    Object.keys(stocks).forEach(function (tk) {
      var s = stocks[tk];
      if (!s || s.price == null) return;
      var h = hashStr(tk + ':' + _tickCounter);
      var delta = (seededRand(h) - 0.48) * 0.22;
      s.change_pct = Math.round((s.change_pct + delta) * 100) / 100;
      s.change_pct = Math.max(-6.9, Math.min(6.9, s.change_pct));
      var ref = getRefPrice(s);
      s.price = Math.round(ref * (1 + s.change_pct / 100) * 100) / 100;
      s.ts = new Date().toISOString();
      sumPct += s.change_pct;
      n += 1;
    });

    syncSectorFromStocks();

    var vnPct = n ? Math.round((sumPct / n) * 100) / 100 : 0;
    var ex = SNAPSHOT.entities.exchanges;
    if (ex.vnindex) {
      ex.vnindex.change_pct = vnPct;
      ex.vnindex.value = Math.round((ex.vnindex.value || 1245) * (1 + vnPct / 800) * 100) / 100;
    }
    if (ex.hose) ex.hose.change_pct = Math.round((vnPct + 0.04) * 100) / 100;
    if (ex.hnx) ex.hnx.change_pct = Math.round((vnPct * 0.6 - 0.2) * 100) / 100;
    if (ex.upcom) ex.upcom.change_pct = Math.round((vnPct * 0.4 + 0.1) * 100) / 100;

    SNAPSHOT.meta.data_as_of = new Date().toISOString();
    if (typeof document !== 'undefined') {
      document.dispatchEvent(new CustomEvent('iflux-market-tick'));
    }
    return { tick: _tickCounter, clock: getTradingClock() };
  }

  /** Top KL mua/bán ròng — split view (UI Spec §1) */
  function formatFlowVolume(vol) {
    vol = Math.abs(Number(vol) || 0);
    if (vol >= 1000000) {
      var m = vol / 1000000;
      return (m % 1 === 0 ? m.toFixed(0) : m.toFixed(2).replace(/\.?0+$/, '')) + 'M';
    }
    if (vol >= 1000) {
      var k = vol / 1000;
      return (k % 1 === 0 ? k.toFixed(0) : k.toFixed(2).replace(/\.?0+$/, '')) + 'K';
    }
    return String(Math.round(vol));
  }

  var FLOW_SUBJECT_SCALE = {
    all: 1,
    retail: 1,
    institutional: 0.72,
    proprietary: 0.48,
    foreign: 0.55
  };

  function flowNetForItem(key, subject) {
    subject = subject || 'retail';
    if (subject === 'all') subject = 'retail';
    var h = hashStr(String(key) + ':flownet:' + subject);
    var scale = FLOW_SUBJECT_SCALE[subject] != null ? FLOW_SUBJECT_SCALE[subject] : 1;
    var buy = (seededRand(h) * 0.75 + 0.15) * 9200000 * scale;
    var sell = (seededRand(h + 3.7) * 0.75 + 0.15) * 9200000 * scale;
    return { buy: buy, sell: sell, net: buy - sell };
  }

  function getFlowTopNetList(opts) {
    opts = opts || {};
    var subject = opts.subject || 'retail';
    if (subject === 'all') subject = 'retail';
    var scope = opts.scope || 'stock';
    var count = opts.count || 10;
    var items = [];

    if (scope === 'stock') {
      var stocks = SNAPSHOT.entities.stocks;
      Object.keys(stocks).forEach(function (tk) {
        var f = flowNetForItem(tk, subject);
        items.push({
          id: tk,
          label: tk,
          buy: f.buy,
          sell: f.sell,
          net: f.net,
          href: (global.IfluxSeoUrl ? IfluxSeoUrl.stockHref(tk) : '/co-phieu/' + encodeURIComponent(tk))
        });
      });
    } else {
      var source = scope === 'family' ? 'family' : ((scope === 'story' || scope === 'chude' || scope === 'chu-de') ? 'chu-de' : 'sector');
      getHeatmapGroups(source).forEach(function (g) {
        var f = flowNetForItem(g.id + ':' + source, subject);
        var href = global.IfluxSeoUrl
          ? (scope === 'sector' ? IfluxSeoUrl.sectorHref(g.id)
            : (scope === 'family' ? IfluxSeoUrl.ecosystemHref(g.id) : IfluxSeoUrl.storyEntityHref(g.id)))
          : (scope === 'sector'
            ? '/nganh/' + encodeURIComponent(g.id)
            : (scope === 'family'
              ? '/he-sinh-thai/' + encodeURIComponent(g.id)
              : '/chu-de/' + encodeURIComponent(g.id)));
        items.push({
          id: g.id,
          label: g.name,
          buy: f.buy,
          sell: f.sell,
          net: f.net,
          href: href
        });
      });
    }

    var buyers = items.filter(function (x) { return x.net > 0; })
      .sort(function (a, b) { return b.net - a.net; })
      .slice(0, count)
      .map(function (x) {
        return {
          id: x.id,
          label: x.label,
          value: x.net,
          value_label: formatFlowVolume(x.net),
          pct: 0,
          href: x.href
        };
      });
    var sellers = items.filter(function (x) { return x.net < 0; })
      .sort(function (a, b) { return a.net - b.net; })
      .slice(0, count)
      .map(function (x) {
        return {
          id: x.id,
          label: x.label,
          value: Math.abs(x.net),
          value_label: formatFlowVolume(x.net),
          pct: 0,
          href: x.href
        };
      });

    var maxBuy = buyers.reduce(function (m, x) { return Math.max(m, x.value); }, 1);
    var maxSell = sellers.reduce(function (m, x) { return Math.max(m, x.value); }, 1);
    buyers.forEach(function (x) { x.pct = Math.round((x.value / maxBuy) * 100); });
    sellers.forEach(function (x) { x.pct = Math.round((x.value / maxSell) * 100); });

    var rows = Math.max(buyers.length, sellers.length, count);
    while (buyers.length < rows) buyers.push(null);
    while (sellers.length < rows) sellers.push(null);

    return {
      subject: subject,
      scope: scope,
      rows: rows,
      buyers: buyers,
      sellers: sellers
    };
  }

  function getMarketFlowSummary() {
    var snap = readSnapshot();
    return snap.entities && snap.entities.flow ? snap.entities.flow : {};
  }

  /** Ngữ cảnh vùng Hỗ trợ/Kháng cự + rủi ro thị trường (sidebar Dòng tiền) */
  function getMarketZoneContext() {
    var snap = readSnapshot();
    var exMap = snap.entities && snap.entities.exchanges;
    var idx = exMap && exMap.vnindex;
    if (!idx || idx.value == null) return null;

    var price = idx.value;
    var h = hashStr('vnindex:zone:20');
    var supportDist = 0.036 + (h % 9) * 0.002;
    var resistDist = 0.034 + (h % 7) * 0.002;
    var support = Math.round(price * (1 - supportDist) * 100) / 100;
    var resistance = Math.round(price * (1 + resistDist) * 100) / 100;
    var range = resistance - support;
    var position = range > 0 ? Math.max(0, Math.min(1, (price - support) / range)) : 0.5;
    var distResPct = Math.round(((resistance - price) / price) * 10000) / 100;
    var distSupPct = Math.round(((price - support) / price) * 10000) / 100;

    var zone = 'middle';
    var zoneLabel = 'Vùng giữa';
    var zoneHint = 'Giá đang dao động giữa hỗ trợ và kháng cự — theo dõi xác nhận volume.';
    var zoneTone = 'neutral';

    if (distResPct <= 0.6) {
      zone = 'at_resistance';
      zoneLabel = 'Sát kháng cự';
      zoneHint = 'VN-Index áp sát vùng kháng cự — cẩn trọng chốt lời / quản trị rủi ro.';
      zoneTone = 'danger';
    } else if (distSupPct <= 0.6) {
      zone = 'at_support';
      zoneLabel = 'Sát hỗ trợ';
      zoneHint = 'Giá test vùng hỗ trợ — quan sát dòng tiền xác nhận hồi phục.';
      zoneTone = 'success';
    } else if (distResPct <= 2.2) {
      zone = 'near_resistance';
      zoneLabel = 'Gần kháng cự';
      zoneHint = 'Còn ' + distResPct + '% tới kháng cự — ưu tiên quản trị vị thế ngắn hạn.';
      zoneTone = 'warning';
    } else if (distSupPct <= 2.2) {
      zone = 'near_support';
      zoneLabel = 'Gần hỗ trợ';
      zoneHint = 'Còn ' + distSupPct + '% tới hỗ trợ — có thể tích lũy nếu dòng tiền vào.';
      zoneTone = 'info';
    }

    var risks = [];
    var breadth = getBreadth('vnindex');
    if (breadth && breadth.down > breadth.up * 1.08) {
      risks.push({
        level: 'warning',
        icon: 'ti-arrows-down',
        title: 'Độ rộng yếu',
        detail: 'Mã giảm (' + breadth.down + ') vượt mã tăng (' + breadth.up + ') — áp lực bán lan tỏa.'
      });
    }
    if (breadth && breadth.ceiling_purple >= 12) {
      risks.push({
        level: 'warning',
        icon: 'ti-flame',
        title: 'FOMO tím trần',
        detail: breadth.ceiling_purple + ' mã trần — rủi ro đu đỉnh ngắn hạn cao.'
      });
    }

    var flow = snap.entities && snap.entities.flow;
    if (flow && flow.foreign && String(flow.foreign.net_label || '').indexOf('-') === 0) {
      risks.push({
        level: 'danger',
        icon: 'ti-world',
        title: 'Khối ngoại bán ròng',
        detail: 'NN ' + flow.foreign.net_label + ' — áp lực bán từ nhà đầu tư nước ngoài.'
      });
    }
    if (flow && flow.proprietary && String(flow.proprietary.net_label || '').indexOf('-') === 0) {
      risks.push({
        level: 'info',
        icon: 'ti-building-bank',
        title: 'Tự doanh bán ròng',
        detail: 'CTCK ' + flow.proprietary.net_label + ' — theo dõi hành vi tạo lập.'
      });
    }

    if (idx.change_pct != null && idx.change_pct >= 1.2 && zoneTone === 'danger') {
      risks.push({
        level: 'danger',
        icon: 'ti-alert-triangle',
        title: 'Rủi ro kép',
        detail: 'Tăng mạnh + sát kháng cự — dễ có nhịp rung lắc / chốt lời.'
      });
    }

    if (!risks.length) {
      risks.push({
        level: 'ok',
        icon: 'ti-circle-check',
        title: 'Không có rủi ro nổi bật',
        detail: 'Thị trường trong vùng an toàn tương đối — tiếp tục theo dõi dòng tiền.'
      });
    }

    return {
      index: { name: idx.name, value: price, change_pct: idx.change_pct },
      support: support,
      resistance: resistance,
      position: position,
      zone: zone,
      zoneLabel: zoneLabel,
      zoneHint: zoneHint,
      zoneTone: zoneTone,
      distResPct: distResPct,
      distSupPct: distSupPct,
      sessions: 15,
      risks: risks.slice(0, 4),
      updatedAt: snap.meta && snap.meta.clock_label ? snap.meta.clock_label : 'Realtime'
    };
  }

  syncSectorFromStocks();
  syncMarketClockMeta();

  document.addEventListener('iflux-core-config-changed', function () {
    _liqDayCache = {};
  });

  global.IfluxMockMarket = {
    getSnapshot: getSnapshot,
    getSrLevels: getSrLevels,
    getPriceVsSrPct: getPriceVsSrPct,
    getBreadth: getBreadth,
    getExchanges: getExchanges,
    getSectorPerf: getSectorPerf,
    getStockPriceState: getStockPriceState,
    getStock: getStock,
    getMarketCap: getMarketCap,
    formatMarketCap: formatMarketCap,
    getStockDetail: getStockDetail,
    getStockInfo: getStockInfo,
    getStockValuationSeries: getStockValuationSeries,
    getStockEvents: getStockEvents,
    getGroupDetail: getGroupDetail,
    getGroupChartData: getGroupChartData,
    getGroupNetFlow: getGroupNetFlow,
    getStockChartData: getStockChartData,
    getStockNetFlow: getStockNetFlow,
    getRefPrice: getRefPrice,
    getPriceChangeAbs: getPriceChangeAbs,
    getLiquiditySeries: getLiquiditySeries,
    getTradingClock: getTradingClock,
    isTradingActive: isTradingActive,
    msUntilNextLiquidityUpdate: msUntilNextLiquidityUpdate,
    getHeatmapGroups: getHeatmapGroups,
    getTop10Today: getTop10Today,
    groupPerformance: groupPerformance,
    getFlowTopNetList: getFlowTopNetList,
    getMarketFlowSummary: getMarketFlowSummary,
    getMarketZoneContext: getMarketZoneContext,
    formatFlowVolume: formatFlowVolume,
    tickRealtime: tickRealtime,
    SESSION_LABELS: SESSION_LABELS,
    getLiqSlots: getLiqSlots,
    getLiqUpdateMs: getLiqUpdateMs,
    getTickIntervalMs: function () { return sessionBounds().tickIntervalMs; }
  };
})(window);
