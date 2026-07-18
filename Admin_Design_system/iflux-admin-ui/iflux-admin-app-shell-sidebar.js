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

  function itemHtml(it) {
    var cls = 'ix-menu-item' + (it.active ? ' active' : '');
    var icon = String(it.icon || 'ti-circle').replace(/\s*ix-menu-icon\s*/g, ' ').trim().split(/\s+/)[0];
    var badge = it.badge
      ? '<span class="ix-menu-badge">' + esc(it.badge) + '</span>'
      : '';
    return '<a href="' + esc(it.href) + '" class="' + cls + '"' +
      (it.routeKey ? ' data-ix-route="' + esc(it.routeKey) + '"' : '') + '>' +
      '<i class="ti ' + esc(icon) + ' ix-menu-icon"></i>' +
      '<span class="ix-menu-label">' + esc(it.label) + '</span>' +
      badge + '</a>';
  }

  function groupHtml(g) {
    return '<div class="ix-menu-header">' + esc(g.label) + '</div>';
  }

  function render() {
    var host = findHost();
    if (!host) return;
    var shell = global.IfluxAdminAppShell;
    if (!shell || !shell.getSidebarNav) return;
    var nodes = shell.getSidebarNav();
    var html = nodes.map(function (n) {
      return n.type === 'group' ? groupHtml(n) : itemHtml(n);
    }).join('');
    host.innerHTML = html;
    host.setAttribute('data-ix-admin-nav', '');
  }

  global.IfluxAdminAppShellSidebar = { render: render };

  function boot() {
    render();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})(window);
