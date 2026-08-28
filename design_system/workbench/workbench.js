/**
 * Shared Workbench — viewer for two peer areas: Design System and Patterns.
 */
(function () {
  'use strict';

  var SANDBOX_SECTIONS = ['tokens', 'foundation', 'primitives', 'components', 'widgets', 'visual', 'contract'];
  var RETIRED_SECTIONS = ['patterns', 'references'];
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
  var AUTH_STATES = {
    login: 'login.html',
    register: 'register.html',
    forgot: 'forgot.html',
    'verify-2fa': 'verify-2fa.html'
  };
  var AUTH_STATE_LABEL = {
    login: 'Login',
    register: 'Register',
    forgot: 'Forgot Password',
    'verify-2fa': 'Verify 2FA'
  };
  var SECTION_LABEL = {
    tokens: 'Tokens',
    foundation: 'Foundation',
    primitives: 'Primitives',
    components: 'Components',
    widgets: 'Widgets',
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
  var authStatesEl = doc.getElementById('ifxAppshellAuthStates');
  var patternFrame = null;

  function params() {
    return new URLSearchParams(window.location.search);
  }

  function normalizeArea(q) {
    var area = q.get('area');
    if (!area) {
      var module = q.get('module');
      if (module === 'patterns' || q.get('pattern')) area = 'patterns';
      else area = 'design-system';
    }
    if (area === 'sandbox' || area === 'ds') area = 'design-system';
    if (area !== 'design-system' && area !== 'patterns') area = 'design-system';
    return area;
  }

  function readRoute() {
    var q = params();
    var area = normalizeArea(q);
    var section = q.get('section');
    var pattern = q.get('pattern') || '';
    if (RETIRED_SECTIONS.indexOf(section) !== -1) section = 'components';
    if (SANDBOX_SECTIONS.indexOf(section) === -1) section = 'foundation';
    if (pattern && !PATTERNS[pattern]) pattern = '';
    if (area === 'patterns' && !pattern) pattern = 'auth';
    var state = q.get('state') || '';
    if (pattern === 'auth') {
      if (!AUTH_STATES[state]) state = 'login';
    } else {
      state = '';
    }
    return {
      area: area,
      module: area === 'patterns' ? 'patterns' : 'sandbox',
      section: section,
      panel: q.get('panel') || '',
      pattern: pattern,
      state: state
    };
  }

  function routeUrl(route) {
    var p = new URLSearchParams();
    p.set('area', route.area);
    if (route.area === 'design-system') {
      p.set('section', route.section);
      if (route.panel) p.set('panel', route.panel);
    } else if (route.pattern) {
      p.set('pattern', route.pattern);
      if (route.pattern === 'auth' && route.state) p.set('state', route.state);
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
    if (route.area === 'patterns') {
      var name = PATTERNS[route.pattern] || PATTERNS.auth;
      if (route.pattern === 'auth' && route.state) {
        return 'Patterns · ' + name + ' · ' + (AUTH_STATE_LABEL[route.state] || route.state);
      }
      return 'Patterns · ' + name;
    }
    var label = SECTION_LABEL[route.section] || route.section;
    return route.panel ? ('Design System · ' + label + ' · ' + route.panel) : ('Design System · ' + label);
  }

  function syncNav(route) {
    nav.querySelectorAll('[data-wb-area]').forEach(function (a) {
      var sameArea = a.getAttribute('data-wb-area') === route.area;
      var active;
      if (route.area === 'design-system') {
        active = sameArea && a.getAttribute('data-wb-section') === route.section;
      } else {
        active = sameArea && (a.getAttribute('data-wb-pattern') || '') === route.pattern;
      }
      a.classList.toggle('is-active', active);
    });
    titleEl.textContent = titleFor(route);
    var showAuth = route.area === 'patterns' && route.pattern === 'auth';
    if (authStatesEl) {
      authStatesEl.hidden = !showAuth;
      authStatesEl.classList.toggle('is-visible', showAuth);
      authStatesEl.querySelectorAll('[data-wb-auth-state]').forEach(function (a) {
        a.classList.toggle('is-active', a.getAttribute('data-wb-auth-state') === route.state);
      });
    }
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

  function mountPattern(id, state) {
    host.classList.add('is-pattern');
    host.textContent = '';
    if (!id) id = 'auth';
    var file = '';
    if (id === 'auth') file = AUTH_STATES[state] || AUTH_STATES.login;
    patternFrame = doc.createElement('iframe');
    patternFrame.className = 'ifx-appshell-frame';
    patternFrame.title = PATTERNS[id] || id;
    patternFrame.src = '/patterns/' + id + '/' + file;
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

    if (route.area === 'patterns') {
      return mountPattern(route.pattern, route.state);
    }
    patternFrame = null;
    ensureSandboxStage();
    if (!window.IfxSandbox) return Promise.reject(new Error('IfxSandbox missing'));
    return window.IfxSandbox.render(route.section, route.panel);
  }

  function routeFromHref(href) {
    var url = new URL(href, location.href);
    var q = url.searchParams;
    var area = normalizeArea(q);
    var section = q.get('section');
    var pattern = q.get('pattern') || '';
    if (RETIRED_SECTIONS.indexOf(section) !== -1) section = 'components';
    if (SANDBOX_SECTIONS.indexOf(section) === -1) section = 'foundation';
    if (pattern && !PATTERNS[pattern]) pattern = '';
    if (area === 'patterns' && !pattern) pattern = 'auth';
    var state = q.get('state') || '';
    if (pattern === 'auth') {
      if (!AUTH_STATES[state]) state = 'login';
    } else {
      state = '';
    }
    return {
      area: area,
      module: area === 'patterns' ? 'patterns' : 'sandbox',
      section: section,
      panel: q.get('panel') || '',
      pattern: pattern,
      state: state
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
    var area = partial.area || (partial.module === 'patterns' ? 'patterns' : (partial.module === 'sandbox' ? 'design-system' : cur.area));
    var next = {
      area: area,
      module: area === 'patterns' ? 'patterns' : 'sandbox',
      section: cur.section,
      panel: '',
      pattern: ''
    };
    if (next.area === 'design-system') {
      next.section = partial.section || cur.section;
      next.panel = partial.panel != null ? partial.panel : '';
    } else {
      next.pattern = partial.pattern || '';
      next.state = next.pattern === 'auth' ? (partial.state || cur.state || 'login') : '';
    }
    return applyRoute(next, push !== false);
  }

  if (authStatesEl) {
    authStatesEl.addEventListener('click', function (e) {
      var a = e.target.closest('a[href]');
      if (!a || !authStatesEl.contains(a)) return;
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      followLink(a, true);
    });
  }

  window.addEventListener('message', function (e) {
    if (!e.data || e.data.type !== 'ifx-auth-state') return;
    var cur = readRoute();
    if (cur.area !== 'patterns' || cur.pattern !== 'auth') return;
    if (cur.state === e.data.state) return;
    if (!AUTH_STATES[e.data.state]) return;
    var next = {
      area: cur.area,
      module: cur.module,
      section: cur.section,
      panel: cur.panel,
      pattern: cur.pattern,
      state: e.data.state
    };
    window.history.replaceState(next, '', routeUrl(next));
    syncNav(next);
  });

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
      area: 'design-system',
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
