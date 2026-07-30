/* iFlux Admin — Sidebar renderer. Chỉ đọc IfluxAdminAppShell — không gọi Routes/Auth. */
(function (global) {
  'use strict';
  if (global.IfluxAdminAppShellSidebar) return;

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function findHost() {
    return document.querySelector('[data-ix-admin-nav]') ||
      document.querySelector('.ix-sidebar .ix-menu');
  }

  function itemHtml(it, nested) {
    var cls = 'ix-menu-item' + (it.active ? ' active' : '');
    var icon = String(it.icon || 'ti-circle').replace(/\s*ix-menu-icon\s*/g, ' ').trim().split(/\s+/)[0];
    var badge = it.badge
      ? '<span class="ix-menu-badge">' + esc(it.badge) + '</span>'
      : '';
    var iconHtml = nested
      ? '<span class="ix-menu-bullet" aria-hidden="true"></span>'
      : '<i class="ti ' + esc(icon) + ' ix-menu-icon"></i>';
    return '<a href="' + esc(it.href) + '" class="' + cls + '"' +
      (it.routeKey ? ' data-ix-route="' + esc(it.routeKey) + '"' : '') + '>' +
      iconHtml +
      '<span class="ix-menu-label">' + esc(it.label) + '</span>' +
      badge + '</a>';
  }

  function parentHtml(p) {
    var cls = 'ix-menu-item' + (p.open ? ' open' : '') + (p.active ? ' active' : '');
    var icon = String(p.icon || 'ti-circle').replace(/\s*ix-menu-icon\s*/g, ' ').trim().split(/\s+/)[0];
    var badge = p.badge
      ? '<span class="ix-menu-badge">' + esc(p.badge) + '</span>'
      : '';
    var children = (p.children || []).map(function (ch) {
      return itemHtml(ch, true);
    }).join('');
    /* Parent có submenu: không điều hướng — chỉ toggle khi bấm tên/icon */
    return '<div class="' + cls + '" data-ix-submenu role="button" tabindex="0"' +
      (p.routeKey ? ' data-ix-route="' + esc(p.routeKey) + '"' : '') + '>' +
      '<i class="ti ' + esc(icon) + ' ix-menu-icon"></i>' +
      '<span class="ix-menu-label">' + esc(p.label) + '</span>' +
      badge +
      '<i class="ti ti-chevron-right ix-menu-arrow" aria-hidden="true"></i>' +
      '</div>' +
      '<div class="ix-menu-sub">' + children + '</div>';
  }

  function groupHtml(g) {
    return '<div class="ix-menu-header">' + esc(g.label) + '</div>';
  }

  /* Parent cùng MODULE = giữa 2 .ix-menu-header (hoặc đầu/cuối menu) */
  function moduleParentItems(host, item) {
    var kids = Array.prototype.slice.call(host.children || []);
    var idx = kids.indexOf(item);
    if (idx < 0) return [item];
    var start = 0;
    var i;
    for (i = idx; i >= 0; i--) {
      if (kids[i].classList && kids[i].classList.contains('ix-menu-header')) {
        start = i + 1;
        break;
      }
    }
    var end = kids.length;
    for (i = idx + 1; i < kids.length; i++) {
      if (kids[i].classList && kids[i].classList.contains('ix-menu-header')) {
        end = i;
        break;
      }
    }
    return kids.slice(start, end).filter(function (el) {
      return el.classList && el.classList.contains('ix-menu-item') && el.hasAttribute('data-ix-submenu');
    });
  }

  function toggleParent(host, item) {
    if (!host || !item) return;
    var isOpen = item.classList.contains('open');
    moduleParentItems(host, item).forEach(function (sibling) {
      if (sibling !== item) sibling.classList.remove('open');
    });
    item.classList.toggle('open', !isOpen);
  }

  function bindSubmenu(host) {
    if (!host || host._ixSubmenuBound) return;
    host._ixSubmenuBound = true;
    host.addEventListener('click', function (e) {
      var item = e.target && e.target.closest
        ? e.target.closest('.ix-menu-item[data-ix-submenu]')
        : null;
      if (!item || !host.contains(item)) return;
      /* Không chặn click vào item con trong submenu */
      if (e.target.closest('.ix-menu-sub')) return;
      e.preventDefault();
      e.stopPropagation();
      toggleParent(host, item);
    });
    host.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      var item = e.target && e.target.closest
        ? e.target.closest('.ix-menu-item[data-ix-submenu]')
        : null;
      if (!item || item !== e.target) return;
      e.preventDefault();
      toggleParent(host, item);
    });
  }

  function render() {
    var host = findHost();
    if (!host) return;
    var shell = global.IfluxAdminAppShell;
    if (!shell || !shell.getSidebarNav) return;
    var nodes = shell.getSidebarNav();
    var html = nodes.map(function (n) {
      if (n.type === 'group') return groupHtml(n);
      if (n.type === 'parent') return parentHtml(n);
      return itemHtml(n, false);
    }).join('');
    host.innerHTML = html;
    host.setAttribute('data-ix-admin-nav', '');
    bindSubmenu(host);
  }

  global.IfluxAdminAppShellSidebar = { render: render };

  function boot() {
    render();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})(window);
