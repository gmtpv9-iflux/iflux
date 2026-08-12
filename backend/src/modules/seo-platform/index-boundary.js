'use strict';

/**
 * Index Boundary / URL variant classification (D-SEO-09 layered principle).
 * Affiliate attribution stays intact — this only classifies SEO identity eligibility.
 */

var VARIANT = {
  CLEAN: 'CLEAN',
  DECORATED: 'DECORATED',
  QUERY_REF: 'QUERY_REF',
  OTHER_NON_INDEX: 'OTHER_NON_INDEX'
};

var PUBLIC_ID_RE = /^\/IFL[A-Za-z0-9]{5,17}(\/|$)/i;

function parseUrlParts(rawUrl, opts) {
  opts = opts || {};
  var path = String(opts.path || '');
  var search = String(opts.search || '');
  if (rawUrl) {
    try {
      var u = new URL(String(rawUrl), 'https://iflux.vn');
      path = u.pathname || path;
      search = u.search || search;
    } catch (e) {
      /* keep opts */
    }
  }
  if (!path && opts.requestUri) {
    var ru = String(opts.requestUri);
    var q = ru.indexOf('?');
    path = q >= 0 ? ru.slice(0, q) : ru;
    search = q >= 0 ? ru.slice(q) : search;
  }
  return { path: path || '/', search: search || '' };
}

function stripPublicIdPath(path) {
  var p = String(path || '/');
  var m = p.match(/^\/IFL[A-Za-z0-9]{5,17}(\/.*)?$/i);
  if (!m) return p;
  return m[1] ? m[1] : '/';
}

function classifyUrlVariant(input) {
  input = input || {};
  var parts = parseUrlParts(input.url, input);
  var path = parts.path;
  var search = parts.search;
  var params = new URLSearchParams(search.charAt(0) === '?' ? search.slice(1) : search);

  // Nginx rewrite strips publicId from $uri but $request_uri stays original — honor requestUri.
  var requestPath = '';
  var requestSearch = '';
  if (input.requestUri) {
    var ru = String(input.requestUri);
    var q = ru.indexOf('?');
    requestPath = q >= 0 ? ru.slice(0, q) : ru;
    requestSearch = q >= 0 ? ru.slice(q) : '';
  }
  if (requestSearch && (!search || search === '?')) {
    search = requestSearch;
    params = new URLSearchParams(search.charAt(0) === '?' ? search.slice(1) : search);
  }

  if (PUBLIC_ID_RE.test(requestPath) || PUBLIC_ID_RE.test(path)) {
    var decoratedPath = PUBLIC_ID_RE.test(requestPath) ? requestPath : path;
    return {
      variant: VARIANT.DECORATED,
      inIndexUniverse: false,
      cleanPath: stripPublicIdPath(decoratedPath),
      reason: 'publicId_path'
    };
  }
  if (params.has('ref') || params.has('r')) {
    return {
      variant: VARIANT.QUERY_REF,
      inIndexUniverse: false,
      cleanPath: stripPublicIdPath(path),
      reason: params.has('ref') ? 'query_ref' : 'query_r'
    };
  }
  if (input.forceNonIndex) {
    return {
      variant: VARIANT.OTHER_NON_INDEX,
      inIndexUniverse: false,
      cleanPath: stripPublicIdPath(path),
      reason: 'forced'
    };
  }
  return {
    variant: VARIANT.CLEAN,
    inIndexUniverse: true,
    cleanPath: stripPublicIdPath(path),
    reason: 'clean_public'
  };
}

/**
 * Layered Index Boundary invariants for a classified variant (Plan PD-03).
 */
function indexBoundaryForVariant(classification, httpPolicy) {
  classification = classification || classifyUrlVariant({});
  httpPolicy = httpPolicy || {};
  var outside = !classification.inIndexUniverse;
  var nonIndexHttp = httpPolicy.mayBeIndexable === false;

  var inUniverse = !outside && !nonIndexHttp && httpPolicy.mayBeIndexable !== false;
  return {
    variant: classification.variant,
    cleanPath: classification.cleanPath,
    inIndexUniverse: inUniverse,
    sitemapEligible: inUniverse && httpPolicy.sitemapEligibleDefault !== false,
    independentOgSdIdentity: false,
    seoIdentityIsClean: true,
    robotsOverride: outside || nonIndexHttp ? 'noindex,nofollow' : null,
    attributionPreserved: true,
    layered: {
      variantClassification: true,
      cleanSeoIdentity: true,
      indexUniverseExclusion: outside || nonIndexHttp,
      sitemapExclusion: outside || nonIndexHttp || httpPolicy.sitemapEligibleDefault === false,
      noIndependentOgSd: true,
      nonIndexSignalRequired: outside || nonIndexHttp,
      affiliateAttributionPreserved: true
    }
  };
}

module.exports = {
  VARIANT,
  PUBLIC_ID_RE,
  classifyUrlVariant,
  stripPublicIdPath,
  indexBoundaryForVariant
};
