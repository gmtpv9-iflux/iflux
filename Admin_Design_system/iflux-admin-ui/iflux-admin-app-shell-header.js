/* iFlux Admin — Header/Topbar renderer. Chỉ đọc IfluxAdminAppShell. */
(function (global) {
  'use strict';
  if (global.IfluxAdminAppShellHeader) return;

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function initials(name) {
    return String(name || '')
      .split(/\s+/)
      .filter(Boolean)
      .map(function (w) { return w.charAt(0); })
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'AD';
  }

  function findNavbar() {
    return document.querySelector('[data-ix-admin-shell="header"]') ||
      document.querySelector('.ix-navbar');
  }

  function ensureEnvChip(nav) {
    var actions = nav.querySelector('.ix-nav-actions');
    if (!actions) return;
    var shell = global.IfluxAdminAppShell;
    var state = shell && shell.getHeaderState ? shell.getHeaderState() : { env: 'production' };
    var label = state.env === 'staging' ? 'Staging' : 'Production';
    /* Gỡ chip môi trường cứng trong HTML cũ */
    actions.querySelectorAll('.ix-chip').forEach(function (el) {
      var t = (el.textContent || '').toLowerCase();
      if (t.indexOf('môi trường') >= 0 || t.indexOf('local') >= 0 || t.indexOf('staging') >= 0 || t.indexOf('production') >= 0) {
        if (!el.getAttribute('data-ix-admin-env')) el.remove();
      }
    });
    var chip = actions.querySelector('[data-ix-admin-env]');
    if (!chip) {
      chip = document.createElement('span');
      chip.className = 'ifx-chip' + (state.env === 'staging' ? ' ifx-chip-warning' : ' ifx-chip-success');
      chip.setAttribute('data-ix-admin-env', '');
      var avatar = actions.querySelector('.ifx-avatar, .ix-avatar');
      if (avatar) actions.insertBefore(chip, avatar);
      else actions.appendChild(chip);
    } else {
      chip.className = 'ifx-chip' + (state.env === 'staging' ? ' ifx-chip-warning' : ' ifx-chip-success');
    }
    chip.textContent = label;
  }

  function renderAvatar(nav) {
    var shell = global.IfluxAdminAppShell;
    var state = shell && shell.getHeaderState ? shell.getHeaderState() : {};
    var admin = state.admin;
    var avatar = nav.querySelector('.ifx-avatar, .ix-avatar');
    if (!avatar) return;
    avatar.className = 'ifx-avatar ifx-avatar-md';
    if (!avatar.getAttribute('data-ix-admin-avatar')) avatar.setAttribute('data-ix-admin-avatar', '');
    if (!admin) {
      avatar.textContent = 'AD';
      avatar.removeAttribute('title');
      return;
    }
    if (admin.avatarUrl) {
      avatar.innerHTML = '<img src="' + esc(admin.avatarUrl) + '" alt="">';
    } else {
      avatar.textContent = initials(admin.name || admin.email);
    }
    avatar.title = admin.name ? admin.name + ' · ' + admin.email : (admin.email || '');
  }

  function ensureLogout(nav) {
    var actions = nav.querySelector('.ix-nav-actions');
    if (!actions) return;
    if (actions.querySelector('[data-ix-admin-logout]')) return;
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ifx-btn ifx-btn-ghost ifx-btn-sm';
    btn.setAttribute('data-ix-admin-logout', '');
    btn.innerHTML = '<i class="ti ti-logout"></i>';
    btn.title = 'Đăng xuất';
    actions.insertBefore(btn, actions.firstChild);
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      if (global.IfluxAdminAuth && global.IfluxAdminAuth.logout) {
        global.IfluxAdminAuth.logout();
      }
    });
  }

  function ensurePageHeaderSlot(nav) {
    var main = nav.parentNode;
    if (!main || main.tagName !== 'MAIN') return;
    if (main.querySelector('[data-admin-page-header]')) return;
    var slot = document.createElement('div');
    slot.setAttribute('data-admin-page-header', '');
    if (nav.nextSibling) main.insertBefore(slot, nav.nextSibling);
    else main.appendChild(slot);
  }

  function render() {
    var nav = findNavbar();
    if (!nav) return;
    nav.setAttribute('data-ix-admin-shell', 'header');
    ensurePageHeaderSlot(nav);
    ensureEnvChip(nav);
    ensureLogout(nav);
    renderAvatar(nav);
    /* Ủy quyền patch avatar từ auth nếu đã login sau render */
    if (global.IfluxAdminAuth && global.IfluxAdminAuth.patchNavbarAdmin) {
      try { global.IfluxAdminAuth.patchNavbarAdmin(); } catch (e) { /* ignore */ }
    }
  }

  global.IfluxAdminAppShellHeader = { render: render };

  function boot() {
    render();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})(window);
