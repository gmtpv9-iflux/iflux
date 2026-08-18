/* ADM-SUB-004 — Loyalty admin page */
(function (global) {
  'use strict';

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function qs(name) {
    return new URLSearchParams(location.search).get(name);
  }

  function setTab(tabId) {
    document.querySelectorAll('.adm-loyalty-tab').forEach(function (btn) {
      btn.classList.toggle('active', btn.getAttribute('data-adm-loyalty-tab') === tabId);
    });
    document.querySelectorAll('.adm-loyalty-panel').forEach(function (panel) {
      panel.classList.toggle('active', panel.id === tabId);
    });
    history.replaceState(null, '', 'loyalty.html?tab=' + encodeURIComponent(tabId.replace('tab-adm-', '')));
  }

  function bindTabs() {
    document.querySelectorAll('.adm-loyalty-tab').forEach(function (btn) {
      btn.addEventListener('click', function () {
        setTab(btn.getAttribute('data-adm-loyalty-tab'));
      });
    });
    var initial = qs('tab');
    if (initial === 'coupons') setTab('tab-adm-coupons');
    else if (initial === 'payouts') setTab('tab-adm-payouts');
    else setTab('tab-adm-affiliate');
  }

  function renderAffiliateStats() {
    var stats = LoyaltyAffiliateStore.getStats();
    var el;
    el = document.getElementById('adm-aff-stat-total');
    if (el) el.textContent = LoyaltyAffiliateStore.formatVnd(stats.totalEarn);
    el = document.getElementById('adm-aff-stat-unpaid');
    if (el) el.textContent = LoyaltyAffiliateStore.formatVnd(stats.unpaid);
    el = document.getElementById('adm-aff-stat-signups');
    if (el) el.textContent = String(stats.signups);
    el = document.getElementById('adm-aff-stat-conv');
    if (el) el.textContent = stats.convRate + '%';
  }

  function fillAffiliateConfig() {
    var cfg = LoyaltyAffiliateStore.getConfig();
    var map = {
      'cfg-enabled': cfg.enabled,
      'cfg-f0': cfg.f0_pct,
      'cfg-f1': cfg.f1_pct,
      'cfg-f2': cfg.f2_pct,
      'cfg-min-payout': cfg.min_payout,
      'cfg-cookie-days': cfg.cookie_days
    };
    Object.keys(map).forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      if (el.type === 'checkbox') el.checked = !!map[id];
      else el.value = map[id];
    });
    var steps = document.getElementById('adm-aff-steps');
    if (steps) {
      steps.innerHTML =
        '<div class="ix-referral-step"><div class="ix-referral-step-icon"><i class="ti ti-link"></i></div>' +
        '<div class="ix-referral-step-title">Người giới thiệu trực tiếp mua hàng (F0)</div>' +
        '<div class="ix-referral-step-reward">F0 · ' + cfg.f0_pct + '%</div></div>' +
        '<div class="ix-referral-step"><div class="ix-referral-step-icon"><i class="ti ti-user-plus"></i></div>' +
        '<div class="ix-referral-step-title">F1 của bạn mua / giới thiệu tiếp (F1)</div>' +
        '<div class="ix-referral-step-reward">F1 · ' + cfg.f1_pct + '%</div></div>' +
        '<div class="ix-referral-step"><div class="ix-referral-step-icon"><i class="ti ti-users-group"></i></div>' +
        '<div class="ix-referral-step-title">Chuỗi cấp 3 — F2 thụ động</div>' +
        '<div class="ix-referral-step-reward">F2 · ' + cfg.f2_pct + '%</div></div>';
    }
  }

  function bindAffiliate() {
    fillAffiliateConfig();
    renderAffiliateStats();

    var saveBtn = document.getElementById('adm-aff-save-config');
    if (saveBtn) {
      saveBtn.addEventListener('click', function () {
        var res = LoyaltyAffiliateStore.saveConfig({
          enabled: document.getElementById('cfg-enabled').checked,
          f0_pct: document.getElementById('cfg-f0').value,
          f1_pct: document.getElementById('cfg-f1').value,
          f2_pct: document.getElementById('cfg-f2').value,
          min_payout: document.getElementById('cfg-min-payout').value,
          cookie_days: document.getElementById('cfg-cookie-days').value
        });
        if (res.ok) {
          fillAffiliateConfig();
          if (global.ixToast) ixToast('Đã lưu cấu hình Affiliate', 'success');
        }
      });
    }
  }

  function openCouponModal(data) {
    var overlay = document.getElementById('adm-coupon-modal');
    if (!overlay) return;
    document.getElementById('adm-coupon-modal-title').textContent = data ? 'Sửa mã giảm giá' : 'Thêm mã giảm giá';
    document.getElementById('cp-code').value = data ? data.code : '';
    document.getElementById('cp-code').readOnly = !!data;
    document.getElementById('cp-original-code').value = data ? data.code : '';
    document.getElementById('cp-label').value = data ? data.label : '';
    document.getElementById('cp-discount-pct').value = data && data.discount_pct ? data.discount_pct : '';
    document.getElementById('cp-discount-fixed').value = data && data.discount_fixed ? data.discount_fixed : '';
    document.getElementById('cp-min-order').value = data ? (data.min_order || 0) : 0;
    document.getElementById('cp-expires').value = data ? (data.expires_at || '') : '';
    document.getElementById('cp-scope').value = data ? (data.scope || 'Gói cước') : 'Gói cước';
    document.getElementById('cp-active').checked = data ? data.active !== false : true;
    overlay.style.display = 'flex';
  }

  function closeCouponModal() {
    var overlay = document.getElementById('adm-coupon-modal');
    if (overlay) overlay.style.display = 'none';
  }

  function renderCouponTable() {
    var tbody = document.getElementById('adm-coupon-tbody');
    if (!tbody) return;
    var q = ((document.getElementById('adm-coupon-search') || {}).value || '').toLowerCase();
    var list = LoyaltyCouponCatalogStore.listAll().filter(function (c) {
      if (!q) return true;
      return [c.code, c.label, c.scope].join(' ').toLowerCase().indexOf(q) >= 0;
    });
    if (!list.length) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:32px;color:var(--ix-text-muted)">Chưa có mã giảm giá.</td></tr>';
      return;
    }
    tbody.innerHTML = list.map(function (c) {
      var st = LoyaltyCouponCatalogStore.statusOf(c);
      return '<tr>' +
        '<td style="font-weight:700;letter-spacing:1px;font-family:ui-monospace,monospace">' + esc(c.code) + '</td>' +
        '<td>' + esc(c.label) + '</td>' +
        '<td>' + LoyaltyCouponCatalogStore.formatDiscount(c) + '</td>' +
        '<td>' + esc(c.scope) + '</td>' +
        '<td>' + (c.expires_at ? new Date(c.expires_at).toLocaleDateString('vi-VN') : '—') + '</td>' +
        '<td><span class="ix-chip ' + st.chip + '" style="font-size:11px">' + esc(st.text) + '</span></td>' +
        '<td><div style="display:flex;gap:4px">' +
          '<button type="button" class="ix-btn ix-btn-icon" data-adm-coupon-edit="' + esc(c.code) + '" title="Sửa"><i class="ti ti-edit" style="font-size:14px"></i></button>' +
          '<button type="button" class="ix-btn ix-btn-icon" data-adm-coupon-toggle="' + esc(c.code) + '" title="Bật/tắt"><i class="ti ti-toggle-left" style="font-size:14px"></i></button>' +
          '<button type="button" class="ix-btn ix-btn-icon" data-adm-coupon-delete="' + esc(c.code) + '" title="Xoá"><i class="ti ti-trash" style="font-size:14px"></i></button>' +
        '</div></td></tr>';
    }).join('');
  }

  function bindCoupons() {
    renderCouponTable();

    var addBtn = document.getElementById('adm-coupon-add');
    if (addBtn) addBtn.addEventListener('click', function () { openCouponModal(null); });

    var search = document.getElementById('adm-coupon-search');
    if (search) search.addEventListener('input', renderCouponTable);

    document.getElementById('adm-coupon-modal-close').addEventListener('click', closeCouponModal);
    document.getElementById('adm-coupon-modal-cancel').addEventListener('click', closeCouponModal);

    document.getElementById('adm-coupon-modal-save').addEventListener('click', function () {
      var res = LoyaltyCouponCatalogStore.save({
        code: document.getElementById('cp-code').value,
        label: document.getElementById('cp-label').value,
        discount_pct: document.getElementById('cp-discount-pct').value,
        discount_fixed: document.getElementById('cp-discount-fixed').value,
        min_order: document.getElementById('cp-min-order').value,
        expires_at: document.getElementById('cp-expires').value,
        scope: document.getElementById('cp-scope').value,
        active: document.getElementById('cp-active').checked
      }, document.getElementById('cp-original-code').value);
      if (!res.ok) {
        if (global.ixToast) ixToast(res.error, 'danger');
        return;
      }
      closeCouponModal();
      renderCouponTable();
      if (global.ixToast) ixToast('Đã lưu mã ' + res.coupon.code, 'success');
    });

    document.addEventListener('click', function (e) {
      var editBtn = e.target.closest('[data-adm-coupon-edit]');
      if (editBtn) {
        var c = LoyaltyCouponCatalogStore.get(editBtn.getAttribute('data-adm-coupon-edit'));
        if (c) openCouponModal(c);
        return;
      }
      var toggleBtn = e.target.closest('[data-adm-coupon-toggle]');
      if (toggleBtn) {
        var code = toggleBtn.getAttribute('data-adm-coupon-toggle');
        LoyaltyCouponCatalogStore.toggleActive(code);
        renderCouponTable();
        if (global.ixToast) ixToast('Đã cập nhật trạng thái ' + code, 'success');
        return;
      }
      var delBtn = e.target.closest('[data-adm-coupon-delete]');
      if (delBtn) {
        var delCode = delBtn.getAttribute('data-adm-coupon-delete');
        if (!confirm('Xoá mã "' + delCode + '"?')) return;
        var delRes = LoyaltyCouponCatalogStore.remove(delCode);
        if (!delRes.ok) {
          if (global.ixToast) ixToast(delRes.error, 'danger');
          return;
        }
        renderCouponTable();
        if (global.ixToast) ixToast('Đã xoá mã', 'success');
      }
    });
  }

  function bindPayouts() {
    var Store = global.IfluxAffiliatePayoutStore;
    if (!Store) return;

    function renderPayoutStats() {
      var stats = Store.statsAdmin();
      var el;
      el = document.getElementById('adm-payout-stat-pending');
      if (el) el.textContent = String(stats.pending);
      el = document.getElementById('adm-payout-stat-processing');
      if (el) el.textContent = String(stats.processing);
      el = document.getElementById('adm-payout-stat-paid');
      if (el) el.textContent = String(stats.paid);
    }

    function renderPayoutTable() {
      var tbody = document.getElementById('adm-payout-tbody');
      if (!tbody) return;
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

    function refreshPayouts() {
      Store.refreshFromApi(true).finally(function () {
        renderPayoutStats();
        renderPayoutTable();
      });
    }

    refreshPayouts();

    ['adm-payout-search', 'adm-payout-filter-status'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener(el.tagName === 'INPUT' ? 'input' : 'change', renderPayoutTable);
    });

    document.addEventListener('click', function (e) {
      var approveBtn = e.target.closest('[data-adm-payout-approve]');
      if (approveBtn) {
        Store.approveRequest(approveBtn.getAttribute('data-adm-payout-approve')).then(function (res) {
          if (res.ok) {
            refreshPayouts();
            if (global.ixToast) ixToast('Đã duyệt yêu cầu rút tiền', 'success');
          }
        });
        return;
      }
      var completeBtn = e.target.closest('[data-adm-payout-complete]');
      if (completeBtn) {
        Store.completeRequest(completeBtn.getAttribute('data-adm-payout-complete')).then(function (res) {
          if (res.ok) {
            refreshPayouts();
            renderAffiliateStats();
            if (global.ixToast) ixToast('Đã xác nhận chuyển khoản', 'success');
          }
        });
        return;
      }
      var rejectBtn = e.target.closest('[data-adm-payout-reject]');
      if (rejectBtn) {
        var reason = prompt('Lý do từ chối (tuỳ chọn):', '') || '';
        Store.rejectRequest(rejectBtn.getAttribute('data-adm-payout-reject'), reason).then(function (res) {
          if (res.ok) {
            refreshPayouts();
            if (global.ixToast) ixToast('Đã từ chối yêu cầu', 'info');
          }
        });
      }
    });
  }

  function init() {
    bindTabs();
    bindAffiliate();
    bindCoupons();
    bindPayouts();
  }

  global.AdmLoyaltyPage = { init: init };
})(window);
