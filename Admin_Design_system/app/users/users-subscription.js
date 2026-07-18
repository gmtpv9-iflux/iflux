/* ADM-USR-003 — Thao tác gói theo khách hàng (Override / Extend / Refund / Block) */
(function (global) {
  'use strict';

  var LOG_KEY = 'iflux_customer_sub_actions_v1';
  var customer = null;

  var PKG_LABELS = { Free: 'Miễn phí', Premium: 'Premium', Elite: 'Elite' };
  var PLAN_LABELS = {
    freemium: 'Miễn phí',
    monthly: 'Hàng tháng',
    yearly: 'Hàng năm',
    lifetime: 'Trọn đời'
  };

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function queryEmail() {
    try {
      return decodeURIComponent((new URLSearchParams(location.search).get('email') || '').trim());
    } catch (e) {
      return '';
    }
  }

  function addDays(n, fromDate) {
    var d = fromDate ? new Date(fromDate + 'T00:00:00') : new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + n);
    return d.toISOString().slice(0, 10);
  }

  function daysUntil(expiresAt) {
    if (!expiresAt) return null;
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var end = new Date(expiresAt + 'T00:00:00');
    return Math.ceil((end - today) / 86400000);
  }

  function pkgToTier(pkg) {
    if (pkg === 'Premium') return 'premium';
    if (pkg === 'Elite') return 'elite';
    return 'free';
  }

  function planExpiry(planType) {
    if (planType === 'freemium' || planType === 'lifetime') return null;
    if (planType === 'monthly') return addDays(30);
    if (planType === 'yearly') return addDays(365);
    return addDays(30);
  }

  function appendLog(email, action, detail) {
    try {
      var raw = localStorage.getItem(LOG_KEY);
      var map = raw ? JSON.parse(raw) : {};
      var key = String(email || '').toLowerCase();
      if (!map[key]) map[key] = [];
      map[key].unshift({
        at: new Date().toISOString(),
        action: action,
        detail: detail || '',
        admin: 'Admin'
      });
      map[key] = map[key].slice(0, 50);
      localStorage.setItem(LOG_KEY, JSON.stringify(map));
    } catch (e) { /* ignore */ }
  }

  function readLog(email) {
    try {
      var raw = localStorage.getItem(LOG_KEY);
      if (!raw) return [];
      var map = JSON.parse(raw);
      return (map[String(email || '').toLowerCase()] || []).slice();
    } catch (e) {
      return [];
    }
  }

  function syncCustomerToApp(c) {
    if (!c || !global.IfluxCustomersStore) return c;
    IfluxCustomersStore.updateCustomer(c.email, c);

    var tier = pkgToTier(c.package);
    var tierLabel = PKG_LABELS[c.package] || c.package;
    var daysLeft = daysUntil(c.expiresAt);
    var expiresIso = c.expiresAt ? new Date(c.expiresAt + 'T00:00:00').toISOString() : null;

    var patch = {
      tier: tier,
      tier_label: tierLabel,
      status: c.accountStatus === 'suspended' ? 'suspended' : 'active',
      status_label: c.accountStatus === 'suspended' ? 'Tạm khóa' : 'Hoạt động',
      plan: {
        name: tierLabel,
        tier: tier,
        cycle: c.planType || 'freemium',
        days_left: c.planType === 'lifetime' || c.planType === 'freemium' ? null : daysLeft,
        days_total: c.planType === 'lifetime' || c.planType === 'freemium' ? null : daysLeft,
        expires_at: c.planType === 'lifetime' || c.planType === 'freemium' ? null : expiresIso
      }
    };

    try {
      var PROFILES_KEY = 'iflux_user_profiles_v1';
      var pr = localStorage.getItem(PROFILES_KEY);
      if (pr) {
        var data = JSON.parse(pr);
        var touched = {};
        if (c.id && data.byId && data.byId[c.id]) touched[c.id] = true;
        var ek = (c.email || '').toLowerCase();
        if (ek && data.byEmail && data.byEmail[ek] && data.byEmail[ek].id) {
          touched[data.byEmail[ek].id] = true;
        }
        Object.keys(touched).forEach(function (uid) {
          var u = data.byId[uid];
          if (!u) return;
          u = Object.assign({}, u, patch);
          u.plan = Object.assign({}, u.plan || {}, patch.plan);
          data.byId[uid] = u;
          if (u.email) data.byEmail[String(u.email).toLowerCase()] = u;
          if (u.phone) data.byPhone[String(u.phone).replace(/\D/g, '')] = u;
        });
        localStorage.setItem(PROFILES_KEY, JSON.stringify(data));
      }
    } catch (e1) { /* ignore */ }

    try {
      var sraw = localStorage.getItem('iflux_user_session');
      if (sraw) {
        var s = JSON.parse(sraw);
        if (s.user && (s.user.id === c.id || String(s.user.email || '').toLowerCase() === String(c.email || '').toLowerCase())) {
          s.user = Object.assign({}, s.user, patch);
          s.user.plan = Object.assign({}, s.user.plan || {}, patch.plan);
          localStorage.setItem('iflux_user_session', JSON.stringify(s));
        }
      }
    } catch (e2) { /* ignore */ }

    return c;
  }

  function reloadCustomer() {
    var email = queryEmail();
    if (!email || !global.IfluxCustomersStore) return null;
    customer = IfluxCustomersStore.getCustomerByEmail(email);
    return customer;
  }

  function setText(id, text) {
    var el = document.getElementById(id);
    if (el) el.textContent = text == null ? '—' : String(text);
  }

  function resolveStatus(c) {
    if (c.accountStatus === 'suspended') {
      return { text: 'Tạm khóa', chip: 'ix-chip-warning' };
    }
    if (c.planType === 'freemium' || c.planType === 'lifetime') {
      return { text: 'Hoạt động', chip: 'ix-chip-success' };
    }
    var days = daysUntil(c.expiresAt);
    if (days !== null && days <= 0) {
      return { text: 'Hết hạn', chip: 'ix-chip-danger' };
    }
    return { text: 'Hoạt động', chip: 'ix-chip-success' };
  }

  function showMissing() {
    var miss = document.getElementById('adm-sub-missing');
    var main = document.getElementById('adm-sub-main');
    if (miss) miss.hidden = false;
    if (main) main.hidden = true;
  }

  function fmtDate(iso) {
    if (!iso) return '—';
    try { return new Date(iso).toLocaleString('vi-VN'); } catch (e) { return iso; }
  }

  function renderSummary(c) {
    var st = resolveStatus(c);
    var avatar = document.getElementById('adm-sub-avatar');
    if (avatar) {
      avatar.textContent = c.initials || 'U';
      avatar.className = 'ix-avatar-sm ' + (c.avatarCls || 'ix-avatar-accent');
    }
    setText('adm-sub-name', c.name);
    setText('adm-sub-email', c.email);
    setText('adm-sub-package', PKG_LABELS[c.package] || c.package);
    setText('adm-sub-plan', PLAN_LABELS[c.planType] || c.planType);
    setText('adm-sub-billing', c.billing || '—');

    var expText = '—';
    if (c.planType === 'lifetime') expText = 'Trọn đời';
    else if (c.planType === 'freemium') expText = 'Không áp dụng';
    else if (c.expiresAt) {
      var days = daysUntil(c.expiresAt);
      expText = c.expiresAt + (days != null ? ' (còn ' + Math.max(0, days) + ' ngày)' : '');
    }
    setText('adm-sub-expires', expText);

    var statusEl = document.getElementById('adm-sub-status');
    if (statusEl) {
      statusEl.textContent = st.text;
      statusEl.className = 'ix-chip ' + st.chip;
    }

    setText('adm-sub-crumb-name', c.name);
    document.title = 'Thao tác gói · ' + c.name + ' · iFlux Admin';

    var detailLink = document.getElementById('adm-sub-link-detail');
    if (detailLink) detailLink.href = 'detail.html?email=' + encodeURIComponent(c.email);

    var pkgField = document.getElementById('adm-sub-override-package');
    var planField = document.getElementById('adm-sub-override-plan');
    if (pkgField) pkgField.value = c.package || 'Free';
    if (planField) planField.value = c.planType || 'freemium';
    syncOverridePlanField();

    var blockBtn = document.getElementById('adm-sub-btn-block');
    if (blockBtn) {
      var suspended = c.accountStatus === 'suspended';
      blockBtn.innerHTML = suspended
        ? '<i class="ti ti-lock-open"></i> Mở khóa tài khoản'
        : '<i class="ti ti-lock"></i> Khóa tài khoản';
      blockBtn.className = 'ix-btn ix-btn-sm ' + (suspended ? 'ix-btn-success' : 'ix-btn-warning');
    }
  }

  function syncOverridePlanField() {
    var pkgEl = document.getElementById('adm-sub-override-package');
    var planEl = document.getElementById('adm-sub-override-plan');
    if (!pkgEl || !planEl) return;
    if (pkgEl.value === 'Free') {
      planEl.value = 'freemium';
      planEl.disabled = true;
    } else {
      planEl.disabled = false;
      if (planEl.value === 'freemium') planEl.value = 'monthly';
    }
  }

  function renderOrders(c) {
    var tbody = document.getElementById('adm-sub-orders-tbody');
    if (!tbody) return;
    var Store = global.IfluxSubscriptionOrdersStore;
    if (!Store || !c.id) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--ix-text-muted)">Chưa có đơn hàng</td></tr>';
      return;
    }

    var list = Store.listOrders({ userId: c.id });
    if (!list.length) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--ix-text-muted)">Chưa có đơn hàng</td></tr>';
      return;
    }

    tbody.innerHTML = list.map(function (o) {
      var status = Store.statusLabel(o.status);
      var chip = 'ix-chip-primary';
      if (o.status === 'pending') chip = 'ix-chip-warning';
      if (o.status === 'approved' || o.status === 'paid') chip = 'ix-chip-success';
      if (o.status === 'rejected' || o.status === 'refunded') chip = 'ix-chip-danger';

      var actions = '';
      if (o.status === 'pending') {
        actions =
          '<button type="button" class="ix-btn ix-btn-success ix-btn-sm" data-adm-sub-approve="' + esc(o.id) + '">Duyệt</button> ' +
          '<button type="button" class="ix-btn ix-btn-outline ix-btn-sm" data-adm-sub-reject="' + esc(o.id) + '">Từ chối</button>';
      } else if (o.status === 'approved' || o.status === 'paid') {
        actions = '<button type="button" class="ix-btn ix-btn-outline ix-btn-sm" data-adm-sub-refund="' + esc(o.id) + '"><i class="ti ti-receipt-refund"></i> Hoàn tiền</button>';
      } else {
        actions = '<span style="font-size:12px;color:var(--ix-text-muted)">—</span>';
      }

      return '<tr>' +
        '<td><code class="adm-sub-order-id">' + esc(o.id) + '</code></td>' +
        '<td>' + esc(o.planName) + '<div style="font-size:12px;color:var(--ix-text-muted)">' +
          esc(o.planTier || '') + ' · ' + esc(Store.cycleLabel(o.cycle)) + '</div></td>' +
        '<td style="font-weight:600">' + esc(Store.fmt(o.amount)) + '</td>' +
        '<td><span class="ix-chip ' + chip + '" style="font-size:11px">' + esc(status) + '</span></td>' +
        '<td style="font-size:12px;color:var(--ix-text-muted)">' + fmtDate(o.createdAt) + '</td>' +
        '<td><div class="adm-sub-order-actions">' + actions + '</div></td>' +
      '</tr>';
    }).join('');
  }

  function renderLog(c) {
    var list = document.getElementById('adm-sub-log-list');
    if (!list) return;
    var items = readLog(c.email);
    if (!items.length) {
      list.innerHTML = '<li style="color:var(--ix-text-muted);font-size:13px">Chưa có thao tác nào.</li>';
      return;
    }
    list.innerHTML = items.map(function (item) {
      return '<li class="adm-sub-log-item">' +
        '<div class="adm-sub-log-item__time">' + fmtDate(item.at) + '</div>' +
        '<div class="adm-sub-log-item__action">' + esc(item.action) + '</div>' +
        '<div class="adm-sub-log-item__detail">' + esc(item.detail) + '</div>' +
      '</li>';
    }).join('');
  }

  function render() {
    var c = reloadCustomer();
    if (!c) {
      showMissing();
      return;
    }
    var miss = document.getElementById('adm-sub-missing');
    var main = document.getElementById('adm-sub-main');
    if (miss) miss.hidden = true;
    if (main) main.hidden = false;
    renderSummary(c);
    renderOrders(c);
    renderLog(c);
  }

  function applyPatch(patch, logAction, logDetail) {
    if (!customer) return;
    customer = Object.assign({}, customer, patch);
    syncCustomerToApp(customer);
    appendLog(customer.email, logAction, logDetail);
    if (global.ixToast) ixToast(logAction + ' thành công', 'success');
    render();
  }

  function onOverride() {
    if (!customer) return;
    var pkg = (document.getElementById('adm-sub-override-package') || {}).value || 'Free';
    var plan = (document.getElementById('adm-sub-override-plan') || {}).value || 'freemium';
    if (pkg === 'Free') plan = 'freemium';

    var patch = {
      package: pkg,
      planType: plan,
      billing: pkg === 'Free' ? '—' : (customer.billing === '—' ? 'Manual' : customer.billing),
      expiresAt: planExpiry(plan)
    };
    if (!confirm('Ghi đè gói thành ' + (PKG_LABELS[pkg] || pkg) + ' · ' + (PLAN_LABELS[plan] || plan) + '?')) return;
    applyPatch(patch, 'Ghi đè gói', (PKG_LABELS[pkg] || pkg) + ' / ' + (PLAN_LABELS[plan] || plan));
  }

  function onExtend(days) {
    if (!customer) return;
    if (customer.planType === 'freemium') {
      if (global.ixToast) ixToast('Khách đang dùng Miễn phí — hãy nâng gói trước', 'warning');
      return;
    }
    if (customer.planType === 'lifetime') {
      if (global.ixToast) ixToast('Gói trọn đời không cần gia hạn', 'info');
      return;
    }
    var base = customer.expiresAt;
    var d = daysUntil(base);
    if (d !== null && d <= 0) base = null;
    var next = addDays(days, base);
    if (!confirm('Gia hạn thêm ' + days + ' ngày · hết hạn mới: ' + next + '?')) return;
    applyPatch({ expiresAt: next }, 'Gia hạn', '+' + days + ' ngày → ' + next);
  }

  function onExtendCustom() {
    var input = document.getElementById('adm-sub-extend-days');
    var days = parseInt((input && input.value) || '0', 10);
    if (!days || days < 1) {
      if (global.ixToast) ixToast('Nhập số ngày gia hạn hợp lệ', 'warning');
      return;
    }
    onExtend(days);
  }

  function onDowngradeFree() {
    if (!customer) return;
    if (!confirm('Hạ khách về gói Miễn phí? Quyền Premium/Elite sẽ bị thu hồi.')) return;
    applyPatch({
      package: 'Free',
      planType: 'freemium',
      expiresAt: null,
      billing: '—'
    }, 'Hạ về Miễn phí', 'Thu hồi gói trả phí');
  }

  function onToggleBlock() {
    if (!customer) return;
    var suspended = customer.accountStatus === 'suspended';
    var next = suspended ? 'active' : 'suspended';
    var msg = suspended ? 'Mở khóa tài khoản cho khách?' : 'Khóa tài khoản? Khách sẽ không đăng nhập được.';
    if (!confirm(msg)) return;
    applyPatch({ accountStatus: next }, suspended ? 'Mở khóa' : 'Khóa tài khoản', next === 'suspended' ? 'Tạm khóa' : 'Hoạt động');
  }

  function bindOrderActions() {
    document.addEventListener('click', function (e) {
      var Store = global.IfluxSubscriptionOrdersStore;
      if (!Store || !customer) return;

      var approve = e.target.closest('[data-adm-sub-approve]');
      if (approve) {
        var id = approve.getAttribute('data-adm-sub-approve');
        if (!confirm('Xác nhận duyệt đơn ' + id + ' và kích hoạt gói cho khách?')) return;
        Promise.resolve(Store.approveOrder(id, { adminName: 'Admin' })).then(function (res) {
          if (res.ok) {
            var o = res.order;
            var refresh = Store.refreshFromApi ? Store.refreshFromApi() : Promise.resolve();
            refresh.then(function () {
              var pkg = o.planName || (o.planTier === 'elite' ? 'Elite' : (o.planTier === 'premium' ? 'Premium' : 'Free'));
              var planType = o.cycle === 'lifetime' ? 'lifetime' : (o.cycle === 'annual' ? 'yearly' : 'monthly');
              applyPatch({
                package: pkg,
                planType: planType,
                expiresAt: planExpiry(planType),
                billing: 'Manual'
              }, 'Duyệt đơn', o.id);
            });
          } else if (global.ixToast) ixToast('Không thể duyệt đơn này', 'danger');
        });
        return;
      }

      var reject = e.target.closest('[data-adm-sub-reject]');
      if (reject) {
        var rid = reject.getAttribute('data-adm-sub-reject');
        var reason = prompt('Lý do từ chối (tuỳ chọn):', 'Không tìm thấy giao dịch chuyển khoản');
        if (reason === null) return;
        Promise.resolve(Store.rejectOrder(rid, reason, { adminName: 'Admin' })).then(function (rej) {
          if (rej.ok) {
            appendLog(customer.email, 'Từ chối đơn', rid + ' — ' + reason);
            if (global.ixToast) ixToast('Đã từ chối đơn', 'info');
            render();
          }
        });
        return;
      }

      var refund = e.target.closest('[data-adm-sub-refund]');
      if (refund) {
        var fid = refund.getAttribute('data-adm-sub-refund');
        if (!confirm('Hoàn tiền đơn ' + fid + '? Gói khách sẽ được hạ về Miễn phí.')) return;
        var ref = Store.refundOrder ? Store.refundOrder(fid, { adminName: 'Admin', reason: 'Admin hoàn tiền' }) : { ok: false };
        if (ref.ok) {
          applyPatch({
            package: 'Free',
            planType: 'freemium',
            expiresAt: null,
            billing: '—'
          }, 'Hoàn tiền', fid);
        } else if (global.ixToast) ixToast('Không thể hoàn tiền đơn này', 'danger');
      }
    });
  }

  function bindForms() {
    var pkgEl = document.getElementById('adm-sub-override-package');
    if (pkgEl) pkgEl.addEventListener('change', syncOverridePlanField);

    var overrideBtn = document.getElementById('adm-sub-btn-override');
    if (overrideBtn) overrideBtn.addEventListener('click', onOverride);

    document.querySelectorAll('[data-adm-sub-extend]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        onExtend(parseInt(btn.getAttribute('data-adm-sub-extend'), 10));
      });
    });

    var extendCustom = document.getElementById('adm-sub-btn-extend-custom');
    if (extendCustom) extendCustom.addEventListener('click', onExtendCustom);

    var downgradeBtn = document.getElementById('adm-sub-btn-downgrade');
    if (downgradeBtn) downgradeBtn.addEventListener('click', onDowngradeFree);

    var blockBtn = document.getElementById('adm-sub-btn-block');
    if (blockBtn) blockBtn.addEventListener('click', onToggleBlock);
  }

  function init() {
    if (!queryEmail()) {
      showMissing();
      return;
    }
    bindForms();
    bindOrderActions();
    render();
    document.addEventListener('iflux-orders-changed', render);
  }

  global.UsersSubscription = { init: init, getCustomer: function () { return customer; } };
})(window);
