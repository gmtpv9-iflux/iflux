/* Market — Cấu hình thời gian (Time SoT server-side + Sync Cycle ops) */
(function (global) {
  'use strict';

  var Core = global.IfluxCoreConfig;

  function toast(msg, type) {
    if (typeof global.ixToast === 'function') global.ixToast(msg, type || 'primary');
  }

  function el(id) {
    return document.getElementById(id);
  }

  function apiBase() {
    if (global.IfluxAdminAuth && IfluxAdminAuth.apiBase) return IfluxAdminAuth.apiBase();
    return '/api';
  }

  function adminToken() {
    if (global.IfluxAdminAuth && IfluxAdminAuth.getSession) {
      var s = IfluxAdminAuth.getSession();
      if (s && s.token) return s.token;
    }
    try {
      var raw = localStorage.getItem('iflux_admin_session') || sessionStorage.getItem('iflux_admin_session');
      if (raw) {
        var obj = JSON.parse(raw);
        if (obj && obj.token) return obj.token;
      }
    } catch (e) { /* ignore */ }
    return null;
  }

  function authHeaders() {
    var h = { 'Content-Type': 'application/json', Accept: 'application/json' };
    var token = adminToken();
    if (token) {
      h.Authorization = 'Bearer ' + token;
      return h;
    }
    h['X-Admin-Key'] = 'iflux-admin-local-dev';
    return h;
  }

  function unwrap(data) {
    if (data && data.data) return data.data;
    return data || {};
  }

  function request(path, options) {
    options = options || {};
    return fetch(apiBase() + path, {
      method: options.method || 'GET',
      headers: Object.assign(authHeaders(), options.headers || {}),
      body: options.body != null ? JSON.stringify(options.body) : undefined
    }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (data) {
        if (!res.ok) {
          var err = data.error;
          throw new Error((err && err.message) || data.message || ('HTTP ' + res.status));
        }
        return unwrap(data);
      });
    });
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function fmtDate(iso) {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleString('vi-VN');
    } catch (e) {
      return String(iso);
    }
  }

  function fmtNum(v) {
    if (v == null || v === '') return '—';
    var n = Number(v);
    if (!Number.isFinite(n)) return esc(v);
    return n.toLocaleString('vi-VN');
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
        'Nhịp Sync Cycle: <strong>' + b.tickIntervalMs / 1000 + 's</strong> · ' +
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
          (r.poll ? 'Sync' : 'Không sync') +
        '</span>' +
      '</div>';
    }).join('');
  }

  function previewDraft() {
    renderStatus(readForm());
    renderTimeline(readForm());
  }

  function timePayloadFromItem(item) {
    var p = (item && item.payload) || item || {};
    return {
      tick_interval_seconds: p.tick_interval_seconds,
      liq_slot_minutes: p.liq_slot_minutes,
      session_morning_start: p.session_morning_start,
      session_morning_end: p.session_morning_end,
      session_afternoon_start: p.session_afternoon_start,
      session_afternoon_end: p.session_afternoon_end,
      trading_weekdays: p.trading_weekdays
    };
  }

  function loadTimeConfig() {
    return request('/admin/system/core-setup').then(function (data) {
      var tc = data.time_config || timePayloadFromItem(data.item);
      var cfg = Core.applyServerConfig(tc);
      fillForm(cfg);
      return cfg;
    });
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
    request('/admin/system/core-setup', {
      method: 'PATCH',
      body: { payload: result.cfg }
    }).then(function (data) {
      var tc = data.time_config || timePayloadFromItem(data.item);
      var cfg = Core.applyServerConfig(tc);
      fillForm(cfg);
      toast('Đã lưu Cấu hình thời gian', 'success');
    }).catch(function (e) {
      toast(e.message || 'Lỗi lưu', 'danger');
    });
  }

  function resetDefaults() {
    if (!Core) return;
    var payload = Object.assign({}, Core.DEFAULTS, {
      trading_weekdays: Core.DEFAULTS.trading_weekdays.slice()
    });
    request('/admin/system/core-setup', {
      method: 'PATCH',
      body: { payload: payload }
    }).then(function (data) {
      var tc = data.time_config || timePayloadFromItem(data.item);
      fillForm(Core.applyServerConfig(tc));
      toast('Đã khôi phục mặc định', 'info');
    }).catch(function (e) {
      toast(e.message || 'Lỗi', 'danger');
    });
  }

  function renderRuns(items) {
    var tb = el('adm-price-runs-tbody');
    if (!tb) return;
    if (!items || !items.length) {
      tb.innerHTML = '<tr><td colspan="5" class="ix-caption" style="text-align:center;padding:20px">Chưa có Sync Cycle.</td></tr>';
      return;
    }
    tb.innerHTML = items.slice(0, 30).map(function (r) {
      return '<tr>' +
        '<td class="ix-caption">' + esc(fmtDate(r.started_at)) + '</td>' +
        '<td class="ix-caption">' + esc(fmtDate(r.completed_at)) + '</td>' +
        '<td>' + esc(r.status) + '</td>' +
        '<td>' + esc(r.records_processed != null ? r.records_processed : '—') + '</td>' +
        '<td class="ix-caption">' + esc(r.error || '—') + '</td>' +
      '</tr>';
    }).join('');
  }

  function renderPrices(items) {
    var tb = el('adm-price-tbody');
    var count = el('adm-price-count');
    if (count) count.textContent = String((items && items.length) || 0);
    if (!tb) return;
    if (!items || !items.length) {
      tb.innerHTML = '<tr><td colspan="12" class="ix-caption" style="text-align:center;padding:20px">Chưa có dữ liệu giá. Bấm Đồng bộ ngay.</td></tr>';
      return;
    }
    tb.innerHTML = items.map(function (r) {
      var dateStr = r.trading_date
        ? (typeof r.trading_date === 'string' ? r.trading_date.slice(0, 10) : String(r.trading_date).slice(0, 10))
        : '—';
      return '<tr>' +
        '<td><strong>' + esc(r.ticker) + '</strong></td>' +
        '<td class="ix-caption">' + esc(dateStr) + '</td>' +
        '<td>' + fmtNum(r.open) + '</td>' +
        '<td>' + fmtNum(r.high) + '</td>' +
        '<td>' + fmtNum(r.low) + '</td>' +
        '<td><strong>' + fmtNum(r.close) + '</strong></td>' +
        '<td>' + fmtNum(r.volume) + '</td>' +
        '<td>' + fmtNum(r.trading_value) + '</td>' +
        '<td>' + fmtNum(r.price_change) + '</td>' +
        '<td>' + fmtNum(r.price_change_percent) + '</td>' +
        '<td class="ix-caption"><code>' + esc(r.source) + '</code></td>' +
        '<td class="ix-caption">' + esc(fmtDate(r.updated_at)) + '</td>' +
      '</tr>';
    }).join('');
  }

  function renderSyncMeta(cfg) {
    var meta = el('adm-price-sync-meta');
    if (!meta || !cfg) return;
    meta.innerHTML =
      'Lần cuối: <strong>' + esc(fmtDate(cfg.last_sync_at)) + '</strong> · ' +
      'Lần tới: <strong>' + esc(fmtDate(cfg.next_sync_at)) + '</strong> · ' +
      'Kết quả: <strong>' + esc(cfg.last_result || '—') + '</strong> · ' +
      'Bản ghi: <strong>' + esc(cfg.last_records_synced != null ? cfg.last_records_synced : '—') + '</strong>' +
      (cfg.last_error ? (' · Lỗi: ' + esc(cfg.last_error)) : '');
  }

  function loadOps() {
    var qEl = el('adm-price-search');
    var q = qEl ? (qEl.value || '').trim() : '';
    var pricePath = '/admin/market/price-sync/prices?limit=200' + (q ? '&q=' + encodeURIComponent(q) : '');
    return Promise.all([
      request('/admin/market/price-sync/sync-config'),
      request('/admin/market/price-sync/sync-runs?limit=30'),
      request(pricePath)
    ]).then(function (parts) {
      renderSyncMeta((parts[0] && parts[0].config) || null);
      renderRuns((parts[1] && parts[1].items) || []);
      renderPrices((parts[2] && parts[2].items) || []);
    }).catch(function (err) {
      toast(err.message || 'Không tải được Sync Cycle', 'danger');
    });
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
    var syncNow = el('btn-adm-price-sync-now');
    if (syncNow) {
      syncNow.addEventListener('click', function () {
        syncNow.disabled = true;
        request('/admin/market/price-sync/sync-now', { method: 'POST', body: {} })
          .then(function (out) {
            if (out && out.status === 'error') {
              toast(out.error || 'Sync lỗi', 'danger');
            } else {
              toast('Đã chạy Sync Cycle · ' + (out.records_processed || 0) + ' bản ghi', 'success');
            }
            return loadOps();
          })
          .catch(function (e) {
            toast(e.message || 'Sync lỗi', 'danger');
          })
          .then(function () {
            syncNow.disabled = false;
          });
      });
    }
    var search = el('adm-price-search');
    var searchTimer = null;
    if (search) {
      search.addEventListener('input', function () {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(loadOps, 250);
      });
    }
  }

  function init() {
    if (!Core) {
      toast('Thiếu cau-hinh-thoi-gian-catalog.js', 'danger');
      return;
    }
    ensureTradingDaysUI();
    fillForm(Core.get());
    bind();
    loadTimeConfig()
      .catch(function (e) {
        toast(e.message || 'Không tải được Cấu hình thời gian từ server — đang dùng mặc định', 'warning');
      })
      .then(function () {
        return loadOps();
      });
    if (global.IfluxAdminAuth && IfluxAdminAuth.whenReady) {
      IfluxAdminAuth.whenReady(function () {
        loadTimeConfig().then(loadOps);
      });
    }
  }

  global.AdmCoreSetupPage = { init: init };
})(window);
