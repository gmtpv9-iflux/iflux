/**
 * Foundation — Share Action Store + Share URL Builder
 * Owner: Design System Foundation (Share Capability).
 *
 * Share Boundary Contract v1 (B5-WP2):
 *   - Consumer (Article / Widget / Entity / Profile / Page) cung cấp canonicalUrl
 *   - Foundation chỉ normalize + decorate affiliate identity — KHÔNG chọn destination
 *   - Foundation KHÔNG biết Article / Widget / Stock / Profile / Page
 *   - Thiếu canonicalUrl = lỗi consumer (R3) — không fallback landing
 *
 * Contract:
 *   Input:  canonicalUrl (required, sạch), title?, description?, image?, affiliate?, ref?
 *   Output: shareUrl (path decorator /{publicId}/… khi affiliate), sharePayload
 * Rules:
 *   - canonical luôn sạch; decorate chỉ ở shareUrl (pathname prefix — P3)
 *   - outgoing ref = referral_code của user đang share — KHÔNG lấy cookie/URL incoming
 *   - không mutate Article Metadata / OG
 */
(function (global) {
  'use strict';

  var STORAGE_KEY = 'iflux_insight_shares_v1';
  var PUBLIC_ORIGIN = 'https://iflux.vn';
  var PUBLIC_ID_RE = /^IFL[A-Z0-9]{5,17}$/;

  function userWebPrefix() {
    var path = (global.location && global.location.pathname) || '';
    var idx = path.indexOf('/User_Web/');
    if (idx >= 0) return path.slice(0, idx + '/User_Web/'.length);
    return '/User_Web/';
  }

  function origin() {
    var o = global.location && global.location.origin;
    if (o && o !== 'null') return o;
    return PUBLIC_ORIGIN;
  }

  /**
   * Outgoing affiliate code only — Self Public ID of logged-in sharer (P7-DQ-02).
   * CẤM: cookie / URL incoming / Active Owner / Identity Context.
   */
  function getOutgoingAffiliateRef() {
    var user = global.IfluxAuth && IfluxAuth.getUser && IfluxAuth.getUser();
    if (!user || !user.referral_code) return '';
    if (global.IfluxAuth && IfluxAuth.isLoggedIn && !IfluxAuth.isLoggedIn()) return '';
    return String(user.referral_code).trim().toUpperCase();
  }

  /** @deprecated alias — same as getOutgoingAffiliateRef (không đọc cookie) */
  function getAffiliateRef() {
    return getOutgoingAffiliateRef();
  }

  function requireLoggedInSelf(apiName) {
    var self = getOutgoingAffiliateRef();
    if (!self) {
      var err = new Error('Share Boundary: login required — Self Public ID (' + (apiName || 'share') + ')');
      err.code = 'SHARE_LOGIN_REQUIRED';
      throw err;
    }
    return self;
  }

  /** Consumer ref chỉ được phép nếu trùng Self — cấm Active Owner / URL Owner (P7-DQ-02). */
  function resolveShareRef(opts) {
    opts = opts || {};
    var self = requireLoggedInSelf(opts._apiName || 'buildShareUrl');
    var incoming = opts.ref && String(opts.ref).trim().toUpperCase();
    if (incoming && incoming !== self) {
      /* Ignore foreign ref — luôn Self */
      return self;
    }
    return self;
  }

  function affiliateRootCanonicalUrl() {
    return origin() + '/';
  }

  function requireCanonicalUrl(raw, apiName) {
    var value = String(raw || '').trim();
    if (!value) {
      throw new Error('Share Boundary: canonicalUrl required (' + (apiName || 'share') + ')');
    }
    return value;
  }

  /**
   * Normalize → absolute, strip hash, strip existing ref/r query.
   */
  function normalizeShareUrl(raw) {
    var input = String(raw || '').trim();
    if (!input) return '';
    var base = origin() || PUBLIC_ORIGIN;
    var abs;
    try {
      abs = new URL(input, base.charAt(base.length - 1) === '/' ? base : base + '/');
    } catch (e) {
      return '';
    }
    if (abs.protocol !== 'http:' && abs.protocol !== 'https:') return '';
    abs.hash = '';
    abs.searchParams.delete('ref');
    abs.searchParams.delete('r');
    var q = abs.searchParams.toString();
    var path = abs.pathname || '/';
    return abs.origin + path + (q ? '?' + q : '');
  }

  function isPublicIdSegment(seg) {
    return PUBLIC_ID_RE.test(String(seg || '').trim().toUpperCase());
  }

  /**
   * P3 — Path decorator (idempotent). Chỉ đổi pathname; giữ origin · query (trừ ref/r) · hash.
   * decorate(u) === decorate(decorate(u))
   */
  function prefixPublicIdPath(pathname, code) {
    pathname = pathname || '/';
    if (!pathname.startsWith('/')) pathname = '/' + pathname;
    var segments = pathname.split('/').filter(Boolean);
    if (segments.length > 0 && segments[0].toUpperCase() === code) {
      return pathname;
    }
    if (segments.length > 0 && isPublicIdSegment(segments[0])) {
      segments.shift();
      pathname = segments.length ? '/' + segments.join('/') : '/';
    }
    if (pathname === '/') {
      return '/' + code;
    }
    return '/' + code + pathname;
  }

  function decorateAffiliateRef(cleanUrl, refCode) {
    var code = String(refCode || '').trim().toUpperCase();
    if (!cleanUrl || !code) return cleanUrl || '';
    if (!isPublicIdSegment(code)) return cleanUrl;

    var raw = String(cleanUrl).trim();
    var hashIdx = raw.indexOf('#');
    var hash = hashIdx >= 0 ? raw.slice(hashIdx) : '';
    var withoutHash = hashIdx >= 0 ? raw.slice(0, hashIdx) : raw;
    var qIdx = withoutHash.indexOf('?');
    var searchPart = qIdx >= 0 ? withoutHash.slice(qIdx) : '';
    var pathAndRest = qIdx >= 0 ? withoutHash.slice(0, qIdx) : withoutHash;

    var params = new URLSearchParams(searchPart ? searchPart.slice(1) : '');
    params.delete('ref');
    params.delete('r');
    var q = params.toString();
    var searchStr = q ? '?' + q : '';

    var isAbsolute = /^https?:\/\//i.test(pathAndRest);
    var originPart = '';
    var pathname = pathAndRest;

    if (isAbsolute) {
      try {
        var parsed = new URL(pathAndRest);
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return cleanUrl;
        originPart = parsed.origin;
        pathname = parsed.pathname || '/';
      } catch (e) {
        return cleanUrl;
      }
    } else if (pathAndRest.charAt(0) === '/') {
      pathname = pathAndRest;
    } else {
      pathname = '/' + pathAndRest;
    }

    var prefixed = prefixPublicIdPath(pathname, code);
    if (isAbsolute) {
      return originPart + prefixed + searchStr + hash;
    }
    return prefixed + searchStr + hash;
  }

  /**
   * Share Capability — consumer truyền canonicalUrl; Foundation decorate Self (P7).
   * Guest / no Self → SHARE_LOGIN_REQUIRED (không emit Product URL như share thành công).
   */
  function buildShareUrl(opts) {
    opts = opts || {};
    var canonical = normalizeShareUrl(requireCanonicalUrl(opts.canonicalUrl, 'buildShareUrl'));
    var wantAff = opts.affiliate !== false;
    if (!wantAff) {
      return {
        shareUrl: canonical,
        sharePayload: {
          url: canonical,
          title: opts.title || '',
          text: opts.description || opts.title || '',
          description: opts.description || '',
          image: opts.image || ''
        },
        canonicalUrl: canonical,
        ref: '',
        entityType: opts.entityType || '',
        entityId: opts.entityId || ''
      };
    }
    var ref = resolveShareRef(Object.assign({}, opts, { _apiName: 'buildShareUrl' }));
    var shareUrl = decorateAffiliateRef(canonical, ref);
    return {
      shareUrl: shareUrl,
      sharePayload: {
        url: shareUrl,
        title: opts.title || '',
        text: opts.description || opts.title || '',
        description: opts.description || '',
        image: opts.image || ''
      },
      canonicalUrl: canonical,
      ref: ref || '',
      entityType: opts.entityType || '',
      entityId: opts.entityId || ''
    };
  }

  /** Affiliate root + ref — referral guidance display (consumer truyền canonical root) */
  function buildReferralHomeUrl(ref) {
    var code = ref != null && String(ref).trim() ? String(ref).trim().toUpperCase() : getOutgoingAffiliateRef();
    return buildShareUrl({
      canonicalUrl: affiliateRootCanonicalUrl(),
      affiliate: !!code,
      ref: code
    }).shareUrl;
  }

  function clearShareStorage() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) { /* ignore */ }
  }

  function createShare(payload) {
    payload = payload || {};
    clearShareStorage();
    requireCanonicalUrl(payload.canonicalUrl, 'createShare');
    var built = buildShareUrl({
      entityType: payload.entityType || '',
      entityId: payload.entityId,
      canonicalUrl: payload.canonicalUrl,
      title: payload.title,
      description: payload.subtitle || payload.description,
      image: payload.image,
      affiliate: payload.affiliate !== false,
      ref: payload.ref
    });
    return {
      ref: built.ref,
      url: built.shareUrl,
      qrUrl: built.shareUrl,
      shareUrl: built.shareUrl,
      sharePayload: built.sharePayload,
      canonicalUrl: built.canonicalUrl,
      record: {
        ref: built.ref,
        title: payload.title || 'Insight iFlux',
        created_at: new Date().toISOString()
      }
    };
  }

  function registerUrlAttribution(loc) {
    var AR = global.IfluxAffiliateResolver;
    if (!AR || typeof AR.resolve !== 'function') return;
    if (loc && loc.pathname && AR.parseAffiliatePath) {
      if (AR.parseAffiliatePath(loc.pathname)) AR.resolve();
    } else if (!loc) {
      AR.resolve();
    }
  }

  var api = {
    buildShareUrl: buildShareUrl,
    normalizeShareUrl: normalizeShareUrl,
    decorateAffiliateRef: decorateAffiliateRef,
    createShare: createShare,
    buildReferralHomeUrl: buildReferralHomeUrl,
    affiliateRootCanonicalUrl: affiliateRootCanonicalUrl,
    getAffiliateRef: getAffiliateRef,
    getOutgoingAffiliateRef: getOutgoingAffiliateRef,
    clearShareStorage: clearShareStorage,
    registerUrlAttribution: registerUrlAttribution,
    userWebPrefix: userWebPrefix
  };

  global.IfluxInsightShareStore = api;
  global.IfluxShareFoundation = api;
})(window);
