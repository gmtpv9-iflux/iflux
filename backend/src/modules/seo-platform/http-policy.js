'use strict';

/**
 * SEO Platform — HTTP status classes (Plan P1.1 / Solution §9.6).
 * Does NOT own Foundation config. Operationalizes Contract HTTP policy only.
 */

var CLASS = {
  INDEXABLE_SUCCESS: 'indexable_success',
  REDIRECT: 'redirect',
  NOT_FOUND_GONE: 'not_found_gone',
  NON_INDEXABLE_NON_SUCCESS: 'non_indexable_non_success',
  TRANSIENT_SERVER_FAILURE: 'transient_server_failure'
};

function classifyHttpStatus(status, opts) {
  opts = opts || {};
  var code = Number(status);
  if (!Number.isFinite(code) || code < 100) {
    return CLASS.TRANSIENT_SERVER_FAILURE;
  }
  if (code === 200) {
    return opts.forceNonIndex ? CLASS.NON_INDEXABLE_NON_SUCCESS : CLASS.INDEXABLE_SUCCESS;
  }
  if (code === 301 || code === 302) return CLASS.REDIRECT;
  if (code === 404 || code === 410) return CLASS.NOT_FOUND_GONE;
  if (code === 429 || code >= 500) return CLASS.TRANSIENT_SERVER_FAILURE;
  if (code >= 400) return CLASS.NON_INDEXABLE_NON_SUCCESS;
  if (code >= 300 && code < 400) return CLASS.REDIRECT;
  return CLASS.NON_INDEXABLE_NON_SUCCESS;
}

/**
 * Deterministic Contract implications for an HTTP class.
 */
function httpClassPolicy(httpClass) {
  switch (httpClass) {
    case CLASS.INDEXABLE_SUCCESS:
      return {
        httpClass: httpClass,
        mayBeIndexable: true,
        sitemapEligibleDefault: true,
        allowSelfCanonical: true,
        emitRichMetadata: true,
        emitOgSdAsIdentity: true,
        robotsDefault: 'index,follow',
        cacheAsIndexableSuccess: true,
        healthIfIndexableClaim: null
      };
    case CLASS.REDIRECT:
      return {
        httpClass: httpClass,
        mayBeIndexable: false,
        sitemapEligibleDefault: false,
        allowSelfCanonical: false,
        emitRichMetadata: false,
        emitOgSdAsIdentity: false,
        robotsDefault: 'noindex,follow',
        cacheAsIndexableSuccess: false,
        healthIfIndexableClaim: 'ERROR'
      };
    case CLASS.NOT_FOUND_GONE:
      return {
        httpClass: httpClass,
        mayBeIndexable: false,
        sitemapEligibleDefault: false,
        allowSelfCanonical: false,
        emitRichMetadata: false,
        emitOgSdAsIdentity: false,
        robotsDefault: 'noindex,nofollow',
        cacheAsIndexableSuccess: false,
        healthIfIndexableClaim: 'ERROR'
      };
    case CLASS.NON_INDEXABLE_NON_SUCCESS:
      return {
        httpClass: httpClass,
        mayBeIndexable: false,
        sitemapEligibleDefault: false,
        allowSelfCanonical: false,
        emitRichMetadata: false,
        emitOgSdAsIdentity: false,
        robotsDefault: 'noindex,nofollow',
        cacheAsIndexableSuccess: false,
        healthIfIndexableClaim: 'ERROR'
      };
    case CLASS.TRANSIENT_SERVER_FAILURE:
    default:
      return {
        httpClass: CLASS.TRANSIENT_SERVER_FAILURE,
        mayBeIndexable: false,
        sitemapEligibleDefault: false,
        allowSelfCanonical: false,
        emitRichMetadata: false,
        emitOgSdAsIdentity: false,
        robotsDefault: 'noindex,nofollow',
        cacheAsIndexableSuccess: false,
        healthIfIndexableClaim: 'WARN'
      };
  }
}

function resolveHttpPolicy(status, opts) {
  var httpClass = classifyHttpStatus(status, opts);
  var policy = httpClassPolicy(httpClass);
  return Object.assign({ status: Number(status) || 0 }, policy);
}

module.exports = {
  CLASS,
  classifyHttpStatus,
  httpClassPolicy,
  resolveHttpPolicy
};
