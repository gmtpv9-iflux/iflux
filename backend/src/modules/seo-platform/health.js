'use strict';

/**
 * P7 — SOL-HEALTH · SOL-PREV · SOL-OBS
 * Health matrix (Solution §34) + Preview + observability over SEO Contract.
 * No second metadata engine — reads Contract / emitted head only.
 */

var headRenderer = require('./head-renderer');

function pushIssue(list, level, code, message, extra) {
  var row = { level: level, code: code, message: message };
  if (extra && typeof extra === 'object') {
    Object.keys(extra).forEach(function (k) {
      row[k] = extra[k];
    });
  }
  list.push(row);
}

/**
 * Evaluate Contract (+ optional emitted HTML) against Solution §34 matrix.
 */
function evaluateSeoHealth(contract, opts) {
  opts = opts || {};
  var c = contract || {};
  var issues = [];
  var http = c.http || {};
  var index = c.indexability || {};
  var identity = c.identity || {};
  var social = (c.social && c.social.og) || {};
  var sd = c.structuredData || {};
  var doc = c.document || {};
  var variant = (c.classification && c.classification.variant) || c.urlVariant || 'CLEAN';

  // Carry conflict resolver health
  if (Array.isArray(c.health)) {
    c.health.forEach(function (h) {
      if (h) issues.push(h);
    });
  }

  // §34 HTTP conflicts
  if (http.httpClass === 'not_found_gone') {
    if (index.indexUniverse || index.indexableClaim) {
      pushIssue(issues, 'ERROR', 'HTTP_404_INDEXABLE', '404/410 không được indexable');
    }
    if (index.sitemapEligible) {
      pushIssue(issues, 'ERROR', 'HTTP_404_SITEMAP', '404/410 không được sitemap eligible');
    }
    if (identity.canonicalUrl && identity.allowSelfCanonical) {
      pushIssue(issues, 'ERROR', 'HTTP_404_SELF_CANONICAL', '404/410 không được self-canonical indexable');
    }
  }
  if (http.httpClass === 'redirect') {
    if (index.sitemapEligible) {
      pushIssue(issues, 'ERROR', 'REDIRECT_SITEMAP', 'Redirect không được sitemap eligible');
    }
    if (identity.allowSelfCanonical) {
      pushIssue(issues, 'ERROR', 'REDIRECT_INDEPENDENT_CANONICAL', 'Redirect không được independent canonical');
    }
    if (social.url && identity.redirectTarget && social.url !== identity.redirectTarget) {
      pushIssue(issues, 'ERROR', 'REDIRECT_INDEPENDENT_OG', 'Redirect không được independent OG identity');
    }
  }

  if (index.sitemapEligible && index.robots && String(index.robots).indexOf('noindex') >= 0) {
    pushIssue(issues, 'ERROR', 'SITEMAP_NOINDEX_CONFLICT', 'noindex không được sitemap eligible');
  }

  if (variant === 'DECORATED' || variant === 'QUERY_REF') {
    if (index.sitemapEligible) {
      pushIssue(issues, 'ERROR', 'DECORATED_SITEMAP', 'Decorated/ref URL không được sitemap eligible');
    }
    var seoId = String(identity.seoIdentityUrl || '');
    var req = String(identity.requestedUrl || '');
    if (
      /\/IFL[A-Za-z0-9]{5,17}/i.test(seoId) ||
      (variant === 'DECORATED' && req && seoId && req === seoId && /\/IFL[A-Za-z0-9]{5,17}/i.test(req))
    ) {
      pushIssue(issues, 'ERROR', 'DECORATED_INDEPENDENT_IDENTITY', 'Decorated URL không được là SEO identity');
    }
    if (social.url && identity.seoIdentityUrl && social.url !== identity.seoIdentityUrl) {
      pushIssue(issues, 'ERROR', 'DECORATED_INDEPENDENT_OG', 'Decorated URL không được independent OG');
    }
  }

  if (
    social.url &&
    identity.seoIdentityUrl &&
    social.url !== identity.seoIdentityUrl &&
    http.httpClass === 'indexable_success'
  ) {
    pushIssue(issues, 'ERROR', 'OG_URL_IDENTITY_MISMATCH', 'og:url phải bằng SEO identity');
  }
  if (
    sd.url &&
    identity.seoIdentityUrl &&
    sd.url !== identity.seoIdentityUrl &&
    index.indexUniverse
  ) {
    pushIssue(issues, 'ERROR', 'SD_URL_IDENTITY_MISMATCH', 'structured-data.url phải bằng SEO identity');
  }

  if (!doc.title) pushIssue(issues, 'ERROR', 'MISSING_TITLE', 'Thiếu title');
  if (!doc.description) pushIssue(issues, 'WARN', 'MISSING_DESCRIPTION', 'Thiếu description');
  if (index.indexUniverse && !identity.canonicalUrl && !identity.seoIdentityUrl) {
    pushIssue(issues, 'ERROR', 'MISSING_CANONICAL', 'Thiếu canonical / SEO identity');
  }

  // Singleton on emitted HTML
  var singleton = null;
  if (opts.html) {
    singleton = headRenderer.detectSingletonViolations(opts.html);
    (singleton.violations || []).forEach(function (v) {
      pushIssue(issues, 'ERROR', v.code || 'SINGLETON_VIOLATION', 'Duplicate/missing singleton: ' + v.field, {
        field: v.field,
        count: v.count
      });
    });
  }

  var hasError = issues.some(function (i) {
    return i.level === 'ERROR';
  });
  var hasWarn = issues.some(function (i) {
    return i.level === 'WARN';
  });

  return {
    status: hasError ? 'ERROR' : hasWarn ? 'WARN' : 'OK',
    coherent: !hasError && c.coherent !== false,
    issues: issues,
    singleton: singleton,
    matrix: 'Solution §34'
  };
}

/** Preview panels from Contract only (SoT §32 / SOL-PREV). */
function buildPreviewFromContract(contract) {
  var c = contract || {};
  var doc = c.document || {};
  var identity = c.identity || {};
  var social = (c.social && c.social.og) || {};
  var twitter = (c.social && c.social.twitter) || {};
  var assets = c.assets || {};
  var url = identity.seoIdentityUrl || identity.canonicalUrl || '';
  var title = doc.documentTitle || doc.title || 'iFlux';
  var description = doc.description || '';
  var image = social.image || assets.ogImageUrl || '';

  var headHtml = headRenderer.renderHeadFromContract(c, {
    includeJsonLd: true,
    forceImage: true
  });

  return {
    google: {
      title: title,
      url: url,
      description: description
    },
    openGraph: {
      title: social.title || doc.title || title,
      description: social.description || description,
      url: social.url || url,
      image: image,
      site_name: social.site_name || 'iFlux',
      type: social.type || 'website'
    },
    twitter: {
      card: twitter.card || (image ? 'summary_large_image' : 'summary'),
      title: twitter.title || social.title || doc.title || title,
      description: twitter.description || description,
      image: twitter.image || image
    },
    headHtml: headHtml
  };
}

/**
 * Observability chain: URL → resolve inputs → Contract → head → health.
 */
function buildObservabilityBundle(contract, opts) {
  opts = opts || {};
  var preview = buildPreviewFromContract(contract);
  var html = opts.html || headRenderer.renderShellHtml(contract);
  var health = evaluateSeoHealth(contract, { html: html });
  return {
    chain: ['url', 'resolve', 'contract', 'render', 'health'],
    input: {
      path: opts.path || null,
      pageKey: contract && contract.pageKey,
      entityType: contract && contract.entityType,
      requestUri: opts.requestUri || null
    },
    contract: contract,
    preview: preview,
    health: health,
    singleton: health.singleton || headRenderer.detectSingletonViolations(html),
    emittedHead: preview.headHtml,
    trace: (contract && contract.trace) || null
  };
}

module.exports = {
  evaluateSeoHealth,
  buildPreviewFromContract,
  buildObservabilityBundle
};
