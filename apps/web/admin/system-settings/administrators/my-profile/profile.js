/**
 * Staging 2 — ADM-15: hồ sơ của tôi
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

  function api(method, path, body) {
    return global.IfluxAdminApi.request(method, path, body);
  }

  function paint(profile) {
    els.name.value = profile.name || '';
    els.email.value = profile.email || '';
    els.id.textContent = profile.id || '—';
    els.access.replaceChildren(el(
      'span',
      'ifx-chip ' + (profile.isSuper ? 'ifx-chip--primary' : 'ifx-chip--outline'),
      profile.access === 'Owner' ? 'Owner' : 'Nhân viên'
    ));
    if (!profile.roles || !profile.roles.length) {
      els.roles.replaceChildren(el('span', 'ifx-admins-hint', 'Chưa gán vai trò'));
      return;
    }
    els.roles.replaceChildren.apply(els.roles, profile.roles.map(function (role) {
      return el('span', 'ifx-chip ifx-chip--outline', role.name);
    }));
  }

  function load() {
    api('GET', '/admin/administrators/profile').then(function (res) {
      if (!res.ok || !res.data || !res.data.profile) {
        toast((res.data && res.data.error) || 'Không tải được hồ sơ.', true);
        return;
      }
      paint(res.data.profile);
    });
  }

  function saveName() {
    api('PATCH', '/admin/administrators/profile', { name: els.name.value.trim() }).then(function (res) {
      if (!res.ok) {
        toast((res.data && res.data.error) || 'Không lưu được hồ sơ.', true);
        return;
      }
      toast('Đã lưu hồ sơ.');
      paint(res.data.profile);
    });
  }

  function savePassword() {
    var next = els.password.value;
    var confirm = els.confirm.value;
    if (next.length < 8) {
      toast('Mật khẩu mới tối thiểu 8 ký tự.', true);
      return;
    }
    if (next !== confirm) {
      toast('Xác nhận mật khẩu không khớp.', true);
      return;
    }
    api('PATCH', '/admin/administrators/profile', {
      currentPassword: els.current.value,
      password: next
    }).then(function (res) {
      if (!res.ok) {
        toast((res.data && res.data.error) || 'Không đổi được mật khẩu.', true);
        return;
      }
      els.current.value = '';
      els.password.value = '';
      els.confirm.value = '';
      toast('Đã đổi mật khẩu.');
    });
  }

  function init() {
    els = {
      name: document.getElementById('profile-name'),
      email: document.getElementById('profile-email'),
      id: document.getElementById('profile-id'),
      access: document.getElementById('profile-access'),
      roles: document.getElementById('profile-roles'),
      current: document.getElementById('profile-current'),
      password: document.getElementById('profile-password'),
      confirm: document.getElementById('profile-confirm'),
      save: document.getElementById('profile-save'),
      passwordSave: document.getElementById('profile-password-save'),
      toast: document.getElementById('admins-toast')
    };
    els.save.addEventListener('click', saveName);
    els.passwordSave.addEventListener('click', savePassword);
    load();
  }

  init();
})(typeof window !== 'undefined' ? window : globalThis);
