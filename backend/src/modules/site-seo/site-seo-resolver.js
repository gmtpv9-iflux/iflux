'use strict';

/**
 * Effective configuration resolver (SOL-06 / SOT-05…07).
 * ARTICLE > PAGE > GLOBAL > FALLBACK
 * States: INHERITED | OVERRIDDEN | UNSET | INVALID
 */

var FIELD_KEYS = [
  'siteName',
  'siteDescription',
  'faviconUrl',
  'logoUrl',
  'seoTitle',
  'metaDescription',
  'ogImageUrl',
  'ogImageAlt',
  'socialImageUrl'
];

function isBlank(v) {
  if (v == null) return true;
  if (typeof v === 'string' && !String(v).trim()) return true;
  return false;
}

function pick(obj, key) {
  if (!obj || typeof obj !== 'object') return undefined;
  if (!Object.prototype.hasOwnProperty.call(obj, key)) return undefined;
  return obj[key];
}

/**
 * Resolve one field with source + state metadata for Admin.
 */
function resolveField(key, layers) {
  layers = layers || {};
  var article = pick(layers.article, key);
  var page = pick(layers.page, key);
  var global = pick(layers.global, key);
  var fallback = pick(layers.fallback, key);

  if (!isBlank(article)) {
    return {
      key: key,
      value: article,
      state: 'OVERRIDDEN',
      source: 'Thiết lập SEO bài viết',
      sourceScope: 'ARTICLE'
    };
  }
  /* D-SEO-07 / PD-13: favicon = GLOBAL only — ignore PAGE override
   * logo = GLOBAL only (Owner LOCK 20260811) — Header brand có 1 owner duy nhất Thiết lập SEO hệ thống */
  if (key !== 'faviconUrl' && key !== 'logoUrl' && !isBlank(page)) {
    return {
      key: key,
      value: page,
      state: layers.article && Object.prototype.hasOwnProperty.call(layers.article, key) && isBlank(article)
        ? 'INHERITED'
        : 'OVERRIDDEN',
      source: 'Thiết lập SEO từng trang',
      sourceScope: 'PAGE'
    };
  }
  if (!isBlank(global)) {
    return {
      key: key,
      value: global,
      state: 'INHERITED',
      source: 'Thiết lập SEO hệ thống',
      sourceScope: 'GLOBAL'
    };
  }
  if (!isBlank(fallback)) {
    return {
      key: key,
      value: fallback,
      state: 'UNSET',
      source: 'Fallback',
      sourceScope: 'FALLBACK'
    };
  }
  return {
    key: key,
    value: '',
    state: 'UNSET',
    source: 'Fallback',
    sourceScope: 'FALLBACK'
  };
}

/**
 * OD-SOL-02: socialImageUrl defaults to ogImageUrl when blank at same layer merge after resolve.
 */
function applyOgSocialShare(effective) {
  var og = effective.ogImageUrl;
  var social = effective.socialImageUrl;
  if (isBlank(social.value) && !isBlank(og.value)) {
    effective.socialImageUrl = {
      key: 'socialImageUrl',
      value: og.value,
      state: social.state === 'OVERRIDDEN' ? social.state : 'INHERITED',
      source: social.state === 'UNSET' ? (og.source || 'Thiết lập SEO hệ thống') : social.source,
      sourceScope: social.sourceScope === 'FALLBACK' ? og.sourceScope : social.sourceScope,
      sharedFrom: 'ogImageUrl'
    };
  }
  return effective;
}

function resolveEffectiveConfig(input) {
  input = input || {};
  var global = normalizeGlobal(input.global || {});
  var page = normalizePage(input.page || {});
  var article = normalizeArticle(input.article || {});
  var fallback = Object.assign(
    {
      siteName: 'iFlux',
      seoTitle: 'iFlux',
      metaDescription: '',
      faviconUrl: '',
      logoUrl: '',
      ogImageUrl: '',
      ogImageAlt: '',
      socialImageUrl: '',
      siteDescription: ''
    },
    input.fallback || {}
  );

  var layers = { global: global, page: page, article: article, fallback: fallback };
  var out = {};
  for (var i = 0; i < FIELD_KEYS.length; i++) {
    out[FIELD_KEYS[i]] = resolveField(FIELD_KEYS[i], layers);
  }
  applyOgSocialShare(out);

  return {
    fields: out,
    values: flattenValues(out),
    public: toPublic(out)
  };
}

function flattenValues(fields) {
  var v = {};
  FIELD_KEYS.forEach(function (k) {
    v[k] = fields[k] ? fields[k].value : '';
  });
  return v;
}

function toPublic(fields) {
  var placeholders = require('./page-seo-placeholders');
  function live(v) {
    v = v || '';
    /* Unresolved Default SEO Template placeholders → không publish ra HTML/public API */
    if (placeholders.hasPlaceholder(v)) return '';
    return v;
  }
  var rawTitle = (fields.seoTitle && fields.seoTitle.value) || '';
  var rawDesc = (fields.metaDescription && fields.metaDescription.value) || '';
  return {
    site_name: live(fields.siteName.value) || '',
    site_description: live(fields.siteDescription.value) || '',
    favicon_url: live(fields.faviconUrl.value) || '',
    logo_url: live(fields.logoUrl.value) || '',
    title: live(rawTitle) || '',
    title_template: placeholders.templateField(rawTitle),
    description: live(rawDesc) || '',
    description_template: placeholders.templateField(rawDesc),
    og_image: live(fields.ogImageUrl.value) || '',
    og_image_alt: live(fields.ogImageAlt.value) || '',
    social_image: live(fields.socialImageUrl.value) || ''
  };
}

function normalizeGlobal(p) {
  p = p || {};
  return {
    siteName: p.siteName != null ? p.siteName : p.name,
    siteDescription: p.siteDescription != null ? p.siteDescription : p.tagline,
    faviconUrl: p.faviconUrl || '',
    logoUrl: p.logoUrl || '',
    seoTitle: p.defaultSeoTitle || p.seoTitle || '',
    metaDescription: p.defaultMetaDescription || p.metaDescription || '',
    ogImageUrl: p.defaultOgImageUrl || p.ogImageUrl || '',
    ogImageAlt: p.defaultOgImageAlt || p.ogImageAlt || '',
    socialImageUrl: p.defaultSocialImageUrl || p.socialImageUrl || ''
  };
}

function normalizePage(p) {
  p = p || {};
  return {
    siteName: undefined,
    siteDescription: undefined,
    faviconUrl: p.faviconUrl,
    logoUrl: p.logoUrl,
    seoTitle: p.seoTitle || p.title,
    metaDescription: p.metaDescription || p.description,
    ogImageUrl: p.ogImageUrl,
    ogImageAlt: p.ogImageAlt,
    socialImageUrl: p.socialImageUrl
  };
}

function normalizeArticle(p) {
  p = p || {};
  var seo = p.seo && typeof p.seo === 'object' ? p.seo : p;
  var cover = p.cover && typeof p.cover === 'object' ? p.cover : {};
  var title =
    seo.title ||
    seo.seo_title ||
    seo.meta_title ||
    seo.og_title ||
    p.title ||
    '';
  var desc =
    seo.description ||
    seo.seo_description ||
    seo.meta_description ||
    seo.og_description ||
    p.excerpt ||
    '';
  var og =
    seo.og_image ||
    seo.ogImageUrl ||
    cover.url ||
    p.cover_url ||
    '';
  var social = seo.social_image || seo.socialImageUrl || '';
  var ogAlt = seo.og_image_alt || seo.ogImageAlt || '';
  return {
    siteName: undefined,
    siteDescription: undefined,
    faviconUrl: undefined,
    logoUrl: undefined,
    seoTitle: title,
    metaDescription: desc,
    ogImageUrl: og,
    ogImageAlt: ogAlt,
    socialImageUrl: social
  };
}

module.exports = {
  FIELD_KEYS: FIELD_KEYS,
  resolveEffectiveConfig: resolveEffectiveConfig,
  resolveField: resolveField,
  normalizeGlobal: normalizeGlobal,
  normalizePage: normalizePage,
  normalizeArticle: normalizeArticle,
  isBlank: isBlank
};
