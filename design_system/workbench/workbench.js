/**
 * Design System Workbench — persistent AppShell router.
 * Sidebar stays mounted. Main host swaps Sandbox vs Patterns modules.
 */
(function () {
  'use strict';

  var SANDBOX_SECTIONS = ['tokens', 'foundation', 'primitives', 'components', 'patterns', 'references', 'visual', 'contract'];
  var PATTERNS = {
    auth: 'Auth',
    charts: 'Charts',
    chat: 'Chat',
    'form-add': 'Form Add',
    'order-detail': 'Order Detail',
    'order-list': 'Order List',
    referrals: 'Referrals',
    'table-list': 'Table List',
    'user-profile': 'User Profile',
    wizard: 'Wizard'
  };
  var SECTION_LABEL = {
    tokens: 'Tokens',
    foundation: 'Foundation',
    primitives: 'Primitives',
    components: 'Components',
    patterns: 'Compose',
    references: 'Wave notes',
    visual: 'Visual Test',
    contract: 'Contract'
  };
  var MQ_DESKTOP = window.matchMedia('(min-width: 1024px)');
  var STORAGE_COLLAPSED = 'ifx-wb-sidebar-collapsed';

  var doc = document;
  var shell = doc.getElementById('ifxAppshell');
  var sidebar = doc.getElementById('ifxAppshellSidebar');
  var nav = doc.getElementById('ifxAppshellNav');
  var host = doc.getElementById('ifxAppshellHost');
  var overlay = doc.getElementById('ifxAppshellOverlay');
  var titleEl = doc.getElementById('ifxAppshellTitle');
  var themeBtn = doc.getElementById('ifxAppshellTheme');
  var menuBtn = doc.getElementById('ifxAppshellMenu');
  var patternFrame = null;

  function params() {
    return new URLSearchParams(window.location.search);
  }

  function readRoute() {
    var q = params();
    var module = q.get('module');
    var section = q.get('section');
    var pattern = q.get('pattern') || '';
    if (!module) {
      if (pattern) module = 'patterns';
      else module = 'sandbox';
    }
    if (module !== 'sandbox' && module !== 'patterns') module = 'sandbox';
    if (SANDBOX_SECTIONS.indexOf(section) === -1) section = 'foundation';
    if (pattern && !PATTERNS[pattern]) pattern = '';
    return {
      module: module,
      section: section,
      panel: q.get('panel') || '',
      pattern: pattern
    };
  }

  function routeUrl(route) {
    var p = new URLSearchParams();
    p.set('module', route.module);
    if (route.module === 'sandbox') {
      p.set('section', route.section);
      if (route.panel) p.set('panel', route.panel);
    } else if (route.pattern) {
      p.set('pattern', route.pattern);
    }
    return '?' + p.toString();
  }

  function isDesktop() {
    return MQ_DESKTOP.matches;
  }

  function setCollapsed(on) {
    shell.classList.toggle('is-sidebar-collapsed', !!on);
  }

  function closeMobile() {
    shell.classList.remove('is-sidebar-open');
    overlay.classList.remove('is-visible');
    overlay.hidden = true;
  }

  function openMobile() {
    shell.classList.add('is-sidebar-open');
    overlay.hidden = false;
    overlay.classList.add('is-visible');
  }

  function syncCollapsedPref() {
    if (!isDesktop()) {
      setCollapsed(false);
      closeMobile();
      return;
    }
    closeMobile();
    setCollapsed(localStorage.getItem(STORAGE_COLLAPSED) === '1');
  }

  function titleFor(route) {
    if (route.module === 'patterns') {
      return route.pattern ? ('Patterns · ' + PATTERNS[route.pattern]) : 'Patterns · Catalog';
    }
    var label = SECTION_LABEL[route.section] || route.section;
    return route.panel ? ('Sandbox · ' + label + ' · ' + route.panel) : ('Sandbox · ' + label);
  }

  function syncNav(route) {
    nav.querySelectorAll('[data-wb-module]').forEach(function (a) {
      var sameModule = a.getAttribute('data-wb-module') === route.module;
      var active;
      if (route.module === 'sandbox') {
        active = sameModule && a.getAttribute('data-wb-section') === route.section;
      } else {
        active = sameModule && (a.getAttribute('data-wb-pattern') || '') === route.pattern;
      }
      a.classList.toggle('is-active', active);
    });
    titleEl.textContent = titleFor(route);
  }

  function ensureSandboxStage() {
    host.classList.remove('is-pattern');
    var stage = host.querySelector('#sbStage');
    if (!stage) {
      host.textContent = '';
      stage = doc.createElement('div');
      stage.id = 'sbStage';
      stage.className = 'sb-stage ifx-stack-lg';
      host.appendChild(stage);
    }
    if (window.IfxSandbox) window.IfxSandbox.bindStage(stage);
    return stage;
  }

  function postThemeToFrame() {
    if (!patternFrame || !patternFrame.contentWindow || !window.IfxTheme) return;
    patternFrame.contentWindow.postMessage({ type: 'ifx-theme', theme: window.IfxTheme.get() }, '*');
  }

  function mountPattern(id) {
    host.classList.add('is-pattern');
    host.textContent = '';
    if (!id) {
      host.classList.remove('is-pattern');
      return fetch('patterns-catalog.html')
        .then(function (r) { return r.text(); })
        .then(function (html) {
          host.innerHTML = html;
          host.className = 'ifx-appshell-host';
        });
    }
    patternFrame = doc.createElement('iframe');
    patternFrame.className = 'ifx-appshell-frame';
    patternFrame.title = PATTERNS[id] || id;
    patternFrame.src = '../references/patterns/' + id + '/';
    patternFrame.addEventListener('load', postThemeToFrame);
    host.appendChild(patternFrame);
    return Promise.resolve();
  }

  function applyRoute(route, push) {
    var url = routeUrl(route);
    if (push === true) window.history.pushState(route, '', url);
    else window.history.replaceState(route, '', url);
    syncNav(route);
    if (!isDesktop()) closeMobile();

    if (route.module === 'patterns') {
      return mountPattern(route.pattern);
    }
    patternFrame = null;
    ensureSandboxStage();
    if (!window.IfxSandbox) return Promise.reject(new Error('IfxSandbox missing'));
    return window.IfxSandbox.render(route.section, route.panel);
  }

  function routeFromHref(href) {
    var url = new URL(href, location.href);
    var q = url.searchParams;
    var module = q.get('module') || (q.get('pattern') ? 'patterns' : 'sandbox');
    var section = q.get('section');
    var pattern = q.get('pattern') || '';
    if (module !== 'sandbox' && module !== 'patterns') module = 'sandbox';
    if (SANDBOX_SECTIONS.indexOf(section) === -1) section = 'foundation';
    if (pattern && !PATTERNS[pattern]) pattern = '';
    return {
      module: module,
      section: section,
      panel: q.get('panel') || '',
      pattern: pattern
    };
  }

  function followLink(a, push) {
    var href = a.getAttribute('href');
    if (!href) return;
    applyRoute(routeFromHref(a.href), push !== false).catch(function () {
      window.location.assign(a.href);
    });
  }

  function navigate(partial, push) {
    var cur = readRoute();
    var next = {
      module: partial.module || cur.module,
      section: cur.section,
      panel: '',
      pattern: ''
    };
    if (next.module === 'sandbox') {
      next.section = partial.section || cur.section;
      next.panel = partial.panel != null ? partial.panel : '';
    } else {
      next.pattern = partial.pattern || '';
    }
    return applyRoute(next, push !== false);
  }

  nav.addEventListener('click', function (e) {
    var a = e.target.closest('a[href]');
    if (!a || !nav.contains(a)) return;
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    followLink(a, true);
  });

  host.addEventListener('click', function (e) {
    var a = e.target.closest('a[href]');
    if (!a || !host.contains(a)) return;
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var url = new URL(a.href, location.href);
    if (url.pathname.indexOf('/design_system/workbench') === -1) return;
    e.preventDefault();
    followLink(a, true);
  });

  window.addEventListener('popstate', function () {
    applyRoute(readRoute(), false);
  });

  window.addEventListener('ifx-sandbox-panel', function (e) {
    var next = {
      module: 'sandbox',
      section: readRoute().section,
      panel: e.detail.panel || '',
      pattern: ''
    };
    window.history.pushState(next, '', routeUrl(next));
    syncNav(next);
  });

  menuBtn.addEventListener('click', function () {
    if (isDesktop()) {
      var next = !shell.classList.contains('is-sidebar-collapsed');
      setCollapsed(next);
      localStorage.setItem(STORAGE_COLLAPSED, next ? '1' : '0');
      return;
    }
    shell.classList.contains('is-sidebar-open') ? closeMobile() : openMobile();
  });
  overlay.addEventListener('click', closeMobile);
  MQ_DESKTOP.addEventListener('change', syncCollapsedPref);

  function syncTheme(theme) {
    themeBtn.textContent = 'Theme: ' + (theme === 'light' ? 'Light' : 'Dark');
    postThemeToFrame();
    if (window.IfxSandbox) window.IfxSandbox.onTheme(theme);
  }
  themeBtn.addEventListener('click', function () { window.IfxTheme.toggle(); });
  window.addEventListener('ifx-theme-change', function (e) { syncTheme(e.detail.theme); });
  syncTheme(window.IfxTheme.get());

  window.IfxWorkbench = { navigate: navigate, readRoute: readRoute };
  syncCollapsedPref();
  applyRoute(readRoute(), false).catch(function (err) {
    console.error(err);
  });
})();
