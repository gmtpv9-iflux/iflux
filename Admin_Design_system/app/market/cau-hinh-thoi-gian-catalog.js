/**
 * Market — Cấu hình thời gian (nhịp update · giờ giao dịch)
 */
(function (global) {
  'use strict';

  var STORAGE_KEY = 'iflux_core_config_v1'; /* cache đọc tạm — không authoritative */
  var _serverCfg = null;

  var DEFAULTS = {
    tick_interval_seconds: 12,
    liq_slot_minutes: 5,
    session_morning_start: '09:00',
    session_morning_end: '11:30',
    session_afternoon_start: '13:00',
    session_afternoon_end: '14:45',
    /* getDay(): 0=CN, 1=T2 … 6=T7 — mặc định T2–T6 giao dịch */
    trading_weekdays: [1, 2, 3, 4, 5]
  };

  var WEEKDAY_META = [
    { day: 1, label: 'T2', full: 'Thứ 2' },
    { day: 2, label: 'T3', full: 'Thứ 3' },
    { day: 3, label: 'T4', full: 'Thứ 4' },
    { day: 4, label: 'T5', full: 'Thứ 5' },
    { day: 5, label: 'T6', full: 'Thứ 6' },
    { day: 6, label: 'T7', full: 'Thứ 7' },
    { day: 0, label: 'CN', full: 'Chủ Nhật' }
  ];

  var VN_TZ = 'Asia/Ho_Chi_Minh';
  var VN_WD = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

  function pad2(n) {
    return n < 10 ? '0' + n : String(n);
  }

  function timeToMinutes(t) {
    var p = String(t || '0:0').split(':');
    return parseInt(p[0], 10) * 60 + parseInt(p[1], 10);
  }

  function minutesToTime(m) {
    return pad2(Math.floor(m / 60)) + ':' + pad2(m % 60);
  }

  function normalizeTimeInput(raw) {
    var s = String(raw || '').trim();
    var m = s.match(/^(\d{1,2}):(\d{2})$/);
    if (!m) return null;
    var h = parseInt(m[1], 10);
    var min = parseInt(m[2], 10);
    if (h < 0 || h > 23 || min < 0 || min > 59) return null;
    return pad2(h) + ':' + pad2(min);
  }

  function getVietnamParts(date) {
    date = date || new Date();
    var fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: VN_TZ,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      weekday: 'short'
    });
    var parts = { year: 0, month: 0, day: 0, hour: 0, minute: 0, weekday: 0 };
    fmt.formatToParts(date).forEach(function (p) {
      if (p.type === 'weekday') {
        parts.weekday = VN_WD[p.value] != null ? VN_WD[p.value] : 0;
      } else if (p.type !== 'literal') {
        parts[p.type] = parseInt(p.value, 10);
      }
    });
    parts.dateKey = parts.year + '-' + pad2(parts.month) + '-' + pad2(parts.day);
    parts.minutesOfDay = parts.hour * 60 + parts.minute;
    return parts;
  }

  function vnDateFromParts(parts, hour, minute) {
    hour = hour != null ? hour : parts.hour;
    minute = minute != null ? minute : parts.minute;
    return new Date(Date.UTC(parts.year, parts.month - 1, parts.day, hour - 7, minute, 0));
  }

  function shiftVnCalendarDays(parts, delta) {
    var d = vnDateFromParts(parts, 12, 0);
    return getVietnamParts(new Date(d.getTime() + delta * 86400000));
  }

  function findLastTradingDayParts(fromParts, cfg) {
    cfg = cfg || getConfig();
    var days = normalizeTradingWeekdays(cfg.trading_weekdays);
    var p = fromParts;
    var i;
    for (i = 0; i < 14; i++) {
      if (days.indexOf(p.weekday) >= 0) return p;
      p = shiftVnCalendarDays(p, -1);
    }
    return fromParts;
  }

  function resolveStatsTradingContext(now, cfg) {
    cfg = cfg || getConfig();
    now = now || new Date();
    var vp = getVietnamParts(now);
    var b = getSessionBounds(cfg);
    var closeMins = b.afternoonEnd;
    var closeTime = minutesToTime(closeMins);
    var closedClock = { phase: 'post', cutoffMinutes: closeMins, cutoffTime: closeTime };

    if (!isTradingWeekday(now, cfg)) {
      var refOff = findLastTradingDayParts(shiftVnCalendarDays(vp, -1), cfg);
      return {
        live: false,
        referenceParts: refOff,
        referenceDateKey: refOff.dateKey,
        referenceDate: vnDateFromParts(refOff, 12, 0),
        clock: closedClock,
        statsDayLabel: refOff.dateKey
      };
    }

    var clock = getTradingClock(now, cfg);
    if (clock.phase === 'am' || clock.phase === 'pm') {
      return {
        live: true,
        referenceParts: vp,
        referenceDateKey: vp.dateKey,
        referenceDate: now,
        clock: clock,
        statsDayLabel: vp.dateKey
      };
    }

    if (clock.phase === 'pre') {
      var refPre = findLastTradingDayParts(shiftVnCalendarDays(vp, -1), cfg);
      return {
        live: false,
        referenceParts: refPre,
        referenceDateKey: refPre.dateKey,
        referenceDate: vnDateFromParts(refPre, 12, 0),
        clock: closedClock,
        statsDayLabel: refPre.dateKey
      };
    }

    if (clock.phase === 'lunch' || clock.phase === 'post') {
      return {
        live: false,
        referenceParts: vp,
        referenceDateKey: vp.dateKey,
        referenceDate: vnDateFromParts(vp, 12, 0),
        clock: clock,
        statsDayLabel: vp.dateKey
      };
    }

    return {
      live: false,
      referenceParts: vp,
      referenceDateKey: vp.dateKey,
      referenceDate: vnDateFromParts(vp, 12, 0),
      clock: clock,
      statsDayLabel: vp.dateKey
    };
  }

  function getConfig() {
    if (_serverCfg) {
      return Object.assign({}, DEFAULTS, _serverCfg, {
        trading_weekdays: normalizeTradingWeekdays(_serverCfg.trading_weekdays)
      });
    }
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      var cfg = Object.assign({}, DEFAULTS, raw ? JSON.parse(raw) : {});
      cfg.trading_weekdays = normalizeTradingWeekdays(cfg.trading_weekdays);
      return cfg;
    } catch (e) {
      return Object.assign({}, DEFAULTS, { trading_weekdays: DEFAULTS.trading_weekdays.slice() });
    }
  }

  function applyServerConfig(payload) {
    var checked = validate(Object.assign({}, DEFAULTS, payload || {}));
    _serverCfg = checked.cfg;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(_serverCfg));
    } catch (e) { /* ignore cache */ }
    if (typeof document !== 'undefined') {
      document.dispatchEvent(new CustomEvent('iflux-core-config-changed', { detail: _serverCfg }));
    }
    return _serverCfg;
  }

  function normalizeTradingWeekdays(list) {
    if (!Array.isArray(list)) return DEFAULTS.trading_weekdays.slice();
    var seen = {};
    var out = [];
    list.forEach(function (d) {
      var n = Number(d);
      if (n >= 0 && n <= 6 && !seen[n]) {
        seen[n] = true;
        out.push(n);
      }
    });
    out.sort(function (a, b) {
      var order = [1, 2, 3, 4, 5, 6, 0];
      return order.indexOf(a) - order.indexOf(b);
    });
    return out.length ? out : DEFAULTS.trading_weekdays.slice();
  }

  function isTradingWeekday(now, cfg) {
    now = now || new Date();
    cfg = cfg || getConfig();
    var days = normalizeTradingWeekdays(cfg.trading_weekdays);
    return days.indexOf(getVietnamParts(now).weekday) >= 0;
  }

  function formatTradingWeekdays(cfg) {
    cfg = cfg || getConfig();
    var set = {};
    normalizeTradingWeekdays(cfg.trading_weekdays).forEach(function (d) { set[d] = true; });
    return WEEKDAY_META.filter(function (w) { return set[w.day]; }).map(function (w) { return w.full; }).join(', ');
  }

  function getWeekdayMeta() {
    return WEEKDAY_META.slice();
  }

  function saveConfig(partial) {
    /* Chỉ cập nhật cache local — authority = API core-setup (page.js) */
    var next = Object.assign({}, getConfig(), partial || {});
    if (partial && Object.prototype.hasOwnProperty.call(partial, 'trading_weekdays')) {
      next.trading_weekdays = normalizeTradingWeekdays(partial.trading_weekdays);
    }
    return applyServerConfig(next);
  }

  function getSessionBounds(cfg) {
    cfg = cfg || getConfig();
    return {
      morningStart: timeToMinutes(cfg.session_morning_start),
      morningEnd: timeToMinutes(cfg.session_morning_end),
      afternoonStart: timeToMinutes(cfg.session_afternoon_start),
      afternoonEnd: timeToMinutes(cfg.session_afternoon_end),
      slotMinutes: Math.max(1, Number(cfg.liq_slot_minutes) || DEFAULTS.liq_slot_minutes),
      tickIntervalMs: Math.max(1000, (Number(cfg.tick_interval_seconds) || DEFAULTS.tick_interval_seconds) * 1000)
    };
  }

  function buildLiqSlots(cfg) {
    var b = getSessionBounds(cfg);
    var slots = [];
    var m;
    for (m = b.morningStart; m <= b.morningEnd; m += b.slotMinutes) {
      slots.push(minutesToTime(m));
    }
    for (m = b.afternoonStart; m <= b.afternoonEnd; m += b.slotMinutes) {
      slots.push(minutesToTime(m));
    }
    return slots;
  }

  function getTradingClock(now, cfg) {
    now = now || new Date();
    cfg = cfg || getConfig();
    if (!isTradingWeekday(now, cfg)) {
      return { phase: 'weekend', cutoffMinutes: null, cutoffTime: null };
    }
    var b = getSessionBounds(cfg);
    var vp = getVietnamParts(now);
    var mins = vp.minutesOfDay;
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

  function isTradingActive(now, cfg) {
    if (!isTradingWeekday(now, cfg)) return false;
    var phase = getTradingClock(now, cfg).phase;
    return phase === 'am' || phase === 'pm';
  }

  function shouldPollMarketData(now, cfg) {
    return isTradingActive(now, cfg);
  }

  function validate(cfg) {
    cfg = Object.assign({}, DEFAULTS, cfg || {});
    var errors = [];
    var times = [
      ['session_morning_start', cfg.session_morning_start],
      ['session_morning_end', cfg.session_morning_end],
      ['session_afternoon_start', cfg.session_afternoon_start],
      ['session_afternoon_end', cfg.session_afternoon_end]
    ];
    times.forEach(function (pair) {
      if (!normalizeTimeInput(pair[1])) errors.push('Giờ không hợp lệ: ' + pair[0]);
    });
    if (timeToMinutes(cfg.session_morning_end) <= timeToMinutes(cfg.session_morning_start)) {
      errors.push('Phiên sáng: giờ kết thúc phải sau giờ bắt đầu');
    }
    if (timeToMinutes(cfg.session_afternoon_end) <= timeToMinutes(cfg.session_afternoon_start)) {
      errors.push('Phiên chiều: giờ kết thúc phải sau giờ bắt đầu');
    }
    if (timeToMinutes(cfg.session_afternoon_start) <= timeToMinutes(cfg.session_morning_end)) {
      errors.push('Phiên chiều phải bắt đầu sau khi kết thúc phiên sáng');
    }
    var tick = Number(cfg.tick_interval_seconds);
    if (!tick || tick < 1 || tick > 3600) errors.push('Nhịp update: từ 1 đến 3600 giây');
    var slot = Number(cfg.liq_slot_minutes);
    if (!slot || slot < 1 || slot > 60) errors.push('Slot thanh khoản: từ 1 đến 60 phút');
    var days = normalizeTradingWeekdays(cfg.trading_weekdays);
    if (!days.length) errors.push('Chọn ít nhất một ngày giao dịch trong tuần');
    cfg.trading_weekdays = days;
    return { ok: !errors.length, errors: errors, cfg: cfg };
  }

  function phaseLabel(phase) {
    if (phase === 'weekend') return 'Ngày nghỉ (T7/CN) — không gọi API';
    if (phase === 'pre') return 'Trước giờ mở cửa — không gọi API';
    if (phase === 'lunch') return 'Nghỉ trưa — không gọi API';
    if (phase === 'post') return 'Hết phiên — không gọi API';
    return 'Trong phiên — hệ thống poll dữ liệu';
  }

  global.IfluxCoreConfig = {
    STORAGE_KEY: STORAGE_KEY,
    DEFAULTS: DEFAULTS,
    get: getConfig,
    save: saveConfig,
    applyServerConfig: applyServerConfig,
    validate: validate,
    getSessionBounds: getSessionBounds,
    buildLiqSlots: buildLiqSlots,
    getTradingClock: getTradingClock,
    isTradingActive: isTradingActive,
    isTradingWeekday: isTradingWeekday,
    normalizeTradingWeekdays: normalizeTradingWeekdays,
    formatTradingWeekdays: formatTradingWeekdays,
    getWeekdayMeta: getWeekdayMeta,
    getVietnamParts: getVietnamParts,
    vnDateFromParts: vnDateFromParts,
    resolveStatsTradingContext: resolveStatsTradingContext,
    findLastTradingDayParts: findLastTradingDayParts,
    VN_TZ: VN_TZ,
    shouldPollMarketData: shouldPollMarketData,
    phaseLabel: phaseLabel,
    timeToMinutes: timeToMinutes,
    minutesToTime: minutesToTime,
    normalizeTimeInput: normalizeTimeInput
  };
})(window);
