'use strict';

/**
 * Deterministic SEO conflict resolution (D-SEO-11 / Solution §10).
 * Precedence: HTTP → Index Universe → Canonical → Robots → Sitemap → OG → SD
 */

function applyConflictResolution(draft) {
  draft = draft || {};
  var health = Array.isArray(draft.health) ? draft.health.slice() : [];
  var http = draft.http || {};
  var index = draft.indexability || {};
  var identity = draft.identity || {};
  var social = draft.social || {};
  var structuredData = draft.structuredData || {};

  function err(code, message) {
    health.push({ level: 'ERROR', code: code, message: message });
  }

  // A. Terminal HTTP
  if (http.httpClass === 'not_found_gone' || http.httpClass === 'non_indexable_non_success' ||
      http.httpClass === 'transient_server_failure') {
    index.indexUniverse = false;
    index.sitemapEligible = false;
    index.robots = http.robotsDefault || 'noindex,nofollow';
    identity.canonicalUrl = null;
    identity.allowSelfCanonical = false;
    if (social.og) social.og.url = null;
    if (index.indexableClaim) err('HTTP_INDEX_CONFLICT', 'Non-success HTTP cannot be indexable');
  }

  // B. Redirect
  if (http.httpClass === 'redirect') {
    index.indexUniverse = false;
    index.sitemapEligible = false;
    identity.seoIdentityUrl = identity.redirectTarget || identity.seoIdentityUrl;
    identity.canonicalUrl = identity.redirectTarget || null;
    identity.allowSelfCanonical = false;
    if (social.og) social.og.url = identity.redirectTarget || null;
  }

  // C. Index Universe — outside universe: noindex + no sitemap; canonical still points to Clean identity
  if (index.indexUniverse === false) {
    index.sitemapEligible = false;
    if (!index.robots || String(index.robots).indexOf('noindex') < 0) {
      index.robots = 'noindex,nofollow';
    }
    if (!identity.canonicalUrl) {
      identity.canonicalUrl = identity.seoIdentityUrl || identity.cleanPublicUrl || null;
    }
    identity.allowSelfCanonical = false;
  }

  // D. Canonical must match SEO identity when present
  if (identity.canonicalUrl && identity.seoIdentityUrl && identity.canonicalUrl !== identity.seoIdentityUrl) {
    err('CANONICAL_IDENTITY_MISMATCH', 'Canonical must equal SEO identity URL');
    identity.canonicalUrl = identity.seoIdentityUrl;
  }

  // E. OG / SD inherit Clean SEO identity (never independent decorated identity)
  var idUrl = identity.seoIdentityUrl || identity.cleanPublicUrl || identity.canonicalUrl || null;
  if (idUrl && http.httpClass === 'indexable_success') {
    if (social.og) social.og.url = idUrl;
    if (structuredData && typeof structuredData === 'object') {
      structuredData.url = idUrl;
    }
  } else if (http.httpClass !== 'indexable_success') {
    if (social.og) social.og.url = null;
  }

  // Sitemap vs robots
  if (index.sitemapEligible && index.robots && String(index.robots).indexOf('noindex') >= 0) {
    err('SITEMAP_NOINDEX_CONFLICT', 'noindex cannot be sitemap eligible');
    index.sitemapEligible = false;
  }

  // Decorated + independent identity (SEO identity still carries publicId)
  if (draft.urlVariant === 'DECORATED') {
    var seoId = String(identity.seoIdentityUrl || '');
    var req = String(identity.requestedUrl || '');
    if (/\/IFL[A-Za-z0-9]{5,17}/i.test(seoId) || (req && seoId && req === seoId && /\/IFL[A-Za-z0-9]{5,17}/i.test(req))) {
      err('DECORATED_INDEPENDENT_IDENTITY', 'Decorated URL must not be SEO identity');
      identity.seoIdentityUrl = identity.cleanPublicUrl || identity.seoIdentityUrl;
      identity.canonicalUrl = identity.seoIdentityUrl;
    }
  }

  return {
    http: http,
    identity: identity,
    indexability: index,
    social: social,
    structuredData: structuredData,
    health: health,
    coherent: health.every(function (h) { return h.level !== 'ERROR'; })
  };
}

module.exports = {
  applyConflictResolution
};
