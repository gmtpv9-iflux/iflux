/* ADM-SYS-005 — mock admin role & user store (localStorage) */
(function (global) {
  var STORAGE_KEY = 'iflux-admin-sys-roles-v1';

  var PERM_MODULES = [
    { key: 'dashboard', label: 'Tổng quan (Dashboard)', group: 'Chung' },
    { key: 'customers', label: 'Khách hàng & vai trò KH (ADM-USR, ADM-ACC)', group: 'Chung' },
    { key: 'market', label: 'Thị trường — mã CP, họ CP, ngành, công thức (ADM-MKT)', group: 'Thị trường' },
    { key: 'market_ops', label: 'Vận hành DL thị trường — feed, phiên, tick (ADM-MDO)', group: 'Thị trường' },
    { key: 'data_gov', label: 'Quản trị dữ liệu — nguồn, ETL, pipeline, đối soát (ADM-DATA)', group: 'Dữ liệu' },
    { key: 'subscription', label: 'Gói đăng ký — plan, subscriber, giao dịch (ADM-SUB)', group: 'Kinh doanh' },
    { key: 'notifications', label: 'Thông báo — push, in-app, email (ADM-NOTIF)', group: 'Kinh doanh' },
    { key: 'metadata', label: 'Metadata — enum, theme, lifecycle (ADM-META)', group: 'Cấu hình' },
    { key: 'news', label: 'Tin tức — bài, RSS, kiểm duyệt (ADM-NEWS)', group: 'Giai đoạn 2' },
    { key: 'story', label: 'Story Intelligence (ADM-STR)', group: 'Giai đoạn 2' },
    { key: 'ai', label: 'Trung tâm AI — prompt, log, cost (ADM-AI)', group: 'Giai đoạn 2' },
    { key: 'analytics', label: 'Phân tích — user, revenue, funnel (ADM-ANL)', group: 'Báo cáo' },
    { key: 'system', label: 'Hệ thống — role, audit, SLA, flags (ADM-SYS)', group: 'Hệ thống' }
  ];

  var PERM_ACTIONS = ['read', 'write', 'create'];
  var PERM_ACTION_LABELS = { read: 'Đọc', write: 'Ghi', create: 'Tạo' };

  /** Map quyền cũ (5 module generic) → module spec mới */
  var LEGACY_PERM_MAP = {
    users: 'customers',
    content: 'news',
    finance: 'subscription',
    reporting: 'analytics',
    api: 'system'
  };

  var AVATAR_COLORS = ['ix-avatar-accent', 'ix-avatar-success', 'ix-avatar-warning', 'ix-avatar-danger', 'ix-avatar-info'];

  function emptyPermissions() {
    var p = {};
    PERM_MODULES.forEach(function (m) { p[m.key] = []; });
    return p;
  }

  function perms(map) {
    var p = emptyPermissions();
    if (!map) return p;
    Object.keys(map).forEach(function (k) {
      if (p[k] !== undefined && Array.isArray(map[k])) p[k] = map[k].slice();
    });
    return p;
  }

  function allPermissions() {
    var map = {};
    PERM_MODULES.forEach(function (m) { map[m.key] = PERM_ACTIONS.slice(); });
    return perms(map);
  }

  var BASE_ROLES = {
    administrator: {
      id: 'administrator', code: 'administrator', name: 'Quản trị viên',
      desc: 'Toàn quyền hệ thống',
      permissions: allPermissions(),
      builtin: true
    },
    manager: {
      id: 'manager', code: 'manager', name: 'Quản lý',
      desc: 'Vận hành module chính',
      permissions: perms({
        dashboard: ['read'],
        customers: ['read', 'write'],
        market: ['read', 'write', 'create'],
        market_ops: ['read', 'write'],
        data_gov: ['read', 'write'],
        subscription: ['read', 'write'],
        notifications: ['read', 'write'],
        metadata: ['read'],
        analytics: ['read', 'write'],
        system: ['read']
      }),
      builtin: true
    },
    operator: {
      id: 'operator', code: 'operator', name: 'Vận hành',
      desc: 'Feed, thị trường, dữ liệu',
      permissions: perms({
        dashboard: ['read'],
        customers: ['read'],
        market: ['read', 'write', 'create'],
        market_ops: ['read', 'write', 'create'],
        data_gov: ['read', 'write'],
        subscription: ['read'],
        metadata: ['read']
      }),
      builtin: true
    },
    support: {
      id: 'support', code: 'support', name: 'Hỗ trợ',
      desc: 'Hỗ trợ khách hàng',
      permissions: perms({
        dashboard: ['read'],
        customers: ['read', 'write'],
        community: ['read'],
        notifications: ['read'],
        analytics: ['read']
      }),
      builtin: true
    },
    restricted: {
      id: 'restricted', code: 'restricted', name: 'Hạn chế',
      desc: 'Chỉ xem một số màn',
      permissions: perms({
        dashboard: ['read'],
        customers: ['read'],
        analytics: ['read']
      }),
      builtin: true
    }
  };

  var ROLE_KEYS = ['administrator', 'manager', 'operator', 'support', 'restricted'];

  var BASE_USERS = [
    { id: 'u1', name: 'Galen Slixby', email: 'gslixby@abc.net.au', initials: 'GL', roleId: 'operator', scope: 'Enterprise', status: 'inactive' },
    { id: 'u2', name: 'Halsey Changreau', email: 'hchangreau@apple.com', initials: 'HC', roleId: 'manager', scope: 'Team', status: 'active' },
    { id: 'u3', name: 'Kaine Malloch', email: 'kmalloch@amazon.com', initials: 'KM', roleId: 'administrator', scope: 'Enterprise', status: 'active' }
  ];

  function loadStore() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { roleOverrides: {}, customRoles: [], users: JSON.parse(JSON.stringify(BASE_USERS)) };
      var data = JSON.parse(raw);
      return {
        roleOverrides: data.roleOverrides || {},
        customRoles: data.customRoles || [],
        users: data.users && data.users.length ? data.users : JSON.parse(JSON.stringify(BASE_USERS))
      };
    } catch (e) {
      return { roleOverrides: {}, customRoles: [], users: JSON.parse(JSON.stringify(BASE_USERS)) };
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

  function normalizeCode(code) {
    return String(code || '').trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_.]/g, '');
  }

  function initialsFromName(name) {
    var parts = String(name || '').trim().split(/\s+/);
    if (!parts.length) return '??';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  function roleById(id) {
    return global.SystemRolesStore.listRoles().find(function (r) { return r.id === id || r.code === id; });
  }

  function usersForRole(roleId) {
    return loadStore().users.filter(function (u) { return u.roleId === roleId; });
  }

  function migrateLegacyPermissions(src) {
    if (!src) return {};
    var out = {};
    Object.keys(src).forEach(function (k) {
      var nk = LEGACY_PERM_MAP[k] || k;
      if (!out[nk]) out[nk] = [];
      (src[k] || []).forEach(function (act) {
        if (out[nk].indexOf(act) < 0) out[nk].push(act);
      });
    });
    return out;
  }

  function mergePermissions(src) {
    var migrated = migrateLegacyPermissions(src);
    var p = emptyPermissions();
    PERM_MODULES.forEach(function (m) {
      p[m.key] = Array.isArray(migrated[m.key]) ? migrated[m.key].slice() : [];
    });
    return p;
  }

  /** Gộp quyền gốc + override — module nào override có tick thì dùng override */
  function combinePermissions(baseSrc, overrideSrc) {
    var base = mergePermissions(baseSrc);
    if (!overrideSrc) return base;
    var over = mergePermissions(overrideSrc);
    var p = emptyPermissions();
    PERM_MODULES.forEach(function (m) {
      p[m.key] = over[m.key].length ? over[m.key].slice() : base[m.key].slice();
    });
    return p;
  }

  function permRowHtml(mod) {
    var acts = PERM_ACTIONS.map(function (act) {
      return '<label class="ix-perm-check"><input type="checkbox" class="ix-checkbox sys-perm-cb" data-mod="' +
        escapeHtml(mod.key) + '" data-act="' + act + '" /> ' + (PERM_ACTION_LABELS[act] || act) + '</label>';
    }).join('');
    return '<tr><td class="ix-perm-name" style="font-size:13px">' + escapeHtml(mod.label) + '</td><td><div class="ix-perm-actions">' +
      '<label class="ix-perm-check"><input type="checkbox" class="ix-checkbox sys-perm-all" data-mod="' + escapeHtml(mod.key) + '" /> Tất cả</label>' +
      acts + '</div></td></tr>';
  }

  global.SystemRolesStore = {
    PERM_MODULES: PERM_MODULES,
    PERM_ACTIONS: PERM_ACTIONS,

    listRoles: function () {
      var store = loadStore();
      var list = ROLE_KEYS.map(function (k) {
        var r = merge(BASE_ROLES[k], store.roleOverrides[k]);
        r.permissions = combinePermissions(
          BASE_ROLES[k].permissions,
          store.roleOverrides[k] && store.roleOverrides[k].permissions
        );
        return r;
      });
      store.customRoles.forEach(function (r) {
        r.permissions = mergePermissions(r.permissions);
        list.push(r);
      });
      return list;
    },

    getRole: function (key) {
      if (key === 'new') {
        return {
          id: '', code: '', name: '', desc: '',
          permissions: emptyPermissions(),
          builtin: false, isNew: true
        };
      }
      var store = loadStore();
      var custom = store.customRoles.find(function (r) { return r.id === key || r.code === key; });
      if (custom) {
        custom = JSON.parse(JSON.stringify(custom));
        custom.permissions = mergePermissions(custom.permissions);
        return custom;
      }
      if (BASE_ROLES[key]) {
        var r = merge(BASE_ROLES[key], store.roleOverrides[key]);
        r.permissions = combinePermissions(
          BASE_ROLES[key].permissions,
          store.roleOverrides[key] && store.roleOverrides[key].permissions
        );
        return r;
      }
      return null;
    },

    saveRole: function (roleKey, data) {
      var code = normalizeCode(data.code || data.name);
      if (!code) return { ok: false, error: 'Mã vai trò là bắt buộc' };
      if (!data.name || !data.name.trim()) return { ok: false, error: 'Tên vai trò là bắt buộc' };

      data.code = code;
      data.id = code;
      data.name = data.name.trim();
      data.desc = (data.desc || '').trim();
      data.permissions = mergePermissions(data.permissions);

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
        store.roleOverrides[roleKey] = {
          name: data.name,
          desc: data.desc,
          permissions: data.permissions,
          code: roleKey,
          id: roleKey
        };
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
      if (!id) return { ok: false, error: 'Không xác định vai trò' };
      if (BASE_ROLES[id]) return { ok: false, error: 'Không thể xoá vai trò hệ thống.' };
      var store = loadStore();
      if (store.users.some(function (u) { return u.roleId === id; })) {
        return { ok: false, error: 'Vai trò đang được gán cho admin — chuyển user sang vai trò khác trước.' };
      }
      var before = store.customRoles.length;
      store.customRoles = store.customRoles.filter(function (r) { return r.id !== id && r.code !== id; });
      if (store.customRoles.length === before) return { ok: false, error: 'Không tìm thấy vai trò để xoá' };
      saveStore(store);
      return { ok: true };
    },

    listUsers: function () {
      return loadStore().users.slice();
    },

    getUser: function (id) {
      if (id === 'new') {
        return { id: '', name: '', email: '', initials: '', roleId: 'operator', scope: 'Team', status: 'active', isNew: true };
      }
      var u = loadStore().users.find(function (x) { return x.id === id; });
      return u ? JSON.parse(JSON.stringify(u)) : null;
    },

    saveUser: function (userId, data) {
      if (!data.name || !data.name.trim()) return { ok: false, error: 'Tên là bắt buộc' };
      if (!data.email || !data.email.trim()) return { ok: false, error: 'Email là bắt buộc' };
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) return { ok: false, error: 'Email không hợp lệ' };
      if (!data.roleId) return { ok: false, error: 'Chọn vai trò' };

      data.name = data.name.trim();
      data.email = data.email.trim().toLowerCase();
      data.initials = (data.initials || initialsFromName(data.name)).toUpperCase().slice(0, 2);
      data.scope = data.scope || 'Team';
      data.status = data.status || 'active';

      var store = loadStore();

      if (userId === 'new' || !userId) {
        if (store.users.some(function (u) { return u.email === data.email; })) {
          return { ok: false, error: 'Email đã tồn tại' };
        }
        data.id = 'u' + Date.now();
        store.users.push(data);
        saveStore(store);
        return { ok: true, id: data.id };
      }

      var idx = store.users.findIndex(function (u) { return u.id === userId; });
      if (idx < 0) return { ok: false, error: 'Không tìm thấy admin' };
      if (store.users.some(function (u, i) { return i !== idx && u.email === data.email; })) {
        return { ok: false, error: 'Email đã được dùng bởi admin khác' };
      }
      data.id = userId;
      store.users[idx] = Object.assign({}, store.users[idx], data);
      saveStore(store);
      return { ok: true, id: userId };
    },

    deleteUser: function (id) {
      var store = loadStore();
      var before = store.users.length;
      store.users = store.users.filter(function (u) { return u.id !== id; });
      if (store.users.length === before) return { ok: false, error: 'Không tìm thấy admin để xoá' };
      saveStore(store);
      return { ok: true };
    },

    renderRoleCards: function (container) {
      if (!container) return;
      var roles = this.listRoles();
      var cards = roles.map(function (r) {
        var users = usersForRole(r.id);
        var avatars = users.slice(0, 3).map(function (u, i) {
          return '<div class="ix-avatar-sm ' + AVATAR_COLORS[i % AVATAR_COLORS.length] + '">' + escapeHtml(u.initials || initialsFromName(u.name)) + '</div>';
        }).join('');
        var extra = users.length > 3 ? '<div class="ix-avatar-group-count">+' + (users.length - 3) + '</div>' : '';
        var editKey = r.builtin ? r.code : (r.id || r.code);
        return '<div class="ix-role-card" data-role-card="' + escapeHtml(r.id) + '">' +
          '<div class="ix-role-card__top">' +
            '<span class="ix-role-card__count">' + users.length + ' admin</span>' +
            '<div class="ix-avatar-group">' + avatars + extra + '</div>' +
          '</div>' +
          '<div class="ix-role-card__foot">' +
            '<div><div class="ix-role-name">' + escapeHtml(r.name) + '</div>' +
            '<button type="button" class="ix-role-edit" data-edit-role="' + escapeHtml(editKey) + '">Sửa vai trò</button></div>' +
            '<button type="button" class="ix-btn ix-btn-icon" data-copy-role="' + escapeHtml(editKey) + '" title="Nhân bản"><i class="ti ti-copy" style="font-size:16px"></i></button>' +
          '</div></div>';
      }).join('');

      var addCard = '<div class="ix-role-card ix-role-card--add">' +
        '<div class="ix-role-card__add-body">' +
          '<button type="button" class="ix-btn ix-btn-primary ix-btn-sm ix-mb-8" id="btn-add-role-card"><i class="ti ti-plus"></i> Thêm vai trò</button>' +
          '<p class="ix-role-card__add-hint">Thêm vai trò mới nếu chưa có.</p>' +
        '</div>' +
        '<i class="ti ti-shield ix-role-card__add-icon"></i>' +
      '</div>';

      container.innerHTML = cards + addCard;
    },

    renderUserRows: function (tbody, options) {
      options = options || {};
      var q = (options.search || '').toLowerCase();
      var users = this.listUsers().filter(function (u) {
        if (!q) return true;
        var role = roleById(u.roleId);
        var hay = [u.name, u.email, u.scope, role ? role.name : ''].join(' ').toLowerCase();
        return hay.indexOf(q) >= 0;
      });

      if (!users.length) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:32px;color:var(--ix-text-muted);font-size:13px">Không có admin phù hợp.</td></tr>';
        return;
      }

      tbody.innerHTML = users.map(function (u) {
        var role = roleById(u.roleId);
        var statusChip = u.status === 'active'
          ? '<span class="ix-chip ix-chip-success">Hoạt động</span>'
          : '<span class="ix-chip ix-chip-danger">Ngưng</span>';
        var color = AVATAR_COLORS[(u.name || '').length % AVATAR_COLORS.length];
        return '<tr data-user-id="' + escapeHtml(u.id) + '">' +
          '<td><div class="ix-user-cell"><div class="ix-avatar-sm ' + color + '">' + escapeHtml(u.initials || initialsFromName(u.name)) + '</div>' +
          '<div><div class="ix-user-name">' + escapeHtml(u.name) + '</div><div class="ix-user-email">' + escapeHtml(u.email) + '</div></div></div></td>' +
          '<td>' + escapeHtml(role ? role.name : u.roleId) + '</td>' +
          '<td>' + escapeHtml(u.scope) + '</td>' +
          '<td>' + statusChip + '</td>' +
          '<td><div style="display:flex;gap:4px">' +
            '<button type="button" class="ix-btn ix-btn-icon" data-edit-user="' + escapeHtml(u.id) + '" title="Sửa"><i class="ti ti-edit" style="font-size:14px"></i></button>' +
            '<button type="button" class="ix-btn ix-btn-icon" data-delete-user="' + escapeHtml(u.id) + '" title="Xoá"><i class="ti ti-trash" style="font-size:14px"></i></button>' +
          '</div></td></tr>';
      }).join('');
    },

    fillRoleModal: function (role) {
      document.getElementById('role-modal-title').textContent = role.isNew ? 'Thêm vai trò' : 'Sửa vai trò';
      document.getElementById('role-field-name').value = role.name || '';
      var codeEl = document.getElementById('role-field-code');
      var codeHint = document.getElementById('role-field-code-hint');
      codeEl.value = role.code || '';
      codeEl.readOnly = false;
      codeEl.disabled = false;

      if (role.isNew) {
        codeHint.textContent = 'Mã viết thường, không dấu — vd. auditor';
      } else if (role.builtin) {
        codeEl.readOnly = true;
        codeHint.textContent = 'Vai trò hệ thống — mã không đổi, có thể sửa tên / mô tả / quyền.';
      } else {
        codeHint.textContent = 'Có thể đổi mã nếu chưa có admin gán vai trò này.';
      }

      document.getElementById('role-field-desc').value = role.desc || '';

      document.querySelectorAll('.sys-perm-cb, .sys-perm-all, #sys-perm-admin-all').forEach(function (cb) {
        cb.checked = false;
      });

      PERM_MODULES.forEach(function (mod) {
        var actions = (role.permissions && role.permissions[mod.key]) || [];
        PERM_ACTIONS.forEach(function (act) {
          var cb = document.querySelector('.sys-perm-cb[data-mod="' + mod.key + '"][data-act="' + act + '"]');
          if (cb) cb.checked = actions.indexOf(act) >= 0;
        });
        var allCb = document.querySelector('.sys-perm-all[data-mod="' + mod.key + '"]');
        if (allCb) allCb.checked = PERM_ACTIONS.every(function (act) { return actions.indexOf(act) >= 0; });
      });

      var adminAll = document.getElementById('sys-perm-admin-all');
      if (adminAll) {
        adminAll.checked = PERM_MODULES.every(function (mod) {
          return PERM_ACTIONS.every(function (act) {
            return ((role.permissions && role.permissions[mod.key]) || []).indexOf(act) >= 0;
          });
        });
      }

      document.getElementById('role-modal').dataset.editKey = role.isNew ? 'new' : (role.id || role.code);
    },

    collectRoleForm: function () {
      var permissions = emptyPermissions();
      document.querySelectorAll('.sys-perm-cb:checked').forEach(function (cb) {
        var mod = cb.getAttribute('data-mod');
        var act = cb.getAttribute('data-act');
        if (mod && act && permissions[mod] && permissions[mod].indexOf(act) < 0) {
          permissions[mod].push(act);
        }
      });
      return {
        name: document.getElementById('role-field-name').value.trim(),
        code: document.getElementById('role-field-code').value.trim(),
        desc: document.getElementById('role-field-desc').value.trim(),
        permissions: permissions
      };
    },

    fillUserModal: function (user) {
      document.getElementById('user-modal-title').textContent = user.isNew ? 'Thêm admin' : 'Sửa admin';
      document.getElementById('user-field-name').value = user.name || '';
      document.getElementById('user-field-email').value = user.email || '';
      document.getElementById('user-field-scope').value = user.scope || 'Team';
      document.getElementById('user-field-status').value = user.status || 'active';

      var roleSel = document.getElementById('user-field-role');
      roleSel.innerHTML = this.listRoles().map(function (r) {
        return '<option value="' + escapeHtml(r.id) + '">' + escapeHtml(r.name) + '</option>';
      }).join('');
      roleSel.value = user.roleId || 'operator';

      document.getElementById('user-modal').dataset.editKey = user.isNew ? 'new' : user.id;
    },

    collectUserForm: function () {
      return {
        name: document.getElementById('user-field-name').value.trim(),
        email: document.getElementById('user-field-email').value.trim(),
        roleId: document.getElementById('user-field-role').value,
        scope: document.getElementById('user-field-scope').value,
        status: document.getElementById('user-field-status').value
      };
    },

    refreshPage: function () {
      this.renderRoleCards(document.getElementById('admin-role-cards'));
      this.renderUserRows(document.getElementById('admin-users-tbody'), {
        search: (document.getElementById('admin-users-search') || {}).value || ''
      });
    },

    renderPermTable: function (tbody) {
      if (!tbody) return;
      var rows = [
        '<tr><td class="ix-perm-name">Toàn quyền admin</td><td><label class="ix-perm-check">' +
        '<input type="checkbox" class="ix-checkbox" id="sys-perm-admin-all" /> Chọn tất cả</label></td></tr>'
      ];
      var lastGroup = '';
      PERM_MODULES.forEach(function (mod) {
        if (mod.group && mod.group !== lastGroup) {
          lastGroup = mod.group;
          rows.push('<tr class="ix-perm-group-row"><td colspan="2" class="ix-perm-group-label">' +
            escapeHtml(mod.group) + '</td></tr>');
        }
        rows.push(permRowHtml(mod));
      });
      tbody.innerHTML = rows.join('');
    }
  };
})(window);
