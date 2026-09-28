'use strict';

/**
 * P3 — SOL-AUTO · SOL-OVERRIDE · SOL-TMPL
 * Entity templates + description fallback + field ownership (SoT §5·§6 · Solution §13·§29·§30).
 * Consumed by SEO Contract — does not extend Foundation resolver authority (PD-02).
 */

var TEMPLATE_VERSION = 1;

/** SoT §6 entity title templates (vi). */
var TITLE_TEMPLATES = {
  article: '{title} | Tin tức iFlux',
  stock: '{name} ({ticker}) | iFlux',
  sector: '{name} | Phân tích ngành | iFlux',
  ecosystem: '{name} | iFlux',
  author: '{name} | Tin tức iFlux',
  hub: '{title} · iFlux',
  page: '{title} · iFlux'
};

/**
 * SoT §5 / §37 — field ownership for Contract overrides.
 * system_only: ignored from editorial override (Contract derives)
 * overrideable: editorial exception path
 * automatic: derived; override only if explicit editorial SEO field
 */
var FIELD_OWNERSHIP = {
  title: 'overrideable',
  description: 'overrideable',
  image: 'overrideable',
  ogType: 'overrideable',
  ogTitle: 'overrideable',
  ogDescription: 'overrideable',
  cleanPath: 'system_only',
  canonical: 'system_only',
  robots: 'system_only',
  forceNonIndex: 'system_only',
  sitemapEligible: 'system_only',
  indexUniverse: 'system_only',
  seoIdentityUrl: 'system_only',
  redirectTarget: 'system_only'
};

function trimStr(v) {
  return String(v == null ? '' : v).trim();
}

function isBlank(v) {
  return !trimStr(v);
}

function applyTemplate(pattern, vars) {
  var out = String(pattern || '');
  Object.keys(vars || {}).forEach(function (k) {
    out = out.split('{' + k + '}').join(trimStr(vars[k]) || '');
  });
  return out.replace(/\s{2,}/g, ' ').replace(/\(\s*\)/g, '').trim();
}

function ownershipOf(field) {
  return FIELD_OWNERSHIP[field] || 'system_only';
}

/**
 * Strip / reject system-only keys from raw editorial overrides.
 * Returns { safe, rejected[] }.
 */
function filterEditorialOverrides(raw) {
  raw = raw && typeof raw === 'object' ? raw : {};
  var safe = {};
  var rejected = [];
  Object.keys(raw).forEach(function (key) {
    var own = ownershipOf(key);
    if (own === 'system_only') {
      if (raw[key] != null && raw[key] !== '') {
        rejected.push({ field: key, ownership: own, reason: 'system_only' });
      }
      return;
    }
    if (raw[key] !== undefined) safe[key] = raw[key];
  });
  return { safe: safe, rejected: rejected };
}

/**
 * Description chain — Solution §30.
 * Manual SEO → entity SEO → summary → excerpt → deterministic template → global default
 */
function resolveDescription(input) {
  input = input || {};
  var entity = input.entity || {};
  var seo = entity.seo && typeof entity.seo === 'object' ? entity.seo : {};
  var manual = input.manual || {};
  var foundation = input.foundationEffective || {};

  var steps = [
    { source: 'manual_override', value: manual.description },
    {
      source: 'entity_seo',
      value: (function () {
        var d = trimStr(seo.description || seo.seo_description || seo.meta_description);
        var excerpt = trimStr(entity.excerpt || entity.summary);
        // same auto-fill pattern: seo.description === excerpt is not editorial
        if (d && d !== excerpt) return d;
        return '';
      })()
    },
    { source: 'entity_summary', value: entity.summary },
    { source: 'entity_excerpt', value: entity.excerpt },
    {
      source: 'deterministic_template',
      value: entity.title || entity.name
        ? trimStr(entity.title || entity.name) + ' trên iFlux.'
        : ''
    },
    { source: 'global_default', value: foundation.description || foundation.site_description }
  ];

  for (var i = 0; i < steps.length; i++) {
    if (!isBlank(steps[i].value)) {
      return {
        value: trimStr(steps[i].value),
        source: steps[i].source,
        mode: steps[i].source === 'manual_override' || steps[i].source === 'entity_seo'
          ? 'override'
          : 'automatic'
      };
    }
  }
  return { value: '', source: 'empty', mode: 'automatic' };
}

/**
 * Title: manual/entity SEO override → approved template → foundation → brand.
 */
function resolveTitle(input) {
  input = input || {};
  var entityType = input.entityType || 'page';
  var entity = input.entity || {};
  var seo = entity.seo && typeof entity.seo === 'object' ? entity.seo : {};
  var manual = input.manual || {};
  var foundation = input.foundationEffective || {};
  var template = TITLE_TEMPLATES[entityType] || TITLE_TEMPLATES.page;

  var editorial = trimStr(manual.title);

  // seo.title identical to entity.title is publish auto-fill — not editorial override (P3).
  if (!editorial) {
    var seoTitle = trimStr(seo.title || seo.seo_title || seo.meta_title);
    var entityTitle = trimStr(entity.title || entity.name);
    if (seoTitle && seoTitle !== entityTitle) editorial = seoTitle;
  }

  if (!isBlank(editorial)) {
    return {
      value: trimStr(editorial),
      source: manual.title ? 'manual_override' : 'entity_seo',
      mode: 'override',
      templateId: entityType,
      templateVersion: TEMPLATE_VERSION
    };
  }

  var vars = {
    title: entity.title || entity.name || '',
    name: entity.name || entity.title || '',
    ticker: entity.ticker || '',
    slug: entity.slug || ''
  };

  if (!isBlank(vars.title) || !isBlank(vars.name) || !isBlank(vars.ticker)) {
    var rendered = applyTemplate(template, vars);
    if (!isBlank(rendered)) {
      return {
        value: rendered,
        source: 'entity_template',
        mode: 'automatic',
        templateId: entityType,
        templateVersion: TEMPLATE_VERSION,
        templatePattern: template
      };
    }
  }

  var fromFoundation = foundation.title || foundation.site_name || 'iFlux';
  return {
    value: trimStr(fromFoundation),
    source: 'foundation_or_brand',
    mode: 'automatic',
    templateId: entityType,
    templateVersion: TEMPLATE_VERSION
  };
}

function resolveImage(input) {
  input = input || {};
  var entity = input.entity || {};
  var seo = entity.seo && typeof entity.seo === 'object' ? entity.seo : {};
  var cover = entity.cover && typeof entity.cover === 'object' ? entity.cover : {};
  var manual = input.manual || {};
  var foundation = input.foundationEffective || {};

  var steps = [
    { source: 'manual_override', value: manual.image },
    { source: 'entity_seo', value: seo.og_image || seo.ogImageUrl },
    { source: 'entity_cover', value: cover.url || entity.cover_url },
    { source: 'global_default', value: foundation.og_image || foundation.social_image }
  ];
  for (var i = 0; i < steps.length; i++) {
    if (!isBlank(steps[i].value)) {
      return {
        value: trimStr(steps[i].value),
        source: steps[i].source,
        mode: steps[i].source.indexOf('manual') === 0 || steps[i].source === 'entity_seo'
          ? 'override'
          : 'automatic'
      };
    }
  }
  return { value: '', source: 'empty', mode: 'automatic' };
}

/** P4 ALT slice — deterministic; not AI. */
function resolveImageAlt(input) {
  input = input || {};
  var entity = input.entity || {};
  var seo = entity.seo && typeof entity.seo === 'object' ? entity.seo : {};
  var cover = entity.cover && typeof entity.cover === 'object' ? entity.cover : {};
  var manual = input.manual || {};
  var foundation = input.foundationEffective || {};
  var steps = [
    { source: 'manual_override', value: manual.imageAlt || manual.og_image_alt },
    { source: 'entity_seo', value: seo.og_image_alt || seo.ogImageAlt },
    { source: 'entity_cover', value: cover.alt },
    { source: 'entity_title', value: entity.title },
    { source: 'global_default', value: foundation.og_image_alt }
  ];
  for (var i = 0; i < steps.length; i++) {
    if (!isBlank(steps[i].value)) {
      return {
        value: trimStr(steps[i].value),
        source: steps[i].source,
        mode: steps[i].source.indexOf('manual') === 0 || steps[i].source === 'entity_seo'
          ? 'override'
          : 'automatic'
      };
    }
  }
  return { value: '', source: 'empty', mode: 'automatic' };
}

/**
 * Resolve automatic entity SEO fields + apply safe editorial overrides only.
 * @returns {{ title, description, image, imageAlt, ogType, fields, rejectedOverrides, mode }}
 */
function resolveEntitySeo(input) {
  input = input || {};
  var entityType = input.entityType || 'page';
  var filtered = filterEditorialOverrides(input.manual || {});
  var manual = filtered.safe;

  var title = resolveTitle({
    entityType: entityType,
    entity: input.entity,
    manual: manual,
    foundationEffective: input.foundationEffective
  });
  var description = resolveDescription({
    entity: input.entity,
    manual: manual,
    foundationEffective: input.foundationEffective
  });
  var image = resolveImage({
    entity: input.entity,
    manual: manual,
    foundationEffective: input.foundationEffective
  });
  var imageAlt = resolveImageAlt({
    entity: input.entity,
    manual: manual,
    foundationEffective: input.foundationEffective
  });

  var ogType =
    !isBlank(manual.ogType)
      ? trimStr(manual.ogType)
      : entityType === 'article'
        ? 'article'
        : 'website';

  var mode =
    title.mode === 'override' || description.mode === 'override' || image.mode === 'override'
      ? 'entity_override'
      : 'automatic';

  return {
    title: title.value,
    description: description.value,
    image: image.value,
    imageAlt: imageAlt.value,
    ogType: ogType,
    mode: mode,
    fields: {
      title: title,
      description: description,
      image: image,
      imageAlt: imageAlt
    },
    rejectedOverrides: filtered.rejected,
    templateVersion: TEMPLATE_VERSION,
    entityType: entityType
  };
}

/**
 * Merge entity resolution into Contract override bag (overrideable fields only).
 * System path/identity stay owned by Contract builder.
 */
function toContractOverrides(resolved, pathHints) {
  resolved = resolved || {};
  pathHints = pathHints || {};
  var out = {
    title: resolved.title,
    description: resolved.description,
    image: resolved.image,
    imageAlt: resolved.imageAlt,
    ogType: resolved.ogType
  };
  // Path hints are Contract-owned (system) — passed separately, not via editorial filter.
  if (pathHints.cleanPath) out.cleanPath = pathHints.cleanPath;
  if (pathHints.canonical) out.canonical = pathHints.canonical;
  if (pathHints.robots) out.robots = pathHints.robots;
  if (pathHints.forceNonIndex) out.forceNonIndex = pathHints.forceNonIndex;
  return out;
}

module.exports = {
  TEMPLATE_VERSION,
  TITLE_TEMPLATES,
  FIELD_OWNERSHIP,
  ownershipOf,
  filterEditorialOverrides,
  applyTemplate,
  resolveTitle,
  resolveDescription,
  resolveImage,
  resolveImageAlt,
  resolveEntitySeo,
  toContractOverrides
};
