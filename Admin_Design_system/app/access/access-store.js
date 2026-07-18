/* ADM-ACC-001/002 — mock role & permission store (localStorage) */
(function (global) {
  var STORAGE_KEY = 'iflux-admin-access-v1';

  var PACKAGE_LABELS = { free: 'Miễn phí', premium: 'Premium', elite: 'Elite' };
  var PACKAGE_ORDER = ['free', 'premium', 'elite'];

  var BASE_PERMISSIONS = {
    'market.overview': {
      id: 'market.overview', code: 'market.overview', name: 'Tổng quan thị trường',
      group: 'Thị trường', minPackage: 'free', desc: 'Xem tổng quan thị trường', builtin: true
    },
    'flow.realtime': {
      id: 'flow.realtime', code: 'flow.realtime', name: 'Dòng tiền realtime',
      group: 'Thị trường', minPackage: 'premium', desc: 'WSS dòng tiền real-time', builtin: true
    },
    'alert.composite': {
      id: 'alert.composite', code: 'alert.composite', name: 'Alert tổng hợp',
      group: 'Cảnh báo', minPackage: 'premium', desc: 'Tạo alert composite', builtin: true
    },
    'watchlist.export': {
      id: 'watchlist.export', code: 'watchlist.export', name: 'Xuất watchlist',
      group: 'Watchlist', minPackage: 'premium', desc: 'Xuất CSV watchlist', builtin: true
    },
    'api.read': {
      id: 'api.read', code: 'api.read', name: 'API đọc',
      group: 'API', minPackage: 'elite', desc: 'REST API đọc dữ liệu', builtin: true
    },
    'api.write': {
      id: 'api.write', code: 'api.write', name: 'API ghi',
      group: 'API', minPackage: 'elite', desc: 'REST API ghi watchlist/alert', builtin: true
    },
    'dashboard.widgets': {
      id: 'dashboard.widgets', code: 'dashboard.widgets', name: 'Widget không giới hạn',
      group: 'Bảng điều khiển', minPackage: 'premium', desc: 'Không giới hạn widget', builtin: true
    }
  };

  var BASE_ROLES = {
    standard: {
      id: 'standard', code: 'standard', name: 'Tiêu chuẩn',
      desc: 'Mặc định mọi user',
      packages: ['free', 'premium', 'elite'],
      permissionIds: ['market.overview'],
      users: 18240, status: 'active', builtin: true
    },
    creator: {
      id: 'creator', code: 'creator', name: 'Sáng tạo',
      desc: 'Đăng story, chia sẻ insight',
      packages: ['premium', 'elite'],
      permissionIds: ['market.overview', 'flow.realtime', 'alert.composite', 'watchlist.export', 'dashboard.widgets'],
      users: 4120, status: 'active', builtin: true
    },
    analyst: {
      id: 'analyst', code: 'analyst', name: 'Phân tích',
      desc: 'Export, báo cáo nâng cao',
      packages: ['premium', 'elite'],
      permissionIds: ['market.overview', 'flow.realtime', 'alert.composite', 'watchlist.export', 'dashboard.widgets'],
      users: 2890, status: 'active', builtin: true
    },
    api_partner: {
      id: 'api_partner', code: 'api_partner', name: 'Đối tác API',
      desc: 'Truy cập REST / WSS API',
      packages: ['elite'],
      permissionIds: ['market.overview', 'flow.realtime', 'api.read', 'api.write', 'dashboard.widgets'],
      users: 186, status: 'active', builtin: true
    },
    community_expert: {
      id: 'community_expert', code: 'community_expert', name: 'Chuyên gia cộng đồng',
      desc: 'Moderation cộng đồng GĐ2',
      packages: ['elite'],
      permissionIds: ['market.overview', 'flow.realtime', 'alert.composite'],
      users: 42, status: 'gd2', builtin: true
    }
  };

  var ROLE_KEYS = ['standard', 'creator', 'analyst', 'api_partner', 'community_expert'];

  function loadStore() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { roleOverrides: {}, customRoles: [], permOverrides: {}, customPerms: [] };
      var data = JSON.parse(raw);
      return {
        roleOverrides: data.roleOverrides || {},
        customRoles: data.customRoles || [],
        permOverrides: data.permOverrides || {},
        customPerms: data.customPerms || []
      };
    } catch (e) {
      return { roleOverrides: {}, customRoles: [], permOverrides: {}, customPerms: [] };
    }
  }

  function saveStore(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function merge(base, override) {
    if (!override) return JSON.parse(JSON.stringify(base));
    var item = JSON.parse(JSON.stringify(base));
    Object.keys(override).forEach(function (k) { item[k] = override[k]; });
    return item;
  }

  function escapeHtml(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function formatPackages(pkgs) {
    return (pkgs || []).map(function (p) { return PACKAGE_LABELS[p] || p; }).join(' · ');
  }

  function formatUsers(n) {
    return Number(n || 0).toLocaleString('en-US');
  }

  var ROLE_DISPLAY = {
    standard: 'Tiêu chuẩn',
    creator: 'Sáng tạo',
    analyst: 'Phân tích',
    api_partner: 'Đối tác API',
    community_expert: 'Chuyên gia cộng đồng'
  };

  function roleDisplayName(r) {
    return ROLE_DISPLAY[r.code] || r.name || r.code;
  }

  function roleStatusChip(status) {
    if (status === 'gd2') return { text: 'GĐ2', chip: 'ix-chip-warning' };
    if (status === 'hidden') return { text: 'Ẩn', chip: 'ix-chip-warning' };
    return { text: 'Hoạt động', chip: 'ix-chip-success' };
  }

  function normalizeCode(code) {
    return String(code || '').trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_.]/g, '');
  }

  function matchesSearchRole(r, q) {
    if (!q) return true;
    q = q.toLowerCase();
    var hay = [r.name, r.code, r.desc, formatPackages(r.packages)].join(' ').toLowerCase();
    return hay.indexOf(q) >= 0;
  }

  function matchesSearchPerm(p, q) {
    if (!q) return true;
    q = q.toLowerCase();
    var hay = [p.name, p.code, p.group, p.desc, PACKAGE_LABELS[p.minPackage] || p.minPackage].join(' ').toLowerCase();
    return hay.indexOf(q) >= 0;
  }

  global.AccessStore = {
    PACKAGE_LABELS: PACKAGE_LABELS,
    PACKAGE_ORDER: PACKAGE_ORDER,

    listPermissions: function () {
      var store = loadStore();
      var list = Object.keys(BASE_PERMISSIONS).map(function (k) {
        return merge(BASE_PERMISSIONS[k], store.permOverrides[k]);
      });
      store.customPerms.forEach(function (p) { list.push(p); });
      return list.sort(function (a, b) {
        var ga = (a.group || '').localeCompare(b.group || '');
        if (ga !== 0) return ga;
        return (a.name || '').localeCompare(b.name || '');
      });
    },

    getPermission: function (key) {
      if (key === 'new') {
        return {
          id: '', code: '', name: '', group: 'Thị trường', minPackage: 'free', desc: '',
          builtin: false, isNew: true
        };
      }
      var store = loadStore();
      var custom = store.customPerms.find(function (p) { return p.id === key || p.code === key; });
      if (custom) return JSON.parse(JSON.stringify(custom));
      if (BASE_PERMISSIONS[key]) return merge(BASE_PERMISSIONS[key], store.permOverrides[key]);
      return null;
    },

    savePermission: function (permKey, data) {
      var code = normalizeCode(data.code);
      if (!code) return { ok: false, error: 'Mã permission là bắt buộc' };
      if (!data.name || !data.name.trim()) return { ok: false, error: 'Tên permission là bắt buộc' };
      if (!data.group || !data.group.trim()) return { ok: false, error: 'Nhóm là bắt buộc' };

      data.code = code;
      data.id = code;
      data.name = data.name.trim();
      data.group = data.group.trim();
      data.desc = (data.desc || '').trim();
      data.minPackage = data.minPackage || 'free';

      var store = loadStore();

      if (permKey === 'new' || !permKey) {
        if (BASE_PERMISSIONS[code] || store.customPerms.some(function (p) { return p.code === code; })) {
          return { ok: false, error: 'Mã "' + code + '" đã tồn tại' };
        }
        data.builtin = false;
        store.customPerms.push(data);
        saveStore(store);
        return { ok: true, id: code };
      }

      if (BASE_PERMISSIONS[permKey]) {
        store.permOverrides[permKey] = Object.assign({}, store.permOverrides[permKey] || {}, data);
        store.permOverrides[permKey].code = permKey;
        store.permOverrides[permKey].id = permKey;
        saveStore(store);
        return { ok: true, id: permKey };
      }

      var idx = store.customPerms.findIndex(function (p) { return p.id === permKey || p.code === permKey; });
      if (idx >= 0) {
        if (code !== permKey) {
          if (BASE_PERMISSIONS[code] || store.customPerms.some(function (p, i) { return i !== idx && p.code === code; })) {
            return { ok: false, error: 'Mã "' + code + '" đã tồn tại' };
          }
        }
        data.builtin = false;
        store.customPerms[idx] = Object.assign({}, store.customPerms[idx], data);
        saveStore(store);
        return { ok: true, id: data.id };
      }

      return { ok: false, error: 'Không tìm thấy quyền' };
    },

    deletePermission: function (id) {
      if (!id) return { ok: false, error: 'Không xác định được permission' };
      if (BASE_PERMISSIONS[id]) {
        return { ok: false, error: 'Không thể xoá permission hệ thống.' };
      }
      var store = loadStore();
      var before = store.customPerms.length;
      store.customPerms = store.customPerms.filter(function (p) { return p.id !== id && p.code !== id; });
      if (store.customPerms.length === before) return { ok: false, error: 'Không tìm thấy quyền để xoá' };
      saveStore(store);
      return { ok: true };
    },

    listRoles: function () {
      var store = loadStore();
      var list = ROLE_KEYS.map(function (k) {
        return merge(BASE_ROLES[k], store.roleOverrides[k]);
      });
      store.customRoles.forEach(function (r) { list.push(r); });
      return list;
    },

    getRole: function (key) {
      if (key === 'new') {
        return {
          id: '', code: '', name: '', desc: '',
          packages: ['premium'],
          permissionIds: [],
          users: 0, status: 'active',
          builtin: false, isNew: true
        };
      }
      var store = loadStore();
      var custom = store.customRoles.find(function (r) { return r.id === key || r.code === key; });
      if (custom) return JSON.parse(JSON.stringify(custom));
      if (BASE_ROLES[key]) return merge(BASE_ROLES[key], store.roleOverrides[key]);
      return null;
    },

    saveRole: function (roleKey, data) {
      var code = normalizeCode(data.code);
      if (!code) return { ok: false, error: 'Mã vai trò là bắt buộc' };
      if (!data.name || !data.name.trim()) return { ok: false, error: 'Tên vai trò là bắt buộc' };

      data.code = code;
      data.id = code;
      data.name = data.name.trim();
      data.desc = (data.desc || '').trim();
      data.packages = Array.isArray(data.packages) ? data.packages : [];
      data.permissionIds = Array.isArray(data.permissionIds) ? data.permissionIds : [];
      data.users = parseInt(data.users, 10) || 0;
      data.status = data.status || 'active';

      var store = loadStore();

      if (roleKey === 'new' || !roleKey) {
        if (BASE_ROLES[code] || store.customRoles.some(function (r) { return r.code === code; })) {
          return { ok: false, error: 'Mã "' + code + '" đã tồn tại' };
        }
        data.builtin = false;
        store.customRoles.push(data);
        saveStore(store);
        return { ok: true, id: code };
      }

      if (BASE_ROLES[roleKey]) {
        store.roleOverrides[roleKey] = Object.assign({}, store.roleOverrides[roleKey] || {}, data);
        store.roleOverrides[roleKey].code = roleKey;
        store.roleOverrides[roleKey].id = roleKey;
        saveStore(store);
        return { ok: true, id: roleKey };
      }

      var idx = store.customRoles.findIndex(function (r) { return r.id === roleKey || r.code === roleKey; });
      if (idx >= 0) {
        if (code !== roleKey) {
          if (BASE_ROLES[code] || store.customRoles.some(function (r, i) { return i !== idx && r.code === code; })) {
            return { ok: false, error: 'Mã "' + code + '" đã tồn tại' };
          }
        }
        data.builtin = false;
        store.customRoles[idx] = Object.assign({}, store.customRoles[idx], data);
        saveStore(store);
        return { ok: true, id: data.id };
      }

      return { ok: false, error: 'Không tìm thấy vai trò' };
    },

    deleteRole: function (id) {
      if (!id) return { ok: false, error: 'Không xác định được role' };
      if (BASE_ROLES[id]) {
        return { ok: false, error: 'Không thể xoá vai trò hệ thống (Tiêu chuẩn, Sáng tạo, …).' };
      }
      var store = loadStore();
      var before = store.customRoles.length;
      store.customRoles = store.customRoles.filter(function (r) { return r.id !== id && r.code !== id; });
      if (store.customRoles.length === before) return { ok: false, error: 'Không tìm thấy vai trò để xoá' };
      saveStore(store);
      return { ok: true };
    },

    renderRoleRows: function (tbody, options) {
      options = options || {};
      var search = options.search || '';
      var statusFilter = options.status || '';
      var roles = this.listRoles().filter(function (r) {
        if (statusFilter && r.status !== statusFilter) return false;
        return matchesSearchRole(r, search);
      });

      if (!roles.length) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:32px;color:var(--ix-text-muted);font-size:13px">Không có role phù hợp.</td></tr>';
        return;
      }

      tbody.innerHTML = roles.map(function (r) {
        var st = roleStatusChip(r.status);
        var editKey = r.builtin ? r.code : (r.id || r.code);
        var canDelete = !r.builtin;
        return '<tr data-role-id="' + escapeHtml(r.id || r.code) + '">' +
          '<td><strong>' + escapeHtml(roleDisplayName(r)) + '</strong><div style="font-size:11px;color:var(--ix-text-muted)">' + escapeHtml(r.desc || '') + '</div></td>' +
          '<td><code>' + escapeHtml(r.code) + '</code></td>' +
          '<td>' + escapeHtml(formatPackages(r.packages)) + '</td>' +
          '<td>' + (r.permissionIds ? r.permissionIds.length : 0) + ' quyền</td>' +
          '<td>' + formatUsers(r.users) + '</td>' +
          '<td><span class="ix-chip ' + st.chip + '">' + st.text + '</span></td>' +
          '<td><div style="display:flex;gap:4px">' +
            '<button type="button" class="ix-btn ix-btn-icon" data-edit-role="' + escapeHtml(editKey) + '" title="Sửa"><i class="ti ti-edit"></i></button>' +
            (canDelete ? '<button type="button" class="ix-btn ix-btn-icon" data-delete-role="' + escapeHtml(r.id || r.code) + '" title="Xoá"><i class="ti ti-trash"></i></button>' : '') +
          '</div></td></tr>';
      }).join('');
    },

    renderPermissionRows: function (tbody, options) {
      options = options || {};
      var search = options.search || '';
      var groupFilter = options.group || '';
      var pkgFilter = options.minPackage || '';
      var perms = this.listPermissions().filter(function (p) {
        if (groupFilter && p.group !== groupFilter) return false;
        if (pkgFilter && p.minPackage !== pkgFilter) return false;
        return matchesSearchPerm(p, search);
      });

      if (!perms.length) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:32px;color:var(--ix-text-muted);font-size:13px">Không có permission phù hợp.</td></tr>';
        return;
      }

      tbody.innerHTML = perms.map(function (p) {
        var editKey = p.builtin ? p.code : (p.id || p.code);
        var canDelete = !p.builtin;
        return '<tr data-perm-id="' + escapeHtml(p.id || p.code) + '">' +
          '<td><strong>' + escapeHtml(p.name) + '</strong></td>' +
          '<td><code>' + escapeHtml(p.code) + '</code></td>' +
          '<td>' + escapeHtml(p.group) + '</td>' +
          '<td>' + escapeHtml(PACKAGE_LABELS[p.minPackage] || p.minPackage) + '</td>' +
          '<td style="font-size:12px;color:var(--ix-text-muted)">' + escapeHtml(p.desc || '') + '</td>' +
          '<td><div style="display:flex;gap:4px">' +
            '<button type="button" class="ix-btn ix-btn-icon" data-edit-perm="' + escapeHtml(editKey) + '" title="Sửa"><i class="ti ti-edit"></i></button>' +
            (canDelete ? '<button type="button" class="ix-btn ix-btn-icon" data-delete-perm="' + escapeHtml(p.id || p.code) + '" title="Xoá"><i class="ti ti-trash"></i></button>' : '') +
          '</div></td></tr>';
      }).join('');
    },

    getPermissionGroups: function () {
      var groups = {};
      this.listPermissions().forEach(function (p) {
        if (p.group) groups[p.group] = true;
      });
      return Object.keys(groups).sort();
    },

    refreshRolesPage: function () {
      var tbody = document.getElementById('roles-tbody');
      if (!tbody) return;
      var searchEl = document.getElementById('roles-search');
      var statusEl = document.getElementById('filter-role-status');
      this.renderRoleRows(tbody, {
        search: searchEl ? searchEl.value.trim() : '',
        status: statusEl && statusEl.value ? statusEl.value : ''
      });
    },

    refreshPermissionsPage: function () {
      var tbody = document.getElementById('perms-tbody');
      if (!tbody) return;
      var searchEl = document.getElementById('perms-search');
      var groupEl = document.getElementById('filter-perm-group');
      var pkgEl = document.getElementById('filter-perm-package');
      this.renderPermissionRows(tbody, {
        search: searchEl ? searchEl.value.trim() : '',
        group: groupEl && groupEl.value ? groupEl.value : '',
        minPackage: pkgEl && pkgEl.value ? pkgEl.value : ''
      });
    },

    fillRoleModal: function (role) {
      document.getElementById('role-modal-title').textContent = role.isNew ? 'Thêm vai trò' : 'Sửa vai trò';
      document.getElementById('role-field-name').value = role.name || '';
      var codeEl = document.getElementById('role-field-code');
      codeEl.value = role.code || '';
      codeEl.readOnly = !!role.builtin && !role.isNew;
      document.getElementById('role-field-desc').value = role.desc || '';
      document.getElementById('role-field-users').value = role.users || 0;
      document.getElementById('role-field-status').value = role.status || 'active';

      PACKAGE_ORDER.forEach(function (pkg) {
        var cb = document.getElementById('role-pkg-' + pkg);
        if (cb) cb.checked = (role.packages || []).indexOf(pkg) >= 0;
      });

      var permBox = document.getElementById('role-perm-list');
      if (permBox) {
        var selected = role.permissionIds || [];
        permBox.innerHTML = this.listPermissions().map(function (p) {
          var checked = selected.indexOf(p.code) >= 0 ? ' checked' : '';
          return '<label class="ix-perm-check" style="display:block;margin-bottom:8px">' +
            '<input type="checkbox" class="ix-checkbox role-perm-cb" value="' + escapeHtml(p.code) + '"' + checked + ' /> ' +
            escapeHtml(p.name) + ' <code style="font-size:11px">' + escapeHtml(p.code) + '</code></label>';
        }).join('');
      }

      document.getElementById('role-modal').dataset.editKey = role.isNew ? 'new' : (role.id || role.code);
    },

    collectRoleForm: function () {
      var packages = [];
      PACKAGE_ORDER.forEach(function (pkg) {
        var cb = document.getElementById('role-pkg-' + pkg);
        if (cb && cb.checked) packages.push(pkg);
      });
      var permissionIds = [];
      document.querySelectorAll('.role-perm-cb:checked').forEach(function (cb) {
        permissionIds.push(cb.value);
      });
      return {
        name: document.getElementById('role-field-name').value.trim(),
        code: document.getElementById('role-field-code').value.trim(),
        desc: document.getElementById('role-field-desc').value.trim(),
        users: document.getElementById('role-field-users').value,
        status: document.getElementById('role-field-status').value,
        packages: packages,
        permissionIds: permissionIds
      };
    },

    fillPermModal: function (perm) {
      document.getElementById('perm-modal-title').textContent = perm.isNew ? 'Thêm quyền' : 'Sửa quyền';
      document.getElementById('perm-field-name').value = perm.name || '';
      var codeEl = document.getElementById('perm-field-code');
      codeEl.value = perm.code || '';
      codeEl.readOnly = !!perm.builtin && !perm.isNew;
      document.getElementById('perm-field-group').value = perm.group || '';
      document.getElementById('perm-field-package').value = perm.minPackage || 'free';
      document.getElementById('perm-field-desc').value = perm.desc || '';
      document.getElementById('perm-modal').dataset.editKey = perm.isNew ? 'new' : (perm.id || perm.code);
    },

    collectPermForm: function () {
      return {
        name: document.getElementById('perm-field-name').value.trim(),
        code: document.getElementById('perm-field-code').value.trim(),
        group: document.getElementById('perm-field-group').value.trim(),
        minPackage: document.getElementById('perm-field-package').value,
        desc: document.getElementById('perm-field-desc').value.trim()
      };
    }
  };
})(window);
