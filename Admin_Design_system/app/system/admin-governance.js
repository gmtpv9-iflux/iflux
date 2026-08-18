/* iFlux Admin — Quản trị viên (list / profile / roles / permissions) */
(function (global) {
  'use strict';

  var Auth = global.IfluxAdminAuth;
  var page = (document.body && document.body.getAttribute('data-admin-gov')) || 'list';

  function token() {
    var s = Auth && Auth.getSession && Auth.getSession();
    return s && s.token;
  }
  function base() {
    return (Auth && Auth.apiBase ? Auth.apiBase() : '/api') + '/admin/access';
  }
  function api(path, opts) {
    opts = opts || {};
    opts.headers = Object.assign(
      { 'Content-Type': 'application/json' },
      opts.headers || {},
      { Authorization: 'Bearer ' + token() }
    );
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
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function initials(name) {
    var p = String(name || '').trim().split(/\s+/).filter(Boolean);
    if (!p.length) return '??';
    if (p.length === 1) return p[0].slice(0, 2).toUpperCase();
    return (p[0][0] + p[p.length - 1][0]).toUpperCase();
  }
  var AV = ['ix-avatar-accent', 'ix-avatar-success', 'ix-avatar-warning', 'ix-avatar-danger', 'ix-avatar-info'];
  function avatarCls(s) {
    var sum = 0, str = String(s || 'A');
    for (var i = 0; i < str.length; i++) sum += str.charCodeAt(i);
    return AV[sum % AV.length];
  }
  function fmtDate(v) {
    if (!v) return '—';
    try {
      var d = new Date(v);
      return d.toLocaleDateString('vi-VN') + ' ' + d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    } catch (e) { return '—'; }
  }
  function toast(msg, type) {
    if (global.ixToast) ixToast(msg, type || 'success');
  }

  var ACTION_VI = {
    view: 'Xem', create: 'Tạo', edit: 'Sửa', delete: 'Xóa', import: 'Nhập', export: 'Xuất',
    approve: 'Duyệt', publish: 'Xuất bản', reject: 'Từ chối', execute: 'Chạy', configure: 'Cấu hình',
    grant_premium: 'Cấp Premium', reset_password: 'Reset MK', lock: 'Khóa', assign_permission: 'Gán quyền',
    recalculate: 'Tính lại', feature_post: 'Đưa nổi bật', pin_post: 'Ghim bài', lock_post: 'Khóa bài',
    verify: 'Xác minh', refund: 'Hoàn tiền', cancel: 'Hủy', approve_payment: 'Duyệt thanh toán'
  };
  function actionName(a) { return ACTION_VI[a] || a; }

  var state = { modules: [], roles: [], accounts: [], me: null, rolePerms: {} };

  function loadMe() {
    return api('/me').then(function (d) {
      state.me = d.admin || null;
      return state.me;
    });
  }

  function loadAll() {
    /* Hồ sơ cá nhân: chỉ /me — không đòi quyền list accounts / roles / permissions */
    if (page === 'profile') {
      return loadMe();
    }
    return Promise.all([
      loadMe().catch(function () {}),
      api('/permissions').then(function (d) { state.modules = d.modules || []; }),
      api('/roles').then(function (d) { state.roles = d.roles || []; }),
      api('/accounts').then(function (d) { state.accounts = d.accounts || []; })
    ]);
  }

  function loadRolePerms() {
    var editable = state.roles.filter(function (r) { return !r.isSuper; });
    return Promise.all(editable.map(function (r) {
      return api('/roles/' + r.id).then(function (d) {
        state.rolePerms[r.id] = d.permissionKeys || [];
      });
    }));
  }

  /* ─── List accounts ─── */
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
      var roleChips = (a.roles || []).map(function (r) {
        return '<span class="ix-chip">' + esc(r.name) + '</span>';
      }).join(' ') || '<span style="color:var(--ix-text-muted);font-size:12px">Chưa gán</span>';
      if (a.isSuper) roleChips = '<span class="ix-chip ix-chip-primary">Admin</span>';
      var statusChip = a.status === 'locked'
        ? '<span class="ix-chip ix-chip-danger">Đã khóa</span>'
        : '<span class="ix-chip ix-chip-success">Hoạt động</span>';
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

  /* ─── Role cards ─── */
  function renderRoleCards() {
    var c = document.getElementById('admin-role-cards');
    if (!c) return;
    var cards = state.roles.map(function (r) {
      var sysChip = r.isSuper
        ? '<span class="ix-chip ix-chip-primary">Toàn quyền</span>'
        : (r.isSystem ? '<span class="ix-chip ix-chip-info">Hệ thống</span>' : '<span class="ix-chip">Tùy chỉnh</span>');
      var delBtn = (r.isSystem || r.isSuper) ? '' :
        '<button type="button" class="ix-btn ix-btn-icon" data-delete-role="' + esc(r.id) + '" title="Xóa"><i class="ti ti-trash" style="font-size:16px"></i></button>';
      var editBtn = r.isSuper
        ? ''
        : '<button type="button" class="ix-role-edit" data-edit-role="' + esc(r.id) + '">Sửa hồ sơ</button>';
      var cloneBtn = r.isSuper
        ? ''
        : '<button type="button" class="ix-btn ix-btn-icon" data-clone-role="' + esc(r.id) + '" title="Nhân bản hồ sơ"><i class="ti ti-copy" style="font-size:16px"></i></button>';
      return '<div class="ix-role-card" data-role-card="' + esc(r.id) + '">' +
        '<div class="ix-role-card__top">' +
          '<span class="ix-role-card__count">' + (r.accountCount || 0) + ' nhân viên</span>' +
          sysChip +
        '</div>' +
        '<div class="ix-role-card__foot">' +
          '<div><div class="ix-role-name">' + esc(r.name) + '</div>' +
          '<div style="font-size:12px;color:var(--ix-text-muted);margin-top:2px">' + esc(r.code) + (r.description ? ' · ' + esc(r.description) : '') + '</div>' +
          editBtn + '</div>' +
          '<div style="display:flex;gap:4px">' +
            cloneBtn +
            delBtn +
          '</div></div></div>';
    }).join('');
    var addCard = '<div class="ix-role-card ix-role-card--add">' +
      '<div class="ix-role-card__add-body">' +
        '<button type="button" class="ix-btn ix-btn-primary ix-btn-sm ix-mb-8" id="btn-add-role-card"><i class="ti ti-plus"></i> Thêm vai trò</button>' +
        '<p class="ix-role-card__add-hint">Tạo hồ sơ vai trò. Phân quyền tại trang Phân quyền quản trị.</p>' +
      '</div><i class="ti ti-shield ix-role-card__add-icon"></i></div>';
    c.innerHTML = cards + addCard;
  }

  /* ─── Permission matrix (1 role · tính năng × Xem|Tạo|Sửa|Xóa|Xuất|Trạng thái/NV) ─── */
  var CORE_ACTIONS = ['view', 'create', 'edit', 'delete', 'export'];
  var CORE_LABELS = { view: 'Xem', create: 'Tạo', edit: 'Sửa', delete: 'Xóa', export: 'Xuất' };
  var selectedRoleId = null;

  function editableRoles() {
    return state.roles.filter(function (r) { return !r.isSuper; });
  }

  function isStatusAction(action) {
    return String(action || '').indexOf('status_') === 0;
  }

  function permPageIndex() {
    var idx = {};
    state.modules.forEach(function (mod) {
      (mod.pages || []).forEach(function (page) {
        var byAction = {};
        var status = [];
        (page.permissions || []).forEach(function (p) {
          if (CORE_ACTIONS.indexOf(p.action) >= 0) byAction[p.action] = p;
          else status.push(p); /* status_* + business (approve, cancel, execute, …) */
        });
        idx[mod.key + '.' + page.key] = { byAction: byAction, status: status };
      });
    });
    return idx;
  }

  function permDataForNavItem(item, idx) {
    var empty = { byAction: {}, status: [] };
    var Routes = window.IfluxAdminRoutes;
    var Rbac = window.IfluxAdminRbac;
    if (!Routes || !Rbac || !Rbac.permForHref) return empty;
    var perm = Rbac.permForHref(Routes.hrefFor(item.routeKey || item.key));
    if (!perm) return empty;
    var parts = String(perm).split('.');
    if (parts.length < 2) return empty;
    var pk = parts[0] + '.' + parts[1];
    return idx[pk] || empty;
  }

  /** Cột trái = Main menu (SoT nhãn). Chỉ hiện dòng đã có trên Nav — không hiện quyền mồ côi. */
  function permPageRows() {
    var idx = permPageIndex();
    var nav = (window.IfluxAdminNavRegistry && window.IfluxAdminNavRegistry.sidebar) || [];
    var rows = [];
    nav.forEach(function (node) {
      if (node.type === 'group') {
        rows.push({ type: 'group', label: node.label, key: 'mod:' + node.label });
        return;
      }
      if (node.type === 'parent') {
        rows.push({ type: 'menu', label: node.label, key: 'menu:' + (node.key || node.label) });
        (node.children || []).forEach(function (child) {
          var data = permDataForNavItem(child, idx);
          rows.push({
            type: 'page',
            depth: 1,
            key: child.key || child.label,
            label: child.label,
            byAction: data.byAction,
            status: data.status
          });
        });
        return;
      }
      if (node.type === 'item') {
        var data = permDataForNavItem(node, idx);
        rows.push({
          type: 'page',
          depth: 0,
          key: node.key || node.label,
          label: node.label,
          byAction: data.byAction,
          status: data.status
        });
      }
    });
    return rows;
  }

  function roleHasKey(roleId, key) {
    return (state.rolePerms[roleId] || []).indexOf(key) >= 0;
  }

  function canAssignPermissions() {
    if (state.me && state.me.isSuper) return true;
    var R = global.IfluxAdminRbac;
    if (R && R.isSuper && R.isSuper()) return true;
    if (R && R.hasPermission) {
      return R.hasPermission('access.permissions.assign_permission') ||
        R.hasPermission('access.roles.assign_permission');
    }
    return false;
  }

  function renderPermSessionHint() {
    var el = document.getElementById('admin-perm-session-hint');
    if (!el) return;
    var me = state.me || (Auth && Auth.getAdmin && Auth.getAdmin()) || {};
    var email = me.email || '—';
    var badge = me.isSuper
      ? '<span class="ix-chip ix-chip-primary">Admin · toàn quyền</span>'
      : '<span class="ix-chip">Nhân viên · cần quyền Gán quyền</span>';
    el.innerHTML =
      '<p style="margin:0;font-size:13px;color:var(--ix-text-muted)">' +
        'Đang đăng nhập: <strong style="color:var(--ix-text-primary)">' + esc(email) + '</strong> ' + badge +
      '</p>';
    var btn = document.getElementById('btn-save-admin-perms');
    if (btn) {
      var ok = canAssignPermissions();
      btn.disabled = !ok;
      btn.title = ok ? '' : 'Tài khoản này chỉ được xem ma trận — không có quyền lưu phân quyền.';
    }
  }

  function coreCellHtml(roleId, perm) {
    if (!perm) {
      return '<td style="text-align:center;color:var(--ix-text-muted)">—</td>';
    }
    var checked = roleHasKey(roleId, perm.key) ? ' checked' : '';
    return '<td style="text-align:center">' +
      '<input type="checkbox" class="ix-checkbox adm-gov-perm" data-role="' + esc(roleId) + '" data-key="' + esc(perm.key) + '"' + checked + ' title="' + esc(actionName(perm.action)) + '" />' +
      '</td>';
  }

  function statusCellHtml(roleId, row) {
    var list = row.status || [];
    if (!list.length) {
      return '<td style="text-align:center;color:var(--ix-text-muted)">—</td>';
    }
    var chips = list.map(function (p) {
      var on = roleHasKey(roleId, p.key);
      var checked = on ? ' checked' : '';
      var chipClass = on ? 'ix-chip ix-chip-primary' : 'ix-chip ix-chip-outline';
      var biz = p.isBusiness ? ' <i class="ti ti-bolt" style="font-size:11px;color:var(--ix-warning)" title="Nghiệp vụ"></i>' : '';
      return '<label class="' + chipClass + '" style="cursor:pointer;margin:0">' +
        '<input type="checkbox" class="ix-checkbox adm-gov-perm" data-role="' + esc(roleId) + '" data-key="' + esc(p.key) + '"' + checked + ' />' +
        '<span>' + esc(p.label || actionName(p.action) || p.key) + biz + '</span>' +
        '</label>';
    }).join('');
    return '<td>' +
      '<div class="ix-perm-actions" style="justify-content:flex-start;flex-wrap:wrap;gap:var(--ifx-space-8)">' +
        chips +
      '</div>' +
      '</td>';
  }

  function renderPermMatrix() {
    var mount = document.getElementById('admin-perm-matrix');
    if (!mount) return;
    var roles = editableRoles();
    if (!roles.length) {
      mount.innerHTML = '<div class="ix-card" style="padding:24px"><p style="color:var(--ix-text-muted);font-size:13px;margin:0">Chưa có vai trò tùy chỉnh (ngoài Admin toàn quyền). Tạo vai trò tại trang Vai trò quản trị.</p></div>';
      return;
    }
    if (!selectedRoleId || !roles.some(function (r) { return r.id === selectedRoleId; })) {
      selectedRoleId = roles[0].id;
    }
    var roleId = selectedRoleId;
    var rows = permPageRows();
    var selectHtml =
      '<div class="ix-form-group" style="margin-bottom:16px;max-width:360px">' +
        '<label class="ix-label" for="adm-gov-role-select">Vai trò</label>' +
        '<select class="ix-select" id="adm-gov-role-select">' +
          roles.map(function (r) {
            return '<option value="' + esc(r.id) + '"' + (r.id === roleId ? ' selected' : '') + '>' + esc(r.name) +
              (r.code ? ' (' + esc(r.code) + ')' : '') + '</option>';
          }).join('') +
        '</select>' +
        '<div class="ix-field-hint">Admin (toàn quyền) không nằm trong danh sách.</div>' +
      '</div>';

    var head = '<th class="ix-perm-name" style="text-align:left;min-width:220px">Tính năng</th>' +
      CORE_ACTIONS.map(function (a) {
        return '<th style="text-align:center;min-width:72px">' + esc(CORE_LABELS[a]) + '</th>';
      }).join('') +
      '<th style="text-align:left;min-width:280px">Trạng thái / Nghiệp vụ</th>';

    var body = rows.map(function (row) {
      if (row.type === 'group') {
        return '<tr class="ix-perm-group-row"><td colspan="7">' + esc(row.label) + '</td></tr>';
      }
      if (row.type === 'menu') {
        return '<tr><td class="ix-perm-name" colspan="7" style="color:var(--ix-text-secondary)">' + esc(row.label) + '</td></tr>';
      }
      var nameStyle = row.depth ? ' style="padding-left:var(--ifx-space-32)"' : '';
      return '<tr>' +
        '<td class="ix-perm-name"' + nameStyle + '>' + esc(row.label) + '</td>' +
        CORE_ACTIONS.map(function (a) { return coreCellHtml(roleId, row.byAction[a]); }).join('') +
        statusCellHtml(roleId, row) +
        '</tr>';
    }).join('');

    mount.innerHTML =
      selectHtml +
      '<div class="ix-card" style="padding:0;overflow:auto">' +
        '<table class="ix-perm-table ix-table" style="min-width:720px"><thead><tr>' + head + '</tr></thead><tbody>' + body + '</tbody></table>' +
      '</div>';

    var sel = document.getElementById('adm-gov-role-select');
    if (sel && !sel._admGovBound) {
      sel._admGovBound = true;
      sel.addEventListener('change', function () {
        stashSelectedRoleFromDom();
        selectedRoleId = sel.value;
        renderPermMatrix();
      });
    } else if (sel) {
      sel.value = roleId;
    }

    renderPermSessionHint();

    if (!mount._admGovStatusChipBound) {
      mount._admGovStatusChipBound = true;
      mount.addEventListener('change', function (e) {
        var cb = e.target.closest('.adm-gov-perm');
        if (!cb || !mount.contains(cb)) return;
        var label = cb.closest('label.ix-chip');
        if (!label) return;
        label.classList.toggle('ix-chip-primary', cb.checked);
        label.classList.toggle('ix-chip-outline', !cb.checked);
      });
    }
  }

  function stashSelectedRoleFromDom() {
    if (!selectedRoleId) return;
    var shown = {};
    document.querySelectorAll('.adm-gov-perm[data-role="' + selectedRoleId + '"]').forEach(function (cb) {
      shown[cb.getAttribute('data-key')] = true;
    });
    var checked = [];
    document.querySelectorAll('.adm-gov-perm[data-role="' + selectedRoleId + '"]:checked').forEach(function (cb) {
      checked.push(cb.getAttribute('data-key'));
    });
    var prev = state.rolePerms[selectedRoleId] || [];
    var kept = prev.filter(function (k) { return !shown[k]; });
    state.rolePerms[selectedRoleId] = kept.concat(checked);
  }

  function collectMatrixByRole() {
    stashSelectedRoleFromDom();
    var map = {};
    editableRoles().forEach(function (r) {
      map[r.id] = (state.rolePerms[r.id] || []).slice();
    });
    return map;
  }

  function savePermMatrix() {
    if (!canAssignPermissions()) {
      toast('Tài khoản hiện tại không có quyền lưu phân quyền. Đăng nhập bằng tài khoản Admin (Owner).', 'danger');
      return;
    }
    stashSelectedRoleFromDom();
    var map = collectMatrixByRole();
    var ids = Object.keys(map);
    var btn = document.getElementById('btn-save-admin-perms');
    if (btn) btn.disabled = true;
    Promise.all(ids.map(function (id) {
      return api('/roles/' + id + '/permissions', {
        method: 'PUT',
        body: JSON.stringify({ permissionKeys: map[id] })
      });
    })).then(function () {
      toast('Đã lưu phân quyền quản trị');
      return loadAll().then(loadRolePerms).then(renderPermMatrix);
    }).catch(function (e) {
      var msg = e.message || 'Lưu thất bại';
      if (/không có quyền/i.test(msg)) {
        msg = 'Không có quyền lưu phân quyền. Hãy đăng xuất và đăng nhập lại bằng Gmail Admin (gm.tpv9@gmail.com).';
      }
      toast(msg, 'danger');
    }).finally(function () {
      if (btn) btn.disabled = false;
    });
  }

  /* ─── Profile ─── */
  function renderProfile() {
    var me = state.me || (Auth && Auth.getAdmin && Auth.getAdmin()) || {};
    var nameEl = document.getElementById('prof-name');
    var emailEl = document.getElementById('prof-email');
    var rolesEl = document.getElementById('prof-roles');
    var idEl = document.getElementById('prof-id');
    var superEl = document.getElementById('prof-super');
    if (nameEl) nameEl.value = me.name || '';
    if (emailEl) emailEl.value = me.email || '';
    if (idEl) idEl.textContent = me.id || '—';
    if (superEl) {
      superEl.innerHTML = me.isSuper
        ? '<span class="ix-chip ix-chip-primary">Admin</span>'
        : '<span class="ix-chip">Admin</span>';
    }
    if (rolesEl) {
      var roles = me.roles || [];
      rolesEl.innerHTML = roles.length
        ? roles.map(function (r) { return '<span class="ix-chip">' + esc(r.name || r.code) + '</span>'; }).join(' ')
        : '<span style="color:var(--ix-text-muted);font-size:13px">Chưa gán vai trò</span>';
    }
  }

  function saveProfile() {
    var name = (document.getElementById('prof-name') || {}).value;
    name = String(name || '').trim();
    if (!name) { toast('Họ tên là bắt buộc', 'danger'); return; }
    /* PATCH /me — hồ sơ cá nhân; mọi admin tự sửa, không cần access.admin_accounts.edit */
    api('/me', { method: 'PATCH', body: JSON.stringify({ name: name }) })
      .then(function (d) {
        if (state.me) state.me.name = (d && d.admin && d.admin.name) || name;
        toast('Đã cập nhật hồ sơ');
        if (Auth && Auth.refresh) return Auth.refresh();
      })
      .catch(function (e) { toast(e.message, 'danger'); });
  }

  function changePassword() {
    var cur = (document.getElementById('prof-pw-current') || {}).value || '';
    var nw = (document.getElementById('prof-pw-new') || {}).value || '';
    var nw2 = (document.getElementById('prof-pw-confirm') || {}).value || '';
    if (!cur || !nw) { toast('Nhập đủ mật khẩu hiện tại và mật khẩu mới', 'danger'); return; }
    if (nw.length < 6) { toast('Mật khẩu mới tối thiểu 6 ký tự', 'danger'); return; }
    if (nw !== nw2) { toast('Xác nhận mật khẩu không khớp', 'danger'); return; }
    api('/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword: cur, newPassword: nw })
    }).then(function () {
      toast('Đã đổi mật khẩu');
      ['prof-pw-current', 'prof-pw-new', 'prof-pw-confirm'].forEach(function (id) {
        var el = document.getElementById(id);
        if (el) el.value = '';
      });
    }).catch(function (e) { toast(e.message, 'danger'); });
  }

  /* ─── Role profile offcanvas (không gán quyền — SoT quyền = trang Phân quyền) ─── */
  var editingRoleId = null;
  var editingAccId = null;

  function openRoleModal(role) {
    if (role && role.isSuper) {
      toast('Admin toàn quyền không chỉnh tại đây. Phân quyền cho vai trò khác tại Phân quyền quản trị.', 'warning');
      return;
    }
    editingRoleId = role && role.id ? role.id : null;
    var isNew = !role || role.isNew;
    var title = document.getElementById('role-modal-title');
    if (title) title.textContent = isNew ? 'Thêm vai trò' : 'Sửa hồ sơ vai trò';
    var nameEl = document.getElementById('role-field-name');
    var codeEl = document.getElementById('role-field-code');
    var descEl = document.getElementById('role-field-desc');
    if (!nameEl || !codeEl) return;
    nameEl.value = (role && role.name) || '';
    codeEl.value = (role && role.code) || '';
    if (descEl) descEl.value = (role && role.description) || '';
    codeEl.readOnly = !isNew;
    nameEl.disabled = false;
    if (descEl) descEl.disabled = false;
    var saveBtn = document.getElementById('btn-save-role');
    if (saveBtn) saveBtn.style.display = '';
    if (global.ixOpenOffcanvas) ixOpenOffcanvas('offcanvas-admin-role');
  }

  function saveRole() {
    var name = document.getElementById('role-field-name').value.trim();
    var code = document.getElementById('role-field-code').value.trim();
    var desc = (document.getElementById('role-field-desc') || {}).value || '';
    desc = String(desc).trim();
    if (!name) { toast('Tên vai trò là bắt buộc', 'danger'); return; }
    var p;
    if (!editingRoleId) {
      if (!code) { toast('Mã vai trò là bắt buộc', 'danger'); return; }
      p = api('/roles', { method: 'POST', body: JSON.stringify({ code: code, name: name, description: desc }) });
    } else {
      p = api('/roles/' + editingRoleId, { method: 'PATCH', body: JSON.stringify({ name: name, description: desc }) });
    }
    p.then(function () {
      if (global.ixCloseOffcanvas) ixCloseOffcanvas('offcanvas-admin-role');
      toast(editingRoleId ? 'Đã cập nhật hồ sơ vai trò' : 'Đã tạo hồ sơ vai trò — gán quyền tại Phân quyền quản trị');
      return loadAll();
    }).then(function () {
      if (page === 'roles') renderRoleCards();
      if (page === 'permissions') return loadRolePerms().then(renderPermMatrix);
    }).catch(function (e) { toast(e.message, 'danger'); });
  }

  function openAccModal(acc) {
    editingAccId = acc && acc.id ? acc.id : null;
    var isNew = !acc || acc.isNew;
    var title = document.getElementById('user-modal-title');
    if (title) title.textContent = isNew ? 'Thêm tài khoản nhân viên' : 'Sửa tài khoản nhân viên';
    var nameEl = document.getElementById('acc-field-name');
    var emailEl = document.getElementById('acc-field-email');
    var pwWrap = document.getElementById('acc-pw-wrap');
    var rolesWrap = document.getElementById('acc-roles-wrap');
    if (!nameEl || !emailEl) return;
    nameEl.value = (acc && acc.name) || '';
    emailEl.value = (acc && acc.email) || '';
    emailEl.readOnly = !isNew;
    if (pwWrap) pwWrap.style.display = isNew ? '' : 'none';
    if (rolesWrap) {
      var sel = {};
      ((acc && acc.roles) || []).forEach(function (r) { sel[r.id] = true; });
      rolesWrap.innerHTML = state.roles.filter(function (r) { return !r.isSuper; }).map(function (r) {
        return '<label class="ix-perm-check" style="display:block;margin-bottom:6px"><input type="checkbox" class="ix-checkbox acc-role-cb" data-id="' + esc(r.id) + '"' + (sel[r.id] ? ' checked' : '') + ' /> ' + esc(r.name) + '</label>';
      }).join('') || '<span style="font-size:12px;color:var(--ix-text-muted)">Chưa có vai trò tùy chỉnh (ngoài Admin).</span>';
    }
    if (global.ixOpenOffcanvas) ixOpenOffcanvas('offcanvas-admin-user');
  }

  function saveAcc() {
    var name = document.getElementById('acc-field-name').value.trim();
    var email = document.getElementById('acc-field-email').value.trim();
    if (!name) { toast('Họ tên là bắt buộc', 'danger'); return; }
    var roleIds = [];
    document.querySelectorAll('.acc-role-cb:checked').forEach(function (cb) {
      roleIds.push(cb.getAttribute('data-id'));
    });
    var p;
    if (!editingAccId) {
      if (!email) { toast('Email là bắt buộc', 'danger'); return; }
      var pw = (document.getElementById('acc-field-password') || {}).value || '';
      p = api('/accounts', {
        method: 'POST',
        body: JSON.stringify({ email: email, name: name, password: pw || undefined, roleIds: roleIds })
      });
    } else {
      p = api('/accounts/' + editingAccId, { method: 'PATCH', body: JSON.stringify({ name: name }) })
        .then(function () {
          return api('/accounts/' + editingAccId + '/roles', { method: 'PUT', body: JSON.stringify({ roleIds: roleIds }) });
        });
    }
    p.then(function () {
      if (global.ixCloseOffcanvas) ixCloseOffcanvas('offcanvas-admin-user');
      toast('Đã lưu tài khoản nhân viên');
      return loadAll();
    }).then(renderAccounts).catch(function (e) { toast(e.message, 'danger'); });
  }

  function findRole(id) {
    return state.roles.filter(function (r) { return r.id === id; })[0];
  }
  function findAcc(id) {
    return state.accounts.filter(function (a) { return a.id === id; })[0];
  }

  function bindCommon() {
    var search = document.getElementById('admin-users-search');
    if (search) search.addEventListener('input', renderAccounts);
    var addUser = document.getElementById('btn-add-user');
    if (addUser) addUser.addEventListener('click', function () { openAccModal(null); });
    var saveUser = document.getElementById('btn-save-user');
    if (saveUser) saveUser.addEventListener('click', saveAcc);
    var saveRoleBtn = document.getElementById('btn-save-role');
    if (saveRoleBtn) saveRoleBtn.addEventListener('click', saveRole);
    var savePerms = document.getElementById('btn-save-admin-perms');
    if (savePerms) savePerms.addEventListener('click', savePermMatrix);
    var saveProf = document.getElementById('btn-save-profile');
    if (saveProf) saveProf.addEventListener('click', saveProfile);
    var savePw = document.getElementById('btn-change-password');
    if (savePw) savePw.addEventListener('click', changePassword);

    document.addEventListener('click', function (e) {
      if (e.target.closest('#btn-add-role-card')) { openRoleModal(null); return; }
      var editRole = e.target.closest('[data-edit-role]');
      if (editRole) {
        e.preventDefault();
        var r = findRole(editRole.getAttribute('data-edit-role'));
        if (r) openRoleModal(r);
        return;
      }
      var cloneRole = e.target.closest('[data-clone-role]');
      if (cloneRole) {
        e.preventDefault();
        api('/roles/' + cloneRole.getAttribute('data-clone-role') + '/clone', { method: 'POST', body: '{}' })
          .then(function () { toast('Đã nhân bản vai trò'); return loadAll(); })
          .then(renderRoleCards)
          .catch(function (er) { toast(er.message, 'danger'); });
        return;
      }
      var delRole = e.target.closest('[data-delete-role]');
      if (delRole) {
        e.preventDefault();
        if (!confirm('Xóa vai trò này?')) return;
        api('/roles/' + delRole.getAttribute('data-delete-role'), { method: 'DELETE' })
          .then(function () { toast('Đã xóa vai trò'); return loadAll(); })
          .then(renderRoleCards)
          .catch(function (er) { toast(er.message, 'danger'); });
        return;
      }
      var editAcc = e.target.closest('[data-edit-acc]');
      if (editAcc) {
        e.preventDefault();
        var a = findAcc(editAcc.getAttribute('data-edit-acc'));
        if (a) openAccModal(a);
        return;
      }
      var pwAcc = e.target.closest('[data-pw-acc]');
      if (pwAcc) {
        e.preventDefault();
        var np = prompt('Nhập mật khẩu mới (tối thiểu 6 ký tự):');
        if (!np) return;
        if (np.length < 6) { toast('Mật khẩu tối thiểu 6 ký tự', 'danger'); return; }
        api('/accounts/' + pwAcc.getAttribute('data-pw-acc') + '/reset-password', {
          method: 'POST',
          body: JSON.stringify({ newPassword: np })
        }).then(function () { toast('Đã đặt lại mật khẩu'); })
          .catch(function (er) { toast(er.message, 'danger'); });
        return;
      }
      var lockAcc = e.target.closest('[data-lock-acc]');
      if (lockAcc) {
        e.preventDefault();
        var cur = lockAcc.getAttribute('data-status');
        var next = cur === 'locked' ? 'active' : 'locked';
        api('/accounts/' + lockAcc.getAttribute('data-lock-acc') + '/status', {
          method: 'PATCH',
          body: JSON.stringify({ status: next })
        }).then(function () {
          toast(next === 'locked' ? 'Đã khóa tài khoản' : 'Đã mở khóa');
          return loadAll();
        }).then(renderAccounts).catch(function (er) { toast(er.message, 'danger'); });
        return;
      }
      var delAcc = e.target.closest('[data-delete-acc]');
      if (delAcc) {
        e.preventDefault();
        if (!confirm('Xóa tài khoản nhân viên này?')) return;
        api('/accounts/' + delAcc.getAttribute('data-delete-acc'), { method: 'DELETE' })
          .then(function () { toast('Đã xóa tài khoản'); return loadAll(); })
          .then(renderAccounts)
          .catch(function (er) { toast(er.message, 'danger'); });
      }
    });
  }

  function init() {
    if (!Auth || !token()) {
      toast('Cần đăng nhập admin', 'danger');
      return;
    }
    bindCommon();
    loadAll().then(function () {
      if (page === 'list') renderAccounts();
      if (page === 'roles') renderRoleCards();
      if (page === 'profile') renderProfile();
      if (page === 'permissions') {
        return loadRolePerms().then(function () {
          renderPermMatrix();
          renderPermSessionHint();
        });
      }
    }).catch(function (e) {
      toast(e.message || 'Lỗi tải dữ liệu', 'danger');
      var tbody = document.getElementById('admin-users-tbody');
      if (tbody) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:32px;color:var(--ix-danger);font-size:13px">Lỗi: ' + esc(e.message) + '</td></tr>';
      }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})(window);
