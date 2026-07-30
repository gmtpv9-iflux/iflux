/* iFlux Admin — Quản lý đơn hàng (list / add / edit) */
(function (global) {
  'use strict';

  var ORDERS = [];
  var STATS = null;
  var LOADING = false;
  var LOADED = false;
  var AUTH_ERR = false;
  var page = (document.body && document.body.getAttribute('data-orders-page')) || 'list';

  function canPerm(key) {
    return !!(global.IfluxAdminRbac && IfluxAdminRbac.hasPermission && IfluxAdminRbac.hasPermission(key));
  }

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
    var h = { Accept: 'application/json' };
    var t = adminToken();
    if (t) h.Authorization = 'Bearer ' + t;
    return h;
  }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function fmt(n) {
    return '₫' + Math.round(Number(n) || 0).toLocaleString('vi-VN');
  }
  function fmtDate(iso) {
    if (!iso) return '—';
    try { return new Date(iso).toLocaleString('vi-VN'); } catch (e) { return iso; }
  }
  function toast(msg, type) {
    if (global.ixToast) ixToast(msg, type || 'success');
  }
  function payMethodLabel(method) {
    if (method === 'transfer') return 'Chuyển khoản';
    if (method === 'momo') return 'MoMo';
    if (method === 'vnpay') return 'VNPay';
    return 'Thẻ';
  }
  function cycleLabel(cycle) {
    if (cycle === 'lifetime') return 'Trọn đời';
    if (cycle === 'annual') return 'Hàng năm';
    if (cycle === 'monthly') return 'Hàng tháng';
    return cycle || '—';
  }
  function statusLabel(status) {
    var map = {
      pending: 'Chờ duyệt',
      approved: 'Đã duyệt',
      paid: 'Đã thanh toán',
      rejected: 'Từ chối',
      refunded: 'Đã hoàn tiền'
    };
    return map[status] || status || '—';
  }
  function statusBadge(status) {
    if (status === 'pending') return '<span class="ix-chip ix-chip-warning">Chờ duyệt</span>';
    if (status === 'approved' || status === 'paid') return '<span class="ix-chip ix-chip-success">' + esc(statusLabel(status)) + '</span>';
    if (status === 'rejected' || status === 'refunded') return '<span class="ix-chip ix-chip-danger">' + esc(statusLabel(status)) + '</span>';
    return '<span class="ix-chip">' + esc(statusLabel(status)) + '</span>';
  }
  function planNameFromTier(tier) {
    var t = String(tier || '').toLowerCase();
    if (t === 'elite') return 'Elite';
    if (t === 'premium') return 'Premium';
    if (t === 'free') return 'Miễn phí';
    return tier || 'Premium';
  }

  function handleAuthFail(res) {
    if (res.status === 401 || res.status === 403) {
      AUTH_ERR = true;
      throw new Error('AUTH_EXPIRED');
    }
    return res;
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

  function findOrder(id) {
    return ORDERS.filter(function (o) { return o.id === id; })[0] || null;
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
      'adm-txn-stat-pending': String(s.pendingTransfer || s.pending || 0),
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

  function statusPermKey(st) {
    var map = {
      pending: 'subscription.transactions.status_pending',
      approved: 'subscription.transactions.status_approved',
      paid: 'subscription.transactions.status_paid',
      rejected: 'subscription.transactions.status_rejected',
      refunded: 'subscription.transactions.status_refunded'
    };
    return map[st] || null;
  }

  function canSetStatus(st) {
    var k = statusPermKey(st);
    return k ? canPerm(k) : false;
  }

  function statusSelect(o) {
    var statuses = ['pending', 'approved', 'paid', 'rejected', 'refunded'];
    var canAny = statuses.some(canSetStatus);
    if (!canAny) {
      return statusBadge(o.status);
    }
    var opts = statuses.filter(function (st) {
      return st === o.status || canSetStatus(st);
    }).map(function (st) {
      return '<option value="' + st + '"' + (o.status === st ? ' selected' : '') + '>' + esc(statusLabel(st)) + '</option>';
    }).join('');
    return '<select class="ix-select ix-select-sm" data-order-status="' + esc(o.id) + '" style="min-width:120px;font-size:12px">' + opts + '</select>';
  }

  function renderTable() {
    var tbody = document.getElementById('adm-txn-tbody');
    if (!tbody) return;
    var list = filtered();
    if (!list.length) {
      var msg = AUTH_ERR
        ? 'Phiên admin hết hạn hoặc không đủ quyền. Vui lòng đăng nhập lại.'
        : ((LOADING || !LOADED) ? 'Đang tải danh sách đơn hàng…' : 'Chưa có đơn hàng');
      tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:32px;color:var(--ix-text-muted)">' + msg + '</td></tr>';
      return;
    }
    tbody.innerHTML = list.map(function (o) {
      return '<tr data-order-id="' + esc(o.id) + '">' +
        '<td><code style="font-size:11px">' + esc(o.id) + '</code></td>' +
        '<td><div style="font-weight:600">' + esc(o.userName || '—') + '</div><div style="font-size:12px;color:var(--ix-text-muted)">' + esc(o.email) + '</div></td>' +
        '<td>' + esc(o.planName) + '<div style="font-size:12px;color:var(--ix-text-muted)">' +
          esc(o.planTier || '') + ' · ' + esc(cycleLabel(o.cycle)) + '</div></td>' +
        '<td style="font-weight:600">' + esc(fmt(o.amount)) + '</td>' +
        '<td>' + esc(payMethodLabel(o.payMethod)) + '</td>' +
        '<td>' + (o.transferRef ? '<code>' + esc(o.transferRef) + '</code>' : '—') + '</td>' +
        '<td>' + statusSelect(o) + '</td>' +
        '<td style="font-size:12px;color:var(--ix-text-muted)">' + fmtDate(o.createdAt) + '</td>' +
        '<td style="white-space:nowrap"><div style="display:flex;gap:4px;flex-wrap:wrap">' +
          (canPerm('subscription.transactions.edit')
            ? '<a href="/admin/don-hang/edit?id=' + encodeURIComponent(o.id) + '" class="ix-btn ix-btn-icon" title="Xem / Sửa"><i class="ti ti-edit" style="font-size:14px"></i></a>'
            : '') +
          (o.status === 'pending' && canPerm('subscription.transactions.approve_payment')
            ? '<button type="button" class="ix-btn ix-btn-icon" data-order-approve="' + esc(o.id) + '" title="Duyệt"><i class="ti ti-check" style="font-size:14px"></i></button>'
            : '') +
          ((o.status === 'approved' || o.status === 'paid') && canPerm('subscription.transactions.refund')
            ? '<button type="button" class="ix-btn ix-btn-icon" data-order-refund="' + esc(o.id) + '" title="Hoàn tiền"><i class="ti ti-receipt-refund" style="font-size:14px"></i></button>'
            : '') +
          (canPerm('subscription.transactions.cancel')
            ? '<button type="button" class="ix-btn ix-btn-icon" data-order-delete="' + esc(o.id) + '" title="Xoá"><i class="ti ti-trash" style="font-size:14px"></i></button>'
            : '') +
        '</div></td></tr>';
    }).join('');
  }

  function apiJson(path, opts) {
    opts = opts || {};
    opts.headers = Object.assign({ 'Content-Type': 'application/json' }, authHeaders(), opts.headers || {});
    return fetch(apiBase() + path, opts)
      .then(handleAuthFail)
      .then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (data) {
          if (!res.ok) {
            var m = data && data.error;
            if (m && typeof m === 'object') m = m.message || JSON.stringify(m);
            throw new Error(m || data.message || ('HTTP ' + res.status));
          }
          return data;
        });
      });
  }

  function refreshList() {
    return loadOrders().then(function () {
      renderStats();
      renderTable();
    }).catch(function () {
      renderTable();
    });
  }

  function bindList() {
    ['adm-txn-filter-status', 'adm-txn-filter-method', 'adm-txn-search'].forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('input', renderTable);
      el.addEventListener('change', renderTable);
    });

    document.addEventListener('change', function (e) {
      var sel = e.target.closest('[data-order-status]');
      if (!sel) return;
      var id = sel.getAttribute('data-order-status');
      var status = sel.value;
      var prev = findOrder(id);
      if (prev && prev.status === status) return;
      if (!confirm('Cập nhật trạng thái đơn ' + id + ' → ' + statusLabel(status) + '?')) {
        if (prev) sel.value = prev.status;
        return;
      }
      apiJson('/subscriptions/orders/' + encodeURIComponent(id), {
        method: 'PATCH',
        body: JSON.stringify({ status: status })
      }).then(function () {
        toast('Đã cập nhật trạng thái');
        return refreshList();
      }).catch(function (err) {
        toast(err.message, 'danger');
        if (prev) sel.value = prev.status;
      });
    });

    document.addEventListener('click', function (e) {
      var approve = e.target.closest('[data-order-approve]');
      if (approve) {
        var aid = approve.getAttribute('data-order-approve');
        if (!confirm('Duyệt đơn ' + aid + ' và kích hoạt gói cho khách?')) return;
        apiJson('/subscriptions/orders/' + encodeURIComponent(aid) + '/approve', {
          method: 'POST',
          body: '{}'
        }).then(function () {
          toast('Đã duyệt và kích hoạt gói');
          return refreshList();
        }).catch(function (err) { toast(err.message, 'danger'); });
        return;
      }
      var refund = e.target.closest('[data-order-refund]');
      if (refund) {
        var rid = refund.getAttribute('data-order-refund');
        if (!confirm('Hoàn tiền / đánh dấu đã hoàn cho đơn ' + rid + '?')) return;
        apiJson('/subscriptions/orders/' + encodeURIComponent(rid) + '/refund', {
          method: 'POST',
          body: '{}'
        }).then(function () {
          toast('Đã đánh dấu hoàn tiền');
          return refreshList();
        }).catch(function (err) { toast(err.message, 'danger'); });
        return;
      }
      var del = e.target.closest('[data-order-delete]');
      if (del) {
        var did = del.getAttribute('data-order-delete');
        if (!confirm('Xoá đơn hàng ' + did + '? Thao tác không hoàn tác.')) return;
        apiJson('/subscriptions/orders/' + encodeURIComponent(did), { method: 'DELETE' })
          .then(function () {
            toast('Đã xoá đơn hàng');
            return refreshList();
          })
          .catch(function (err) { toast(err.message, 'danger'); });
      }
    });
  }

  function bindExport() {
    var btn = document.getElementById('adm-txn-export');
    if (!btn || btn._boundExport) return;
    btn._boundExport = true;
    btn.addEventListener('click', function () {
      var f = getFilters();
      var q = [];
      if (f.status) q.push('status=' + encodeURIComponent(f.status));
      if (f.payMethod) q.push('pay_method=' + encodeURIComponent(f.payMethod));
      if (f.q) q.push('q=' + encodeURIComponent(f.q));
      var url = apiBase() + '/subscriptions/orders/export' + (q.length ? '?' + q.join('&') : '');
      var headers = authHeaders();
      fetch(url, { headers: headers })
        .then(handleAuthFail)
        .then(function (res) {
          if (!res.ok) {
            return res.json().catch(function () { return {}; }).then(function (data) {
              var m = data && data.error;
              if (m && typeof m === 'object') m = m.message || JSON.stringify(m);
              throw new Error(m || ('HTTP ' + res.status));
            });
          }
          return res.blob().then(function (blob) {
            var a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = 'don-hang.csv';
            a.click();
            URL.revokeObjectURL(a.href);
            toast('Đã xuất CSV');
          });
        })
        .catch(function (err) { toast(err.message || 'Xuất thất bại', 'danger'); });
    });
  }

  function defaultAmount(tier, cycle) {
    var table = {
      premium: { monthly: 199000, annual: 1990000, lifetime: 4990000 },
      elite: { monthly: 399000, annual: 3990000, lifetime: 9990000 }
    };
    var t = table[tier] || table.premium;
    return t[cycle] || t.monthly;
  }

  function bindAmountSuggest() {
    function sync() {
      var tierEl = document.getElementById('ord-plan-tier');
      var cycleEl = document.getElementById('ord-cycle');
      var amountEl = document.getElementById('ord-amount');
      if (!tierEl || !cycleEl || !amountEl) return;
      if (amountEl.getAttribute('data-manual') === '1') return;
      amountEl.value = String(defaultAmount(tierEl.value, cycleEl.value));
    }
    ['ord-plan-tier', 'ord-cycle'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener('change', sync);
    });
    var amountEl = document.getElementById('ord-amount');
    if (amountEl) {
      amountEl.addEventListener('input', function () {
        amountEl.setAttribute('data-manual', '1');
      });
    }
    sync();
  }

  function collectForm() {
    return {
      email: ((document.getElementById('ord-email') || {}).value || '').trim(),
      user_name: ((document.getElementById('ord-user-name') || {}).value || '').trim(),
      plan_tier: (document.getElementById('ord-plan-tier') || {}).value || 'premium',
      plan_name: planNameFromTier((document.getElementById('ord-plan-tier') || {}).value),
      cycle: (document.getElementById('ord-cycle') || {}).value || 'monthly',
      amount: Number((document.getElementById('ord-amount') || {}).value || 0),
      pay_method: (document.getElementById('ord-pay-method') || {}).value || 'transfer',
      transfer_ref: ((document.getElementById('ord-transfer-ref') || {}).value || '').trim(),
      status: (document.getElementById('ord-status') || {}).value || 'pending',
      note: ((document.getElementById('ord-note') || {}).value || '').trim()
    };
  }

  function fillForm(o) {
    if (!o) return;
    var map = {
      'ord-email': o.email,
      'ord-user-name': o.userName,
      'ord-plan-tier': o.planTier,
      'ord-cycle': o.cycle,
      'ord-amount': o.amount,
      'ord-pay-method': o.payMethod,
      'ord-transfer-ref': o.transferRef,
      'ord-status': o.status,
      'ord-note': o.rejectReason || ''
    };
    Object.keys(map).forEach(function (id) {
      var el = document.getElementById(id);
      if (el && map[id] != null) el.value = map[id];
    });
    var amountEl = document.getElementById('ord-amount');
    if (amountEl) amountEl.setAttribute('data-manual', '1');
    var idEl = document.getElementById('ord-id');
    if (idEl) idEl.textContent = o.id;
  }

  function saveAdd() {
    var data = collectForm();
    if (!data.email) { toast('Email khách hàng là bắt buộc', 'danger'); return; }
    var btn = document.getElementById('btn-save-order');
    if (btn) btn.disabled = true;
    apiJson('/subscriptions/orders/admin', {
      method: 'POST',
      body: JSON.stringify(data)
    }).then(function (res) {
      toast('Đã tạo đơn hàng thủ công');
      var id = res && res.order && res.order.id;
      setTimeout(function () {
        location.href = id ? ('/admin/don-hang/edit?id=' + encodeURIComponent(id)) : '/admin/don-hang/list';
      }, 400);
    }).catch(function (err) {
      toast(err.message, 'danger');
    }).finally(function () {
      if (btn) btn.disabled = false;
    });
  }

  function saveEdit(id) {
    var data = collectForm();
    var btn = document.getElementById('btn-save-order');
    if (btn) btn.disabled = true;
    apiJson('/subscriptions/orders/' + encodeURIComponent(id), {
      method: 'PATCH',
      body: JSON.stringify({
        email: data.email,
        user_name: data.user_name,
        plan_tier: data.plan_tier,
        plan_name: data.plan_name,
        cycle: data.cycle,
        amount: data.amount,
        pay_method: data.pay_method,
        transfer_ref: data.transfer_ref,
        status: data.status,
        reject_reason: data.note
      })
    }).then(function () {
      toast('Đã lưu đơn hàng');
      return loadOrders().then(function () {
        fillForm(findOrder(id));
      });
    }).catch(function (err) {
      toast(err.message, 'danger');
    }).finally(function () {
      if (btn) btn.disabled = false;
    });
  }

  function filterStatusSelectEl(selId, currentStatus) {
    var sel = document.getElementById(selId);
    if (!sel) return;
    Array.prototype.slice.call(sel.options).forEach(function (opt) {
      var st = opt.value;
      if (!st) return;
      var keep = st === currentStatus || canSetStatus(st);
      opt.disabled = !keep;
      opt.hidden = !keep;
    });
  }

  function initList() {
    bindList();
    bindExport();
    refreshList();
  }

  function initAdd() {
    bindAmountSuggest();
    filterStatusSelectEl('ord-status', 'approved');
    var btn = document.getElementById('btn-save-order');
    if (btn) btn.addEventListener('click', saveAdd);
  }

  function initEdit() {
    bindAmountSuggest();
    var params = new URLSearchParams(location.search);
    var id = params.get('id') || '';
    if (!id) {
      toast('Thiếu mã đơn hàng', 'danger');
      return;
    }
    var btn = document.getElementById('btn-save-order');
    if (btn) btn.addEventListener('click', function () { saveEdit(id); });
    var delBtn = document.getElementById('btn-delete-order');
    if (delBtn) {
      delBtn.addEventListener('click', function () {
        if (!confirm('Xoá đơn hàng này?')) return;
        apiJson('/subscriptions/orders/' + encodeURIComponent(id), { method: 'DELETE' })
          .then(function () {
            toast('Đã xoá đơn hàng');
            location.href = '/admin/don-hang/list';
          })
          .catch(function (err) { toast(err.message, 'danger'); });
      });
    }
    loadOrders().then(function () {
      var o = findOrder(id);
      if (!o) {
        toast('Không tìm thấy đơn hàng', 'danger');
        return;
      }
      fillForm(o);
      filterStatusSelectEl('ord-status', o.status);
    }).catch(function () {
      toast('Không tải được đơn hàng', 'danger');
    });
  }

  function init() {
    if (page === 'list') initList();
    else if (page === 'add') initAdd();
    else if (page === 'edit') initEdit();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})(window);
