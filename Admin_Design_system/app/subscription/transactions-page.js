/* ADM-SUB-003 — Danh sách đơn hàng (đọc trực tiếp API admin thật) */
(function (global) {
  'use strict';

  var ORDERS = [];
  var STATS = null;
  var LOADING = false;
  var LOADED = false;

  function apiBase() {
    return (global.IfluxAdminAuth && IfluxAdminAuth.apiBase) ? IfluxAdminAuth.apiBase() : '/api';
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
    var token = adminToken();
    var h = { 'Accept': 'application/json' };
    if (token) h.Authorization = 'Bearer ' + token;
    return h;
  }

  var AUTH_ERR = false;

  function handleAuthFail(res) {
    if (res.status === 401 || res.status === 403) {
      /* KHÔNG tự đăng xuất để tránh vòng lặp đá về login.
         Chỉ báo lỗi để admin tự đăng nhập lại nếu cần. */
      AUTH_ERR = true;
      throw new Error('AUTH_EXPIRED');
    }
    return res;
  }

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function fmt(n) {
    return '₫' + Math.round(Number(n) || 0).toLocaleString('vi-VN');
  }

  function fmtDate(iso) {
    if (!iso) return '—';
    try { return new Date(iso).toLocaleString('vi-VN'); } catch (e) { return iso; }
  }

  function payMethodLabel(method) {
    if (method === 'transfer') return 'Chuyển khoản';
    if (method === 'momo') return 'MoMo';
    if (method === 'vnpay') return 'VNPay';
    return 'Thẻ tín dụng';
  }

  function statusLabel(status) {
    if (status === 'pending') return 'Chờ duyệt';
    if (status === 'approved') return 'Đã duyệt';
    if (status === 'rejected') return 'Từ chối';
    if (status === 'refunded') return 'Đã hoàn tiền';
    if (status === 'paid') return 'Đã thanh toán';
    return status || '—';
  }

  function cycleLabel(cycle) {
    if (cycle === 'lifetime') return 'Trọn đời';
    if (cycle === 'annual') return 'Hàng năm';
    if (cycle === 'monthly') return 'Hàng tháng';
    return cycle || '—';
  }

  function statusBadge(status) {
    if (status === 'pending') return '<span class="ix-badge ix-badge-warning">Chờ duyệt</span>';
    if (status === 'approved' || status === 'paid') return '<span class="ix-badge ix-badge-success">Đã duyệt</span>';
    if (status === 'rejected') return '<span class="ix-badge ix-badge-danger">Từ chối</span>';
    return '<span class="ix-badge">' + esc(statusLabel(status)) + '</span>';
  }

  function loadOrders() {
    if (!adminToken()) { LOADED = true; return Promise.resolve(false); }
    LOADING = true;
    return fetch(apiBase() + '/subscriptions/orders', {
      headers: authHeaders(),
      cache: 'no-store'
    })
      .then(handleAuthFail)
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (data) {
        ORDERS = (data && data.orders) || [];
        STATS = (data && data.stats) || null;
        AUTH_ERR = false;
        LOADING = false;
        LOADED = true;
        return true;
      })
      .catch(function (e) {
        LOADING = false;
        LOADED = true;
        if (e && e.message === 'AUTH_EXPIRED') throw e;
        return false;
      });
  }

  function computeStats() {
    if (STATS) return STATS;
    var pending = ORDERS.filter(function (o) { return o.status === 'pending'; });
    var approved = ORDERS.filter(function (o) { return o.status === 'approved' || o.status === 'paid'; });
    return {
      total: ORDERS.length,
      pendingTransfer: pending.filter(function (o) { return o.payMethod === 'transfer'; }).length,
      approved: approved.length,
      revenue: approved.reduce(function (s, o) { return s + (o.amount || 0); }, 0)
    };
  }

  function renderStats() {
    var s = computeStats();
    var map = {
      'adm-txn-stat-total': String(s.total || 0),
      'adm-txn-stat-pending': String(s.pendingTransfer || 0),
      'adm-txn-stat-approved': String(s.approved || 0),
      'adm-txn-stat-revenue': fmt(s.revenue || 0)
    };
    Object.keys(map).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.textContent = map[id];
    });
  }

  function getFilters() {
    return {
      status: (document.getElementById('adm-txn-filter-status') || {}).value || '',
      payMethod: (document.getElementById('adm-txn-filter-method') || {}).value || '',
      q: ((document.getElementById('adm-txn-search') || {}).value || '').trim().toLowerCase()
    };
  }

  function filtered() {
    var f = getFilters();
    return ORDERS.filter(function (o) {
      if (f.status && o.status !== f.status) return false;
      if (f.payMethod && o.payMethod !== f.payMethod) return false;
      if (f.q) {
        var hay = ((o.email || '') + ' ' + (o.userName || '') + ' ' + (o.id || '') + ' ' + (o.transferRef || '')).toLowerCase();
        if (hay.indexOf(f.q) < 0) return false;
      }
      return true;
    });
  }

  function renderTable() {
    var tbody = document.getElementById('adm-txn-tbody');
    if (!tbody) return;

    var list = filtered();
    if (!list.length) {
      var msg = AUTH_ERR
        ? 'Phiên admin hết hạn hoặc không đủ quyền. Vui lòng đăng nhập lại.'
        : ((LOADING || !LOADED) ? 'Đang tải danh sách đơn hàng…' : 'Chưa có giao dịch');
      tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:32px;color:var(--ix-text-muted)">' + msg + '</td></tr>';
      return;
    }

    tbody.innerHTML = list.map(function (o) {
      var actions = '';
      if (o.status === 'pending') {
        actions =
          '<button type="button" class="ix-btn ix-btn-success ix-btn-sm" data-adm-txn-approve="' + esc(o.id) + '"><i class="ti ti-check"></i> Duyệt</button> ' +
          '<button type="button" class="ix-btn ix-btn-outline ix-btn-sm" data-adm-txn-reject="' + esc(o.id) + '"><i class="ti ti-x"></i> Từ chối</button>';
      } else {
        actions = '<span style="font-size:12px;color:var(--ix-text-muted)">' +
          (o.approvedAt ? fmtDate(o.approvedAt) : (o.rejectedAt ? fmtDate(o.rejectedAt) : '—')) +
          '</span>';
      }

      return '<tr>' +
        '<td><code style="font-size:11px">' + esc(o.id) + '</code></td>' +
        '<td><div style="font-weight:600">' + esc(o.userName || '—') + '</div><div style="font-size:12px;color:var(--ix-text-muted)">' + esc(o.email) + '</div></td>' +
        '<td>' + esc(o.planName) + '<div style="font-size:12px;color:var(--ix-text-muted)">' +
          esc(o.planTier || '') + ' · ' + esc(cycleLabel(o.cycle)) + '</div></td>' +
        '<td style="font-weight:600">' + esc(fmt(o.amount)) + '</td>' +
        '<td>' + esc(payMethodLabel(o.payMethod)) + '</td>' +
        '<td>' + (o.transferRef ? '<code>' + esc(o.transferRef) + '</code>' : '—') + '</td>' +
        '<td>' + statusBadge(o.status) + '</td>' +
        '<td style="font-size:12px;color:var(--ix-text-muted)">' + fmtDate(o.createdAt) + '</td>' +
        '<td style="white-space:nowrap">' + actions + '</td>' +
      '</tr>';
    }).join('');
  }

  function refresh() {
    return loadOrders().then(function () {
      renderStats();
      renderTable();
    }).catch(function () { /* AUTH_EXPIRED đã redirect */ });
  }

  function postAction(id, action, body) {
    return fetch(apiBase() + '/subscriptions/orders/' + encodeURIComponent(id) + '/' + action, {
      method: 'POST',
      headers: Object.assign({ 'Content-Type': 'application/json' }, authHeaders()),
      body: body ? JSON.stringify(body) : '{}'
    })
      .then(handleAuthFail)
      .then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (data) {
          return { ok: res.ok, data: data };
        });
      });
  }

  function bindActions() {
    document.addEventListener('click', function (e) {
      var approveBtn = e.target.closest('[data-adm-txn-approve]');
      var rejectBtn = e.target.closest('[data-adm-txn-reject]');
      if (approveBtn) {
        var id = approveBtn.getAttribute('data-adm-txn-approve');
        if (!confirm('Xác nhận duyệt đơn ' + id + ' và kích hoạt gói cho khách?')) return;
        postAction(id, 'approve').then(function (r) {
          if (r.ok) {
            if (global.ixToast) ixToast('Đã duyệt và kích hoạt gói cho khách hàng', 'success');
            refresh();
          } else if (global.ixToast) {
            ixToast((r.data && r.data.error) || 'Không thể duyệt đơn này', 'danger');
          }
        }).catch(function () { /* redirected */ });
      }
      if (rejectBtn) {
        var rid = rejectBtn.getAttribute('data-adm-txn-reject');
        var reason = prompt('Lý do từ chối (tuỳ chọn):', 'Không tìm thấy giao dịch chuyển khoản');
        if (reason === null) return;
        postAction(rid, 'reject', { reason: reason }).then(function (r) {
          if (r.ok) {
            if (global.ixToast) ixToast('Đã từ chối đơn', 'info');
            refresh();
          } else if (global.ixToast) {
            ixToast((r.data && r.data.error) || 'Không thể từ chối đơn này', 'danger');
          }
        }).catch(function () { /* redirected */ });
      }
    });
  }

  function bindFilters() {
    ['adm-txn-filter-status', 'adm-txn-filter-method', 'adm-txn-search'].forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('input', renderTable);
      el.addEventListener('change', renderTable);
    });
  }

  function init() {
    renderTable();
    bindActions();
    bindFilters();
    refresh();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(window);
