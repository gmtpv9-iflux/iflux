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
      open: false,
      active: node.routeKey === active && !childActive,
      children: children
    };
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
    return out;
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

  /* —— Page Host + navigate (Solution Rev 2 · S1) ——
   * Boundary (đo 97 HTML có data-ix-admin-shell, 18/08/2026):
   * 97/97: main.ix-main + .ix-content trong main; 0 content ngoài main.
   * Page-owned = children của main trừ Header + siblings sau .ix-root trừ overlay rail / toast / SCRIPT.
   * 13 Page: offcanvas sau </main>; 8: modal sau </main>; 1 footer trong main; 28 body data-*.
   */
  var BOOT_ID = 'ix' + String(Date.now());
  var pageEpoch = 0;
  var navigating = false;
  var styleBucket = null;
  var sharedLoaded = {};

  function markBoot() {
    try {
      document.documentElement.setAttribute('data-ix-admin-shell-boot', BOOT_ID);
      var header = document.querySelector('[data-ix-admin-shell="header"]');
      var side = document.querySelector('[data-ix-admin-shell="sidebar"]');
      if (header && !header.getAttribute('data-ix-admin-instance')) {
        header.setAttribute('data-ix-admin-instance', BOOT_ID);
      }
      if (side && !side.getAttribute('data-ix-admin-instance')) {
        side.setAttribute('data-ix-admin-instance', BOOT_ID);
      }
    } catch (e) { /* ignore */ }
  }

  function parseUrl(href) {
    try {
      return new URL(href, global.location.origin);
    } catch (e) {
      return null;
    }
  }

  function isAppBoundary(u) {
    if (!u) return true;
    var p = u.pathname || '';
    if (p.indexOf('/Admin_Design_system/auth/') >= 0) return true;
    if (/\/login(\.html)?$/.test(p)) return true;
    return false;
  }

  function isInternalAdmin(u) {
    if (!u || u.origin !== global.location.origin) return false;
    if (isAppBoundary(u)) return false;
    var p = u.pathname || '';
    if (p.indexOf('/admin') === 0) return true;
    if (p.indexOf('/Admin_Design_system/app/') === 0) return true;
    if (p.indexOf('/Admin_Design_system/hub') === 0) return true;
    return false;
  }

  function canonicalHref(href) {
    var u = parseUrl(href);
    if (!u) return href;
    var R = routes();
    var key = R && R.matchPath ? R.matchPath(u.pathname, u.hash) : null;
    var Nav = registry();
    var ia = (key && Nav && Nav.pathFor) ? Nav.pathFor(key) : '';
    if (ia && ia.charAt(0) === '/') {
      return ia.split('#')[0] + u.search + (u.hash || '');
    }
    if (R && R.hrefFor && key) {
      var h = R.hrefFor(key);
      if (h && h.charAt(0) === '/') {
        var base = String(h).split('#')[0].split('?')[0];
        return base + u.search + (u.hash || '');
      }
    }
    return u.pathname + u.search + u.hash;
  }

  function fileForHref(href) {
    var u = parseUrl(href);
    var R = routes();
    if (!u || !R || !R.matchPath || !R.PAGES) return '';
    var key = R.matchPath(u.pathname, u.hash);
    if (!key) return '';
    var k;
    for (k in R.PAGES) {
      if (!Object.prototype.hasOwnProperty.call(R.PAGES, k)) continue;
      var p = R.PAGES[k];
      if (p && p.key === key && p.file) return p.file;
    }
    return '';
  }

  /* P1: rỗng. Chỉ thêm routeKey sau convert + verify marker (P3+). */
  var CANONICAL_ROUTE_ALLOWLIST = [];

  function canonicalAllowlist() {
    return CANONICAL_ROUTE_ALLOWLIST.slice();
  }

  function isCanonicalRoute(routeKey) {
    return !!routeKey && CANONICAL_ROUTE_ALLOWLIST.indexOf(routeKey) >= 0;
  }

  function routeKeyFromHref(href) {
    var u = parseUrl(href);
    var R = routes();
    if (!u || !R || !R.matchPath) return null;
    return R.matchPath(u.pathname, u.hash) || null;
  }

  function fragmentHref(href) {
    var file = fileForHref(href);
    if (!file) return '';
    return '/Admin_Design_system/app/' + file;
  }

  function isShellDocument(rootDoc) {
    if (!rootDoc) return false;
    var root = rootDoc.documentElement;
    if (root && root.hasAttribute && root.hasAttribute('data-admin-shell-document')) return true;
    return !!(rootDoc.querySelector && rootDoc.querySelector('[data-admin-shell-document]'));
  }

  function collectCanonicalPage(rootDoc) {
    if (!rootDoc || !rootDoc.querySelector) return null;
    return rootDoc.querySelector('[data-admin-page]') || null;
  }

  function isAppShellHeader(el) {
    if (!el || !el.getAttribute) return false;
    if (el.getAttribute('data-ix-admin-shell') === 'header') return true;
    return !!(el.classList && el.classList.contains('ix-navbar'));
  }

  function isAppShellExtra(el) {
    if (!el) return true;
    if (el.id === 'ix-overlay' || el.id === 'ix-toast-container') return true;
    if (el.tagName === 'SCRIPT') return true;
    return false;
  }

  function collectPageOwned(rootDoc) {
    var nodes = [];
    var main = rootDoc.querySelector('main.ix-main');
    if (main) {
      Array.prototype.forEach.call(main.children, function (el) {
        if (isAppShellHeader(el)) return;
        if (el.getAttribute && el.getAttribute('data-ix-admin-page-host') !== null) {
          Array.prototype.forEach.call(el.children, function (ch) { nodes.push(ch); });
          return;
        }
        nodes.push(el);
      });
    }
    var root = rootDoc.querySelector('.ix-root');
    if (root && root.parentNode) {
      var sib = root.nextElementSibling;
      while (sib) {
        if (!isAppShellExtra(sib)) nodes.push(sib);
        sib = sib.nextElementSibling;
      }
    }
    return nodes;
  }

  function ensureCanonicalAssets() {
    var hrefs = [
      '/platform/admin/tokens/generated/css/primitives.css',
      '/design_system/01_tokens/02_generated/01_css/primitives.css',
      '/design_system/01_tokens/02_generated/01_css/semantic.css',
      '/design_system/01_tokens/02_generated/01_css/01_themes/dark.css',
      '/design_system/01_tokens/02_generated/01_css/01_themes/light.css',
      '/design_system/03_primitives/06_navigation/nav.css',
      '/design_system/03_primitives/02_avatar/avatar.css',
      '/design_system/03_primitives/05_chip/chip.css',
      '/design_system/03_primitives/04_button/button.css',
      '/design_system/04_components/10_page-header/page-header.css',
      '/design_system/04_components/02_breadcrumb/breadcrumb.css',
      '/platform/admin/shell/layout.css?v=sub02p2c-20260831'
    ];
    hrefs.forEach(function (href) {
      if (document.querySelector('link[rel="stylesheet"][href="' + href + '"]')) return;
      var link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      document.head.appendChild(link);
    });
  }

  function ensureLayoutFrame() {
    var main = document.querySelector('main.ix-main');
    if (!main) return;
    main.setAttribute('data-admin-main-area', '');
    var layout = document.querySelector('.ix-layout');
    if (layout) layout.setAttribute('data-admin-chrome', 'ds');
    var header = main.querySelector('[data-ix-admin-shell="header"], header.ix-navbar');
    var host = main.querySelector('[data-ix-admin-page-host]');
    var region = main.querySelector('[data-admin-header-region]');
    if (!region) {
      region = document.createElement('div');
      region.setAttribute('data-admin-header-region', '');
      if (header && header.parentNode === main) main.insertBefore(region, header);
      else main.insertBefore(region, main.firstChild);
    }
    if (header && header.parentNode !== region) region.insertBefore(header, region.firstChild);
    var pageHeader = region.querySelector('[data-admin-page-header]');
    if (!pageHeader) {
      pageHeader = document.createElement('div');
      pageHeader.setAttribute('data-admin-page-header', '');
      region.appendChild(pageHeader);
    }
    if (host && host.parentNode === main && region.nextElementSibling !== host) {
      if (region.nextSibling) main.insertBefore(host, region.nextSibling);
      else main.appendChild(host);
    }
  }

  function ensurePageHost() {
    var existing = document.querySelector('[data-ix-admin-page-host]');
    if (existing) return existing;
    var main = document.querySelector('main.ix-main');
    if (!main) return null;
    var host = document.createElement('div');
    host.setAttribute('data-ix-admin-page-host', '');
    var header = main.querySelector('[data-ix-admin-shell="header"], header.ix-navbar');
    collectPageOwned(document).forEach(function (el) {
      host.appendChild(el);
    });
    if (header && header.parentNode === main) {
      if (header.nextSibling) main.insertBefore(host, header.nextSibling);
      else main.appendChild(host);
    } else {
      main.appendChild(host);
    }
    return host;
  }

  function ensureStyleBucket() {
    if (styleBucket && styleBucket.parentNode) return styleBucket;
    styleBucket = document.createElement('div');
    styleBucket.setAttribute('data-ix-admin-page-styles', '');
    document.head.appendChild(styleBucket);
    return styleBucket;
  }

  function syncBodyData(srcBody) {
    if (!srcBody) return;
    Array.prototype.slice.call(document.body.attributes).forEach(function (attr) {
      if (attr.name.indexOf('data-') === 0) document.body.removeAttribute(attr.name);
    });
    Array.prototype.slice.call(srcBody.attributes).forEach(function (attr) {
      if (attr.name.indexOf('data-') === 0) {
        document.body.setAttribute(attr.name, attr.value);
      }
    });
  }

  function syncPageStyles(doc) {
    var bucket = ensureStyleBucket();
    bucket.textContent = '';
    Array.prototype.forEach.call(doc.querySelectorAll('link[rel="stylesheet"]'), function (link) {
      var href = link.getAttribute('href') || '';
      if (!href) return;
      var path;
      try { path = new URL(href, global.location.origin).pathname; } catch (e) { path = href.split('?')[0]; }
      if (path.indexOf('iflux-admin-ui.css') >= 0 || path.indexOf('fonts.css') >= 0) return;
      if (document.querySelector('link[rel="stylesheet"][href="' + href.replace(/"/g, '') + '"]')) return;
      var clone = document.createElement('link');
      clone.rel = 'stylesheet';
      clone.href = href;
      bucket.appendChild(clone);
    });
    Array.prototype.forEach.call(doc.querySelectorAll('head style, body style'), function (st) {
      var clone = document.createElement('style');
      clone.textContent = st.textContent || '';
      bucket.appendChild(clone);
    });
  }

  function scriptPathname(src) {
    try { return new URL(src, global.location.origin).pathname; } catch (e) {
      return String(src || '').split('?')[0];
    }
  }

  function isShellScript(pathname) {
    if (!pathname) return false;
    if (pathname.indexOf('/iflux-admin-ui/iflux-admin-app-shell') >= 0) return true;
    if (pathname.indexOf('/iflux-admin-ui/iflux-admin-routes') >= 0) return true;
    if (pathname.indexOf('/iflux-admin-ui/iflux-admin-nav-registry') >= 0) return true;
    if (pathname.indexOf('/iflux-admin-ui/iflux-admin-ui') >= 0) return true;
    if (pathname.indexOf('/iflux-admin-ui/iflux-admin-notifications') >= 0) return true;
    if (pathname.indexOf('/iflux-admin-ui/admin-rbac') >= 0) return true;
    if (pathname.indexOf('/iflux-admin-ui/admin-auth') >= 0) return true;
    if (pathname.indexOf('/iflux-admin-ui/admin-view-gate') >= 0) return true;
    if (pathname.indexOf('/iflux-admin-ui/iflux-theme') >= 0) return true;
    return false;
  }

  function isPageOwnedScript(pathname) {
    return pathname.indexOf('/Admin_Design_system/app/') === 0
      || pathname.indexOf('/Admin_Design_system/ds-sot') === 0;
  }

  function runOneScript(el, epoch) {
    return new Promise(function (resolve) {
      if (epoch !== pageEpoch) { resolve(); return; }
      var src = el.getAttribute('src');
      if (src) {
        var path = scriptPathname(src);
        if (isShellScript(path)) { resolve(); return; }
        if (!isPageOwnedScript(path)) {
          if (sharedLoaded[path] || document.querySelector('script[src*="' + path.split('/').pop() + '"]')) {
            resolve();
            return;
          }
          var once = document.createElement('script');
          once.src = src;
          once.onload = function () { sharedLoaded[path] = 1; resolve(); };
          once.onerror = function () { resolve(); };
          document.body.appendChild(once);
          return;
        }
        fetch(src, { credentials: 'same-origin', cache: 'force-cache' }).then(function (res) {
          return res.ok ? res.text() : '';
        }).then(function (code) {
          if (epoch !== pageEpoch || !code) { resolve(); return; }
          try { (0, eval)(code); } catch (err) { /* Page script error — Host vẫn sống */ }
          resolve();
        }).catch(function () { resolve(); });
        return;
      }
      var code = el.textContent || '';
      if (!code.trim()) { resolve(); return; }
      try { (0, eval)(code); } catch (err) { /* ignore */ }
      resolve();
    });
  }

  function runPageScripts(doc, epoch) {
    var list = Array.prototype.slice.call(doc.querySelectorAll('script'));
    var i = 0;
    function next() {
      if (epoch !== pageEpoch || i >= list.length) return Promise.resolve();
      return runOneScript(list[i++], epoch).then(next);
    }
    return next();
  }

  function showHostError(msg) {
    var host = ensurePageHost();
    if (!host) return;
    host.textContent = '';
    var box = document.createElement('div');
    box.className = 'ix-content';
    box.innerHTML = '<div class="ix-card" style="padding:32px;text-align:center">' +
      '<h1 class="ix-page-title">Không tải được trang</h1>' +
      '<p class="ix-fs-13" style="color:var(--ix-text-muted);margin-top:8px">' +
      String(msg || 'Page Host không thay được nội dung.') + '</p></div>';
    host.appendChild(box);
  }

  function afterPageIn() {
    fillBreadcrumb();
    if (global.IfluxAdminAppShellSidebar && global.IfluxAdminAppShellSidebar.syncActive) {
      global.IfluxAdminAppShellSidebar.syncActive();
    }
    if (global.IfluxAdminViewGate && global.IfluxAdminViewGate.bootFromAttr) {
      try { global.IfluxAdminViewGate.bootFromAttr(); } catch (e) { /* ignore */ }
    }
    var rb = rbac();
    if (rb && rb.gatePermElements) {
      try { rb.gatePermElements(); } catch (e) { /* ignore */ }
    }
    if (rb && rb.permForHref) {
      try {
        var need = rb.permForHref(global.location.pathname);
        if (need && rb.isLoaded && rb.isLoaded() && rb.hasPermission && !rb.hasPermission(need) && rb.applyGates) {
          /* gateCurrentPage via applyGates sẽ remount Menu nếu gọi đầy đủ — chỉ denied trong Host */
          var host = document.querySelector('[data-ix-admin-page-host]');
          if (host) showHostError('Tài khoản của bạn không được phép xem trang này.');
        }
      } catch (e) { /* ignore */ }
    }
  }

  function leaveAppShell(href) {
    global.location.assign(href);
  }

  function navigate(href, opts) {
    opts = opts || {};
    var u = parseUrl(href);
    if (!u) return Promise.resolve();
    if (isAppBoundary(u) || !isInternalAdmin(u)) {
      if (opts.history === 'none') return Promise.resolve();
      leaveAppShell(u.href);
      return Promise.resolve();
    }
    var dest = canonicalHref(u.href);
    var destU = parseUrl(dest) || u;
    var cur = global.location.pathname + global.location.search + global.location.hash;
    var next = destU.pathname + destU.search + destU.hash;
    if (cur === next && opts.history !== 'none') return Promise.resolve();

    if (fileForHref(cur) && fileForHref(next) && fileForHref(cur) === fileForHref(next)
      && destU.pathname === global.location.pathname && destU.search === global.location.search
      && destU.hash !== global.location.hash) {
      if (opts.history !== 'none') global.history.pushState({ ixAdmin: BOOT_ID }, '', next);
      fillBreadcrumb();
      if (global.IfluxAdminAppShellSidebar && global.IfluxAdminAppShellSidebar.syncActive) {
        global.IfluxAdminAppShellSidebar.syncActive();
      }
      try { global.dispatchEvent(new HashChangeEvent('hashchange')); } catch (e) { /* ignore */ }
      return Promise.resolve();
    }

    if (navigating) return Promise.resolve();
    navigating = true;
    pageEpoch += 1;
    var epoch = pageEpoch;
    var host = ensurePageHost();
    if (!host) {
      navigating = false;
      leaveAppShell(destU.href);
      return Promise.resolve();
    }

    var destKey = routeKeyFromHref(destU.href);
    var useCanonical = isCanonicalRoute(destKey);
    var file = fileForHref(destU.href);
    var fetchUrl;
    if (useCanonical) {
      var fragPath = fragmentHref(destU.href);
      if (!fragPath) {
        navigating = false;
        showHostError('Không có FRAGMENT_SOURCE.');
        return Promise.resolve();
      }
      fetchUrl = fragPath + destU.search;
    } else {
      fetchUrl = file
        ? ('/Admin_Design_system/app/' + file + destU.search)
        : (destU.pathname + destU.search);
    }
    return fetch(fetchUrl, { credentials: 'same-origin', redirect: 'follow' })
      .then(function (res) {
        var fetched = parseUrl(res.url);
        if (fetched && isAppBoundary(fetched)) {
          leaveAppShell(fetched.href);
          return null;
        }
        if (!res.ok) {
          showHostError('HTTP ' + res.status);
          return null;
        }
        return res.text().then(function (html) {
          return { html: html, finalU: destU };
        });
      })
      .then(function (pack) {
        if (!pack || epoch !== pageEpoch) return;
        var parsed = new DOMParser().parseFromString(pack.html, 'text/html');
        if (parsed.querySelector('.ix-auth-root, #ix-admin-login-error')) {
          leaveAppShell(pack.finalU.href);
          return;
        }
        if (useCanonical) {
          if (isShellDocument(parsed)) {
            showHostError('Fetch trả shell document — không mount.');
            return;
          }
          var pageEl = collectCanonicalPage(parsed);
          if (!pageEl) {
            showHostError('Thiếu [data-admin-page].');
            return;
          }
          syncBodyData(parsed.body);
          if (parsed.title) document.title = parsed.title;
          syncPageStyles(parsed);
          host.textContent = '';
          host.appendChild(document.importNode(pageEl, true));
        } else {
          if (!parsed.querySelector('main.ix-main')) {
            showHostError('Page không có AppShell slot.');
            return;
          }
          syncBodyData(parsed.body);
          if (parsed.title) document.title = parsed.title;
          syncPageStyles(parsed);
          host.textContent = '';
          collectPageOwned(parsed).forEach(function (el) {
            if (el.tagName === 'SCRIPT') return;
            host.appendChild(document.importNode(el, true));
          });
        }
        if (opts.history !== 'none') {
          var push = pack.finalU.pathname + pack.finalU.search + pack.finalU.hash;
          global.history.pushState({ ixAdmin: BOOT_ID }, '', push);
        }
        return runPageScripts(parsed, epoch).then(function () {
          if (epoch !== pageEpoch) return;
          afterPageIn();
        });
      })
      .catch(function () {
        if (epoch === pageEpoch) showHostError('Không tải được nội dung trang.');
      })
      .then(function () {
        navigating = false;
      });
  }

  function onDocClick(e) {
    if (e.defaultPrevented || e.button !== 0) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if (!a || a.target === '_blank' || a.hasAttribute('download')) return;
    if (a.closest('[data-ix-admin-nav]')) return;
    var href = a.getAttribute('href');
    if (!href || href.charAt(0) === '#' || href.indexOf('javascript:') === 0) return;
    var u = parseUrl(href);
    if (!isInternalAdmin(u)) return;
    e.preventDefault();
    navigate(u.href);
  }

  function onPopState() {
    navigate(global.location.pathname + global.location.search + global.location.hash, { history: 'none' });
  }

  function bootHost() {
    markBoot();
    ensureCanonicalAssets();
    ensurePageHost();
    ensureLayoutFrame();
    if (!document.documentElement.hasAttribute('data-ix-admin-nav-bound')) {
      document.documentElement.setAttribute('data-ix-admin-nav-bound', '');
      document.addEventListener('click', onDocClick);
      global.addEventListener('popstate', onPopState);
    }
    try {
      global.history.replaceState({ ixAdmin: BOOT_ID }, '', global.location.href);
    } catch (e) { /* ignore */ }
    fillBreadcrumb();
  }

  global.IfluxAdminAppShell = {
    hrefFor: hrefFor,
    activeKey: activeKey,
    isActive: isActive,
    getSidebarNav: getSidebarNav,
    getHeaderState: getHeaderState,
    fillBreadcrumb: fillBreadcrumb,
    navigate: navigate,
    canonicalAllowlist: canonicalAllowlist,
    isCanonicalRoute: isCanonicalRoute,
    fragmentHref: fragmentHref,
    routeKeyFromHref: routeKeyFromHref,
    bootId: function () { return BOOT_ID; },
    refresh: function (opts) {
      opts = opts || {};
      if (opts.sidebar !== false && global.IfluxAdminAppShellSidebar && global.IfluxAdminAppShellSidebar.render) {
        global.IfluxAdminAppShellSidebar.render({ preserveOpen: opts.preserveOpen !== false });
      }
      if (opts.header && global.IfluxAdminAppShellHeader && global.IfluxAdminAppShellHeader.render) {
        global.IfluxAdminAppShellHeader.render();
      }
      fillBreadcrumb();
    }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bootHost);
  else bootHost();
})(window);
