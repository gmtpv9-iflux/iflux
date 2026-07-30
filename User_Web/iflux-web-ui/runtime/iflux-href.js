/* B4.2 — Identity Href Resolver (ADR-AFF-007)
 * Canonical URL → public navigation href (Owner prefix via ShellUrlWriter).
 * SeoUrl / entity factories → canonical only · IfluxHref → decorated href for DOM/nav.
 */
(function (global) {
  'use strict';

  function forCanonical(canonical, opts) {
    opts = opts || {};
    var path = String(canonical == null ? '' : canonical);
    if (!path || path === '#') return path;
    if (opts.raw || opts.skipDecorate) return path;
    var W = global.IfluxShellUrlWriter;
    if (W && W.decorate) return W.decorate(path);
    return path;
  }

  function navigate(canonical, opts) {
    /* Thin alias → Writer (P6-API-01 entrypoint = IfluxShellUrlWriter.navigate) */
    opts = opts || {};
    var W = global.IfluxShellUrlWriter;
    if (W && W.navigate) {
      W.navigate(canonical, opts);
      return;
    }
    var url = forCanonical(canonical, opts);
    if (opts.replace === false) global.location.assign(url);
    else global.location.replace(url);
  }

  function followHref(href) {
    if (!href) return;
    var base = String(href);
    var hash = '';
    var hi = base.indexOf('#');
    if (hi >= 0) {
      hash = base.slice(hi);
      base = base.slice(0, hi);
    }
    var query = '';
    var qi = base.indexOf('?');
    if (qi >= 0) {
      query = base.slice(qi);
      base = base.slice(0, qi);
    }
    var canonical = global.IfluxNormalizePath
      ? global.IfluxNormalizePath(base)
      : base;
    navigate(canonical + query + hash, { replace: false });
  }

  function shouldReconcileHref(href) {
    if (!href || href.charAt(0) !== '/') return false;
    if (/^\/(?:User_Web|Admin_Design_system|admin|api|assets)\b/i.test(href)) return false;
    if (/^\/(?:dang-nhap|dang-ky|quen-mat-khau|xac-minh-otp)\b/i.test(href)) return false;
    return true;
  }

  function reconcileRoot(root) {
    if (!global.document) return 0;
    root = root || document;
    var nodes = root.querySelectorAll ? root.querySelectorAll('a[href]') : [];
    var n = 0;
    var i;
    for (i = 0; i < nodes.length; i++) {
      var a = nodes[i];
      var href = a.getAttribute('href');
      if (!shouldReconcileHref(href)) continue;
      var hash = '';
      var base = href;
      var hi = base.indexOf('#');
      if (hi >= 0) {
        hash = base.slice(hi);
        base = base.slice(0, hi);
      }
      var query = '';
      var qi = base.indexOf('?');
      if (qi >= 0) {
        query = base.slice(qi);
        base = base.slice(0, qi);
      }
      var canonical = global.IfluxNormalizePath
        ? global.IfluxNormalizePath(base)
        : base;
      var decorated = forCanonical(canonical + query + hash);
      if (decorated && decorated !== href) {
        a.setAttribute('href', decorated);
        n++;
      }
    }
    return n;
  }

  function scheduleReconcile(root) {
    reconcileRoot(root);
    if (typeof global.requestAnimationFrame === 'function') {
      global.requestAnimationFrame(function () { reconcileRoot(root); });
    }
    global.setTimeout(function () { reconcileRoot(root); }, 120);
    global.setTimeout(function () { reconcileRoot(root); }, 600);
  }

  function initReconcileHooks() {
    if (global.__IFLUX_HREF_RECONCILE_INIT__) return;
    global.__IFLUX_HREF_RECONCILE_INIT__ = true;
    global.addEventListener('iflux-shell-ready', function () {
      scheduleReconcile(document);
    });
    global.addEventListener('iflux-community-remount-widgets', function () {
      scheduleReconcile(document);
    });
    global.addEventListener('iflux-incoming-referrer', function () {
      global.setTimeout(function () { scheduleReconcile(document); }, 0);
    });
  }

  function patchRoutesAlias() {
    if (!global.IfluxRoutes || global.IfluxRoutes.href) return;
    global.IfluxRoutes.href = forCanonical;
  }

  global.IfluxHref = {
    forCanonical: forCanonical,
    href: forCanonical,
    navigate: navigate,
    followHref: followHref,
    reconcileRoot: reconcileRoot,
    scheduleReconcile: scheduleReconcile
  };

  patchRoutesAlias();
  initReconcileHooks();
  if (global.document && global.document.readyState === 'loading') {
    global.document.addEventListener('DOMContentLoaded', function () {
      patchRoutesAlias();
      scheduleReconcile(document);
    });
  } else if (global.document) {
    scheduleReconcile(document);
  }
})(typeof window !== 'undefined' ? window : this);
