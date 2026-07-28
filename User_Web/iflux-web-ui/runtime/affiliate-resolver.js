/* P2 Affiliate Resolver — B1: parse + capture + emit event (ADR-AFF-007)
 * CẤM URL mutation · CẤM strip · Shell owns Navigation Context (B2 activate)
 */
(function (global) {
  'use strict';

  var PUBLIC_ID_RE = /^IFL[A-Z0-9]{5,17}$/;
  var REF_COOKIE = 'iflux_ref_code';
  var REF_STORAGE = 'iflux_ref_code';
  var REF_FROM_LINK_KEY = 'iflux_ref_from_link';
  var CTX_KEY = 'iflux_aff_context_v1';
  var COOKIE_DAYS = 30;
  var INITIAL_CONTEXT_EVENT = 'iflux-incoming-referrer';

  function isPublicId(seg) {
    return PUBLIC_ID_RE.test(String(seg || '').trim().toUpperCase());
  }

  function parseAffiliatePath(pathname) {
    var path = String(pathname || '/').split('?')[0].split('#')[0] || '/';
    if (path.length > 1 && path.charAt(path.length - 1) === '/') {
      path = path.slice(0, -1) || '/';
    }
    var parts = path.split('/');
    if (parts.length < 2) return null;
    var seg = String(parts[1] || '').trim().toUpperCase();
    if (!isPublicId(seg)) return null;
    var rest = parts.slice(2).join('/');
    var canonicalPath = rest ? '/' + rest : '/';
    return {
      publicId: seg,
      canonicalPath: canonicalPath,
      valid: true
    };
  }

  function storeAttribution(publicId) {
    publicId = String(publicId || '').trim().toUpperCase();
    if (!isPublicId(publicId)) return;
    var expires = new Date();
    expires.setDate(expires.getDate() + COOKIE_DAYS);
    try {
      document.cookie =
        REF_COOKIE +
        '=' +
        encodeURIComponent(publicId) +
        ';path=/;expires=' +
        expires.toUTCString() +
        ';SameSite=Lax';
    } catch (e) { /* ignore */ }
    try {
      global.localStorage.setItem(REF_STORAGE, publicId);
      global.localStorage.setItem(REF_FROM_LINK_KEY, '1');
    } catch (e2) { /* ignore */ }
  }

  function storeContextOnce(resolved) {
    if (!resolved || !resolved.publicId) return;
    var expires = new Date();
    expires.setDate(expires.getDate() + COOKIE_DAYS);
    try {
      var existing = global.localStorage.getItem(CTX_KEY);
      if (existing) {
        try {
          var prev = JSON.parse(existing);
          if (prev && (prev.referrerPublicId || prev.referral_code)) return;
        } catch (e) { /* rewrite */ }
      }
      var nowIso = new Date().toISOString();
      global.localStorage.setItem(
        CTX_KEY,
        JSON.stringify({
          referrerPublicId: resolved.publicId,
          referral_code: resolved.publicId,
          landingPath: resolved.canonicalPath,
          firstSeenAt: nowIso,
          captured_at: nowIso,
          expires_at: expires.toISOString()
        })
      );
    } catch (e2) { /* ignore */ }
  }

  function readCookieCode() {
    try {
      var match = document.cookie.match(new RegExp('(?:^|; )' + REF_COOKIE + '=([^;]*)'));
      return match ? decodeURIComponent(match[1]).trim().toUpperCase() : '';
    } catch (e) {
      return '';
    }
  }

  function readStorageCode() {
    try {
      var ls = global.localStorage.getItem(REF_STORAGE);
      return ls ? String(ls).trim().toUpperCase() : '';
    } catch (e) {
      return '';
    }
  }

  /** Sole owner read — null if expired or invalid (OD-AFF-02). */
  function readActive() {
    if (typeof document === 'undefined') return null;
    try {
      var raw = global.localStorage.getItem(CTX_KEY);
      if (raw) {
        var ctx = JSON.parse(raw);
        if (ctx && ctx.expires_at && new Date(ctx.expires_at).getTime() < Date.now()) {
          clearContext();
          return null;
        }
        var code = String(ctx.referral_code || ctx.referrerPublicId || '').trim().toUpperCase();
        if (isPublicId(code)) return ctx;
      }
    } catch (e) { /* fall through */ }
    var fallback = readCookieCode() || readStorageCode();
    if (!isPublicId(fallback)) return null;
    return { referral_code: fallback, referrerPublicId: fallback };
  }

  function getCodeForIdentityCreation() {
    var ctx = readActive();
    if (!ctx) return '';
    return String(ctx.referral_code || ctx.referrerPublicId || '').trim().toUpperCase();
  }

  function clearContext() {
    try {
      global.localStorage.removeItem(REF_STORAGE);
      global.localStorage.removeItem(REF_FROM_LINK_KEY);
      global.localStorage.removeItem(CTX_KEY);
    } catch (e) { /* ignore */ }
    try {
      document.cookie = REF_COOKIE + '=;path=/;expires=Thu, 01 Jan 1970 00:00:00 GMT';
    } catch (e2) { /* ignore */ }
  }

  function emitInitialContextEvent(resolved) {
    if (!resolved || !resolved.publicId) return;
    var detail = {
      type: INITIAL_CONTEXT_EVENT,
      publicId: resolved.publicId,
      canonicalPath: resolved.canonicalPath
    };
    global.__IFLUX_INITIAL_CONTEXT_EVENT__ = detail;
    try {
      global.dispatchEvent(new CustomEvent(INITIAL_CONTEXT_EVENT, { detail: detail }));
    } catch (e) { /* ignore */ }
  }

  function resolve() {
    if (typeof document === 'undefined' || !global.location) {
      return { affiliate: { valid: false }, canonicalPath: null };
    }
    var resolved = parseAffiliatePath(global.location.pathname);
    if (!resolved) {
      return { affiliate: { valid: false }, canonicalPath: null };
    }

    storeAttribution(resolved.publicId);
    storeContextOnce(resolved);
    emitInitialContextEvent(resolved);

    var out = {
      affiliate: { publicId: resolved.publicId, valid: true },
      canonicalPath: resolved.canonicalPath,
      attribution: {
        referrerPublicId: resolved.publicId,
        landingPath: resolved.canonicalPath
      }
    };
    global.__IFLUX_AFFILIATE_RESOLVE__ = out;
    return out;
  }

  var result = resolve();

  global.IfluxAffiliateResolver = {
    PUBLIC_ID_RE: PUBLIC_ID_RE,
    INITIAL_CONTEXT_EVENT: INITIAL_CONTEXT_EVENT,
    isPublicId: isPublicId,
    parseAffiliatePath: parseAffiliatePath,
    resolve: resolve,
    readActive: readActive,
    getCodeForIdentityCreation: getCodeForIdentityCreation,
    clearContext: clearContext,
    lastResult: result
  };
})(typeof window !== 'undefined' ? window : this);
