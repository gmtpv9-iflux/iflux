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
    if (!rb || !rb.hasPermission || !rb.permForHref) return false;
    /* Fail-closed: chưa nạp quyền → ẩn mục menu được bảo vệ. */
    if (rb.isLoaded && !rb.isLoaded()) return false;
    var need = rb.permForHref(href);
    if (!need) return true;
    return rb.hasPermission(need);
  }

  function mapItem(node, active) {
    var href = hrefFor(node.routeKey);
    return {
      type: 'item',
      key: node.key,
      routeKey: node.routeKey,
      label: node.label,
      icon: node.icon,
      badge: node.badge || null,
      href: href,
      active: node.routeKey === active
    };
  }

  function mapParent(node, active) {
    var children = [];
    var childActive = false;
    (node.children || []).forEach(function (ch) {
      if (ch.type !== 'item' || ch.nav === false) return;
      var href = hrefFor(ch.routeKey);
      if (!canShowHref(href)) return;
      var mapped = mapItem(ch, active);
      if (mapped.active) childActive = true;
      children.push(mapped);
    });
    if (!children.length && !canShowHref(hrefFor(node.routeKey))) return null;
    return {
      type: 'parent',
      key: node.key,
      routeKey: node.routeKey,
      label: node.label,
      icon: node.icon,
      badge: node.badge || null,
      href: hrefFor(node.routeKey),
      open: childActive || node.routeKey === active,
      active: node.routeKey === active && !childActive,
      children: children
    };
  }

  /* Mỗi MODULE (group): mặc định expand parent đầu tiên; nếu đã có parent mở vì route active thì giữ. */
  function applyDefaultFirstParentOpen(nodes) {
    var i = 0;
    while (i < nodes.length) {
      if (nodes[i].type !== 'group') {
        i += 1;
        continue;
      }
      i += 1;
      var firstParent = null;
      var anyOpen = false;
      while (i < nodes.length && nodes[i].type !== 'group') {
        if (nodes[i].type === 'parent') {
          if (!firstParent) firstParent = nodes[i];
          if (nodes[i].open) anyOpen = true;
        }
        i += 1;
      }
      if (firstParent && !anyOpen) firstParent.open = true;
    }
    return nodes;
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
      if (node.type === 'parent') {
        var parent = mapParent(node, active);
        if (!parent) return;
        if (pendingGroup) {
          out.push(pendingGroup);
          pendingGroup = null;
        }
        out.push(parent);
        return;
      }
      if (node.type !== 'item' || node.nav === false) return;
      var href = hrefFor(node.routeKey);
      if (!canShowHref(href)) return;
      if (pendingGroup) {
        out.push(pendingGroup);
        pendingGroup = null;
      }
      out.push(mapItem(node, active));
    });
    return applyDefaultFirstParentOpen(out);
  }

  function fillBreadcrumb() {
    var el = document.getElementById('adm-page-bc');
    var Nav = registry();
    var key = activeKey();
    if (!el || !Nav || !Nav.trailFor || !key) return;
    var trail = Nav.trailFor(key);
    el.textContent = '';
    trail.forEach(function (crumb, idx) {
      if (idx > 0) {
        var sep = document.createElement('i');
        sep.className = 'ti ti-chevron-right';
        sep.style.fontSize = '12px';
        el.appendChild(sep);
      }
      if (crumb.href && idx < trail.length - 1) {
        var a = document.createElement('a');
        a.href = crumb.href;
        a.textContent = crumb.label;
        el.appendChild(a);
      } else {
        var span = document.createElement('span');
        span.textContent = crumb.label;
        el.appendChild(span);
      }
    });
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
    fillBreadcrumb: fillBreadcrumb,
    refresh: function () {
      if (global.IfluxAdminAppShellSidebar && global.IfluxAdminAppShellSidebar.render) {
        global.IfluxAdminAppShellSidebar.render();
      }
      if (global.IfluxAdminAppShellHeader && global.IfluxAdminAppShellHeader.render) {
        global.IfluxAdminAppShellHeader.render();
      }
      fillBreadcrumb();
    }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fillBreadcrumb);
  else fillBreadcrumb();
})(window);
