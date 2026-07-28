/* B2 — Personal Navigation Context domain store (ADR-AFF-007)
 * Domain Object — transitions ONLY: create · transfer · deactivate
 * CẤM mutate exported context · getContext() returns Object.freeze(clone)
 */
(function (global) {
  'use strict';

  var CONTEXT_SOURCES = {
    INCOMING_PATH: 'incoming-path',
    QR: 'qr',
    CAMPAIGN: 'campaign',
    EMAIL: 'email',
    DEEP_LINK: 'deep-link',
    SELF: 'self'
  };

  var STORAGE_KEY = 'iflux_pnc_domain_v1';
  var activeContext = null;
  var returnToCanonical = null;

  function isPublicId(id) {
    var AR = global.IfluxAffiliateResolver;
    if (AR && AR.isPublicId) return AR.isPublicId(id);
    return /^IFL[A-Z0-9]{5,17}$/.test(String(id || '').trim().toUpperCase());
  }

  function normalizeCanonical(path) {
    if (global.IfluxNormalizePath) return global.IfluxNormalizePath(path);
    return String(path || '/').split('?')[0].split('#')[0] || '/';
  }

  function clone(ctx) {
    if (!ctx) return null;
    var out = {
      ownerPublicId: ctx.ownerPublicId,
      source: ctx.source,
      state: ctx.state,
      createdAt: ctx.createdAt
    };
    if (ctx.transferred) {
      out.transferred = {
        fromPublicId: ctx.transferred.fromPublicId,
        at: ctx.transferred.at,
        reason: ctx.transferred.reason
      };
    }
    return Object.freeze(out);
  }

  function persist() {
    try {
      if (!activeContext) {
        global.sessionStorage.removeItem(STORAGE_KEY);
        return;
      }
      global.sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          context: activeContext,
          returnTo: returnToCanonical
        })
      );
    } catch (e) { /* ignore */ }
  }

  function restore() {
    try {
      var raw = global.sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      var pack = JSON.parse(raw);
      if (pack && pack.context && pack.context.ownerPublicId) {
        activeContext = pack.context;
      }
      if (pack && pack.returnTo) {
        returnToCanonical = pack.returnTo;
      }
    } catch (e2) { /* ignore */ }
  }

  function isReturnToAllowed(path) {
    path = normalizeCanonical(path);
    if (global.IfluxRoutes) {
      if (IfluxRoutes.isAuthPage && IfluxRoutes.isAuthPage(path)) return false;
      var r = IfluxRoutes.detectRoute && IfluxRoutes.detectRoute(path);
      if (r && r.zone === 'auth') return false;
    }
    if (/^\/Admin_Design_system/i.test(path)) return false;
    if (/^\/admin(\/|$)/i.test(path)) return false;
    if (/\/oauth|\/callback|\/payment|\/thanh-toan|\/logout/i.test(path)) return false;
    return true;
  }

  function createContext(opts) {
    opts = opts || {};
    var owner = String(opts.ownerPublicId || '').trim().toUpperCase();
    if (!isPublicId(owner)) return null;
    if (activeContext && activeContext.ownerPublicId === owner) {
      return clone(activeContext);
    }
    activeContext = {
      ownerPublicId: owner,
      source: opts.source || CONTEXT_SOURCES.INCOMING_PATH,
      state: opts.state === 'authenticated' ? 'authenticated' : 'guest',
      createdAt: typeof opts.createdAt === 'number' ? opts.createdAt : Date.now(),
      transferred: opts.transferred || undefined
    };
    persist();
    return clone(activeContext);
  }

  function getContext() {
    return clone(activeContext);
  }

  function transferOwnership(selfPublicId, reason) {
    var selfId = String(selfPublicId || '').trim().toUpperCase();
    if (!isPublicId(selfId) || !activeContext) return null;
    if (activeContext.ownerPublicId === selfId && activeContext.state === 'authenticated') {
      return clone(activeContext);
    }
    var from = activeContext.ownerPublicId;
    activeContext = {
      ownerPublicId: selfId,
      source: CONTEXT_SOURCES.SELF,
      state: 'authenticated',
      createdAt: activeContext.createdAt,
      transferred: {
        fromPublicId: from,
        at: Date.now(),
        reason: reason === 'register' ? 'register' : 'login'
      }
    };
    persist();
    return clone(activeContext);
  }

  function deactivateContext() {
    if (!activeContext && !returnToCanonical) return;
    activeContext = null;
    returnToCanonical = null;
    persist();
  }

  function setReturnTo(path) {
    var canonical = normalizeCanonical(path);
    if (!isReturnToAllowed(canonical)) return null;
    returnToCanonical = canonical;
    persist();
    return returnToCanonical;
  }

  function getReturnTo() {
    return returnToCanonical || null;
  }

  function consumeReturnTo() {
    var r = returnToCanonical;
    returnToCanonical = null;
    persist();
    return r;
  }

  restore();

  global.IfluxNavigationContext = {
    CONTEXT_SOURCES: CONTEXT_SOURCES,
    create: createContext,
    createContext: createContext,
    getContext: getContext,
    transfer: transferOwnership,
    transferOwnership: transferOwnership,
    deactivate: deactivateContext,
    deactivateContext: deactivateContext,
    setReturnTo: setReturnTo,
    getReturnTo: getReturnTo,
    consumeReturnTo: consumeReturnTo,
    _persist: persist,
    _restore: restore
  };
})(typeof window !== 'undefined' ? window : this);
