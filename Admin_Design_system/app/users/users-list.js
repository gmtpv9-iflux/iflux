/* ADM-USR-001 — Customer user list mock */
(function (global) {
  var PACKAGE_META = {
    Free:    { icon: 'ti-gift',    cls: 'info' },
    Premium: { icon: 'ti-crown',   cls: 'accent' },
    Elite:   { icon: 'ti-diamond', cls: 'warning' }
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

  var ROLE_LABELS = {
    'Standard': 'Tiêu chuẩn',
    'Creator': 'Sáng tạo',
    'Analyst': 'Phân tích',
    'API Partner': 'Đối tác API',
    'Community Expert': 'Chuyên gia cộng đồng'
  };

  function addDays(n) {
    var d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + n);
    return d.toISOString().slice(0, 10);
  }

  var ROLE_META = {
    'Standard': { chip: 'ix-chip-primary' },
    'Creator': { chip: 'ix-chip-success' },
    'Analyst': { chip: 'ix-chip-info' },
    'API Partner': { chip: 'ix-chip-warning' },
    'Community Expert': { chip: 'ix-chip-danger' }
  };

  var CUSTOMERS = [];
  var API_CUSTOMERS = [];
  var LOADING = false;
  var API_TRIED = false;

  function apiUrl() {
    var base = (global.IfluxAdminAuth && IfluxAdminAuth.apiBase) ? IfluxAdminAuth.apiBase() : '/api';
    return base + '/admin/users';
  }

  function adminToken() {
    if (global.IfluxAdminAuth && IfluxAdminAuth.getSession) {
      var s = IfluxAdminAuth.getSession();
      if (s && s.token) return s.token;
    }
    // Fallback: đọc thẳng phiên admin nếu module auth chưa nạp
    try {
      var raw = localStorage.getItem('iflux_admin_session') || sessionStorage.getItem('iflux_admin_session');
      if (raw) {
        var obj = JSON.parse(raw);
        if (obj && obj.token) return obj.token;
      }
    } catch (e) { /* ignore */ }
    return null;
  }

  // Nguồn thật: bảng users qua API admin. localStorage chỉ để gộp khách do admin nhập tay (chưa vào DB).
  function reloadCustomers() {
    var merged = API_CUSTOMERS.slice();
    if (global.IfluxCustomersStore) {
      var seen = {};
      merged.forEach(function (c) { seen[(c.email || '').toLowerCase()] = true; });
      IfluxCustomersStore.listCustomers().forEach(function (c) {
        var k = (c.email || '').toLowerCase();
        if (c.source === 'admin' && !seen[k]) merged.push(c);
      });
    }
    CUSTOMERS = merged;
  }

  function loadFromApi() {
    var token = adminToken();
    if (!token) { API_TRIED = true; return Promise.resolve(false); }
    LOADING = true;
    return fetch(apiUrl(), {
      headers: { 'Authorization': 'Bearer ' + token, 'Accept': 'application/json' },
      cache: 'no-store'
    })
      .then(function (res) {
        if (res.status === 401 || res.status === 403) {
          // Token admin cũ/hết hạn (vd sau khi xoay JWT_SECRET) → buộc đăng nhập lại để lấy token mới.
          if (global.IfluxAdminAuth && IfluxAdminAuth.logout) {
            IfluxAdminAuth.logout();
          }
          throw new Error('AUTH_EXPIRED');
        }
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (data) {
        API_CUSTOMERS = (data && data.customers) || [];
        LOADING = false;
        API_TRIED = true;
        return true;
      })
      .catch(function () {
        API_CUSTOMERS = [];
        LOADING = false;
        API_TRIED = true;
        return false;
      });
  }

  function daysUntil(expiresAt) {
    if (!expiresAt) return null;
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var end = new Date(expiresAt + 'T00:00:00');
    return Math.ceil((end - today) / 86400000);
  }

  function isPaidPackage(pkg) {
    return pkg === 'Premium' || pkg === 'Elite';
  }

  function isPaidActive(user) {
    if (!isPaidPackage(user.package)) return false;
    if (user.accountStatus === 'suspended') return false;
    if (user.planType === 'lifetime') return true;
    var days = daysUntil(user.expiresAt);
    return days === null || days > 0;
  }

  function isExpiringSoon(user) {
    if (user.planType === 'freemium' || user.planType === 'lifetime') return false;
    if (user.accountStatus === 'suspended') return false;
    var days = daysUntil(user.expiresAt);
    return days !== null && days > 0 && days < 7;
  }

  function isExpiredInLast30Days(user) {
    if (user.planType === 'freemium' || user.planType === 'lifetime') return false;
    var days = daysUntil(user.expiresAt);
    return days !== null && days <= 0 && days >= -30;
  }

  function computeOverview() {
    var total = CUSTOMERS.length;
    var freeCount = CUSTOMERS.filter(function (u) { return u.package === 'Free'; }).length;
    var paidActive = CUSTOMERS.filter(isPaidActive).length;
    var premiumActive = CUSTOMERS.filter(function (u) { return isPaidActive(u) && u.package === 'Premium'; }).length;
    var eliteActive = CUSTOMERS.filter(function (u) { return isPaidActive(u) && u.package === 'Elite'; }).length;
    var expiringSoon = CUSTOMERS.filter(isExpiringSoon).length;
    var expired30 = CUSTOMERS.filter(isExpiredInLast30Days).length;

    return {
      total: total,
      freeCount: freeCount,
      paidActive: paidActive,
      premiumActive: premiumActive,
      eliteActive: eliteActive,
      expiringSoon: expiringSoon,
      expired30: expired30
    };
  }

  function renderOverview() {
    var o = computeOverview();
    var el;

    el = document.getElementById('stat-total');
    if (el) el.textContent = o.total.toLocaleString('en-US');

    el = document.getElementById('stat-total-sub');
    if (el) el.innerHTML = 'Miễn phí: <strong>' + o.freeCount + '</strong> · Trả phí: <strong>' + o.paidActive + '</strong>';

    el = document.getElementById('stat-paid');
    if (el) el.textContent = o.paidActive.toLocaleString('en-US');

    el = document.getElementById('stat-paid-sub');
    if (el) el.innerHTML = 'Premium: <strong>' + o.premiumActive + '</strong> · Elite: <strong>' + o.eliteActive + '</strong>';

    el = document.getElementById('stat-expiring');
    if (el) el.textContent = o.expiringSoon.toLocaleString('en-US');

    el = document.getElementById('stat-expired-30');
    if (el) el.textContent = o.expired30.toLocaleString('en-US');
  }

  function resolveStatus(user) {
    if (user.accountStatus === 'suspended') {
      return { key: 'suspended', text: 'Tạm khóa', chip: 'ix-chip-warning' };
    }
    if (user.planType === 'freemium' || user.planType === 'lifetime') {
      return { key: 'active', text: 'Hoạt động', chip: 'ix-chip-success' };
    }
    var days = daysUntil(user.expiresAt);
    if (days !== null && days <= 0) {
      return { key: 'expired', text: 'Hết hạn', chip: 'ix-chip-danger' };
    }
    return { key: 'active', text: 'Hoạt động', chip: 'ix-chip-success' };
  }

  function formatPlanCell(user) {
    var label = PLAN_LABELS[user.planType] || user.planType;
    if (user.planType === 'freemium') {
      return '<span style="font-weight:500;color:var(--ix-text-primary)">' + label + '</span> <span style="color:var(--ix-text-muted)">| —</span>';
    }
    if (user.planType === 'lifetime') {
      return '<span style="font-weight:500;color:var(--ix-text-primary)">' + label + '</span> <span style="color:var(--ix-text-muted)">| ∞</span>';
    }
    var days = daysUntil(user.expiresAt);
    var daysText = days !== null ? Math.max(0, days) : '—';
    var daysColor = days !== null && days > 0 && days < 7 ? 'var(--ix-warning)' : 'var(--ix-text-muted)';
    if (days !== null && days <= 0) daysColor = 'var(--ix-danger)';
    return '<span style="font-weight:500;color:var(--ix-text-primary)">' + label + '</span> <span style="color:' + daysColor + '">| ' + daysText + '</span>';
  }

  function formatPackageCell(pkg) {
    var meta = PACKAGE_META[pkg] || { icon: 'ti-package', cls: 'accent' };
    var label = PKG_LABELS[pkg] || pkg;
    return '<span style="display:inline-flex;align-items:center;gap:6px;color:var(--ix-text-secondary)">' +
      '<span class="ix-stat-icon ' + meta.cls + '" style="width:28px;height:28px;font-size:14px;border-radius:6px"><i class="ti ' + meta.icon + '"></i></span>' +
      '<span style="font-weight:500;color:var(--ix-text-primary)">' + escapeHtml(label) + '</span></span>';
  }

  var BILLING_LABELS = {
    '—': '—',
    'Auto debit': 'Tự động trừ',
    'Web': 'Web',
    'IAP iOS': 'IAP iOS',
    'IAP Android': 'IAP Android',
    'Manual': 'Thủ công'
  };

  function billingLabel(b) {
    return BILLING_LABELS[b] || b;
  }

  function escapeHtml(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  var AFF_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

  function generateAffiliateCode() {
    var part = '';
    for (var i = 0; i < 6; i++) {
      part += AFF_CHARS.charAt(Math.floor(Math.random() * AFF_CHARS.length));
    }
    return 'IFX-' + part;
  }

  function digitsOnlyPhone(value) {
    var digits = String(value || '').replace(/\D/g, '');
    if (digits.indexOf('84') === 0 && digits.length > 2) {
      digits = '0' + digits.slice(2);
    }
    return digits.slice(0, 10);
  }

  function formatVnPhone(value) {
    var digits = digitsOnlyPhone(value);
    if (!digits) return '';
    if (digits.length <= 4) return digits;
    if (digits.length <= 7) return digits.slice(0, 4) + ' ' + digits.slice(4);
    return digits.slice(0, 4) + ' ' + digits.slice(4, 7) + ' ' + digits.slice(7);
  }

  function isValidVnPhone(value) {
    var digits = digitsOnlyPhone(value);
    if (!digits) return true;
    return /^0(3|5|7|8|9)\d{8}$/.test(digits);
  }

  function initialsFromName(name) {
    var parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    }
    return name.trim().slice(0, 2).toUpperCase();
  }

  function avatarClassFromName(name) {
    var classes = ['ix-avatar-accent', 'ix-avatar-success', 'ix-avatar-warning', 'ix-avatar-danger', 'ix-avatar-info'];
    var sum = 0;
    for (var i = 0; i < name.length; i++) sum += name.charCodeAt(i);
    return classes[sum % classes.length];
  }

  function planExpiry(planType) {
    if (planType === 'freemium' || planType === 'lifetime') return null;
    if (planType === 'monthly') return addDays(28);
    if (planType === 'yearly') return addDays(245);
    return null;
  }

  function syncPlanWithPackage() {
    var pkgEl = document.getElementById('add-field-package');
    var planEl = document.getElementById('add-field-plan');
    if (!pkgEl || !planEl) return;
    if (pkgEl.value === 'Free') {
      planEl.value = 'freemium';
      planEl.disabled = true;
    } else {
      planEl.disabled = false;
      if (planEl.value === 'freemium') planEl.value = 'monthly';
    }
  }

  function resetAddUserForm() {
    var nameEl = document.getElementById('add-field-name');
    var emailEl = document.getElementById('add-field-email');
    var phoneEl = document.getElementById('add-field-phone');
    var affEl = document.getElementById('add-field-affiliate');
    var roleEl = document.getElementById('add-field-role');
    var pkgEl = document.getElementById('add-field-package');
    var planEl = document.getElementById('add-field-plan');
    if (nameEl) nameEl.value = '';
    if (emailEl) emailEl.value = '';
    if (phoneEl) phoneEl.value = '';
    if (affEl) affEl.value = generateAffiliateCode();
    if (roleEl) roleEl.value = 'Standard';
    if (pkgEl) pkgEl.value = 'Free';
    if (planEl) planEl.value = 'freemium';
    syncPlanWithPackage();
  }

  function submitAddUser() {
    var name = (document.getElementById('add-field-name') || {}).value || '';
    var email = (document.getElementById('add-field-email') || {}).value || '';
    var phoneRaw = (document.getElementById('add-field-phone') || {}).value || '';
    var affiliate = (document.getElementById('add-field-affiliate') || {}).value || '';
    var role = (document.getElementById('add-field-role') || {}).value || 'Standard';
    var pkg = (document.getElementById('add-field-package') || {}).value || 'Free';
    var planType = (document.getElementById('add-field-plan') || {}).value || 'freemium';

    name = name.trim();
    email = email.trim().toLowerCase();
    var phone = formatVnPhone(phoneRaw);

    if (!name) {
      if (typeof ixToast === 'function') ixToast('Họ và tên là bắt buộc', 'danger');
      return;
    }
    if (!email || email.indexOf('@') < 0) {
      if (typeof ixToast === 'function') ixToast('Email không hợp lệ', 'danger');
      return;
    }
    if (!isValidVnPhone(phoneRaw)) {
      if (typeof ixToast === 'function') ixToast('Số điện thoại Việt Nam không hợp lệ (10 số, bắt đầu 03/05/07/08/09)', 'danger');
      return;
    }
    if (CUSTOMERS.some(function (u) { return u.email === email; })) {
      if (typeof ixToast === 'function') ixToast('Email đã tồn tại', 'danger');
      return;
    }
    if (pkg === 'Free') planType = 'freemium';

    var record = {
      name: name,
      email: email,
      phone: phone,
      affiliate: affiliate,
      initials: initialsFromName(name),
      avatarCls: avatarClassFromName(name),
      package: pkg,
      planType: planType,
      role: role,
      expiresAt: planExpiry(planType),
      billing: pkg === 'Free' ? '—' : 'Manual',
      accountStatus: 'active',
      source: 'admin'
    };

    if (global.IfluxCustomersStore) {
      IfluxCustomersStore.upsertCustomer(record);
      reloadCustomers();
    } else {
      CUSTOMERS.unshift(record);
    }

    refresh();
    if (typeof ixCloseOffcanvas === 'function') ixCloseOffcanvas('offcanvas-add-user');
    if (typeof ixToast === 'function') ixToast('Đã thêm khách hàng · Mã affiliate: ' + affiliate, 'success');
  }

  function initAddUserForm() {
    var openBtn = document.querySelector('[data-ix-offcanvas="offcanvas-add-user"]');
    if (openBtn) {
      openBtn.addEventListener('click', function () {
        resetAddUserForm();
      });
    }

    var regenBtn = document.getElementById('btn-regen-affiliate');
    if (regenBtn) {
      regenBtn.addEventListener('click', function () {
        var affEl = document.getElementById('add-field-affiliate');
        if (affEl) affEl.value = generateAffiliateCode();
      });
    }

    var phoneEl = document.getElementById('add-field-phone');
    if (phoneEl) {
      phoneEl.addEventListener('input', function () {
        var formatted = formatVnPhone(phoneEl.value);
        phoneEl.value = formatted;
      });
    }

    var pkgEl = document.getElementById('add-field-package');
    if (pkgEl) pkgEl.addEventListener('change', syncPlanWithPackage);

    var submitBtn = document.getElementById('btn-submit-add-user');
    if (submitBtn) submitBtn.addEventListener('click', submitAddUser);
  }

  function formatRoleCell(role) {
    var meta = ROLE_META[role] || { chip: 'ix-chip-primary' };
    var label = ROLE_LABELS[role] || role;
    return '<span class="ix-chip ' + meta.chip + '" style="font-size:12px">' + escapeHtml(label) + '</span>';
  }

  function getFilters() {
    return {
      package: (document.getElementById('filter-package') || {}).value || '',
      plan: (document.getElementById('filter-plan') || {}).value || '',
      role: (document.getElementById('filter-role') || {}).value || '',
      status: (document.getElementById('filter-status') || {}).value || '',
      search: ((document.getElementById('users-search') || {}).value || '').trim().toLowerCase()
    };
  }

  function matchesFilters(user, f) {
    var st = resolveStatus(user);
    if (f.package && user.package !== f.package) return false;
    if (f.plan && user.planType !== f.plan) return false;
    if (f.role && user.role !== f.role) return false;
    if (f.status && st.key !== f.status) return false;
    if (f.search) {
      var hay = (user.name + ' ' + user.email + ' ' + (user.phone || '') + ' ' + (user.affiliate || '') + ' ' + user.package + ' ' + user.role).toLowerCase();
      if (hay.indexOf(f.search) < 0) return false;
    }
    return true;
  }

  function renderRows() {
    var tbody = document.getElementById('users-tbody');
    if (!tbody) return [];
    var f = getFilters();
    var list = CUSTOMERS.filter(function (u) { return matchesFilters(u, f); });

    if (!list.length) {
      var msg = LOADING
        ? 'Đang tải danh sách khách hàng…'
        : (!API_TRIED
            ? 'Đang tải danh sách khách hàng…'
            : 'Không có khách hàng phù hợp.');
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:32px;color:var(--ix-text-muted);font-size:13px">' + msg + '</td></tr>';
      return [];
    }

    tbody.innerHTML = list.map(function (u) {
      var st = resolveStatus(u);
      var avatarStyle = u.avatarCls ? '' : ' style="background:var(--ix-warning-soft);color:var(--ix-warning)"';
      var avatarClass = u.avatarCls ? 'ix-avatar-sm ' + u.avatarCls : 'ix-avatar-sm';
      return '<tr data-package="' + escapeHtml(u.package) + '" data-plan="' + escapeHtml(u.planType) + '" data-status="' + st.key + '">' +
        '<td><input type="checkbox" class="ix-checkbox" /></td>' +
        '<td><div class="ix-user-cell">' +
          '<div class="' + avatarClass + '"' + avatarStyle + '>' + escapeHtml(u.initials) + '</div>' +
          '<div><div class="ix-user-name">' + escapeHtml(u.name) + '</div>' +
          '<div class="ix-user-email">' + escapeHtml(u.email) + '</div></div></div></td>' +
        '<td>' + formatPackageCell(u.package) + '</td>' +
        '<td>' + formatPlanCell(u) + '</td>' +
        '<td>' + formatRoleCell(u.role || 'Standard') + '</td>' +
        '<td>' + escapeHtml(billingLabel(u.billing)) + '</td>' +
        '<td><span class="ix-chip ' + st.chip + '">' + st.text + '</span></td>' +
        '<td><div style="display:flex;gap:4px">' +
          '<a href="detail.html?email=' + encodeURIComponent(u.email) + '" class="ix-btn ix-btn-icon" title="Chi tiết"><i class="ti ti-eye" style="font-size:14px"></i></a>' +
          '<a href="subscription.html?email=' + encodeURIComponent(u.email) + '" class="ix-btn ix-btn-icon" title="Thao tác gói"><i class="ti ti-credit-card" style="font-size:14px"></i></a>' +
        '</div></td></tr>';
    }).join('');

    return list;
  }

  function renderPagination(rowCount) {
    var pager = document.getElementById('users-pagination');
    if (!pager) return;
    var perPage = 5;
    var pages = Math.max(1, Math.ceil(rowCount / perPage));
    if (rowCount === 0) {
      pager.innerHTML = '';
      return;
    }
    var rows = Array.from(document.querySelectorAll('#users-tbody tr'));
    var current = 1;

    function showPage(page) {
      current = Math.max(1, Math.min(page, pages));
      rows.forEach(function (r, i) {
        r.style.display = (i >= (current - 1) * perPage && i < current * perPage) ? '' : 'none';
      });
      pager.innerHTML = '';
      var info = document.createElement('span');
      info.className = 'ix-page-info';
      info.textContent = 'Hiển thị ' + ((current - 1) * perPage + 1) + '–' + Math.min(current * perPage, rowCount) + ' / ' + rowCount;
      var nav = document.createElement('div');
      nav.style.display = 'flex';
      nav.style.gap = '4px';
      function btn(label, p, dis) {
        var b = document.createElement('button');
        b.className = 'ix-page-btn' + (p === current ? ' active' : '');
        b.textContent = label;
        b.disabled = dis;
        b.type = 'button';
        b.addEventListener('click', function () { showPage(p); });
        return b;
      }
      nav.appendChild(btn('‹', current - 1, current === 1));
      for (var pg = 1; pg <= pages; pg++) nav.appendChild(btn(String(pg), pg, false));
      nav.appendChild(btn('›', current + 1, current === pages));
      pager.appendChild(nav);
      pager.appendChild(info);
    }
    showPage(1);
  }

  function refresh() {
    reloadCustomers();
    renderOverview();
    var list = renderRows();
    renderPagination(list.length);
  }

  global.UsersList = {
    init: function () {
      refresh();
      loadFromApi().then(function () { refresh(); });
      initAddUserForm();
      ['filter-package', 'filter-plan', 'filter-role', 'filter-status'].forEach(function (id) {
        var el = document.getElementById(id);
        if (el) el.addEventListener('change', refresh);
      });
      var search = document.getElementById('users-search');
      if (search) search.addEventListener('input', refresh);
    },
    reload: function () { return loadFromApi().then(function () { refresh(); }); },
    CUSTOMERS: CUSTOMERS,
    daysUntil: daysUntil,
    computeOverview: computeOverview
  };
})(window);
