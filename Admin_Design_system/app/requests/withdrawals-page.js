/* ADM-REQ — Yêu cầu rút tiền (Affiliate payout) */
(function (global) {
  'use strict';

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function store() {
    return global.IfluxAffiliatePayoutStore;
  }

  function renderStats() {
    var Store = store();
    if (!Store || !Store.statsAdmin) return;
    var stats = Store.statsAdmin();
    var map = {
      'adm-payout-stat-pending': stats.pending,
      'adm-payout-stat-processing': stats.processing,
      'adm-payout-stat-paid': stats.paid
    };
    Object.keys(map).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.textContent = String(map[id] == null ? 0 : map[id]);
    });
  }

  function renderTable() {
    var Store = store();
    var tbody = document.getElementById('adm-payout-tbody');
    if (!Store || !tbody) return;
    var rows = Store.listAdmin({
      q: (document.getElementById('adm-payout-search') || {}).value || '',
      status: (document.getElementById('adm-payout-filter-status') || {}).value || ''
    });
    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:32px;color:var(--ix-text-muted)">Chưa có yêu cầu rút tiền.</td></tr>';
      return;
    }
    tbody.innerHTML = rows.map(function (r) {
      var st = Store.statusMeta(r.status);
      var actions = '';
      if (r.status === 'pending') {
        actions =
          '<button type="button" class="ix-btn ix-btn-primary ix-btn-sm" data-adm-payout-approve="' + esc(r.id) + '"><i class="ti ti-check"></i> Duyệt</button> ' +
          '<button type="button" class="ix-btn ix-btn-outline ix-btn-sm" data-adm-payout-reject="' + esc(r.id) + '"><i class="ti ti-x"></i> Từ chối</button>';
      } else if (r.status === 'processing') {
        actions =
          '<button type="button" class="ix-btn ix-btn-success ix-btn-sm" data-adm-payout-complete="' + esc(r.id) + '"><i class="ti ti-cash"></i> Đã chuyển khoản</button> ' +
          '<button type="button" class="ix-btn ix-btn-outline ix-btn-sm" data-adm-payout-reject="' + esc(r.id) + '"><i class="ti ti-x"></i> Từ chối</button>';
      } else {
        actions = '<span style="font-size:12px;color:var(--ix-text-muted)">' + esc(r.processedBy || '—') + '</span>';
      }
      return '<tr>' +
        '<td style="font-size:12px;color:var(--ix-text-muted)">' + esc(new Date(r.createdAt).toLocaleString('vi-VN')) + '</td>' +
        '<td><div class="ix-user-name">' + esc(r.userName || '—') + '</div><div style="font-size:11px;color:var(--ix-text-muted)">' + esc(r.email) + '</div></td>' +
        '<td style="font-weight:700;color:var(--ix-success)">' + Store.formatVnd(r.amount) + '</td>' +
        '<td style="font-size:12px">' + esc(r.bankName) + '<br><span style="color:var(--ix-text-muted)">' + esc(r.bankAccount) + '</span></td>' +
        '<td style="font-size:12px">' + esc(r.bankHolder) + '</td>' +
        '<td><span class="ix-chip ' + st.chip + '" style="font-size:11px">' + esc(st.label) + '</span></td>' +
        '<td style="font-size:12px;color:var(--ix-text-muted)">' + esc(r.rejectReason || '—') + '</td>' +
        '<td><div style="display:flex;gap:6px;flex-wrap:wrap">' + actions + '</div></td></tr>';
    }).join('');
  }

  function refresh() {
    var Store = store();
    if (!Store) {
      var tbody = document.getElementById('adm-payout-tbody');
      if (tbody) tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:32px;color:var(--ix-text-muted)">Chưa tải được module rút tiền.</td></tr>';
      return;
    }
    var done = function () {
      renderStats();
      renderTable();
    };
    if (Store.refreshFromApi) {
      Store.refreshFromApi(true).finally(done);
    } else {
      done();
    }
  }

  function boot() {
    ['adm-payout-search', 'adm-payout-filter-status'].forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      el.addEventListener(el.tagName === 'INPUT' ? 'input' : 'change', renderTable);
    });
    var refreshBtn = document.getElementById('adm-payout-refresh');
    if (refreshBtn) refreshBtn.addEventListener('click', refresh);

    document.addEventListener('click', function (e) {
      var Store = store();
      if (!Store) return;
      var approveBtn = e.target.closest('[data-adm-payout-approve]');
      if (approveBtn) {
        Store.approveRequest(approveBtn.getAttribute('data-adm-payout-approve')).then(function (res) {
          if (res && res.ok) {
            refresh();
            if (global.ixToast) ixToast('Đã duyệt yêu cầu rút tiền', 'success');
          }
        });
        return;
      }
      var completeBtn = e.target.closest('[data-adm-payout-complete]');
      if (completeBtn) {
        Store.completeRequest(completeBtn.getAttribute('data-adm-payout-complete')).then(function (res) {
          if (res && res.ok) {
            refresh();
            if (global.ixToast) ixToast('Đã xác nhận chuyển khoản', 'success');
          }
        });
        return;
      }
      var rejectBtn = e.target.closest('[data-adm-payout-reject]');
      if (rejectBtn) {
        var reason = prompt('Lý do từ chối (tuỳ chọn):', '') || '';
        Store.rejectRequest(rejectBtn.getAttribute('data-adm-payout-reject'), reason).then(function (res) {
          if (res && res.ok) {
            refresh();
            if (global.ixToast) ixToast('Đã từ chối yêu cầu', 'info');
          }
        });
      }
    });

    refresh();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})(window);
