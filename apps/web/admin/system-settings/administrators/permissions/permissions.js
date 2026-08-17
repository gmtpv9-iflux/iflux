/**
 * Staging 2 — ADM-15: phân quyền quản trị
 * Hàng/cột lấy từ Registry. Không hard-code action.
 */
(function (global) {
  'use strict';

  var TYPE_ORDER = ['READ', 'CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE', 'RESET', 'GRANT'];
  var TYPE_LABEL = {
    READ: 'Xem',
    CREATE: 'Tạo',
    UPDATE: 'Sửa',
    DELETE: 'Xóa',
    STATUS_CHANGE: 'Trạng thái',
    RESET: 'Đặt lại',
    GRANT: 'Gán'
  };

  var catalog = [];
  var assigned = {};
  var els = {};

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function toast(text, danger) {
    els.toast.textContent = text;
    els.toast.className = 'ifx-admins-toast' + (danger ? ' is-danger' : '');
    els.toast.hidden = false;
    clearTimeout(toast.timer);
    toast.timer = setTimeout(function () { els.toast.hidden = true; }, 3200);
  }

  function hasKey(key) {
    var admin = global.IfluxAdminShell && IfluxAdminShell.getAdmin();
    if (!admin) return false;
    if (admin.isSuper) return true;
    return (admin.keys || []).indexOf(key) >= 0;
  }

  function api(method, path, body) {
    return global.IfluxAdminApi.request(method, path, body);
  }

  function typesInCatalog() {
    var seen = {};
    catalog.forEach(function (item) { seen[item.type] = true; });
    return TYPE_ORDER.filter(function (type) { return seen[type]; });
  }

  function groups() {
    var map = {};
    var order = [];
    catalog.forEach(function (item) {
      var id = item.domain + '.' + item.feature;
      if (!map[id]) {
        map[id] = {
          id: id,
          label: item.pageLabel || item.feature,
          domainLabel: item.moduleLabel || item.domain,
          items: []
        };
        order.push(map[id]);
      }
      map[id].items.push(item);
    });
    return order;
  }

  function renderHead(types) {
    var row = el('tr');
    row.appendChild(el('th', null, 'Tính năng'));
    types.forEach(function (type) {
      row.appendChild(el('th', null, TYPE_LABEL[type] || type));
    });
    els.head.replaceChildren(row);
  }

  function cellFor(items, type) {
    var td = el('td');
    var matches = items.filter(function (item) { return item.type === type; });
    if (!matches.length) {
      td.textContent = '—';
      return td;
    }
    matches.forEach(function (item) {
      var label = el('label', 'ifx-check');
      var box = el('input', 'ifx-checkbox');
      box.type = 'checkbox';
      box.value = item.key;
      box.checked = !!assigned[item.key];
      box.disabled = !hasKey('admin.permissions.assign');
      if (matches.length > 1) {
        label.appendChild(box);
        label.appendChild(document.createTextNode(item.label));
      } else {
        label.appendChild(box);
      }
      td.appendChild(label);
    });
    return td;
  }

  function renderBody(types) {
    var rows = [];
    var list = groups();
    var i;
    for (i = 0; i < list.length; i++) {
      var group = list[i];
      var head = el('tr');
      var cell = el('td', 'ifx-admins-perm__group', group.domainLabel + ' · ' + group.label);
      cell.colSpan = types.length + 1;
      head.appendChild(cell);
      rows.push(head);
      var row = el('tr');
      row.appendChild(el('td', null, group.label));
      types.forEach(function (type) {
        row.appendChild(cellFor(group.items, type));
      });
      rows.push(row);
    }
    if (!rows.length) {
      var empty = el('tr');
      var notice = el('td', 'ifx-table__notice', 'Chưa có quyền trong Catalog.');
      notice.colSpan = types.length + 1;
      empty.appendChild(notice);
      els.body.replaceChildren(empty);
      return;
    }
    els.body.replaceChildren.apply(els.body, rows);
  }

  function renderMatrix() {
    var types = typesInCatalog();
    renderHead(types);
    renderBody(types);
  }

  function selectedKeys() {
    return Array.prototype.map.call(
      els.body.querySelectorAll('input[type="checkbox"]:checked'),
      function (box) { return box.value; }
    );
  }

  function loadMatrix() {
    var roleId = els.role.value;
    if (!roleId) {
      assigned = {};
      renderMatrix();
      return;
    }
    api('GET', '/admin/administrators/permissions/matrix?roleId=' + encodeURIComponent(roleId)).then(function (res) {
      if (!res.ok) {
        toast((res.data && res.data.error) || 'Không tải được matrix.', true);
        return;
      }
      catalog = res.data.permissions || catalog;
      assigned = {};
      (res.data.keys || []).forEach(function (key) { assigned[key] = true; });
      renderMatrix();
    });
  }

  function save() {
    var roleId = els.role.value;
    if (!roleId) return;
    api('PUT', '/admin/administrators/permissions/roles/' + roleId, { keys: selectedKeys() }).then(function (res) {
      if (!res.ok) {
        toast((res.data && res.data.error) || 'Không lưu được phân quyền.', true);
        return;
      }
      toast('Đã lưu phân quyền.');
      assigned = {};
      (res.data.keys || []).forEach(function (key) { assigned[key] = true; });
      renderMatrix();
    });
  }

  function init() {
    els = {
      role: document.getElementById('perm-role'),
      save: document.getElementById('perm-save'),
      head: document.getElementById('perm-head'),
      body: document.getElementById('perm-body'),
      session: document.getElementById('perm-session'),
      toast: document.getElementById('admins-toast')
    };

    function start() {
    var admin = global.IfluxAdminShell && IfluxAdminShell.getAdmin();
    if (admin) {
      els.session.textContent = (admin.email || '') + ' · ' + (admin.isSuper ? 'Owner' : 'Nhân viên');
    }
    els.save.hidden = !hasKey('admin.permissions.assign');
    els.save.addEventListener('click', save);
    els.role.addEventListener('change', loadMatrix);

    Promise.all([
      api('GET', '/admin/administrators/permissions'),
      api('GET', '/admin/administrators/roles')
    ]).then(function (out) {
      var perms = out[0];
      var roles = out[1];
      if (perms.status === 403) {
        els.body.replaceChildren();
        var row = el('tr');
        var cell = el('td', 'ifx-table__notice', 'Tài khoản của bạn không có quyền xem phân quyền.');
        row.appendChild(cell);
        els.body.appendChild(row);
        return;
      }
      if (!perms.ok) {
        toast('Không tải được catalog.', true);
        return;
      }
      catalog = perms.data.permissions || [];
      var staff = ((roles.ok && roles.data.roles) || []).filter(function (r) { return !r.isSuper; });
      els.role.replaceChildren.apply(els.role, staff.map(function (role) {
        var opt = el('option', null, role.name);
        opt.value = role.id;
        return opt;
      }));
      if (!staff.length) {
        els.role.appendChild(el('option', null, 'Chưa có vai trò nhân viên'));
      }
      renderMatrix();
      if (staff.length) loadMatrix();
    });
    }

    var n = 0;
    var t = setInterval(function () {
      n += 1;
      if ((global.IfluxAdminShell && IfluxAdminShell.getAdmin()) || n > 40) {
        clearInterval(t);
        start();
      }
    }, 50);
  }

  init();
})(typeof window !== 'undefined' ? window : globalThis);
