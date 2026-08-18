'use strict';

/**
 * SEO Platform Contract builder.
 * PD-02: consumes Foundation effective config as INPUT — does not extend Foundation resolver authority.
 */

var httpPolicy = require('./http-policy');
var indexBoundary = require('./index-boundary');
var conflict = require('./conflict');
var entityTemplates = require('./entity-templates');
var breadcrumbMod = require('./breadcrumb');

var PUBLIC_ORIGIN = 'https://iflux.vn';

var PAGE_KEY_TO_PATH = {
  dashboard: '/nha-cua-toi',
  market: '/thi-truong',
  community: '/cong-dong',
  flow: '/dong-tien',
  membership: '/thanh-vien',
  faq: '/hoi-dap',
  account: '/tai-khoan',
  messages: '/tin-nhan',
  stocks: '/co-phieu',
  sectors: '/nganh',
  ecosystems: '/he-sinh-thai',
  'cau-chuyen': '/cau-chuyen',
  pricing: '/goi-cuoc',
  'com-topic': '/cong-dong'
};

var UTILITY_NOINDEX_KEYS = {
  dashboard: true,
  account: true,
  messages: true
};

function absUrl(origin, path) {
  var base = String(origin || PUBLIC_ORIGIN).replace(/\/$/, '');
  var p = path || '/';
  if (p.charAt(0) !== '/') p = '/' + p;
  return base + p;
}

/** Social/crawler assets MUST be absolute HTTPS (Solution §21 / BR-15). */
function absolutizeAsset(url, origin) {
  var raw = String(url || '').trim();
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.indexOf('//') === 0) return 'https:' + raw;
  return absUrl(origin || PUBLIC_ORIGIN, raw.charAt(0) === '/' ? raw : '/' + raw);
}

/**
 * @param {object} input
 * @param {object} input.foundationEffective — public bag from Foundation getPublicEffective (consume)
 * @param {string} [input.pageKey]
 * @param {number} [input.httpStatus=200]
 * @param {string} [input.requestedUrl]
 * @param {string} [input.path]
 * @param {string} [input.search]
 * @param {string} [input.redirectTarget]
 * @param {string} [input.origin]
 * @param {object} [input.overrides] — path hints + legacy bag (system path fields OK from callers)
 * @param {object} [input.entity] — source entity for P3 templates (title/excerpt/seo/cover/…)
 * @param {string} [input.entityType] — article|stock|sector|ecosystem|author|hub|page
 * @param {object} [input.manualOverride] — editorial-only fields (system_only stripped)
 * @param {object} [input.breadcrumbHints] — leaf labels from entity context (ticker, sectorName, …)
 */
function buildSeoContract(input) {
  input = input || {};
  var origin = input.origin || PUBLIC_ORIGIN;
  var eff = input.foundationEffective && typeof input.foundationEffective === 'object'
    ? input.foundationEffective
    : {};
  var pageKey = input.pageKey || null;
  var httpStatus = input.httpStatus != null ? Number(input.httpStatus) : 200;
  var ov = input.overrides || {};

  var entityType =
    input.entityType ||
    (ov.ogType === 'article' ? 'article' : null) ||
    (pageKey && UTILITY_NOINDEX_KEYS[pageKey] ? 'page' : 'hub');

  var entityResolved = null;
  if (input.entity || input.entityType || input.manualOverride) {
    entityResolved = entityTemplates.resolveEntitySeo({
      entityType: entityType,
      entity: input.entity || {
        title: ov.title,
        excerpt: ov.description,
        seo: {
          title: ov.title,
          description: ov.description,
          og_image: ov.image
        },
        cover: ov.image ? { url: ov.image } : undefined
      },
      manual: input.manualOverride || {},
      foundationEffective: eff
    });
  }

  // Editorial overrides cannot set system-only identity/index fields.
  var editorialFilter = entityTemplates.filterEditorialOverrides(
    input.manualOverride || {
      title: ov.title,
      description: ov.description,
      image: ov.image,
      ogType: ov.ogType,
      canonical: ov.canonical,
      robots: ov.robots,
      sitemapEligible: ov.sitemapEligible
    }
  );

  var forceNonIndex =
    !!(pageKey && UTILITY_NOINDEX_KEYS[pageKey]) ||
    !!ov.forceNonIndex ||
    (ov.robots && String(ov.robots).toLowerCase().indexOf('noindex') >= 0);

  var classification = indexBoundary.classifyUrlVariant({
    url: input.requestedUrl,
    path: input.path,
    search: input.search,
    requestUri: input.requestUri,
    forceNonIndex: forceNonIndex
  });

  // URL variant outside Index Universe is NOT an HTTP failure (decorated 200 stays success).
  var http = httpPolicy.resolveHttpPolicy(httpStatus, {
    forceNonIndex: forceNonIndex
  });

  var boundary = indexBoundary.indexBoundaryForVariant(classification, http);

  var cleanPath = classification.cleanPath || PAGE_KEY_TO_PATH[pageKey] || '/';
  // cleanPath/canonical: Contract-owned. Callers may pass path hints via overrides (inventory adapters).
  if (ov.cleanPath) cleanPath = ov.cleanPath;
  var cleanPublicUrl = ov.canonical || absUrl(origin, cleanPath);
  var requestedUrl = input.requestedUrl || null;
  if (!requestedUrl && input.requestUri) {
    var ruPath = String(input.requestUri).split('?')[0];
    requestedUrl = absUrl(origin, ruPath.charAt(0) === '/' ? ruPath : '/' + ruPath);
  }
  if (!requestedUrl) requestedUrl = absUrl(origin, input.path || cleanPath);

  var title = String(
    (entityResolved && entityResolved.title) ||
      editorialFilter.safe.title ||
      ov.title ||
      eff.title ||
      eff.site_name ||
      'iFlux'
  ).trim();
  var description = String(
    (entityResolved && entityResolved.description) ||
      editorialFilter.safe.description ||
      ov.description ||
      eff.description ||
      ''
  ).trim();
  var siteName = String(eff.site_name || 'iFlux').trim() || 'iFlux';
  var image = absolutizeAsset(
    String(
      (entityResolved && entityResolved.image) ||
        editorialFilter.safe.image ||
        ov.image ||
        eff.og_image ||
        eff.social_image ||
        ''
    ).trim(),
    origin
  );
  var imageAlt = String(
    (entityResolved && entityResolved.imageAlt) ||
      ov.imageAlt ||
      editorialFilter.safe.imageAlt ||
      eff.og_image_alt ||
      ''
  ).trim();
  /* Owner ALT policy: override → cover/title chain (entity) → foundation → title → empty. No invent. */
  if (!imageAlt && image) imageAlt = String(title || '').trim();
  var favicon = absolutizeAsset(String(eff.favicon_url || '').trim(), origin);
  var logo = absolutizeAsset(String(eff.logo_url || '').trim(), origin);
  var ogType =
    (entityResolved && entityResolved.ogType) ||
    editorialFilter.safe.ogType ||
    ov.ogType ||
    'website';

  var robots = boundary.robotsOverride || http.robotsDefault || 'index,follow';
  if (forceNonIndex) robots = String(ov.robots || 'noindex,nofollow');
  if (pageKey && UTILITY_NOINDEX_KEYS[pageKey]) robots = 'noindex,nofollow';

  var draft = {
    urlVariant: classification.variant,
    http: {
      status: http.status,
      httpClass: http.httpClass,
      redirect: http.httpClass === 'redirect',
      redirectTarget: input.redirectTarget || null,
      robotsDefault: http.robotsDefault,
      cacheAsIndexableSuccess: http.cacheAsIndexableSuccess
    },
    identity: {
      requestedUrl: requestedUrl,
      cleanPublicUrl: cleanPublicUrl,
      seoIdentityUrl: cleanPublicUrl,
      canonicalUrl: boundary.inIndexUniverse && http.allowSelfCanonical ? cleanPublicUrl : cleanPublicUrl,
      allowSelfCanonical: !!(boundary.inIndexUniverse && http.allowSelfCanonical),
      redirectTarget: input.redirectTarget || null
    },
    indexability: {
      indexUniverse: boundary.inIndexUniverse && !forceNonIndex,
      robots: robots,
      sitemapEligible: boundary.sitemapEligible && !forceNonIndex && !(pageKey && UTILITY_NOINDEX_KEYS[pageKey]),
      indexableClaim: boundary.inIndexUniverse && !forceNonIndex
    },
    social: {
      og: {
        title: title,
        description: description,
        image: image,
        imageAlt: image ? imageAlt : '',
        url: cleanPublicUrl,
        type: ogType,
        site_name: siteName
      },
      twitter: {
        card: image ? 'summary_large_image' : 'summary',
        title: title,
        description: description,
        image: image
      }
    },
    structuredData: {
      url: cleanPublicUrl,
      name: title
    }
  };

  var bc = breadcrumbMod.resolveBreadcrumb({
    pageKey: pageKey,
    entityType: entityType,
    path: cleanPath,
    title: (input.entity && input.entity.title) || title,
    hints: input.breadcrumbHints || {},
    origin: origin
  });
  draft.breadcrumb = {
    items: bc.items,
    jsonLd: bc.jsonLd
  };
  if (bc.jsonLd) draft.structuredData.breadcrumb = bc.jsonLd;

  // Decorated: collapse identity to Clean; never independent OG/SD
  if (classification.variant !== 'CLEAN') {
    draft.indexability.indexUniverse = false;
    draft.indexability.sitemapEligible = false;
    draft.indexability.robots = 'noindex,nofollow';
    draft.identity.seoIdentityUrl = cleanPublicUrl;
    draft.identity.canonicalUrl = cleanPublicUrl;
    draft.social.og.url = cleanPublicUrl;
    draft.structuredData.url = cleanPublicUrl;
  }

  if (!http.emitRichMetadata) {
    draft.social.og.image = '';
    draft.social.twitter.image = '';
  }
  if (!http.emitOgSdAsIdentity && http.httpClass !== 'indexable_success') {
    draft.social.og.url = null;
  }

  var resolved = conflict.applyConflictResolution(draft);

  // Entity templates already include brand suffix when automatic; avoid double brand.
  var documentTitle =
    entityResolved && entityResolved.fields && entityResolved.fields.title &&
    entityResolved.fields.title.source === 'entity_template'
      ? title
      : /iflux/i.test(title)
        ? title
        : title + ' · iFlux';

  return {
    version: 1,
    pageKey: pageKey,
    entityType: entityType,
    http: resolved.http,
    identity: resolved.identity,
    indexability: resolved.indexability,
    document: {
      title: title,
      documentTitle: documentTitle,
      description: description,
      locale: 'vi-VN'
    },
    social: resolved.social,
    structuredData: resolved.structuredData,
    breadcrumb: draft.breadcrumb,
    assets: {
      faviconUrl: favicon,
      logoUrl: logo,
      ogImageUrl: image
    },
    boundary: boundary,
    classification: classification,
    foundationInput: {
      consumed: true,
      keys: Object.keys(eff)
    },
    health: resolved.health,
    coherent: resolved.coherent,
    templates: entityResolved
      ? {
          version: entityResolved.templateVersion,
          entityType: entityResolved.entityType,
          fields: entityResolved.fields,
          rejectedOverrides: entityResolved.rejectedOverrides
        }
      : null,
    ownership: {
      rejectedOverrides: editorialFilter.rejected
    },
    trace: {
      source: 'seo-platform.contract',
      foundation: '090826.effective',
      mode: (entityResolved && entityResolved.mode) || (ov.title ? 'entity_override' : 'automatic'),
      templateVersion: entityTemplates.TEMPLATE_VERSION
    }
  };
}

/**
 * Sitemap gate — reads SEO Contract only (Plan P5 / PD-07).
 * NOT a separate eligibility engine.
 */
function isContractSitemapEligible(contract) {
  if (!contract || !contract.indexability) return false;
  if (!contract.indexability.sitemapEligible) return false;
  if (!contract.indexability.indexUniverse) return false;
  if (!contract.http || contract.http.httpClass !== 'indexable_success') return false;
  if (contract.classification && contract.classification.variant !== 'CLEAN') return false;
  var robots = String((contract.indexability && contract.indexability.robots) || '').toLowerCase();
  if (robots.indexOf('noindex') >= 0) return false;
  var loc = (contract.identity && (contract.identity.seoIdentityUrl || contract.identity.canonicalUrl)) || '';
  if (!loc) return false;
  if (/\/IFL[A-Za-z0-9]{5,17}(\/|$)/i.test(loc)) return false;
  if (/[?&]ref=/i.test(loc) || /[?&]r=/i.test(loc)) return false;
  return true;
}

module.exports = {
  PUBLIC_ORIGIN,
  PAGE_KEY_TO_PATH,
  UTILITY_NOINDEX_KEYS,
  buildSeoContract,
  isContractSitemapEligible,
  absUrl,
  absolutizeAsset
};
