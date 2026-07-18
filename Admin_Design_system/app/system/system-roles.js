/* ADM-SYS-005 — Phân quyền quản trị (API thật) */
(function () {
  'use strict';

  var Auth = window.IfluxAdminAuth;
  function token() { var s = Auth && Auth.getSession && Auth.getSession(); return s && s.token; }
  function base() { return (Auth && Auth.apiBase ? Auth.apiBase() : '/api') + '/admin/access'; }

  function api(path, opts) {
    opts = opts || {};
    opts.headers = Object.assign({ 'Content-Type': 'application/json' }, opts.headers || {}, { Authorization: 'Bearer ' + token() });
    return fetch(base() + path, opts).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (d) {
        if (!r.ok) {
          var m = d && d.error;
          if (m && typeof m === 'object') m = m.message || JSON.stringify(m);
          throw new Error(m || (d && d.message) || ('HTTP ' + r.status));
        }
        return d;
      });
    });
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function initials(name) {
    var p = String(name || '').trim().split(/\s+/).filter(Boolean);
    if (!p.length) return '??';
    if (p.length === 1) return p[0].slice(0, 2).toUpperCase();
    return (p[0][0] + p[p.length - 1][0]).toUpperCase();
  }
  var AV = ['ix-avatar-accent', 'ix-avatar-success', 'ix-avatar-warning', 'ix-avatar-danger', 'ix-avatar-info'];
  function avatarCls(s) { var sum = 0, str = String(s || 'A'); for (var i = 0; i < str.length; i++) sum += str.charCodeAt(i); return AV[sum % AV.length]; }
  function fmtDate(v) { if (!v) return '—'; try { var d = new Date(v); return d.toLocaleDateString('vi-VN') + ' ' + d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }); } catch (e) { return '—'; } }
  function toast(msg, type) { if (window.ixToast) ixToast(msg, type || 'success'); }

  var state = { modules: [], roles: [], accounts: [], me: null };

  /* ───── Load ───── */
  function loadAll() {
    return Promise.all([
      api('/me').then(function (d) { state.me = d.admin; }).catch(function () {}),
      api('/permissions').then(function (d) { state.modules = d.modules || []; }),
      api('/roles').then(function (d) { state.roles = d.roles || []; }),
      api('/accounts').then(function (d) { state.accounts = d.accounts || []; })
    ]);
  }

  /* ───── Role cards ───── */
  function renderRoleCards() {
    var c = document.getElementById('admin-role-cards');
    if (!c) return;
    var cards = state.roles.map(function (r) {
      var sysChip = r.isSuper ? '<span class="ix-chip ix-chip-primary">Toàn quyền</span>' :
        (r.isSystem ? '<span class="ix-chip ix-chip-info">Hệ thống</span>' : '<span class="ix-chip">Tùy chỉnh</span>');
      var delBtn = (r.isSystem) ? '' :
        '<button type="button" class="ix-btn ix-btn-icon" data-delete-role="' + esc(r.id) + '" title="Xóa"><i class="ti ti-trash" style="font-size:16px"></i></button>';
      return '<div class="ix-role-card" data-role-card="' + esc(r.id) + '">' +
        '<div class="ix-role-card__top">' +
          '<span class="ix-role-card__count">' + r.accountCount + ' admin · ' + r.permissionCount + ' quyền</span>' +
          sysChip +
        '</div>' +
        '<div class="ix-role-card__foot">' +
          '<div><div class="ix-role-name">' + esc(r.name) + '</div>' +
          '<button type="button" class="ix-role-edit" data-edit-role="' + esc(r.id) + '">' + (r.isSuper ? 'Xem quyền' : 'Sửa vai trò') + '</button></div>' +
          '<div style="display:flex;gap:4px">' +
            '<button type="button" class="ix-btn ix-btn-icon" data-clone-role="' + esc(r.id) + '" title="Nhân bản"><i class="ti ti-copy" style="font-size:16px"></i></button>' +
            delBtn +
          '</div>' +
        '</div></div>';
    }).join('');
    var addCard = '<div class="ix-role-card ix-role-card--add">' +
      '<div class="ix-role-card__add-body">' +
        '<button type="button" class="ix-btn ix-btn-primary ix-btn-sm ix-mb-8" id="btn-add-role-card"><i class="ti ti-plus"></i> Thêm vai trò</button>' +
        '<p class="ix-role-card__add-hint">Tạo vai trò mới rồi gán quyền theo module.</p>' +
      '</div><i class="ti ti-shield ix-role-card__add-icon"></i></div>';
    c.innerHTML = cards + addCard;
  }

  /* ───── Admin accounts table ───── */
  function renderAccounts() {
    var tbody = document.getElementById('admin-users-tbody');
    if (!tbody) return;
    var q = ((document.getElementById('admin-users-search') || {}).value || '').toLowerCase();
    var rows = state.accounts.filter(function (a) {
      if (!q) return true;
      var hay = [a.name, a.email, (a.roles || []).map(function (r) { return r.name; }).join(' ')].join(' ').toLowerCase();
      return hay.indexOf(q) >= 0;
    });
    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:32px;color:var(--ix-text-muted);font-size:13px">Không có tài khoản phù hợp.</td></tr>';
      return;
    }
    tbody.innerHTML = rows.map(function (a) {
      var roleChips = (a.roles || []).map(function (r) { return '<span class="ix-chip">' + esc(r.name) + '</span>'; }).join(' ') || '<span class="ix-text-muted ix-fs-12">Chưa gán</span>';
      if (a.isSuper) roleChips = '<span class="ix-chip ix-chip-primary">Super admin</span>';
      var statusChip = a.status === 'locked' ? '<span class="ix-chip ix-chip-danger">Đã khóa</span>' : '<span class="ix-chip ix-chip-success">Hoạt động</span>';
      var lockBtn = a.isSuper ? '' :
        '<button type="button" class="ix-btn ix-btn-icon" data-lock-acc="' + esc(a.id) + '" data-status="' + esc(a.status) + '" title="' + (a.status === 'locked' ? 'Mở khóa' : 'Khóa') + '"><i class="ti ' + (a.status === 'locked' ? 'ti-lock-open' : 'ti-lock') + '" style="font-size:14px"></i></button>';
      var delBtn = a.isSuper ? '' :
        '<button type="button" class="ix-btn ix-btn-icon" data-delete-acc="' + esc(a.id) + '" title="Xóa"><i class="ti ti-trash" style="font-size:14px"></i></button>';
      return '<tr data-acc-id="' + esc(a.id) + '">' +
        '<td><div class="ix-user-cell"><div class="ix-avatar-sm ' + avatarCls(a.name) + '">' + esc(initials(a.name)) + '</div>' +
        '<div><div class="ix-user-name">' + esc(a.name) + '</div><div class="ix-user-email">' + esc(a.email) + '</div></div></div></td>' +
        '<td>' + roleChips + '</td>' +
        '<td class="ix-fs-12" style="color:var(--ix-text-muted)">' + fmtDate(a.lastLoginAt) + '</td>' +
        '<td>' + statusChip + '</td>' +
        '<td><div style="display:flex;gap:4px">' +
          '<button type="button" class="ix-btn ix-btn-icon" data-edit-acc="' + esc(a.id) + '" title="Sửa / gán vai trò"><i class="ti ti-edit" style="font-size:14px"></i></button>' +
          '<button type="button" class="ix-btn ix-btn-icon" data-pw-acc="' + esc(a.id) + '" title="Đặt lại mật khẩu"><i class="ti ti-key" style="font-size:14px"></i></button>' +
          lockBtn + delBtn +
        '</div></td></tr>';
    }).join('');
  }

  function refresh() { renderRoleCards(); renderAccounts(); }

  /* ───── Permission editor (module → page → action) ───── */
  function buildPermTable(selectedKeys, readonly) {
    var sel = {}; (selectedKeys || []).forEach(function (k) { sel[k] = true; });
    var dis = readonly ? ' disabled' : '';
    var html = '<tr><td class="ix-perm-name">Toàn quyền admin</td><td><label class="ix-perm-check">' +
      '<input type="checkbox" class="ix-checkbox" id="perm-all-global"' + dis + ' /> Chọn tất cả</label></td></tr>';
    state.modules.forEach(function (mod) {
      html += '<tr class="ix-perm-group-row"><td colspan="2" class="ix-perm-name">' +
        esc(mod.label) +
        ' <label class="ix-perm-check" style="display:inline-flex;margin-left:8px;font-weight:400"><input type="checkbox" class="ix-checkbox perm-all-mod" data-mod="' + esc(mod.key) + '"' + dis + ' /> tất cả</label></td></tr>';
      (mod.pages || []).forEach(function (page) {
        var acts = (page.permissions || []).map(function (p) {
          var checked = sel[p.key] ? ' checked' : '';
          var biz = p.isBusiness ? ' <i class="ti ti-bolt" style="font-size:11px;color:var(--ix-warning)" title="Quyền nghiệp vụ"></i>' : '';
          return '<label class="ix-perm-check"><input type="checkbox" class="ix-checkbox perm-cb" data-key="' + esc(p.key) + '" data-mod="' + esc(mod.key) + '" data-page="' + esc(page.key) + '"' + checked + dis + ' /> ' + esc(actionName(p.action)) + biz + '</label>';
        }).join('');
        html += '<tr><td class="ix-perm-name" style="font-size:13px;padding-left:16px">' + esc(page.label) + '</td>' +
          '<td><div class="ix-perm-actions">' +
          '<label class="ix-perm-check"><input type="checkbox" class="ix-checkbox perm-all-page" data-mod="' + esc(mod.key) + '" data-page="' + esc(page.key) + '"' + dis + ' /> Tất cả</label>' +
          acts + '</div></td></tr>';
      });
    });
    return html;
  }
  var ACTION_VI = { view: 'Xem', create: 'Tạo', edit: 'Sửa', delete: 'Xóa', import: 'Nhập', export: 'Xuất', approve: 'Duyệt', publish: 'Xuất bản', reject: 'Từ chối', execute: 'Chạy', configure: 'Cấu hình' };
  function actionName(a) { return ACTION_VI[a] || a; }

  function syncPageAll(mod, page) {
    var boxes = document.querySelectorAll('.perm-cb[data-mod="' + mod + '"][data-page="' + page + '"]');
    var all = document.querySelector('.perm-all-page[data-mod="' + mod + '"][data-page="' + page + '"]');
    if (all && boxes.length) all.checked = Array.prototype.every.call(boxes, function (b) { return b.checked; });
  }
  function syncModAll(mod) {
    var boxes = document.querySelectorAll('.perm-cb[data-mod="' + mod + '"]');
    var all = document.querySelector('.perm-all-mod[data-mod="' + mod + '"]');
    if (all && boxes.length) all.checked = Array.prototype.every.call(boxes, function (b) { return b.checked; });
  }
  function syncGlobalAll() {
    var boxes = document.querySelectorAll('.perm-cb');
    var g = document.getElementById('perm-all-global');
    if (g && boxes.length) g.checked = Array.prototype.every.call(boxes, function (b) { return b.checked; });
  }
  function syncAllGroups() {
    state.modules.forEach(function (mod) {
      (mod.pages || []).forEach(function (p) { syncPageAll(mod.key, p.key); });
      syncModAll(mod.key);
    });
    syncGlobalAll();
  }

  /* ───── Role modal ───── */
  var editingRoleId = null;
  function buildRoleModalBody() {
    return '<div class="ix-form-group"><label class="ix-label">Tên vai trò <span style="color:var(--ix-danger)">*</span></label>' +
      '<input type="text" class="ix-input" id="role-field-name" placeholder="VD: Kiểm toán" /></div>' +
      '<div class="ix-form-group"><label class="ix-label">Mã <span style="color:var(--ix-danger)">*</span></label>' +
      '<input type="text" class="ix-input" id="role-field-code" placeholder="VD: auditor" autocomplete="off" />' +
      '<div class="ix-field-hint" id="role-field-code-hint">Mã viết thường, không dấu.</div></div>' +
      '<div class="ix-form-group"><label class="ix-label">Mô tả</label><input type="text" class="ix-input" id="role-field-desc" placeholder="Mô tả ngắn" /></div>' +
      '<div style="margin-top:12px"><div style="font-size:14px;font-weight:600;color:var(--ix-text-primary);margin-bottom:8px">Quyền theo module</div>' +
      '<p class="ix-field-hint" id="role-perm-note" style="margin-bottom:12px">Tick quyền cho vai trò này.</p>' +
      '<table class="ix-perm-table"><tbody id="role-perm-tbody"></tbody></table></div>';
  }

  function openRoleModal(role) {
    editingRoleId = role && role.id ? role.id : null;
    var isNew = !role || role.isNew;
    var readonly = !!(role && role.isSuper);
    document.getElementById('role-modal-title').textContent = isNew ? 'Thêm vai trò' : (readonly ? 'Quyền của vai trò' : 'Sửa vai trò');
    var body = document.querySelector('#role-modal .ix-modal-body');
    body.innerHTML = buildRoleModalBody();

    var nameEl = document.getElementById('role-field-name');
    var codeEl = document.getElementById('role-field-code');
    var descEl = document.getElementById('role-field-desc');
    var hint = document.getElementById('role-field-code-hint');
    var note = document.getElementById('role-perm-note');

    nameEl.value = (role && role.name) || '';
    codeEl.value = (role && role.code) || '';
    descEl.value = (role && role.description) || '';

    if (!isNew) { codeEl.readOnly = true; hint.textContent = 'Mã hệ thống — không đổi.'; }
    if (readonly) {
      nameEl.disabled = true; descEl.disabled = true;
      note.textContent = 'Vai trò toàn quyền — luôn có tất cả quyền, không chỉnh sửa.';
    }

    var saveBtn = document.getElementById('btn-save-role');
    saveBtn.style.display = readonly ? 'none' : '';

    var permsPromise = (role && role.id) ? api('/roles/' + role.id).then(function (d) { return d.permissionKeys || []; }) : Promise.resolve([]);
    permsPromise.then(function (keys) {
      document.getElementById('role-perm-tbody').innerHTML = buildPermTable(keys, readonly);
      syncAllGroups();
    });
    ixOpenModal('role-modal');
  }

  function collectRolePermKeys() {
    var keys = [];
    document.querySelectorAll('.perm-cb:checked').forEach(function (cb) { keys.push(cb.getAttribute('data-key')); });
    return keys;
  }

  function saveRole() {
    var name = document.getElementById('role-field-name').value.trim();
    var code = document.getElementById('role-field-code').value.trim();
    var desc = document.getElementById('role-field-desc').value.trim();
    if (!name) { toast('Tên vai trò là bắt buộc', 'danger'); return; }
    var permKeys = collectRolePermKeys();

    var p;
    if (!editingRoleId) {
      if (!code) { toast('Mã vai trò là bắt buộc', 'danger'); return; }
      p = api('/roles', { method: 'POST', body: JSON.stringify({ code: code, name: name, description: desc }) })
        .then(function (d) { return api('/roles/' + d.id + '/permissions', { method: 'PUT', body: JSON.stringify({ permissionKeys: permKeys }) }); });
    } else {
      p = api('/roles/' + editingRoleId, { method: 'PATCH', body: JSON.stringify({ name: name, description: desc }) })
        .then(function () { return api('/roles/' + editingRoleId + '/permissions', { method: 'PUT', body: JSON.stringify({ permissionKeys: permKeys }) }); });
    }
    p.then(function () {
      ixCloseModal('role-modal');
      toast('Đã lưu vai trò');
      return loadAll();
    }).then(refresh).catch(function (e) { toast(e.message, 'danger'); });
  }

  /* ───── Admin account modal ───── */
  var editingAccId = null;
  function buildAccModalBody(isNew) {
    var pw = isNew ? '<div class="ix-form-group"><label class="ix-label">Mật khẩu</label>' +
      '<input type="password" class="ix-input" id="acc-field-password" placeholder="Để trống nếu chỉ đăng nhập Gmail" autocomplete="new-password" />' +
      '<div class="ix-field-hint">Tối thiểu 6 ký tự. Có thể để trống nếu tài khoản chỉ dùng Gmail.</div></div>' : '';
    var roleChecks = state.roles.filter(function (r) { return !r.isSuper; }).map(function (r) {
      return '<label class="ix-perm-check" style="display:block;margin-bottom:6px"><input type="checkbox" class="ix-checkbox acc-role-cb" data-id="' + esc(r.id) + '" /> ' + esc(r.name) + ' <span class="ix-fs-12" style="color:var(--ix-text-muted)">(' + esc(r.code) + ')</span></label>';
    }).join('');
    return '<div class="ix-form-group"><label class="ix-label">Họ tên <span style="color:var(--ix-danger)">*</span></label>' +
      '<input type="text" class="ix-input" id="acc-field-name" placeholder="VD: Nguyễn Văn A" /></div>' +
      '<div class="ix-form-group"><label class="ix-label">Email <span style="color:var(--ix-danger)">*</span></label>' +
      '<input type="email" class="ix-input" id="acc-field-email" placeholder="admin@iflux.vn" /></div>' +
      pw +
      '<div class="ix-form-group"><label class="ix-label">Vai trò</label>' +
      '<div style="margin-top:6px">' + (roleChecks || '<span class="ix-fs-12" style="color:var(--ix-text-muted)">Chưa có vai trò tùy chỉnh.</span>') + '</div></div>';
  }

  function openAccModal(acc) {
    editingAccId = acc && acc.id ? acc.id : null;
    var isNew = !acc || acc.isNew;
    document.getElementById('user-modal-title').textContent = isNew ? 'Thêm admin' : 'Sửa admin';
    var body = document.querySelector('#user-modal .ix-modal-body');
    body.innerHTML = buildAccModalBody(isNew);
    document.getElementById('acc-field-name').value = (acc && acc.name) || '';
    var emailEl = document.getElementById('acc-field-email');
    emailEl.value = (acc && acc.email) || '';
    if (!isNew) emailEl.readOnly = true;
    var selRoles = {}; ((acc && acc.roles) || []).forEach(function (r) { selRoles[r.id] = true; });
    document.querySelectorAll('.acc-role-cb').forEach(function (cb) { cb.checked = !!selRoles[cb.getAttribute('data-id')]; });
    ixOpenModal('user-modal');
  }

  function collectAccRoles() {
    var ids = [];
    document.querySelectorAll('.acc-role-cb:checked').forEach(function (cb) { ids.push(cb.getAttribute('data-id')); });
    return ids;
  }

  function saveAcc() {
    var name = document.getElementById('acc-field-name').value.trim();
    var email = document.getElementById('acc-field-email').value.trim();
    if (!name) { toast('Họ tên là bắt buộc', 'danger'); return; }
    var roleIds = collectAccRoles();
    var p;
    if (!editingAccId) {
      if (!email) { toast('Email là bắt buộc', 'danger'); return; }
      var pwEl = document.getElementById('acc-field-password');
      var pw = pwEl ? pwEl.value : '';
      p = api('/accounts', { method: 'POST', body: JSON.stringify({ email: email, name: name, password: pw || undefined, roleIds: roleIds }) });
    } else {
      p = api('/accounts/' + editingAccId, { method: 'PATCH', body: JSON.stringify({ name: name }) })
        .then(function () { return api('/accounts/' + editingAccId + '/roles', { method: 'PUT', body: JSON.stringify({ roleIds: roleIds }) }); });
    }
    p.then(function () { ixCloseModal('user-modal'); toast('Đã lưu tài khoản'); return loadAll(); }).then(refresh)
      .catch(function (e) { toast(e.message, 'danger'); });
  }

  /* ───── Events ───── */
  function bind() {
    document.getElementById('btn-add-user').addEventListener('click', function () { openAccModal(null); });
    document.getElementById('btn-save-role').addEventListener('click', saveRole);
    document.getElementById('btn-save-user').addEventListener('click', saveAcc);
    var search = document.getElementById('admin-users-search');
    if (search) search.addEventListener('input', renderAccounts);

    document.getElementById('role-modal').addEventListener('change', function (e) {
      var t = e.target;
      if (t.id === 'perm-all-global') { document.querySelectorAll('.perm-cb, .perm-all-mod, .perm-all-page').forEach(function (cb) { cb.checked = t.checked; }); return; }
      if (t.classList.contains('perm-all-mod')) { var m = t.getAttribute('data-mod'); document.querySelectorAll('.perm-cb[data-mod="' + m + '"], .perm-all-page[data-mod="' + m + '"]').forEach(function (cb) { cb.checked = t.checked; }); syncGlobalAll(); return; }
      if (t.classList.contains('perm-all-page')) { var mm = t.getAttribute('data-mod'), pg = t.getAttribute('data-page'); document.querySelectorAll('.perm-cb[data-mod="' + mm + '"][data-page="' + pg + '"]').forEach(function (cb) { cb.checked = t.checked; }); syncModAll(mm); syncGlobalAll(); return; }
      if (t.classList.contains('perm-cb')) { syncPageAll(t.getAttribute('data-mod'), t.getAttribute('data-page')); syncModAll(t.getAttribute('data-mod')); syncGlobalAll(); }
    });

    document.addEventListener('click', function (e) {
      var addRole = e.target.closest('#btn-add-role-card');
      if (addRole) { openRoleModal(null); return; }

      var editRole = e.target.closest('[data-edit-role]');
      if (editRole) { e.preventDefault(); var r = findRole(editRole.getAttribute('data-edit-role')); if (r) openRoleModal(r); return; }

      var cloneRole = e.target.closest('[data-clone-role]');
      if (cloneRole) {
        e.preventDefault();
        api('/roles/' + cloneRole.getAttribute('data-clone-role') + '/clone', { method: 'POST', body: '{}' })
          .then(function () { toast('Đã nhân bản vai trò'); return loadAll(); }).then(refresh).catch(function (er) { toast(er.message, 'danger'); });
        return;
      }

      var delRole = e.target.closest('[data-delete-role]');
      if (delRole) {
        e.preventDefault();
        if (!confirm('Xóa vai trò này?')) return;
        api('/roles/' + delRole.getAttribute('data-delete-role'), { method: 'DELETE' })
          .then(function () { toast('Đã xóa vai trò'); return loadAll(); }).then(refresh).catch(function (er) { toast(er.message, 'danger'); });
        return;
      }

      var editAcc = e.target.closest('[data-edit-acc]');
      if (editAcc) { e.preventDefault(); var a = findAcc(editAcc.getAttribute('data-edit-acc')); if (a) openAccModal(a); return; }

      var pwAcc = e.target.closest('[data-pw-acc]');
      if (pwAcc) {
        e.preventDefault();
        var np = prompt('Nhập mật khẩu mới (tối thiểu 6 ký tự):');
        if (!np) return;
        if (np.length < 6) { toast('Mật khẩu tối thiểu 6 ký tự', 'danger'); return; }
        api('/accounts/' + pwAcc.getAttribute('data-pw-acc') + '/reset-password', { method: 'POST', body: JSON.stringify({ newPassword: np }) })
          .then(function () { toast('Đã đặt lại mật khẩu'); }).catch(function (er) { toast(er.message, 'danger'); });
        return;
      }

      var lockAcc = e.target.closest('[data-lock-acc]');
      if (lockAcc) {
        e.preventDefault();
        var cur = lockAcc.getAttribute('data-status');
        var next = cur === 'locked' ? 'active' : 'locked';
        api('/accounts/' + lockAcc.getAttribute('data-lock-acc') + '/status', { method: 'PATCH', body: JSON.stringify({ status: next }) })
          .then(function () { toast(next === 'locked' ? 'Đã khóa tài khoản' : 'Đã mở khóa'); return loadAll(); }).then(refresh).catch(function (er) { toast(er.message, 'danger'); });
        return;
      }

      var delAcc = e.target.closest('[data-delete-acc]');
      if (delAcc) {
        e.preventDefault();
        if (!confirm('Xóa tài khoản admin này?')) return;
        api('/accounts/' + delAcc.getAttribute('data-delete-acc'), { method: 'DELETE' })
          .then(function () { toast('Đã xóa tài khoản'); return loadAll(); }).then(refresh).catch(function (er) { toast(er.message, 'danger'); });
      }
    });
  }

  function findRole(id) { return state.roles.filter(function (r) { return r.id === id; })[0]; }
  function findAcc(id) { return state.accounts.filter(function (a) { return a.id === id; })[0]; }

  /* ───── Init ───── */
  function init() {
    if (!Auth || !token()) { toast('Cần đăng nhập admin', 'danger'); return; }
    bind();
    loadAll().then(refresh).catch(function (e) {
      var tbody = document.getElementById('admin-users-tbody');
      if (tbody) tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:32px;color:var(--ix-danger);font-size:13px">Lỗi tải dữ liệu: ' + esc(e.message) + '</td></tr>';
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
