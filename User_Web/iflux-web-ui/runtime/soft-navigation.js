/**
 * Điều hướng mềm — App Shell (header, bottom menu, CSS/JS global) giữ nguyên, chỉ thay nội dung trang.
 * Mọi trang dựng bằng runtime (page-keys.js); trang HTML tĩnh / modifier-click / lỗi → tải đầy đủ.
 * Class <main> và CSS riêng của trang do manifest trang khai báo (page-runtime áp dụng).
 */
import { unloadWidget } from './widget-loader.js?v=r20260928n';
import { pageKeyFromPath, isSoftPage, AUTH_PAGES } from './page-keys.js?v=r20260928p';

var SOFT_VER = 'softAll_20260928';

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

function syncHomeGreet(pageKey) {
  var main = document.querySelector('main.ifx-main');
  var mount = document.querySelector('[data-ifx-page-runtime]');
  var greet = document.querySelector('.ifx-hub-greet-row');
  if (pageKey === 'home') {
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
  if (!isSoftPage(key)) return false;
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
  if (!isSoftPage(pageKey)) return false;

  var pathPart = abs.pathname + (abs.search || '') + (abs.hash || '');
  var finalUrl = decorateUrl(pathPart);
  if (opts.replace) {
    /* replace giữ soft */
  }

  navigating = true;
  try {
    teardownOutlet();
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

function guestNeedsLogin(href) {
  if (!window.IfluxAuth || !IfluxAuth.promptLogin || IfluxAuth.isLoggedIn()) return false;
  var url;
  try { url = new URL(toAbsoluteUrl(href)); } catch (e) { return false; }
  if (url.origin !== location.origin) return false;
  return !!AUTH_PAGES[pageKeyFromPath(url.pathname)];
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
  if (guestNeedsLogin(href)) {
    /* Khách bấm vào nội dung cần đăng nhập → hỏi trước, ở lại trang nếu chọn «Để sau». */
    e.preventDefault();
    var u = new URL(toAbsoluteUrl(href));
    window.IfluxAuth.promptLogin(u.pathname + u.search);
    return;
  }
  if (!canSoftNavigate(href)) return;

  e.preventDefault();
  softNavigate(href, { replace: false });
}

function onPopState() {
  var key = pageKeyFromPath(location.pathname);
  if (!isSoftPage(key)) {
    /* Trang HTML tĩnh — tải lại để đúng HTML của trang. */
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
