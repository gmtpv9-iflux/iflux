/* ADM-SYS-010 — Thiết lập core */
(function (global) {
  'use strict';

  var Core = global.IfluxCoreConfig;

  function toast(msg, type) {
    if (typeof global.ixToast === 'function') global.ixToast(msg, type || 'primary');
  }

  function el(id) {
    return document.getElementById(id);
  }

  function ensureTradingDaysUI() {
    var wrap = el('core-trading-days');
    if (!wrap || wrap.dataset.bound) return;
    wrap.dataset.bound = '1';
    var meta = Core.getWeekdayMeta ? Core.getWeekdayMeta() : [];
    wrap.innerHTML = meta.map(function (w) {
      return '<label class="core-day-chip">' +
        '<input type="checkbox" class="ix-checkbox" data-core-weekday="' + w.day + '" />' +
        '<span>' + w.label + '</span></label>';
    }).join('');
  }

  function readTradingWeekdays() {
    var days = [];
    document.querySelectorAll('[data-core-weekday]').forEach(function (cb) {
      if (cb.checked) days.push(Number(cb.getAttribute('data-core-weekday')));
    });
    return days;
  }

  function fillTradingWeekdays(list) {
    list = Core.normalizeTradingWeekdays ? Core.normalizeTradingWeekdays(list) : (list || []);
    var set = {};
    list.forEach(function (d) { set[d] = true; });
    document.querySelectorAll('[data-core-weekday]').forEach(function (cb) {
      var d = Number(cb.getAttribute('data-core-weekday'));
      cb.checked = !!set[d];
    });
  }

  function readForm() {
    return {
      tick_interval_seconds: Number((el('core-tick-interval') || {}).value),
      liq_slot_minutes: Number((el('core-liq-slot') || {}).value),
      session_morning_start: (el('core-am-start') || {}).value,
      session_morning_end: (el('core-am-end') || {}).value,
      session_afternoon_start: (el('core-pm-start') || {}).value,
      session_afternoon_end: (el('core-pm-end') || {}).value,
      trading_weekdays: readTradingWeekdays()
    };
  }

  function fillForm(cfg) {
    cfg = cfg || Core.get();
    if (el('core-tick-interval')) el('core-tick-interval').value = cfg.tick_interval_seconds;
    if (el('core-liq-slot')) el('core-liq-slot').value = cfg.liq_slot_minutes;
    if (el('core-am-start')) el('core-am-start').value = cfg.session_morning_start;
    if (el('core-am-end')) el('core-am-end').value = cfg.session_morning_end;
    if (el('core-pm-start')) el('core-pm-start').value = cfg.session_afternoon_start;
    if (el('core-pm-end')) el('core-pm-end').value = cfg.session_afternoon_end;
    fillTradingWeekdays(cfg.trading_weekdays);
    renderStatus(cfg);
    renderTimeline(cfg);
  }

  function renderStatus(cfg) {
    var box = el('core-status-live');
    if (!box || !Core) return;
    var clock = Core.getTradingClock(new Date(), cfg);
    var b = Core.getSessionBounds(cfg);
    var poll = Core.shouldPollMarketData(new Date(), cfg);
    var daysLabel = Core.formatTradingWeekdays ? Core.formatTradingWeekdays(cfg) : '';
    box.innerHTML =
      '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:10px">' +
        '<span class="ix-chip ' + (poll ? 'ix-chip-success' : 'ix-chip-secondary') + '">' +
          (poll ? 'Đang trong phiên' : 'Ngoài phiên') +
        '</span>' +
        '<span style="font-size:13px;color:var(--ix-text-secondary)">' + Core.phaseLabel(clock.phase) + '</span>' +
      '</div>' +
      '<div style="font-size:12px;color:var(--ix-text-muted);line-height:1.6">' +
        'Ngày GD: <strong>' + (daysLabel || '—') + '</strong><br />' +
        'Nhịp poll API: <strong>' + b.tickIntervalMs / 1000 + 's</strong> · ' +
        'Slot KLGD/GTGD: <strong>' + b.slotMinutes + ' phút</strong> · ' +
        'Số slot/ngày: <strong>' + Core.buildLiqSlots(cfg).length + '</strong>' +
      '</div>';
  }

  function renderTimeline(cfg) {
    var box = el('core-session-timeline');
    if (!box || !Core) return;
    cfg = cfg || Core.get();
    var offDays = Core.getWeekdayMeta().filter(function (w) {
      return Core.normalizeTradingWeekdays(cfg.trading_weekdays).indexOf(w.day) < 0;
    });
    var rows = [];
    if (offDays.length) {
      rows.push({
        label: 'Ngày nghỉ',
        range: offDays.map(function (w) { return w.full; }).join(', '),
        poll: false
      });
    }
    rows = rows.concat([
      { label: 'Trước phiên', range: '00:00 – ' + cfg.session_morning_start, poll: false },
      { label: 'Phiên sáng', range: cfg.session_morning_start + ' – ' + cfg.session_morning_end, poll: true },
      { label: 'Nghỉ trưa', range: cfg.session_morning_end + ' – ' + cfg.session_afternoon_start, poll: false },
      { label: 'Phiên chiều', range: cfg.session_afternoon_start + ' – ' + cfg.session_afternoon_end, poll: true },
      { label: 'Sau phiên', range: 'Sau ' + cfg.session_afternoon_end, poll: false }
    ]);
    box.innerHTML = rows.map(function (r) {
      return '<div class="core-tl-row">' +
        '<span class="core-tl-row__label">' + r.label + '</span>' +
        '<span class="core-tl-row__range">' + r.range + '</span>' +
        '<span class="ix-chip ' + (r.poll ? 'ix-chip-success' : 'ix-chip-secondary') + '" style="font-size:11px">' +
          (r.poll ? 'Gọi API' : 'Không gọi') +
        '</span>' +
      '</div>';
    }).join('');
  }

  function previewDraft() {
    renderStatus(readForm());
    renderTimeline(readForm());
  }

  function save() {
    if (!Core) {
      toast('Thiếu IfluxCoreConfig', 'danger');
      return;
    }
    var draft = readForm();
    ['session_morning_start', 'session_morning_end', 'session_afternoon_start', 'session_afternoon_end'].forEach(function (k) {
      var norm = Core.normalizeTimeInput(draft[k]);
      if (norm) draft[k] = norm;
    });
    var result = Core.validate(draft);
    if (!result.ok) {
      toast(result.errors[0], 'warning');
      return;
    }
    Core.save(result.cfg);
    fillForm(result.cfg);
    toast('Đã lưu thiết lập core', 'success');
  }

  function resetDefaults() {
    if (!Core) return;
    Core.save(Object.assign({}, Core.DEFAULTS, { trading_weekdays: Core.DEFAULTS.trading_weekdays.slice() }));
    fillForm(Core.DEFAULTS);
    toast('Đã khôi phục mặc định', 'info');
  }

  function bind() {
    var saveBtn = el('core-btn-save');
    if (saveBtn) saveBtn.addEventListener('click', save);
    var resetBtn = el('core-btn-reset');
    if (resetBtn) resetBtn.addEventListener('click', resetDefaults);
    ['core-tick-interval', 'core-liq-slot', 'core-am-start', 'core-am-end', 'core-pm-start', 'core-pm-end'].forEach(function (id) {
      var node = el(id);
      if (!node) return;
      node.addEventListener('input', previewDraft);
    });
    document.querySelectorAll('[data-core-weekday]').forEach(function (cb) {
      cb.addEventListener('change', previewDraft);
    });
  }

  function init() {
    if (!Core) {
      toast('Thiếu core-setup-catalog.js', 'danger');
      return;
    }
    ensureTradingDaysUI();
    fillForm(Core.get());
    bind();
  }

  global.AdmCoreSetupPage = { init: init };
})(window);
