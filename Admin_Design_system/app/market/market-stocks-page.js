/* ADM-MKT-000 — Stock Registry */
(function (global) {
  'use strict';

  var EXCHANGE_LABELS = { HOSE: 'HOSE', HSX: 'HOSE', HNX: 'HNX', UPCOM: 'UPCOM' };
  var CAP_LABELS = { large: 'Vốn hóa lớn', medium: 'Trung bình', mid: 'Trung bình', small: 'Nhỏ' };
  var STATUS_META = {
    active: { text: 'Hoạt động', chip: 'ix-chip-success' },
    halted: { text: 'Tạm ngưng', chip: 'ix-chip-warning' },
    delisted: { text: 'Hủy niêm yết', chip: 'ix-chip-danger' }
  };

  var editingTicker = null;
  var stocksData = [];
  var sectorsData = [];
  var ecosystemsData = [];

  function MKT() { return global.IfluxMarketQuotes; }
  var _mktObserver = null;
  var _quoteQueue = [];
  var _quoteTimer = null;

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function fmtMktPrice(n) {
    if (n == null || isNaN(n)) return '—';
    return Number(n).toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function stateColor(state) {
    if (state === 'up' || state === 'ceiling') return 'var(--ix-success)';
    if (state === 'down' || state === 'floor') return 'var(--ix-danger)';
    return 'var(--ix-warning)';
  }

  function priceCellHtml(q) {
    if (!q || q.price == null) return '<span style="color:var(--ix-text-muted)">—</span>';
    return '<strong style="color:' + stateColor(q.state) + '">' + fmtMktPrice(q.price) + '</strong>';
  }

  function changeCellHtml(q) {
    if (!q || q.pctChange == null) return '<span style="color:var(--ix-text-muted)">—</span>';
    var chip = (q.state === 'up' || q.state === 'ceiling') ? 'ix-chip-success'
      : (q.state === 'down' || q.state === 'floor') ? 'ix-chip-danger' : 'ix-chip-warning';
    var sign = q.change > 0 ? '+' : '';
    return '<span class="ix-chip ' + chip + '" style="font-size:12px">' +
      sign + Number(q.change).toFixed(2) + ' (' + sign + Number(q.pctChange).toFixed(2) + '%)</span>';
  }

  function miniOhlcHtml(rows) {
    if (!rows || !rows.length) return '<span style="color:var(--ix-text-muted)">—</span>';
    var data = rows.slice(-24);
    var W = 120, H = 34, n = data.length, cw = W / n;
    var hi = -Infinity, lo = Infinity;
    data.forEach(function (d) { if (d.high > hi) hi = d.high; if (d.low < lo) lo = d.low; });
    if (hi === lo) { hi += 1; lo -= 1; }
    function y(v) { return H - ((v - lo) / (hi - lo)) * H; }
    var body = data.map(function (d, i) {
      var x = i * cw + cw / 2;
      var col = d.close >= d.open ? 'var(--ix-success)' : 'var(--ix-danger)';
      var yo = y(d.open), yc = y(d.close), yh = y(d.high), yl = y(d.low);
      var top = Math.min(yo, yc), h = Math.max(1, Math.abs(yc - yo));
      var bw = Math.max(1, cw * 0.6);
      return '<line x1="' + x.toFixed(1) + '" y1="' + yh.toFixed(1) + '" x2="' + x.toFixed(1) + '" y2="' + yl.toFixed(1) + '" stroke="' + col + '" stroke-width="1"/>' +
        '<rect x="' + (x - bw / 2).toFixed(1) + '" y="' + top.toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + h.toFixed(1) + '" fill="' + col + '"/>';
    }).join('');
    return '<svg width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" style="display:block" role="img" aria-label="OHLC">' + body + '</svg>';
  }

  function rowByTicker(tk) {
    return document.querySelector('#adm-mkt-stocks-tbody tr[data-ticker="' + tk + '"]');
  }

  function flushQuotes() {
    var batch = _quoteQueue.splice(0, _quoteQueue.length);
    if (!batch.length || !MKT()) return;
    MKT().getQuotes(batch).then(function (map) {
      batch.forEach(function (tk) {
        var q = map[tk];
        var tr = rowByTicker(tk);
        if (!tr) return;
        var pc = tr.querySelector('[data-mkt-price]');
        var cc = tr.querySelector('[data-mkt-chg]');
        if (pc) pc.innerHTML = priceCellHtml(q);
        if (cc) cc.innerHTML = changeCellHtml(q);
      });
    });
  }

  function queueQuotes(tickers) {
    _quoteQueue = _quoteQueue.concat(tickers);
    if (_quoteTimer) clearTimeout(_quoteTimer);
    _quoteTimer = setTimeout(flushQuotes, 140);
  }

  function loadOhlcForRow(tr, tk) {
    if (!MKT()) return;
    MKT().getOHLC(tk, 40).then(function (rows) {
      var oc = tr.querySelector('[data-mkt-ohlc]');
      if (oc) oc.innerHTML = miniOhlcHtml(rows);
    });
  }

  function initMarketData() {
    if (!MKT()) return;
    if (_mktObserver) _mktObserver.disconnect();
    var rows = document.querySelectorAll('#adm-mkt-stocks-tbody tr[data-ticker]');
    if (!('IntersectionObserver' in global)) {
      var all = [];
      rows.forEach(function (tr) {
        var tk = tr.getAttribute('data-ticker');
        if (tk) { all.push(tk); loadOhlcForRow(tr, tk); }
      });
      if (all.length) queueQuotes(all);
      return;
    }
    _mktObserver = new IntersectionObserver(function (entries) {
      var toQuote = [];
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var tr = en.target;
        var tk = tr.getAttribute('data-ticker');
        if (!tk || tr._mktDone) return;
        tr._mktDone = true;
        _mktObserver.unobserve(tr);
        toQuote.push(tk);
        loadOhlcForRow(tr, tk);
      });
      if (toQuote.length) queueQuotes(toQuote);
    }, { rootMargin: '150px' });
    rows.forEach(function (tr) { _mktObserver.observe(tr); });
  }

  function toast(msg, type) {
    if (typeof global.ixToast === 'function') global.ixToast(msg, type || 'primary');
  }

  function fmtDate(iso) {
    if (!iso) return '—';
    try { return new Date(iso).toLocaleString('vi-VN'); } catch (e) { return iso; }
  }

  function fmtVnd(n) {
    if (n == null || n === '') return '—';
    return '₫' + Number(n).toLocaleString('vi-VN');
  }

  function normExchange(ex) {
    if (ex === 'HSX') return 'HOSE';
    return ex || '';
  }

  function apiFetch(url, options) {
    var token = '';
    try {
      var raw = localStorage.getItem('iflux_admin_session') || sessionStorage.getItem('iflux_admin_session');
      if (raw) token = JSON.parse(raw).token || '';
    } catch(e) {}
    var opts = options || {};
    opts.headers = opts.headers || {};
    if (token) opts.headers['Authorization'] = 'Bearer ' + token;
    return fetch(url, opts).then(function (r) {
      if (!r.ok) {
        return r.json().then(function(body) {
          var msg = (body && body.error && (body.error.message || body.error.code)) || ('API Error ' + r.status);
          throw new Error(msg + ' [' + r.status + ']');
        }).catch(function(e) {
          if (e.message && e.message.indexOf('[') !== -1) throw e;
          throw new Error('API Error ' + r.status);
        });
      }
      return r.json();
    });
  }

  function loadData() {
    var p1 = apiFetch('/api/admin/sectors').then(function(res) { sectorsData = res.data.sectors || res.data.items || []; });
    var p2 = apiFetch('/api/admin/ecosystems').then(function(res) { ecosystemsData = res.data.ecosystems || res.data.items || []; });
    var p3 = apiFetch('/api/admin/market/stocks').then(function(res) { stocksData = res.data.items || []; });
    
    Promise.all([p1, p2, p3]).then(function() {
      populateSectorFilters();
      populateEcosystemFilters();
      refresh();
    }).catch(function(err) {
      toast('Lỗi tải dữ liệu: ' + err.message, 'danger');
    });
  }

  function getFilters() {
    var f = {};
    var ex = (document.getElementById('adm-mkt-filter-exchange') || {}).value || '';
    var sec = (document.getElementById('adm-mkt-filter-sector') || {}).value || '';
    var eco = (document.getElementById('adm-mkt-filter-ecosystem') || {}).value || '';
    var cap = (document.getElementById('adm-mkt-filter-capTier') || {}).value || '';
    var st = (document.getElementById('adm-mkt-filter-status') || {}).value || '';
    var q = ((document.getElementById('adm-mkt-stocks-search') || {}).value || '').trim().toLowerCase();
    
    if (ex) f.exchange = ex;
    if (sec) f.sectorId = Number(sec);
    if (eco) f.ecosystemId = Number(eco);
    if (cap) f.capTier = cap;
    if (st) f.status = st;
    if (q) f.q = q;
    return f;
  }

  function getFilteredStocks() {
    var f = getFilters();
    return stocksData.filter(function(s) {
      if (f.exchange && normExchange(s.exchange) !== f.exchange) return false;
      if (f.sectorId && Number(s.sector_id) !== f.sectorId) return false;
      if (f.ecosystemId && Number(s.ecosystem_id) !== f.ecosystemId) return false;
      if (f.capTier) {
        var cg = s.cap_group || s.cap_tier || '';
        if (cg === 'mid') cg = 'medium';
        if (cg !== f.capTier) return false;
      }
      if (f.status && s.status !== f.status) return false;
      if (f.q) {
        var match = (s.ticker || '').toLowerCase().indexOf(f.q) > -1 || 
                    (s.name || '').toLowerCase().indexOf(f.q) > -1;
        if (!match) return false;
      }
      return true;
    });
  }

  function renderStats() {
    var all = stocksData;
    var active = all.filter(function (s) { return s.status === 'active'; }).length;
    var halted = all.filter(function (s) { return s.status === 'halted'; }).length;
    var map = {
      'adm-mkt-stat-total': String(all.length),
      'adm-mkt-stat-active': String(active),
      'adm-mkt-stat-halted': String(halted)
    };
    Object.keys(map).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.textContent = map[id];
    });
  }

  function sectorName(id) {
    if (!id) return '—';
    var sec = sectorsData.find(function(s) { return Number(s.id) === Number(id); });
    return sec ? sec.name : '—';
  }

  function ecosystemName(id) {
    if (!id) return '—';
    var eco = ecosystemsData.find(function(s) { return Number(s.id) === Number(id); });
    return eco ? eco.name : '—';
  }

  function populateSectorFilters() {
    var sel = document.getElementById('adm-mkt-filter-sector');
    if (!sel || sel.dataset.mktBound) return;
    sel.innerHTML = '<option value="">Tất cả ngành</option>' +
      sectorsData.map(function (s) {
        return '<option value="' + s.id + '">' + esc(s.name) + '</option>';
      }).join('');
    sel.dataset.mktBound = '1';
  }

  function populateEcosystemFilters() {
    var sel = document.getElementById('adm-mkt-filter-ecosystem');
    if (!sel || sel.dataset.mktBound) return;
    sel.innerHTML = '<option value="">Tất cả hệ sinh thái</option>' +
      ecosystemsData.map(function (s) {
        return '<option value="' + s.id + '">' + esc(s.name) + '</option>';
      }).join('');
    sel.dataset.mktBound = '1';
  }

  function populateEditSectorSelect(selectedId) {
    var sel = document.getElementById('adm-mkt-edit-sector');
    if (!sel) return;
    sel.innerHTML = '<option value="">-- Không chọn --</option>' + sectorsData.map(function (s) {
      return '<option value="' + s.id + '"' + (String(s.id) === String(selectedId) ? ' selected' : '') + '>' + esc(s.name) + '</option>';
    }).join('');
  }

  function populateEditEcosystemSelect(selectedId) {
    var sel = document.getElementById('adm-mkt-edit-ecosystem');
    if (!sel) return;
    sel.innerHTML = '<option value="">-- Không chọn --</option>' + ecosystemsData.map(function (s) {
      return '<option value="' + s.id + '"' + (String(s.id) === String(selectedId) ? ' selected' : '') + '>' + esc(s.name) + '</option>';
    }).join('');
  }

  function renderTable() {
    var tbody = document.getElementById('adm-mkt-stocks-tbody');
    if (!tbody) return;

    var list = getFilteredStocks();
    if (!list.length) {
      tbody.innerHTML = '<tr><td colspan="13" style="text-align:center;padding:32px;color:var(--ix-text-muted);font-size:13px">Không có mã phù hợp.</td></tr>';
      return;
    }

    tbody.innerHTML = list.map(function (s) {
      var st = STATUS_META[s.status] || { text: s.status, chip: 'ix-chip-primary' };
      var ex = EXCHANGE_LABELS[s.exchange] || s.exchange || '—';
      var capKey = s.cap_group || s.cap_tier || '';
      if (capKey === 'mid') capKey = 'medium';
      var cap = CAP_LABELS[capKey] || capKey || '—';
      var mcap = s.market_cap != null && s.market_cap !== '' ? fmtVnd(s.market_cap) : '—';
      return '<tr data-ticker="' + esc(s.ticker) + '">' +
        '<td><strong style="color:var(--ix-accent)">' + esc(s.ticker) + '</strong></td>' +
        '<td>' + esc(s.name) + '</td>' +
        '<td>' + esc(ex) + '</td>' +
        '<td>' + esc(s.sector_name || sectorName(s.sector_id)) + '</td>' +
        '<td>' + esc(s.ecosystem_name || ecosystemName(s.ecosystem_id)) + '</td>' +
        '<td data-mkt-price><span style="color:var(--ix-text-muted)">…</span></td>' +
        '<td data-mkt-chg><span style="color:var(--ix-text-muted)">…</span></td>' +
        '<td data-mkt-ohlc><span style="color:var(--ix-text-muted)">…</span></td>' +
        '<td style="font-size:12px">' + esc(mcap) + '</td>' +
        '<td><span class="ix-chip ix-chip-info" style="font-size:12px">' + esc(cap) + '</span></td>' +
        '<td><span class="ix-chip ' + st.chip + '">' + st.text + '</span></td>' +
        '<td style="font-size:12px;color:var(--ix-text-muted)">' + esc(fmtDate(s.updated_at)) + '</td>' +
        '<td><button type="button" class="ix-btn ix-btn-icon" data-adm-mkt-edit-stock="' + esc(s.ticker) + '" title="Sửa metadata"><i class="ti ti-edit" style="font-size:14px"></i></button></td>' +
      '</tr>';
    }).join('');
  }

  function openEdit(ticker) {
    var stock = stocksData.find(function(s) { return s.ticker === ticker; });
    if (!stock) {
      toast('Không tìm thấy mã ' + ticker, 'danger');
      return;
    }
    editingTicker = ticker;
    var tickerEl = document.getElementById('adm-mkt-edit-ticker');
    var nameEl = document.getElementById('adm-mkt-edit-name');
    var exEl = document.getElementById('adm-mkt-edit-exchange');
    var capEl = document.getElementById('adm-mkt-edit-capTier');
    var statusEl = document.getElementById('adm-mkt-edit-status');
    var descEl = document.getElementById('adm-mkt-edit-description');

    if (tickerEl) tickerEl.value = stock.ticker;
    if (nameEl) nameEl.value = stock.name || '';
    if (exEl) exEl.value = normExchange(stock.exchange) || 'HOSE';
    populateEditSectorSelect(stock.sector_id);
    populateEditEcosystemSelect(stock.ecosystem_id);
    if (capEl) {
      var cg = stock.cap_group || stock.cap_tier || '';
      if (cg === 'mid') cg = 'medium';
      capEl.value = cg || '';
    }
    if (statusEl) statusEl.value = stock.status || 'active';
    if (descEl) descEl.value = stock.description || '';

    if (typeof global.ixOpenOffcanvas === 'function') {
      global.ixOpenOffcanvas('offcanvas-edit-stock');
    } else if (typeof global.ixOpenModal === 'function') {
      global.ixOpenModal('modal-edit-stock');
    }
  }

  function saveEdit() {
    if (!editingTicker) return;
    var name = ((document.getElementById('adm-mkt-edit-name') || {}).value || '').trim();
    var exchange = (document.getElementById('adm-mkt-edit-exchange') || {}).value || 'HOSE';
    var sectorId = (document.getElementById('adm-mkt-edit-sector') || {}).value;
    var ecosystemId = (document.getElementById('adm-mkt-edit-ecosystem') || {}).value;
    var capTier = (document.getElementById('adm-mkt-edit-capTier') || {}).value || '';
    if (capTier === 'mid') capTier = 'medium';
    var status = (document.getElementById('adm-mkt-edit-status') || {}).value || 'active';
    var description = (document.getElementById('adm-mkt-edit-description') || {}).value || '';

    if (!name) {
      toast('Tên công ty là bắt buộc', 'danger');
      return;
    }

    var payload = {
      name: name,
      exchange: exchange,
      status: status,
      description: description,
      sector_id: sectorId ? Number(sectorId) : null,
      ecosystem_id: ecosystemId ? Number(ecosystemId) : null
    };
    if (capTier) payload.cap_group = capTier;

    var btn = document.getElementById('btn-adm-mkt-save-stock');
    if (btn) btn.disabled = true;

    apiFetch('/api/admin/market/stocks/' + editingTicker, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(function(res) {
      if (btn) btn.disabled = false;
      editingTicker = null;
      if (typeof global.ixCloseOffcanvas === 'function') global.ixCloseOffcanvas('offcanvas-edit-stock');
      if (typeof global.ixCloseModal === 'function') global.ixCloseModal('modal-edit-stock');
      toast('Đã cập nhật thành công', 'success');
      loadData(); // Reload
    }).catch(function(err) {
      if (btn) btn.disabled = false;
      toast('Lỗi cập nhật: ' + err.message, 'danger');
    });
  }

  function refresh() {
    renderStats();
    renderTable();
    initMarketData();
  }

  function bindEvents() {
    ['adm-mkt-filter-exchange', 'adm-mkt-filter-sector', 'adm-mkt-filter-ecosystem', 'adm-mkt-filter-capTier', 'adm-mkt-filter-status'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener('change', refresh);
    });
    var search = document.getElementById('adm-mkt-stocks-search');
    if (search) search.addEventListener('input', refresh);

    /* Delegated — offcanvas có thể bind trước/sau init; luôn bắt được Lưu/Đóng */
    document.addEventListener('click', function (e) {
      var saveBtn = e.target.closest('#btn-adm-mkt-save-stock');
      if (saveBtn) {
        e.preventDefault();
        saveEdit();
        return;
      }
      var cancelBtn = e.target.closest('#btn-adm-mkt-cancel-stock, #btn-adm-mkt-close-stock');
      if (cancelBtn) {
        editingTicker = null;
        return;
      }
      var btn = e.target.closest('[data-adm-mkt-edit-stock]');
      if (!btn) return;
      e.preventDefault();
      openEdit(btn.getAttribute('data-adm-mkt-edit-stock'));
    });
  }

  function init() {
    bindEvents();
    loadData();
  }

  global.AdmMarketStocks = { init: init, refresh: refresh };
})(window);
