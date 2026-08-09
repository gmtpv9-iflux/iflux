'use strict';

/**
 * Time Configuration SoT — system_admin_kv.scope = core_setup.
 * Sync Engine MUST read this for WHEN (weekday + session + tick).
 */

const { query } = require('../../core/database/connection');
const { AppError } = require('../../shared/exceptions/app-error');

const VN_TZ = 'Asia/Ho_Chi_Minh';
const VN_WD = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

const DEFAULTS = {
  tick_interval_seconds: 12,
  liq_slot_minutes: 5,
  session_morning_start: '09:00',
  session_morning_end: '11:30',
  session_afternoon_start: '13:00',
  session_afternoon_end: '14:45',
  trading_weekdays: [1, 2, 3, 4, 5]
};

function pad2(n) {
  return n < 10 ? '0' + n : String(n);
}

function normalizeTimeInput(raw) {
  const s = String(raw || '').trim();
  const m = s.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  return pad2(h) + ':' + pad2(min);
}

function timeToMinutes(t) {
  const p = String(t || '0:0').split(':');
  return parseInt(p[0], 10) * 60 + parseInt(p[1], 10);
}

function normalizeTradingWeekdays(list) {
  if (!Array.isArray(list)) return DEFAULTS.trading_weekdays.slice();
  const seen = {};
  const out = [];
  list.forEach(function (d) {
    const n = Number(d);
    if (n >= 0 && n <= 6 && !seen[n]) {
      seen[n] = true;
      out.push(n);
    }
  });
  out.sort(function (a, b) {
    const order = [1, 2, 3, 4, 5, 6, 0];
    return order.indexOf(a) - order.indexOf(b);
  });
  return out.length ? out : DEFAULTS.trading_weekdays.slice();
}

function validateAndNormalize(raw) {
  const cfg = Object.assign({}, DEFAULTS, raw || {});
  const errors = [];
  ['session_morning_start', 'session_morning_end', 'session_afternoon_start', 'session_afternoon_end'].forEach(
    function (k) {
      const norm = normalizeTimeInput(cfg[k]);
      if (!norm) errors.push('Giờ không hợp lệ: ' + k);
      else cfg[k] = norm;
    }
  );
  if (timeToMinutes(cfg.session_morning_end) <= timeToMinutes(cfg.session_morning_start)) {
    errors.push('Phiên sáng: giờ kết thúc phải sau giờ bắt đầu');
  }
  if (timeToMinutes(cfg.session_afternoon_end) <= timeToMinutes(cfg.session_afternoon_start)) {
    errors.push('Phiên chiều: giờ kết thúc phải sau giờ bắt đầu');
  }
  if (timeToMinutes(cfg.session_afternoon_start) <= timeToMinutes(cfg.session_morning_end)) {
    errors.push('Phiên chiều phải bắt đầu sau khi kết thúc phiên sáng');
  }
  const tick = Number(cfg.tick_interval_seconds);
  if (!tick || tick < 1 || tick > 3600) errors.push('Nhịp update: từ 1 đến 3600 giây');
  else cfg.tick_interval_seconds = Math.floor(tick);
  const slot = Number(cfg.liq_slot_minutes);
  if (!slot || slot < 1 || slot > 60) errors.push('Slot thanh khoản: từ 1 đến 60 phút');
  else cfg.liq_slot_minutes = Math.floor(slot);
  cfg.trading_weekdays = normalizeTradingWeekdays(cfg.trading_weekdays);
  if (!cfg.trading_weekdays.length) errors.push('Chọn ít nhất một ngày giao dịch trong tuần');
  return { ok: !errors.length, errors: errors, cfg: cfg };
}

function getVietnamParts(date) {
  date = date || new Date();
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: VN_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    weekday: 'short'
  });
  const parts = { year: 0, month: 0, day: 0, hour: 0, minute: 0, weekday: 0 };
  fmt.formatToParts(date).forEach(function (p) {
    if (p.type === 'weekday') {
      parts.weekday = VN_WD[p.value] != null ? VN_WD[p.value] : 0;
    } else if (p.type !== 'literal') {
      parts[p.type] = parseInt(p.value, 10);
    }
  });
  parts.minutesOfDay = parts.hour * 60 + parts.minute;
  return parts;
}

function extractTimeFields(payload) {
  payload = payload || {};
  const keys = [
    'tick_interval_seconds',
    'liq_slot_minutes',
    'session_morning_start',
    'session_morning_end',
    'session_afternoon_start',
    'session_afternoon_end',
    'trading_weekdays'
  ];
  const out = {};
  keys.forEach(function (k) {
    if (payload[k] !== undefined && payload[k] !== null && payload[k] !== '') {
      out[k] = payload[k];
    }
  });
  return out;
}

async function getTimeConfig() {
  const res = await query(
    `SELECT payload FROM system_admin_kv WHERE scope = 'core_setup' AND code = 'primary' LIMIT 1`
  );
  const payload = (res.rows[0] && res.rows[0].payload) || {};
  const checked = validateAndNormalize(extractTimeFields(payload));
  return checked.cfg;
}

function mergeTimeIntoPayload(existingPayload, timePartial) {
  const base = Object.assign({}, existingPayload || {});
  const merged = Object.assign(
    {},
    extractTimeFields(base),
    extractTimeFields(timePartial || {})
  );
  const checked = validateAndNormalize(merged);
  if (!checked.ok) {
    throw AppError.badRequest('VALIDATION', checked.errors[0] || 'Cấu hình thời gian không hợp lệ');
  }
  Object.keys(checked.cfg).forEach(function (k) {
    base[k] = checked.cfg[k];
  });
  delete base.sync_enabled;
  return base;
}

function isTradingWeekday(now, cfg) {
  cfg = cfg || DEFAULTS;
  const days = normalizeTradingWeekdays(cfg.trading_weekdays);
  return days.indexOf(getVietnamParts(now || new Date()).weekday) >= 0;
}

function isTradingActive(now, cfg) {
  cfg = cfg || DEFAULTS;
  now = now || new Date();
  if (!isTradingWeekday(now, cfg)) return false;
  const mins = getVietnamParts(now).minutesOfDay;
  const amS = timeToMinutes(cfg.session_morning_start);
  const amE = timeToMinutes(cfg.session_morning_end);
  const pmS = timeToMinutes(cfg.session_afternoon_start);
  const pmE = timeToMinutes(cfg.session_afternoon_end);
  return (mins >= amS && mins <= amE) || (mins >= pmS && mins <= pmE);
}

module.exports = {
  DEFAULTS,
  VN_TZ,
  validateAndNormalize,
  getTimeConfig,
  mergeTimeIntoPayload,
  extractTimeFields,
  isTradingWeekday,
  isTradingActive,
  getVietnamParts
};
