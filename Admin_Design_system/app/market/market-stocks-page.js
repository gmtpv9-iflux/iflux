/* ADM-MKT-000 — Stock Registry */
(function (global) {
  'use strict';

  var Store = global.IfluxMarketRegistryStore;

  var EXCHANGE_LABELS = { HOSE: 'HOSE', HSX: 'HOSE', HNX: 'HNX', UPCOM: 'UPCOM' };
  var CAP_LABELS = { large: 'Vốn hóa lớn', mid: 'Trung bình', small: 'Nhỏ' };
  var STATUS_META = {
    active: { text: 'Hoạt động', chip: 'ix-chip-success' },
    halted: { text: 'Tạm ngưng', chip: 'ix-chip-warning' },
    delisted: { text: 'Hủy niêm yết', chip: 'ix-chip-danger' }
  };

  var editingTicker = null;

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
    if (Store && typeof Store.formatVnd === 'function') return Store.formatVnd(n);
    return '₫' + Number(n).toLocaleString('vi-VN');
  }

  function normExchange(ex) {
    if (ex === 'HSX') return 'HOSE';
    return ex || '';
  }

  function getFilters() {
    var f = {};
    var ex = (document.getElementById('adm-mkt-filter-exchange') || {}).value || '';
    var sec = (document.getElementById('adm-mkt-filter-sector') || {}).value || '';
    var cap = (document.getElementById('adm-mkt-filter-capTier') || {}).value || '';
    var st = (document.getElementById('adm-mkt-filter-status') || {}).value || '';
    var q = ((document.getElementById('adm-mkt-stocks-search') || {}).value || '').trim().toLowerCase();
    if (ex) f.exchange = ex;
    if (sec) f.sectorId = sec;
    if (cap) f.capTier = cap;
    if (st) f.status = st;
    if (q) f.q = q;
    return f;
  }

  function renderStats() {
    if (!Store) return;
    var all = Store.listStocks({});
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
    if (!Store || !id) return '—';
    var sec = Store.getSector(Number(id));
    return sec ? sec.name : '—';
  }

  function populateSectorFilters() {
    if (!Store) return;
    var sel = document.getElementById('adm-mkt-filter-sector');
    if (!sel || sel.dataset.mktBound) return;
    var current = sel.value;
    sel.innerHTML = '<option value="">Tất cả ngành</option>' +
      Store.listSectors().map(function (s) {
        return '<option value="' + s.id + '">' + esc(s.name) + '</option>';
      }).join('');
    if (current) sel.value = current;
    sel.dataset.mktBound = '1';
  }

  function populateEditSectorSelect(selectedId) {
    if (!Store) return;
    var sel = document.getElementById('adm-mkt-edit-sector');
    if (!sel) return;
    sel.innerHTML = Store.listSectors().map(function (s) {
      return '<option value="' + s.id + '"' + (String(s.id) === String(selectedId) ? ' selected' : '') + '>' + esc(s.name) + '</option>';
    }).join('');
  }

  function renderTable() {
    if (!Store) return;
    var tbody = document.getElementById('adm-mkt-stocks-tbody');
    if (!tbody) return;

    var list = Store.listStocks(getFilters());
    if (!list.length) {
      tbody.innerHTML = '<tr><td colspan="12" style="text-align:center;padding:32px;color:var(--ix-text-muted);font-size:13px">Không có mã phù hợp.</td></tr>';
      return;
    }

    tbody.innerHTML = list.map(function (s) {
      var st = STATUS_META[s.status] || { text: s.status, chip: 'ix-chip-primary' };
      var ex = EXCHANGE_LABELS[s.exchange] || s.exchange || '—';
      var cap = CAP_LABELS[s.capTier] || s.capTier || '—';
      return '<tr data-ticker="' + esc(s.ticker) + '">' +
        '<td><strong style="color:var(--ix-accent)">' + esc(s.ticker) + '</strong></td>' +
        '<td>' + esc(s.name) + '</td>' +
        '<td>' + esc(ex) + '</td>' +
        '<td>' + esc(sectorName(s.sectorId)) + '</td>' +
        '<td data-mkt-price><span style="color:var(--ix-text-muted)">…</span></td>' +
        '<td data-mkt-chg><span style="color:var(--ix-text-muted)">…</span></td>' +
        '<td data-mkt-ohlc><span style="color:var(--ix-text-muted)">…</span></td>' +
        '<td><span class="ix-chip ix-chip-info" style="font-size:12px">' + esc(cap) + '</span></td>' +
        '<td style="font-size:12px;color:var(--ix-text-muted)">' + esc(fmtVnd(s.lotThreshold)) + '</td>' +
        '<td><span class="ix-chip ' + st.chip + '">' + st.text + '</span></td>' +
        '<td style="font-size:12px;color:var(--ix-text-muted)">' + esc(fmtDate(s.updatedAt)) + '</td>' +
        '<td><button type="button" class="ix-btn ix-btn-icon" data-adm-mkt-edit-stock="' + esc(s.ticker) + '" title="Sửa metadata"><i class="ti ti-edit" style="font-size:14px"></i></button></td>' +
      '</tr>';
    }).join('');
  }

  function openEdit(ticker) {
    if (!Store) return;
    var stock = Store.getStock(ticker);
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
    populateEditSectorSelect(stock.sectorId);
    if (capEl) capEl.value = stock.capTier || 'large';
    if (statusEl) statusEl.value = stock.status || 'active';
    if (descEl) descEl.value = stock.description || '';

    if (typeof global.ixOpenOffcanvas === 'function') {
      global.ixOpenOffcanvas('offcanvas-edit-stock');
    } else if (typeof global.ixOpenModal === 'function') {
      global.ixOpenModal('modal-edit-stock');
    }
  }

  function saveEdit() {
    if (!Store || !editingTicker) return;
    var name = ((document.getElementById('adm-mkt-edit-name') || {}).value || '').trim();
    var exchange = (document.getElementById('adm-mkt-edit-exchange') || {}).value || 'HOSE';
    var sectorId = Number((document.getElementById('adm-mkt-edit-sector') || {}).value);
    var capTier = (document.getElementById('adm-mkt-edit-capTier') || {}).value || 'large';
    var status = (document.getElementById('adm-mkt-edit-status') || {}).value || 'active';
    var description = (document.getElementById('adm-mkt-edit-description') || {}).value || '';

    if (!name) {
      toast('Tên công ty là bắt buộc', 'danger');
      return;
    }

    var savedTicker = editingTicker;
    Store.updateStock(savedTicker, {
      name: name,
      exchange: exchange,
      sectorId: sectorId,
      capTier: capTier,
      status: status,
      description: description
    });

    editingTicker = null;
    if (typeof global.ixCloseOffcanvas === 'function') global.ixCloseOffcanvas('offcanvas-edit-stock');
    if (typeof global.ixCloseModal === 'function') global.ixCloseModal('modal-edit-stock');
    refresh();
    toast('Đã cập nhật metadata mã ' + savedTicker, 'success');
  }

  function refresh() {
    populateSectorFilters();
    renderStats();
    renderTable();
    initMarketData();
  }

  function bindEvents() {
    ['adm-mkt-filter-exchange', 'adm-mkt-filter-sector', 'adm-mkt-filter-capTier', 'adm-mkt-filter-status'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener('change', refresh);
    });
    var search = document.getElementById('adm-mkt-stocks-search');
    if (search) search.addEventListener('input', refresh);

    var saveBtn = document.getElementById('btn-adm-mkt-save-stock');
    if (saveBtn) saveBtn.addEventListener('click', saveEdit);

    document.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-adm-mkt-edit-stock]');
      if (!btn) return;
      e.preventDefault();
      openEdit(btn.getAttribute('data-adm-mkt-edit-stock'));
    });
  }

  function init() {
    if (!Store) {
      toast('Thiếu IfluxMarketRegistryStore', 'danger');
      return;
    }
    refresh();
    bindEvents();
  }

  global.AdmMarketStocks = { init: init, refresh: refresh };
})(window);
