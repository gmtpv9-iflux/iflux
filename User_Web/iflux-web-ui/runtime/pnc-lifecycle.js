/* B2 — PNC lifecycle gate (ADR-AFF-007)
 * Single transition gate — Domain Object mutations only via NavigationContext API
 */
(function (global) {
  'use strict';

  function pnc() {
    return global.IfluxNavigationContext;
  }

  function isLoggedIn() {
    return !!(global.IfluxAuth && IfluxAuth.isLoggedIn && IfluxAuth.isLoggedIn());
  }

  function selfPublicId(user) {
    user = user || (global.IfluxAuth && IfluxAuth.getUser && IfluxAuth.getUser());
    if (!user || !user.referral_code) return null;
    var id = String(user.referral_code).trim().toUpperCase();
    var P = pnc();
    if (P && global.IfluxAffiliateResolver && IfluxAffiliateResolver.isPublicId) {
      return IfluxAffiliateResolver.isPublicId(id) ? id : null;
    }
    return /^IFL[A-Z0-9]{5,17}$/.test(id) ? id : null;
  }

  function onIncomingReferrer(detail) {
    if (!detail || !detail.publicId) return;
    var P = pnc();
    if (!P) return;
    if (isLoggedIn()) return;
    var incoming = String(detail.publicId).trim().toUpperCase();
    var existing = P.getContext();
    if (existing) {
      if (existing.ownerPublicId === incoming) return;
      return;
    }
    P.create({
      ownerPublicId: incoming,
      source: P.CONTEXT_SOURCES.INCOMING_PATH,
      state: 'guest'
    });
  }

  function onSessionEstablished(user, opts) {
    opts = opts || {};
    var selfId = selfPublicId(user);
    if (!selfId) return;
    var P = pnc();
    if (!P) return;
    var existing = P.getContext();
    var reason = opts.reason === 'register' ? 'register' : 'login';
    if (existing) {
      if (existing.ownerPublicId === selfId && existing.state === 'authenticated') return;
      P.transfer(selfId, reason);
    } else {
      P.create({
        ownerPublicId: selfId,
        source: P.CONTEXT_SOURCES.SELF,
        state: 'authenticated'
      });
    }
  }

  function onLogout() {
    var P = pnc();
    if (!P) return;
    P.deactivate();
  }

  function saveReturnTo(path) {
    var P = pnc();
    if (!P || !P.getContext()) return null;
    var p = path;
    if (p == null && global.location) {
      p = global.location.pathname;
    }
    return P.setReturnTo(p);
  }

  function restoreSessionIfLoggedIn() {
    if (!isLoggedIn()) return;
    var user = global.IfluxAuth.getUser();
    onSessionEstablished(user, { reason: 'login' });
  }

  function onPopState() {
    var P = pnc();
    if (!P) return;
    P._restore();
    if (!isLoggedIn() && !P.getContext()) {
      return;
    }
    if (isLoggedIn()) {
      restoreSessionIfLoggedIn();
    }
  }

  function initPopstate() {
    if (global.__IFLUX_PNC_POPSTATE_INIT__) return;
    global.__IFLUX_PNC_POPSTATE_INIT__ = true;
    global.addEventListener('popstate', onPopState);
  }

  function initShellReadyBarSync() {
    if (global.__IFLUX_PNC_SHELL_READY_SYNC__) return;
    global.__IFLUX_PNC_SHELL_READY_SYNC__ = true;
    global.addEventListener('iflux-shell-ready', function () {
      if (global.IfluxShellUrlWriter && IfluxShellUrlWriter.syncBarWithOwner) {
        IfluxShellUrlWriter.syncBarWithOwner();
      }
      if (global.IfluxHref && global.IfluxRoutes && !IfluxRoutes.href) {
        IfluxRoutes.href = IfluxHref.forCanonical;
      }
    });
  }

  function init() {
    initPopstate();
    initShellReadyBarSync();
    if (global.IfluxPncShellBridge && IfluxPncShellBridge.init) {
      IfluxPncShellBridge.init();
    }
    restoreSessionIfLoggedIn();
    if (global.IfluxPncShellBridge && IfluxPncShellBridge.replayPendingIncoming) {
      IfluxPncShellBridge.replayPendingIncoming();
    }
    if (global.IfluxShellUrlWriter && IfluxShellUrlWriter.syncBarWithOwner) {
      IfluxShellUrlWriter.syncBarWithOwner();
    }
  }

  global.IfluxPncLifecycle = {
    onIncomingReferrer: onIncomingReferrer,
    onSessionEstablished: onSessionEstablished,
    onLogout: onLogout,
    saveReturnTo: saveReturnTo,
    init: init
  };

  if (global.document && document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(typeof window !== 'undefined' ? window : this);
