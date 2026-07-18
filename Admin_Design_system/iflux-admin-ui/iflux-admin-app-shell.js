/* iFlux Admin — App Shell façade. Resolve href/active; optional RBAC filter. */
(function (global) {
  'use strict';
  if (global.IfluxAdminAppShell) return;

  function routes() { return global.IfluxAdminRoutes; }
  function registry() { return global.IfluxAdminNavRegistry; }
  function rbac() { return global.IfluxAdminRbac; }

  function hrefFor(routeKey) {
    var R = routes();
    return R && R.hrefFor ? R.hrefFor(routeKey) : '#';
  }

  function activeKey() {
    var R = routes();
    return R && R.detectActiveKey ? R.detectActiveKey() : null;
  }

  function isActive(routeKey) {
    return activeKey() === routeKey;
  }

  function canShowHref(href) {
    var rb = rbac();
    if (!rb || !rb.hasPermission || !rb.permForHref) return true;
    /* Chưa nạp quyền → hiện đủ menu; sau fetchAccessMe sẽ refresh ẩn item. */
    if (rb.isLoaded && !rb.isLoaded()) return true;
    var need = rb.permForHref(href);
    if (!need) return true;
    return rb.hasPermission(need);
  }

  function getSidebarNav() {
    var reg = registry();
    if (!reg || !reg.sidebar) return [];
    var active = activeKey();
    var out = [];
    var pendingGroup = null;
    reg.sidebar.forEach(function (node) {
      if (node.type === 'group') {
        pendingGroup = { type: 'group', label: node.label };
        return;
      }
      if (node.type !== 'item') return;
      var href = hrefFor(node.routeKey);
      if (!canShowHref(href)) return;
      if (pendingGroup) {
        out.push(pendingGroup);
        pendingGroup = null;
      }
      out.push({
        type: 'item',
        key: node.key,
        routeKey: node.routeKey,
        label: node.label,
        icon: node.icon,
        badge: node.badge || null,
        href: href,
        active: node.routeKey === active
      });
    });
    return out;
  }

  function getHeaderState() {
    var Auth = global.IfluxAdminAuth;
    var admin = Auth && Auth.getAdmin ? Auth.getAdmin() : null;
    var env = 'production';
    try {
      var h = (global.location && global.location.hostname) || '';
      if (h.indexOf('staging.') === 0 || h === 'localhost' || h === '127.0.0.1') env = 'staging';
    } catch (e) { /* ignore */ }
    return {
      env: env,
      admin: admin,
      loggedIn: !!(Auth && Auth.isAuthenticated && Auth.isAuthenticated())
    };
  }

  global.IfluxAdminAppShell = {
    hrefFor: hrefFor,
    activeKey: activeKey,
    isActive: isActive,
    getSidebarNav: getSidebarNav,
    getHeaderState: getHeaderState,
    refresh: function () {
      if (global.IfluxAdminAppShellSidebar && global.IfluxAdminAppShellSidebar.render) {
        global.IfluxAdminAppShellSidebar.render();
      }
      if (global.IfluxAdminAppShellHeader && global.IfluxAdminAppShellHeader.render) {
        global.IfluxAdminAppShellHeader.render();
      }
    }
  };
})(window);
