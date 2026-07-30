/* Loyalty — trang mã khuyến mãi (list / add / usage) */
(function (global) {
  'use strict';

  var page = (document.body && document.body.getAttribute('data-promo-page')) || 'list';
  var editingCode = null;

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function toast(msg, type) {
    if (global.ixToast) ixToast(msg, type || 'success');
  }
  function Store() { return global.LoyaltyPromoCatalogStore; }

  function typeLabel(t) {
    return t === 'voucher' ? 'Voucher' : 'Coupon';
  }

  function syncTypeFields() {
    var type = (document.getElementById('promo-type') || {}).value || 'coupon';
    var valueLabel = document.getElementById('promo-value-label');
    var maxLabel = document.getElementById('promo-max-label');
    if (valueLabel) valueLabel.textContent = type === 'voucher' ? 'Giá trị (₫)' : 'Giá trị (%)';
    if (maxLabel) maxLabel.textContent = type === 'voucher' ? 'Giá trị tối đa (% ĐH)' : 'Giá trị tối đa (₫)';
  }

  function collectForm() {
    return {
      type: (document.getElementById('promo-type') || {}).value || 'coupon',
      code: (document.getElementById('promo-code') || {}).value || '',
      value: (document.getElementById('promo-value') || {}).value || '',
      max_value: (document.getElementById('promo-max') || {}).value || '',
      qty_limit: (document.getElementById('promo-qty') || {}).value || '',
      starts_at: (document.getElementById('promo-starts') || {}).value || '',
      ends_at: (document.getElementById('promo-ends') || {}).value || '',
      active: !!(document.getElementById('promo-active') || {}).checked
    };
  }

  function fillForm(c) {
    if (!c) return;
    var map = {
      'promo-type': c.type || 'coupon',
      'promo-code': c.code || '',
      'promo-value': c.value || '',
      'promo-max': c.max_value || '',
      'promo-qty': c.qty_limit || '',
      'promo-starts': c.starts_at || '',
      'promo-ends': c.ends_at || ''
    };
    Object.keys(map).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.value = map[id];
    });
    var active = document.getElementById('promo-active');
    if (active) active.checked = c.active !== false;
    var codeEl = document.getElementById('promo-code');
    if (codeEl) codeEl.readOnly = !!editingCode;
    syncTypeFields();
  }

  function renderList() {
    var tbody = document.getElementById('promo-tbody');
    if (!tbody) return;
    var q = ((document.getElementById('promo-search') || {}).value || '').toLowerCase();
    var list = Store().listAll().filter(function (c) {
      if (!q) return true;
      return [c.code, c.type].join(' ').toLowerCase().indexOf(q) >= 0;
    });
    if (!list.length) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:32px;color:var(--ix-text-muted)">Chưa có mã.</td></tr>';
      return;
    }
    tbody.innerHTML = list.map(function (c) {
      var st = Store().statusOf(c);
      return '<tr>' +
        '<td><span class="ix-chip">' + esc(typeLabel(c.type)) + '</span></td>' +
        '<td><code>' + esc(c.code) + '</code></td>' +
        '<td>' + esc(Store().formatValue(c)) + '</td>' +
        '<td>' + esc(Store().formatMax(c)) + '</td>' +
        '<td>' + (c.qty_limit > 0 ? (esc(c.used_count) + ' / ' + esc(c.qty_limit)) : '—') + '</td>' +
        '<td style="font-size:12px">' + esc(Store().formatTime(c)) + '</td>' +
        '<td><span class="ix-chip ' + st.chip + '">' + esc(st.text) + '</span></td>' +
        '<td><div style="display:flex;gap:4px">' +
          '<a href="/admin/thanh-vien/ma-them?code=' + encodeURIComponent(c.code) + '" class="ix-btn ix-btn-icon" title="Sửa"><i class="ti ti-edit" style="font-size:14px"></i></a>' +
          '<button type="button" class="ix-btn ix-btn-icon" data-promo-del="' + esc(c.code) + '" title="Xoá"><i class="ti ti-trash" style="font-size:14px"></i></button>' +
        '</div></td></tr>';
    }).join('');
  }

  function renderUsage() {
    var stats = Store().usageStats();
    var elOrders = document.getElementById('promo-stat-orders');
    var elCost = document.getElementById('promo-stat-cost');
    if (elOrders) elOrders.textContent = String(stats.orders);
    if (elCost) elCost.textContent = '₫' + Number(stats.cost || 0).toLocaleString('vi-VN');

    var tbody = document.getElementById('promo-usage-tbody');
    if (!tbody) return;
    var list = Store().listUsage();
    if (!list.length) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:32px;color:var(--ix-text-muted)">Chưa có lượt sử dụng.</td></tr>';
      return;
    }
    tbody.innerHTML = list.map(function (u) {
      return '<tr>' +
        '<td><code>' + esc(u.code) + '</code></td>' +
        '<td><code style="font-size:11px">' + esc(u.orderId || '—') + '</code></td>' +
        '<td>' + esc(u.email || '—') + '</td>' +
        '<td>₫' + Number(u.orderAmount || 0).toLocaleString('vi-VN') + '</td>' +
        '<td style="font-weight:600;color:var(--ix-danger)">₫' + Number(u.discount || 0).toLocaleString('vi-VN') + '</td>' +
        '<td style="font-size:12px;color:var(--ix-text-muted)">' + (u.at ? new Date(u.at).toLocaleString('vi-VN') : '—') + '</td>' +
      '</tr>';
    }).join('');
  }

  function initList() {
    renderList();
    var search = document.getElementById('promo-search');
    if (search) search.addEventListener('input', renderList);
    document.addEventListener('click', function (e) {
      var del = e.target.closest('[data-promo-del]');
      if (!del) return;
      var code = del.getAttribute('data-promo-del');
      if (!confirm('Xoá mã ' + code + '?')) return;
      var res = Store().remove(code);
      if (!res.ok) { toast(res.error, 'danger'); return; }
      toast('Đã xoá');
      renderList();
    });
  }

  function initAdd() {
    var params = new URLSearchParams(location.search);
    var code = params.get('code');
    editingCode = code || null;
    var typeEl = document.getElementById('promo-type');
    if (typeEl) typeEl.addEventListener('change', syncTypeFields);
    syncTypeFields();

    if (code) {
      var c = Store().get(code);
      if (c) {
        fillForm(c);
        var title = document.getElementById('promo-page-title');
        if (title) title.textContent = 'Sửa mã ' + c.code;
      }
    }

    var btn = document.getElementById('btn-save-promo');
    if (btn) {
      btn.addEventListener('click', function () {
        var res = Store().save(collectForm(), editingCode);
        if (!res.ok) { toast(res.error, 'danger'); return; }
        toast('Đã lưu');
        location.href = '/admin/thanh-vien/ma-list';
      });
    }
  }

  function initUsage() {
    renderUsage();
  }

  function init() {
    if (page === 'list') initList();
    else if (page === 'add') initAdd();
    else if (page === 'usage') initUsage();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})(window);
