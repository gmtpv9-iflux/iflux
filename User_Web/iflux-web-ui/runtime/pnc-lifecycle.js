/* Platform Identity Lifecycle gate (runtime)
 * Phase 4 — Candidate ≠ Active Owner; BD-06 Guest replace; BD-08 Self precedence
 * Transitions ONLY via this module → NavigationContext projection APIs
 * Event sources: Path Capture → onIncomingReferrer; Auth → onSessionEstablished / onLogout
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

  function syncBar() {
    if (global.IfluxShellUrlWriter && IfluxShellUrlWriter.syncBarWithOwner) {
      IfluxShellUrlWriter.syncBarWithOwner();
    }
  }

  /**
   * BD-06 — Guest Active Owner replace (last-wins).
   * Caller: onIncomingReferrer after Path Capture candidate only.
   * Does not apply when logged in (BD-08) or when projection is authenticated Self.
   */
  function replaceGuestOwner(candidatePublicId, opts) {
    opts = opts || {};
    if (isLoggedIn()) return null;
    var P = pnc();
    if (!P || !P.replaceProjection) return null;
    var incoming = String(candidatePublicId || '').trim().toUpperCase();
    var existing = P.getContext();
    if (!existing || existing.state === 'authenticated') return null;
    if (existing.ownerPublicId === incoming) return existing;
    var next = P.replaceProjection({
      ownerPublicId: incoming,
      source: (P.CONTEXT_SOURCES && P.CONTEXT_SOURCES.INCOMING_PATH) || 'incoming-path',
      reason: opts.reason || 'enter_owner_url'
    });
    if (next) syncBar();
    return next;
  }

  /** Path Capture candidate → Lifecycle decision (Candidate ≠ Active Owner). */
  function onIncomingReferrer(detail) {
    if (!detail || !detail.publicId) return;
    var P = pnc();
    if (!P) return;
    /* BD-08 — Authenticated Self precedence: keep Self, ignore Owner URL candidate */
    if (isLoggedIn()) return;
    var incoming = String(detail.publicId).trim().toUpperCase();
    var existing = P.getContext();
    if (existing) {
      if (existing.ownerPublicId === incoming) return;
      /* BD-06 — Guest last-wins replace */
      replaceGuestOwner(incoming, { reason: 'enter_owner_url' });
      return;
    }
    P.create({
      ownerPublicId: incoming,
      source: P.CONTEXT_SOURCES.INCOMING_PATH,
      state: 'guest'
    });
    syncBar();
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
    syncBar();
  }

  function onLogout() {
    var P = pnc();
    if (!P) return;
    P.deactivate();
    syncBar();
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

  function applyCandidateFromLocation() {
    if (typeof global.location === 'undefined') return false;
    var AR = global.IfluxAffiliateResolver;
    if (!AR || !AR.parseAffiliatePath) return false;
    var parsed = AR.parseAffiliatePath(global.location.pathname);
    if (!parsed || !parsed.publicId) return false;
    onIncomingReferrer({
      publicId: parsed.publicId,
      canonicalPath: parsed.canonicalPath
    });
    return true;
  }

  function onPopState() {
    var P = pnc();
    if (!P) return;
    if (isLoggedIn()) {
      P._restore();
      restoreSessionIfLoggedIn();
      syncBar();
      return;
    }
    /* Guest: history Back/Forward — Candidate từ Owner URL hiện tại (≠ chỉ session restore) */
    if (applyCandidateFromLocation()) {
      syncBar();
      return;
    }
    P._restore();
    syncBar();
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
      syncBar();
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
    syncBar();
  }

  global.IfluxPncLifecycle = {
    onIncomingReferrer: onIncomingReferrer,
    onSessionEstablished: onSessionEstablished,
    onLogout: onLogout,
    replaceGuestOwner: replaceGuestOwner,
    saveReturnTo: saveReturnTo,
    init: init
  };

  if (global.document && document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(typeof window !== 'undefined' ? window : this);
