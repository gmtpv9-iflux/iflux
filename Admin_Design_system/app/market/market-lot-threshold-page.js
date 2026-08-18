/* ADM-MKT-004 — Lot Threshold Config */
(function (global) {
  'use strict';

  var Store = global.IfluxMarketRegistryStore;

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function toast(msg, type) {
    if (typeof global.ixToast === 'function') global.ixToast(msg, type || 'primary');
  }

  function fmtVnd(n) {
    if (n == null || n === '') return '—';
    if (Store && typeof Store.formatVnd === 'function') return Store.formatVnd(n);
    return '₫' + Number(n).toLocaleString('vi-VN');
  }

  function parseVndInput(raw) {
    return Number(String(raw || '').replace(/[^\d]/g, '')) || 0;
  }

  function capLabel(tier) {
    var map = { large: 'Vốn hóa lớn', mid: 'Trung bình', small: 'Nhỏ' };
    return map[tier] || tier;
  }

  function renderTierCard() {
    if (!Store) return;
    var tiers = Store.getLotTiers();
    var map = {
      'adm-mkt-lot-large': tiers.large,
      'adm-mkt-lot-mid': tiers.mid,
      'adm-mkt-lot-small': tiers.small
    };
    Object.keys(map).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.value = fmtVnd(map[id]);
    });
  }

  function saveTierDefaults() {
    if (!Store) return;
    var large = parseVndInput((document.getElementById('adm-mkt-lot-large') || {}).value);
    var mid = parseVndInput((document.getElementById('adm-mkt-lot-mid') || {}).value);
    var small = parseVndInput((document.getElementById('adm-mkt-lot-small') || {}).value);

    if (!large || !mid || !small) {
      toast('Ngưỡng mặc định phải lớn hơn 0', 'danger');
      return;
    }
    if (large < mid || mid < small) {
      toast('Thứ tự ngưỡng: Lớn ≥ Trung bình ≥ Nhỏ', 'warning');
    }

    Store.setLotTiers({ large: large, mid: mid, small: small });
    renderTierCard();
    renderOverrides();
    toast('Đã lưu ngưỡng mặc định theo tier', 'success');
    var payload = { large: large, mid: mid, small: small, overrides: {} };
    var h = { 'Content-Type': 'application/json', Accept: 'application/json' };
    var token = null;
    if (global.IfluxAdminAuth && IfluxAdminAuth.getSession) {
      var s = IfluxAdminAuth.getSession();
      if (s && s.token) token = s.token;
    }
    if (token) h.Authorization = 'Bearer ' + token;
    else h['X-Admin-Key'] = 'iflux-admin-local-dev';
    var base = (global.IfluxAdminAuth && IfluxAdminAuth.apiBase) ? IfluxAdminAuth.apiBase() : '/api';
    fetch(base + '/admin/market-config/lot-threshold', {
      method: 'PATCH', headers: h, body: JSON.stringify({ payload: payload })
    }).catch(function () { /* local OK */ });
  }

  function renderOverrides() {
    if (!Store) return;
    var tbody = document.getElementById('adm-mkt-lot-tbody');
    if (!tbody) return;

    var search = ((document.getElementById('adm-mkt-lot-search') || {}).value || '').trim().toLowerCase();
    var list = Store.listLotOverrides().filter(function (row) {
      if (!search) return true;
      var hay = (row.ticker + ' ' + (row.name || '') + ' ' + (row.capTier || '')).toLowerCase();
      return hay.indexOf(search) >= 0;
    });

    if (!list.length) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:32px;color:var(--ix-text-muted);font-size:13px">Không có override.</td></tr>';
      return;
    }

    tbody.innerHTML = list.map(function (row) {
      var defaultVal = row.tierDefault != null ? row.tierDefault : row.defaultThreshold;
      var isOverride = row.lotThreshold != null && row.lotThreshold !== defaultVal;
      return '<tr data-ticker="' + esc(row.ticker) + '">' +
        '<td><strong style="color:var(--ix-accent)">' + esc(row.ticker) + '</strong></td>' +
        '<td>' + esc(row.name || '—') + '</td>' +
        '<td><span class="ix-chip ix-chip-info" style="font-size:12px">' + esc(capLabel(row.capTier)) + '</span></td>' +
        '<td style="font-size:12px;color:var(--ix-text-muted)">' + esc(fmtVnd(defaultVal)) + '</td>' +
        '<td><div style="display:flex;align-items:center;gap:8px">' +
          '<input type="text" class="ix-input adm-mkt-lot-input" data-ticker="' + esc(row.ticker) + '" value="' + esc(fmtVnd(row.lotThreshold)) + '" style="max-width:160px" />' +
          (isOverride ? '<span class="ix-chip ix-chip-warning" style="font-size:11px">Override</span>' : '') +
          '<button type="button" class="ix-btn ix-btn-success ix-btn-sm" data-adm-mkt-lot-save="' + esc(row.ticker) + '"><i class="ti ti-check"></i></button>' +
        '</div></td>' +
      '</tr>';
    }).join('');
  }

  function saveRow(ticker) {
    var input = document.querySelector('.adm-mkt-lot-input[data-ticker="' + ticker + '"]');
    if (!input) return;
    var value = parseVndInput(input.value);
    if (!value) {
      toast('Ngưỡng lô không hợp lệ', 'danger');
      return;
    }
    Store.setStockLotThreshold(ticker, value);
    renderOverrides();
    toast('Đã lưu ngưỡng lô cho ' + ticker, 'success');
  }

  function bindEvents() {
    var saveTiersBtn = document.getElementById('btn-adm-mkt-save-tiers');
    if (saveTiersBtn) saveTiersBtn.addEventListener('click', saveTierDefaults);

    ['adm-mkt-lot-large', 'adm-mkt-lot-mid', 'adm-mkt-lot-small'].forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('blur', function () {
        el.value = fmtVnd(parseVndInput(el.value));
      });
    });

    var search = document.getElementById('adm-mkt-lot-search');
    if (search) search.addEventListener('input', renderOverrides);

    document.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-adm-mkt-lot-save]');
      if (!btn) return;
      e.preventDefault();
      saveRow(btn.getAttribute('data-adm-mkt-lot-save'));
    });

    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter') return;
      var input = e.target.closest('.adm-mkt-lot-input');
      if (!input) return;
      e.preventDefault();
      saveRow(input.getAttribute('data-ticker'));
    });
  }

  function init() {
    if (!Store) {
      toast('Thiếu IfluxMarketRegistryStore', 'danger');
      return;
    }
    renderTierCard();
    renderOverrides();
    bindEvents();
  }

  global.AdmMarketLotThreshold = { init: init, refresh: renderOverrides };
})(window);
