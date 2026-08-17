/**
 * Staging 2 — ADM-15: vai trò quản trị
 */
(function (global) {
  'use strict';

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

  function openDrawer(role) {
    els.drawer.hidden = false;
    els.drawer.classList.add('is-open');
    els.title.textContent = role ? 'Sửa vai trò' : 'Thêm vai trò';
    els.id.value = role ? role.id : '';
    els.name.value = role ? role.name : '';
    els.code.value = role ? role.code : '';
    els.code.readOnly = !!role;
    els.description.value = role ? role.description || '' : '';
  }

  function closeDrawer() {
    els.drawer.classList.remove('is-open');
    els.drawer.hidden = true;
  }

  function card(role) {
    var node = el('article', 'ifx-card ifx-card__body ifx-admins-role');
    var top = el('div', 'ifx-admins-role__top');
    top.appendChild(el('span', 'ifx-admins-role__count', role.holderCount + ' đang giữ'));
    top.appendChild(el('span', 'ifx-chip ' + (role.isSuper ? 'ifx-chip--primary' : 'ifx-chip--outline'), role.kind));
    node.appendChild(top);
    node.appendChild(el('h2', 'ifx-admins-role__name', role.name));
    node.appendChild(el('p', 'ifx-admins-role__code', role.code));
    node.appendChild(el('p', 'ifx-admins-role__desc', role.description || '—'));
    var foot = el('div', 'ifx-admins-role__foot');
    if (!role.isSuper && !role.isSystem && hasKey('admin.roles.edit')) {
      var edit = el('button', 'ifx-button ifx-button--outline', 'Sửa hồ sơ');
      edit.type = 'button';
      edit.addEventListener('click', function () { openDrawer(role); });
      foot.appendChild(edit);
    }
    if (!role.isSuper && hasKey('admin.roles.clone')) {
      var clone = el('button', 'ifx-button ifx-button--outline', 'Nhân bản');
      clone.type = 'button';
      clone.addEventListener('click', function () {
        api('POST', '/admin/administrators/roles/' + role.id + '/clone').then(function (res) {
          if (!res.ok) { toast((res.data && res.data.error) || 'Không nhân bản được.', true); return; }
          toast('Đã nhân bản vai trò.');
          load();
        });
      });
      foot.appendChild(clone);
    }
    if (!role.isSuper && !role.isSystem && hasKey('admin.roles.delete')) {
      var del = el('button', 'ifx-button ifx-button--outline', 'Xóa');
      del.type = 'button';
      del.addEventListener('click', function () {
        if (!window.confirm('Xóa vai trò này?')) return;
        api('DELETE', '/admin/administrators/roles/' + role.id).then(function (res) {
          if (!res.ok) { toast((res.data && res.data.error) || 'Không xóa được.', true); return; }
          toast('Đã xóa vai trò.');
          load();
        });
      });
      foot.appendChild(del);
    }
    node.appendChild(foot);
    return node;
  }

  function addCard() {
    var node = el('button', 'ifx-card ifx-card__body ifx-admins-role ifx-admins-role--add');
    node.type = 'button';
    node.appendChild(el('h2', 'ifx-admins-role__name', 'Thêm vai trò'));
    node.appendChild(el('p', 'ifx-admins-role__desc', 'Sau khi tạo, gán quyền tại trang Phân quyền quản trị.'));
    node.addEventListener('click', function () { openDrawer(null); });
    return node;
  }

  function render(roles) {
    var nodes = roles.map(card);
    if (hasKey('admin.roles.create')) nodes.push(addCard());
    if (!nodes.length) {
      els.grid.replaceChildren(el('p', 'ifx-admins-hint', 'Chưa có vai trò nào.'));
      return;
    }
    els.grid.replaceChildren.apply(els.grid, nodes);
  }

  function load() {
    api('GET', '/admin/administrators/roles').then(function (res) {
      if (res.status === 403) {
        els.grid.replaceChildren(el('p', 'ifx-admins-hint', 'Tài khoản của bạn không có quyền xem vai trò.'));
        return;
      }
      if (!res.ok) {
        els.grid.replaceChildren(el('p', 'ifx-admins-hint', 'Không tải được vai trò.'));
        return;
      }
      render(res.data.roles || []);
    }).catch(function () {
      els.grid.replaceChildren(el('p', 'ifx-admins-hint', 'Không tải được vai trò.'));
    });
  }

  function save() {
    var id = els.id.value;
    var body = {
      name: els.name.value.trim(),
      description: els.description.value.trim()
    };
    var req;
    if (id) {
      req = api('PATCH', '/admin/administrators/roles/' + id, body);
    } else {
      body.code = els.code.value.trim().toLowerCase();
      req = api('POST', '/admin/administrators/roles', body);
    }
    req.then(function (res) {
      if (!res.ok) {
        toast((res.data && res.data.error) || 'Không lưu được.', true);
        return;
      }
      closeDrawer();
      toast('Đã lưu vai trò.');
      load();
    });
  }

  function init() {
    els = {
      grid: document.getElementById('roles-grid'),
      drawer: document.getElementById('roles-drawer'),
      title: document.getElementById('roles-drawer-title'),
      id: document.getElementById('role-id'),
      name: document.getElementById('role-name'),
      code: document.getElementById('role-code'),
      description: document.getElementById('role-description'),
      save: document.getElementById('role-save'),
      toast: document.getElementById('admins-toast')
    };
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
