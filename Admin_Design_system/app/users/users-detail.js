/* ADM-USR-002 — Chi tiết khách hàng (profile + timeline + override mật khẩu) */
(function (global) {
  'use strict';

  var ROLE_LABELS = {
    'Standard': 'Tiêu chuẩn',
    'Creator': 'Sáng tạo',
    'Analyst': 'Phân tích',
    'API Partner': 'Đối tác API',
    'Community Expert': 'Chuyên gia cộng đồng'
  };

  var PLAN_LABELS = {
    freemium: 'Miễn phí',
    monthly: 'Hàng tháng',
    yearly: 'Hàng năm',
    lifetime: 'Trọn đời'
  };

  var PKG_LABELS = {
    Free: 'Miễn phí',
    Premium: 'Premium',
    Elite: 'Elite'
  };

  var customer = null;

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

  function daysUntil(expiresAt) {
    if (!expiresAt) return null;
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var end = new Date(expiresAt + 'T00:00:00');
    return Math.ceil((end - today) / 86400000);
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

  function setText(id, text) {
    var el = document.getElementById(id);
    if (el) el.textContent = text == null ? '—' : String(text);
  }

  function showMissing() {
    var miss = document.getElementById('adm-user-missing');
    var profile = document.getElementById('adm-user-profile');
    if (miss) miss.hidden = false;
    if (profile) profile.hidden = true;
  }

  function renderSidebar(c) {
    var st = resolveStatus(c);
    var avatar = document.getElementById('adm-user-avatar');
    if (avatar) {
      avatar.textContent = c.initials || 'U';
      avatar.className = 'ix-profile-avatar ' + (c.avatarCls || '');
    }
    setText('adm-user-name', c.name);
    setText('adm-user-package-chip', PKG_LABELS[c.package] || c.package);
    setText('adm-user-email', c.email);
    setText('adm-user-phone', c.phone || '—');
    setText('adm-user-affiliate', c.affiliate || '—');
    setText('adm-user-role', ROLE_LABELS[c.role] || c.role || '—');
    setText('adm-user-billing', c.billing || '—');
    setText('adm-user-source', c.source === 'admin' ? 'Admin tạo' : 'Ứng dụng');

    var statusEl = document.getElementById('adm-user-status');
    if (statusEl) {
      statusEl.textContent = st.text;
      statusEl.className = 'ix-chip ' + st.chip;
      statusEl.style.fontSize = '11px';
    }

    setText('adm-plan-name', PKG_LABELS[c.package] || c.package);
    var planSub = document.getElementById('adm-plan-sub');
    if (planSub) {
      if (c.planType === 'lifetime') planSub.textContent = 'Trọn đời';
      else if (c.planType === 'freemium') planSub.textContent = 'Miễn phí';
      else {
        var days = daysUntil(c.expiresAt);
        planSub.textContent = (PLAN_LABELS[c.planType] || c.planType) +
          (days != null ? ' · còn ' + Math.max(0, days) + ' ngày' : '');
      }
    }

    var subLink = document.getElementById('adm-link-subscription');
    if (subLink) subLink.href = 'subscription.html?email=' + encodeURIComponent(c.email);
  }

  function renderAccountTab(c) {
    setText('adm-acc-name', c.name);
    setText('adm-acc-email', c.email);
    setText('adm-acc-phone', c.phone || '—');
    setText('adm-acc-id', c.id || '—');
    setText('adm-acc-affiliate', c.affiliate || '—');
    setText('adm-acc-package', PKG_LABELS[c.package] || c.package);
    setText('adm-acc-plan', PLAN_LABELS[c.planType] || c.planType);
    setText('adm-acc-role', ROLE_LABELS[c.role] || c.role || '—');
    setText('adm-acc-billing', c.billing || '—');
    setText('adm-acc-expires', c.expiresAt || (c.planType === 'lifetime' ? '∞' : '—'));
  }

  function renderPasswordStatus(email) {
    var el = document.getElementById('adm-pwd-status');
    if (!el || !global.IfluxCredentialsStore) return;
    var has = IfluxCredentialsStore.hasPassword(email);
    el.innerHTML = has
      ? '<span class="ix-chip ix-chip-success" style="font-size:11px">Đã thiết lập mật khẩu</span>'
      : '<span class="ix-chip ix-chip-warning" style="font-size:11px">Chưa thiết lập / đăng nhập OTP</span>';
  }

  function bindPasswordOverride(email) {
    var btn = document.getElementById('adm-btn-override-pwd');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var pwd = (document.getElementById('adm-pwd-new') || {}).value || '';
      var confirm = (document.getElementById('adm-pwd-confirm') || {}).value || '';
      var reason = (document.getElementById('adm-pwd-reason') || {}).value || '';
      if (pwd.length < 8) {
        if (typeof ixToast === 'function') ixToast('Mật khẩu tối thiểu 8 ký tự', 'warning');
        return;
      }
      if (pwd !== confirm) {
        if (typeof ixToast === 'function') ixToast('Xác nhận mật khẩu không khớp', 'danger');
        return;
      }
      if (!global.IfluxCredentialsStore) {
        if (typeof ixToast === 'function') ixToast('Kho mật khẩu chưa sẵn sàng', 'danger');
        return;
      }
      var res = IfluxCredentialsStore.overridePassword(email, pwd, { by: 'admin', reason: reason });
      if (!res.ok) {
        if (typeof ixToast === 'function') ixToast(res.error || 'Lỗi ghi đè', 'danger');
        return;
      }
      document.getElementById('adm-pwd-new').value = '';
      document.getElementById('adm-pwd-confirm').value = '';
      if (document.getElementById('adm-pwd-reason')) document.getElementById('adm-pwd-reason').value = '';
      renderPasswordStatus(email);
      if (typeof ixToast === 'function') ixToast('Đã ghi đè mật khẩu cho ' + email, 'success');
    });
  }

  function seedCommentsIfNeeded() {
    if (!global.IfluxStockStore) return;
    ['HPG', 'VCB', 'FPT'].forEach(function (tk) { IfluxStockStore.getComments(tk); });
  }

  function initProfileTabs(c) {
    var uid = c.id || ('usr_' + c.email);
    if (!c.id) {
      global.IfluxCustomersStore.updateCustomer(c.email, { id: uid });
      c.id = uid;
    }

    if (global.PatternUserProfile) PatternUserProfile.init();

    if (global.IfluxProfilePage) {
      IfluxProfilePage.init({
        userId: uid,
        stockBase: '../../../User_Web/stock/',
        readOnlyFollowing: true
      });
    }

    var followingEl = document.querySelector('[data-bind="following"]');
    if (followingEl && global.IfluxProfileFollowStore) {
      followingEl.textContent = String(IfluxProfileFollowStore.countFollowing(uid));
    }
  }

  function init() {
    var email = queryEmail();
    document.title = (email || 'Chi tiết KH') + ' · iFlux Admin';

    var title = document.getElementById('adm-user-title');
    if (title) title.textContent = email ? 'Chi tiết khách hàng' : 'Chi tiết khách hàng';

    var crumb = document.getElementById('adm-user-crumb-email');
    if (crumb) crumb.textContent = email || 'Không tìm thấy';

    if (!email || !global.IfluxCustomersStore) {
      showMissing();
      return;
    }

    customer = IfluxCustomersStore.getCustomerByEmail(email);
    if (!customer) {
      showMissing();
      return;
    }

    var miss = document.getElementById('adm-user-missing');
    var profile = document.getElementById('adm-user-profile');
    if (miss) miss.hidden = true;
    if (profile) profile.hidden = false;

    renderSidebar(customer);
    renderAccountTab(customer);
    renderPasswordStatus(customer.email);
    bindPasswordOverride(customer.email);
    seedCommentsIfNeeded();
    initProfileTabs(customer);
  }

  global.UsersDetail = { init: init, getCustomer: function () { return customer; } };
})(window);
