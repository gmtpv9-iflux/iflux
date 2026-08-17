/**
 * Staging 2 — Navigation SoT (Admin)
 * Một nguồn: định nghĩa module, menu, route, active, visibility.
 * Trang không tự khai báo menu, không tự set active.
 *
 * Nhãn menu = tiếng Việt. URL / thư mục / tệp = tiếng Anh (URL Architecture).
 *
 * Chỉ item đã có trang thật mới được hiện (exists !== false).
 */
(function (global) {
  'use strict';

  var MODULES = [
    {
      label: 'Quản lý người dùng',
      items: [
        { href: '/admin/users', label: 'Danh sách người dùng', icon: 'users' }
      ]
    },
    {
      label: 'Hệ thống',
      items: [
        {
          label: 'Cấu hình Widget',
          icon: 'template',
          children: [
            { href: '/admin/widget-library', label: 'Thư viện Widget' }
          ]
        },
        {
          label: 'Quản trị viên',
          icon: 'users',
          children: [
            {
              href: '/admin/system-settings/administrators/list',
              label: 'Danh sách Quản trị viên',
              pageIdentity: 'page.administrators.list',
              viewKey: 'admin.accounts.view'
            },
            {
              href: '/admin/system-settings/administrators/roles',
              label: 'Vai trò quản trị',
              pageIdentity: 'page.administrators.roles',
              viewKey: 'admin.roles.view'
            },
            {
              href: '/admin/system-settings/administrators/permissions',
              label: 'Phân quyền quản trị',
              pageIdentity: 'page.administrators.permissions',
              viewKey: 'admin.permissions.view'
            },
            {
              href: '/admin/system-settings/administrators/my-profile',
              label: 'Hồ sơ của tôi',
              pageIdentity: 'page.administrators.my-profile'
            }
          ]
        }
      ]
    }
  ];

  function normalizePath(path) {
    var p = String(path || '');
    var q = p.indexOf('?');
    if (q >= 0) p = p.slice(0, q);
    var h = p.indexOf('#');
    if (h >= 0) p = p.slice(0, h);
    if (p.length > 1 && p.charAt(p.length - 1) === '/') p = p.slice(0, -1);
    return p || '/';
  }

  function isActive(item, path) {
    var href = normalizePath(item && item.href);
    var current = normalizePath(path);
    if (!href) return false;
    if (href === '/admin') return current === '/admin';
    return current === href || current.indexOf(href + '/') === 0;
  }

  function keepItem(item) {
    return !!(item && item.label && item.exists !== false &&
      (item.href || (item.children && item.children.length)));
  }

  function allowed(item, access) {
    if (!item.viewKey) return true;
    if (!access) return false;
    if (access.isSuper) return true;
    var keys = access.keys || [];
    return keys.indexOf(item.viewKey) >= 0;
  }

  function pickItems(list, access) {
    var out = [];
    var i;
    for (i = 0; i < (list || []).length; i++) {
      var item = list[i];
      if (!keepItem(item)) continue;
      if (item.children) {
        var kids = pickItems(item.children, access);
        if (!kids.length) continue;
        out.push({ href: item.href, label: item.label, icon: item.icon, children: kids });
        continue;
      }
      if (!allowed(item, access)) continue;
      out.push(item);
    }
    return out;
  }

  function visibleModules(access) {
    var out = [];
    var i;
    for (i = 0; i < MODULES.length; i++) {
      var items = pickItems(MODULES[i].items, access);
      if (items.length) out.push({ label: MODULES[i].label, items: items });
    }
    return out;
  }

  global.IfluxAdminNavigation = {
    modules: MODULES,
    normalizePath: normalizePath,
    visibleModules: visibleModules,
    isActive: isActive
  };
})(typeof window !== 'undefined' ? window : globalThis);
