/**
 * Staging 2 — ADM-15: danh sách quản trị viên
 */
(function (global) {
  'use strict';

  var STATUS = {
    active: { label: 'Hoạt động', chip: 'ifx-chip--success' },
    disabled: { label: 'Vô hiệu', chip: 'ifx-chip--warning' }
  };

  var accounts = [];
  var staffRoles = [];
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

  function initials(name, email) {
    var words = String(name || email || '').split(/\s+/);
    var out = '';
    var i;
    for (i = 0; i < words.length && out.length < 2; i++) out += words[i].charAt(0);
    return out.toUpperCase() || 'NV';
  }

  function formatDate(value) {
    if (!value) return '—';
    var d = new Date(value);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleString('vi-VN');
  }

  function notice(text) {
    var row = el('tr');
    var cell = el('td', 'ifx-table__notice', text);
    cell.colSpan = 5;
    row.appendChild(cell);
    els.rows.replaceChildren(row);
  }

  function openDrawer(account) {
    els.drawer.hidden = false;
    els.drawer.classList.add('is-open');
    els.drawerTitle.textContent = account ? 'Sửa tài khoản' : 'Thêm tài khoản nhân viên';
    els.id.value = account ? account.id : '';
    els.name.value = account ? account.name || '' : '';
    els.email.value = account ? account.email : '';
    els.email.readOnly = !!account;
    els.passwordField.hidden = !!account;
    els.password.value = '';
    var chosen = {};
    if (account) {
      account.roles.forEach(function (r) { chosen[r.id] = true; });
    }
    els.rolesBox.replaceChildren.apply(els.rolesBox, staffRoles.map(function (role) {
      var label = el('label', 'ifx-check');
      var box = el('input', 'ifx-checkbox');
      box.type = 'checkbox';
      box.value = role.id;
      box.checked = !!chosen[role.id];
      label.appendChild(box);
      label.appendChild(document.createTextNode(role.name));
      return label;
    }));
  }

  function closeDrawer() {
    els.drawer.classList.remove('is-open');
    els.drawer.hidden = true;
  }

  function selectedRoleIds() {
    return Array.prototype.map.call(
      els.rolesBox.querySelectorAll('input:checked'),
      function (box) { return box.value; }
    );
  }

  function api(method, path, body) {
    return global.IfluxAdminApi.request(method, path, body);
  }

  function identityCell(account) {
    var cell = el('td');
    var wrap = el('div', 'ifx-admins-user');
    wrap.appendChild(el('span', 'ifx-admins-user__avatar', initials(account.name, account.email)));
    var text = el('div');
    text.appendChild(el('div', 'ifx-admins-user__name', account.name || '(chưa đặt tên)'));
    text.appendChild(el('div', 'ifx-admins-user__email', account.email));
    wrap.appendChild(text);
    cell.appendChild(wrap);
    return cell;
  }

  function actionCell(account) {
    var cell = el('td');
    var wrap = el('div', 'ifx-admins-actions');
    if (account.isSuper) {
      cell.appendChild(el('span', 'ifx-chip ifx-chip--primary', 'Owner'));
      return cell;
    }
    if (hasKey('admin.accounts.edit')) {
      var edit = el('button', 'ifx-button ifx-button--outline', 'Sửa');
      edit.type = 'button';
      edit.addEventListener('click', function () { openDrawer(account); });
      wrap.appendChild(edit);
    }
    if (hasKey('admin.accounts.reset_password')) {
      var reset = el('button', 'ifx-button ifx-button--outline', 'Đặt lại mật khẩu');
      reset.type = 'button';
      reset.addEventListener('click', function () {
        var password = window.prompt('Mật khẩu mới (tối thiểu 8 ký tự)');
        if (password == null) return;
        api('POST', '/admin/administrators/accounts/' + account.id + '/reset-password', { password: password })
          .then(function (res) {
            toast(res.ok ? 'Đã đặt lại mật khẩu.' : (res.data && res.data.error) || 'Không đặt lại được mật khẩu.', !res.ok);
          });
      });
      wrap.appendChild(reset);
    }
    if (account.status === 'active' && hasKey('admin.accounts.disable')) {
      var disable = el('button', 'ifx-button ifx-button--outline', 'Khóa');
      disable.type = 'button';
      disable.addEventListener('click', function () {
        api('PATCH', '/admin/administrators/accounts/' + account.id + '/status', { status: 'disabled' })
          .then(function (res) {
            if (!res.ok) { toast((res.data && res.data.error) || 'Không khóa được.', true); return; }
            load();
          });
      });
      wrap.appendChild(disable);
    }
    if (account.status === 'disabled' && hasKey('admin.accounts.enable')) {
      var enable = el('button', 'ifx-button ifx-button--outline', 'Mở');
      enable.type = 'button';
      enable.addEventListener('click', function () {
        api('PATCH', '/admin/administrators/accounts/' + account.id + '/status', { status: 'active' })
          .then(function (res) {
            if (!res.ok) { toast((res.data && res.data.error) || 'Không mở được.', true); return; }
            load();
          });
      });
      wrap.appendChild(enable);
    }
    if (hasKey('admin.accounts.delete')) {
      var del = el('button', 'ifx-button ifx-button--outline', 'Xóa');
      del.type = 'button';
      del.addEventListener('click', function () {
        if (!window.confirm('Xóa tài khoản này?')) return;
        api('DELETE', '/admin/administrators/accounts/' + account.id).then(function (res) {
          if (!res.ok) { toast((res.data && res.data.error) || 'Không xóa được.', true); return; }
          toast(res.data && res.data.action === 'admin.account.soft_delete'
            ? 'Tài khoản đã chuyển sang đã xóa.'
            : 'Đã xóa tài khoản.');
          load();
        });
      });
      wrap.appendChild(del);
    }
    cell.appendChild(wrap);
    return cell;
  }

  function render() {
    var q = els.search.value.trim().toLowerCase();
    var rows = accounts.filter(function (account) {
      if (!q) return true;
      return String(account.name || '').toLowerCase().indexOf(q) >= 0 ||
        String(account.email || '').toLowerCase().indexOf(q) >= 0;
    });
    if (!rows.length) {
      notice(q ? 'Không có quản trị viên nào khớp bộ lọc.' : 'Chưa có quản trị viên nào.');
      return;
    }
    els.rows.replaceChildren.apply(els.rows, rows.map(function (account) {
      var row = el('tr');
      row.appendChild(identityCell(account));
      row.appendChild(el('td', null, account.roles.map(function (r) { return r.name; }).join(', ') || '—'));
      row.appendChild(el('td', null, formatDate(account.lastLoginAt)));
      var meta = STATUS[account.status] || { label: account.status, chip: 'ifx-chip--outline' };
      var status = el('td');
      status.appendChild(el('span', 'ifx-chip ' + meta.chip, meta.label));
      row.appendChild(status);
      row.appendChild(actionCell(account));
      return row;
    }));
  }

  function load() {
    notice('Đang tải…');
    Promise.all([
      api('GET', '/admin/administrators/accounts'),
      api('GET', '/admin/administrators/roles')
    ]).then(function (out) {
      var acc = out[0];
      var roles = out[1];
      if (acc.status === 403) {
        notice('Tài khoản của bạn không có quyền xem danh sách quản trị viên.');
        return;
      }
      if (!acc.ok) {
        notice('Không tải được danh sách.');
        return;
      }
      accounts = acc.data.accounts || [];
      staffRoles = ((roles.ok && roles.data.roles) || []).filter(function (r) { return !r.isSuper; });
      els.add.hidden = !hasKey('admin.accounts.create');
      render();
    }).catch(function () {
      notice('Không tải được danh sách.');
    });
  }

  function save() {
    var id = els.id.value;
    var name = els.name.value.trim();
    var email = els.email.value.trim();
    var password = els.password.value;
    var roleIds = selectedRoleIds();
    var req;
    if (id) {
      req = api('PATCH', '/admin/administrators/accounts/' + id, { name: name, email: email })
        .then(function (res) {
          if (!res.ok) return res;
          return api('PUT', '/admin/administrators/accounts/' + id + '/roles', { roleIds: roleIds });
        });
    } else {
      req = api('POST', '/admin/administrators/accounts', {
        name: name,
        email: email,
        password: password,
        roleIds: roleIds
      });
    }
    req.then(function (res) {
      if (!res.ok) {
        toast((res.data && res.data.error) || 'Không lưu được.', true);
        return;
      }
      closeDrawer();
      toast('Đã lưu tài khoản.');
      load();
    });
  }

  function init() {
    els = {
      search: document.getElementById('admins-search'),
      add: document.getElementById('admins-add'),
      rows: document.getElementById('admins-rows'),
      drawer: document.getElementById('admins-drawer'),
      drawerTitle: document.getElementById('admins-drawer-title'),
      id: document.getElementById('account-id'),
      name: document.getElementById('account-name'),
      email: document.getElementById('account-email'),
      password: document.getElementById('account-password'),
      passwordField: document.getElementById('account-password-field'),
      rolesBox: document.getElementById('account-roles'),
      save: document.getElementById('account-save'),
      toast: document.getElementById('admins-toast')
    };
    els.search.addEventListener('input', render);
    els.add.addEventListener('click', function () { openDrawer(null); });
    els.save.addEventListener('click', save);
    els.drawer.addEventListener('click', function (e) {
      if (e.target.getAttribute('data-close')) closeDrawer();
    });
    var n = 0;
    var t = setInterval(function () {
      n += 1;
      if ((global.IfluxAdminShell && IfluxAdminShell.getAdmin()) || n > 40) {
        clearInterval(t);
        load();
      }
    }, 50);
  }

  init();
})(typeof window !== 'undefined' ? window : globalThis);
