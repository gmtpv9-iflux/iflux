/**
 * Soft Navigation P1 — Persistent App Shell
 * Intercept allowlist primary links → teardown outlet → pushState → soft start.
 * Hard fallback: modifier-click, ngoài allowlist, lỗi soft.
 */
import { unloadWidget } from './widget-loader.js?v=cssPin20260808';

var SOFT_VER = 'softNavP1_20260811';
var HUB_CSS = '/User_Web/iflux-web-ui/hub.css?v=stickyRefactor20260811';
var COMMUNITY_CSS = '/User_Web/iflux-web-ui/news.css?v=stickyRefactor20260811';

var ALLOW_KEYS = {
  home: 1,
  market: 1,
  flow: 1,
  news: 1,
  pricing: 1,
  stock: 1,
  sector: 1,
  family: 1,
  article: 1
};

var MAIN_CLASS = {
  home: 'ifx-main--hub',
  market: 'ifx-main--market',
  flow: 'ifx-main--flow',
  news: 'ifx-main--community',
  pricing: 'ifx-main--pricing',
  stock: 'ifx-main--stock',
  sector: 'ifx-main--stock',
  family: 'ifx-main--stock',
  article: 'ifx-main--community-post'
};

var ALL_MAIN = [
  'ifx-main--hub',
  'ifx-main--market',
  'ifx-main--flow',
  'ifx-main--community',
  'ifx-main--pricing',
  'ifx-main--stock',
  'ifx-main--community-post'
];

var installed = false;
var navigating = false;
var startSoftFn = null;

function normalizePath(pathname) {
  var path = String(pathname || '/');
  if (window.IfluxNormalizePath) {
    try { path = window.IfluxNormalizePath(path); } catch (e) { /* keep */ }
  }
  path = String(path || '/').split('?')[0].split('#')[0];
  if (path.length > 1 && path.charAt(path.length - 1) === '/') {
    path = path.slice(0, -1);
  }
  return (path || '/').toLowerCase();
}

/** Soft P1 allowlist — hub + entity detail / bài viết (cùng pipeline). */
function pageKeyFromPath(pathname) {
  var path = normalizePath(pathname);
  if (/\/(cong-dong|community)\/(bai-viet|posts?|story)(\/|$)/.test(path)) return 'article';
  if (/^\/co-phieu\/[^/]+$/.test(path) || /^\/stocks\/[^/]+$/.test(path)) return 'stock';
  if (/^\/nganh\/[^/]+$/.test(path) || /^\/sectors\/[^/]+$/.test(path)) return 'sector';
  if (
    /^\/he-sinh-thai\/[^/]+$/.test(path) ||
    /^\/ho-co-phieu\/[^/]+$/.test(path) ||
    /^\/ecosystems\/[^/]+$/.test(path)
  ) {
    return 'family';
  }
  if (path === '/trang-chu' || path === '/nha-cua-toi' || path === '/home') return 'home';
  if (path === '/thi-truong' || path === '/market') return 'market';
  if (path === '/dong-tien' || path === '/flow') return 'flow';
  if (path === '/tin-tuc' || path === '/cong-dong' || path === '/community') return 'news';
  if (path === '/goi-cuoc' || path === '/pricing' || path === '/bang-gia') return 'pricing';
  return null;
}

function toAbsoluteUrl(href) {
  try {
    return new URL(href, location.href);
  } catch (e) {
    return null;
  }
}

function decorateUrl(pathnameWithQueryHash) {
  var W = window.IfluxShellUrlWriter;
  if (W && W.decorate) return W.decorate(pathnameWithQueryHash);
  return pathnameWithQueryHash;
}

function hardAssign(url) {
  try {
    location.assign(url);
  } catch (e) {
    location.href = url;
  }
}

function ensureStylesheet(href) {
  if (!href) return;
  var links = document.querySelectorAll('link[rel="stylesheet"]');
  for (var i = 0; i < links.length; i++) {
    var h = links[i].getAttribute('href') || '';
    if (h === href || h.indexOf(href.split('?')[0]) === 0) return;
  }
  var link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  document.head.appendChild(link);
}

function syncMainClass(pageKey) {
  var main = document.querySelector('main.ifx-main');
  if (!main) return;
  for (var i = 0; i < ALL_MAIN.length; i++) {
    main.classList.remove(ALL_MAIN[i]);
  }
  var cls = MAIN_CLASS[pageKey];
  if (cls) main.classList.add(cls);
}

function syncHomeGreet(pageKey) {
  var main = document.querySelector('main.ifx-main');
  var mount = document.querySelector('[data-ifx-page-runtime]');
  var greet = document.querySelector('.ifx-hub-greet-row');
  if (pageKey === 'home') {
    ensureStylesheet(HUB_CSS);
    if (!greet && main && mount) {
      greet = document.createElement('div');
      greet.className = 'ifx-hub-greet-row';
      greet.innerHTML =
        '<h1 class="ix-page-title">Xin chào, <span data-ifx-user-name>bạn</span> 👋</h1>';
      main.insertBefore(greet, mount);
    } else if (greet) {
      greet.hidden = false;
      greet.removeAttribute('hidden');
    }
  } else if (greet) {
    greet.hidden = true;
  }
  if (pageKey === 'article' || pageKey === 'news') {
    ensureStylesheet(COMMUNITY_CSS);
  }
}

function teardownOutlet() {
  var rt = window.__ifxPageRuntime;
  var widgets = (rt && rt.widgets) || [];
  for (var i = 0; i < widgets.length; i++) {
    try { unloadWidget(widgets[i]); } catch (e) { /* ignore */ }
  }
  window.__ifxPageRuntime = { pageKey: null, widgets: [] };
  var mount = document.querySelector('[data-ifx-page-runtime]');
  if (mount) {
    try { mount.innerHTML = ''; } catch (e2) { /* ignore */ }
  }
  try {
    document.dispatchEvent(new CustomEvent('iflux-page-teardown'));
  } catch (e3) { /* ignore */ }
}

function syncActiveChrome() {
  if (window.IfluxAppShellHeader && IfluxAppShellHeader.renderNav) {
    try { IfluxAppShellHeader.renderNav(); } catch (e) { /* ignore */ }
  } else if (window.IfluxAppShellHeader && IfluxAppShellHeader.render) {
    try { IfluxAppShellHeader.render(); } catch (e2) { /* ignore */ }
  }
  if (window.IfluxWebUI && IfluxWebUI.syncMobileTabbar) {
    try { IfluxWebUI.syncMobileTabbar(); } catch (e3) { /* ignore */ }
  }
}

export function canSoftNavigate(href) {
  var abs = toAbsoluteUrl(href);
  if (!abs) return false;
  if (abs.origin !== location.origin) return false;
  var key = pageKeyFromPath(abs.pathname);
  if (!key || !ALLOW_KEYS[key]) return false;
  /* Cùng trang + cùng search → không soft (tránh remount vô ích). */
  if (
    normalizePath(abs.pathname) === normalizePath(location.pathname) &&
    String(abs.search || '') === String(location.search || '')
  ) {
    return false;
  }
  return true;
}

/**
 * @returns {Promise<boolean>} true nếu soft thành công; false → caller hard-nav
 */
export async function softNavigate(href, opts) {
  opts = opts || {};
  if (!canSoftNavigate(href) && !opts.forceKey) return false;
  if (navigating) return false;
  if (typeof startSoftFn !== 'function') return false;

  var abs = toAbsoluteUrl(href);
  if (!abs) return false;
  var pageKey = opts.forceKey || pageKeyFromPath(abs.pathname);
  if (!pageKey || !ALLOW_KEYS[pageKey]) return false;

  var pathPart = abs.pathname + (abs.search || '') + (abs.hash || '');
  var finalUrl = decorateUrl(pathPart);
  if (opts.replace) {
    /* replace giữ soft */
  }

  navigating = true;
  try {
    teardownOutlet();
    syncMainClass(pageKey);
    syncHomeGreet(pageKey);

    if (opts.replace && history.replaceState) {
      history.replaceState({ ifxSoft: SOFT_VER, pageKey: pageKey }, '', finalUrl);
    } else if (history.pushState) {
      history.pushState({ ifxSoft: SOFT_VER, pageKey: pageKey }, '', finalUrl);
    } else {
      hardAssign(finalUrl);
      return true;
    }

    syncActiveChrome();

    var result = await startSoftFn({ pageKey: pageKey, soft: true });
    if (result === null || result === false) {
      hardAssign(finalUrl);
      return true;
    }
    syncActiveChrome();
    return true;
  } catch (err) {
    if (window.console && console.error) {
      console.error('[SoftNav] soft failed → hard', err);
    }
    hardAssign(finalUrl);
    return true;
  } finally {
    navigating = false;
  }
}

function onDocumentClick(e) {
  if (e.defaultPrevented) return;
  if (e.button != null && e.button !== 0) return;
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

  var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
  if (!a) return;
  if (a.target && a.target !== '' && a.target !== '_self') return;
  if (a.hasAttribute('download')) return;
  if (a.getAttribute('data-ifx-hard-nav') != null) return;

  var href = a.getAttribute('href');
  if (!href || href.charAt(0) === '#' || href.indexOf('javascript:') === 0) return;
  if (!canSoftNavigate(href)) return;

  e.preventDefault();
  softNavigate(href, { replace: false });
}

function onPopState() {
  var key = pageKeyFromPath(location.pathname);
  if (!key || !ALLOW_KEYS[key]) {
    /* Ngoài allowlist — hard reload để đúng HTML/CSS trang. */
    location.reload();
    return;
  }
  softNavigate(location.pathname + location.search + location.hash, {
    replace: true,
    forceKey: key
  });
}

export function installSoftNavigation(api) {
  if (installed) return;
  installed = true;
  startSoftFn = api && api.startSoft ? api.startSoft : null;

  window.IfluxSoftNav = {
    canSoftNavigate: canSoftNavigate,
    navigate: softNavigate,
    pageKeyFromPath: pageKeyFromPath,
    ver: SOFT_VER
  };

  document.addEventListener('click', onDocumentClick, true);
  window.addEventListener('popstate', onPopState);
}
