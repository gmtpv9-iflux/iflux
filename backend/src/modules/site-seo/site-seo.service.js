'use strict';

const { query } = require('../../core/database/connection');
const { AppError } = require('../../shared/exceptions/app-error');
const resolver = require('./site-seo-resolver');
const brandSvc = require('../metadata/wave-d-admin.service');
const quality = require('./seo-content-quality');

var GLOBAL_SEO_KEYS = [
  'siteDescription',
  'faviconUrl',
  'faviconAssetId',
  'logoUrl',
  'logoAssetId',
  'defaultSeoTitle',
  'defaultMetaDescription',
  'defaultOgImageUrl',
  'defaultOgImageAssetId',
  'defaultOgImageAlt',
  'defaultSocialImageUrl',
  'defaultSocialImageAssetId'
];

function asObject(payload) {
  if (!payload) return {};
  if (typeof payload === 'string') {
    try {
      return JSON.parse(payload) || {};
    } catch (e) {
      return {};
    }
  }
  if (typeof payload === 'object' && !Array.isArray(payload)) return payload;
  return {};
}

async function getGlobalPayload() {
  const row = await brandSvc.getBrand();
  return asObject(row.payload);
}

async function getGlobalSeo() {
  const payload = await getGlobalPayload();
  return {
    code: 'primary',
    payload: payload,
    view: resolver.normalizeGlobal(payload)
  };
}

var GLOBAL_TITLE_LABEL = 'Tiêu đề SEO mặc định (Global)';
var GLOBAL_DESC_LABEL = 'Meta description mặc định (Global)';

/** BR-19/BR-20: thu thập title/description ở scope khác để check duplicate (không tính chính scope đang sửa). */
async function collectOtherTitles(excludeLabel) {
  var out = [];
  var globalPayload = await getGlobalPayload();
  if (globalPayload.defaultSeoTitle && GLOBAL_TITLE_LABEL !== excludeLabel) {
    out.push({ owner: GLOBAL_TITLE_LABEL, value: globalPayload.defaultSeoTitle });
  }
  var pages = await listPageSeo();
  pages.forEach(function (p) {
    var label = 'trang "' + p.page_key + '"';
    if (label === excludeLabel) return;
    var t = p.payload && p.payload.seoTitle;
    if (t) out.push({ owner: label, value: t });
  });
  return out;
}

async function collectOtherDescriptions(excludeLabel) {
  var out = [];
  var globalPayload = await getGlobalPayload();
  if (globalPayload.defaultMetaDescription && GLOBAL_DESC_LABEL !== excludeLabel) {
    out.push({ owner: GLOBAL_DESC_LABEL, value: globalPayload.defaultMetaDescription });
  }
  var pages = await listPageSeo();
  pages.forEach(function (p) {
    var label = 'trang "' + p.page_key + '"';
    if (label === excludeLabel) return;
    var d = p.payload && p.payload.metaDescription;
    if (d) out.push({ owner: label, value: d });
  });
  return out;
}

/** Chạy BR-19 (description) / BR-20 (title): throw khi có error, trả về warnings khi chỉ là chất lượng. */
async function runContentQualityGate(fields) {
  var errors = [];
  var warnings = [];
  if (Object.prototype.hasOwnProperty.call(fields, 'title')) {
    var tRes = quality.validateTitle(fields.title.value, {
      others: await collectOtherTitles(fields.title.label)
    });
    errors = errors.concat(tRes.errors);
    warnings = warnings.concat(tRes.warnings);
  }
  if (Object.prototype.hasOwnProperty.call(fields, 'description')) {
    var dRes = quality.validateDescription(fields.description.value, {
      others: await collectOtherDescriptions(fields.description.label)
    });
    errors = errors.concat(dRes.errors);
    warnings = warnings.concat(dRes.warnings);
  }
  if (errors.length) {
    throw AppError.badRequest('SEO_CONTENT_QUALITY', errors.map(function (e) { return e.message; }).join(' '), {
      errors: errors,
      warnings: warnings
    });
  }
  return warnings;
}

async function updateGlobalSeo(patch, meta) {
  patch = patch && typeof patch === 'object' ? patch : {};
  const cur = await getGlobalPayload();
  const next = Object.assign({}, cur);

  // Allow name/tagline from Global SEO surface too (same authority)
  if (patch.name != null) next.name = String(patch.name).trim();
  if (patch.tagline != null) next.tagline = String(patch.tagline).trim();
  if (patch.siteName != null) next.name = String(patch.siteName).trim();
  if (patch.siteDescription != null) next.siteDescription = String(patch.siteDescription).trim();

  GLOBAL_SEO_KEYS.forEach(function (k) {
    if (Object.prototype.hasOwnProperty.call(patch, k)) {
      next[k] = patch[k] == null ? '' : patch[k];
    }
  });

  var qualityFields = {};
  if (Object.prototype.hasOwnProperty.call(patch, 'defaultSeoTitle')) {
    qualityFields.title = { value: patch.defaultSeoTitle, label: GLOBAL_TITLE_LABEL };
  }
  if (Object.prototype.hasOwnProperty.call(patch, 'defaultMetaDescription')) {
    qualityFields.description = { value: patch.defaultMetaDescription, label: GLOBAL_DESC_LABEL };
  }
  const seoWarnings = await runContentQualityGate(qualityFields);

  const row = await brandSvc.updateBrand(next);
  return {
    code: 'primary',
    payload: asObject(row.payload),
    view: resolver.normalizeGlobal(asObject(row.payload)),
    updated_by: meta && meta.updated_by,
    seoWarnings: seoWarnings
  };
}

async function getPageSeo(pageKey) {
  const key = String(pageKey || '').trim();
  if (!key) throw AppError.badRequest('BAD_REQUEST', 'Thiếu pageKey');
  const res = await query(`SELECT * FROM page_seo_configs WHERE page_key = $1`, [key]);
  const row = res.rows[0] || { page_key: key, payload: {}, updated_at: null, updated_by: null };
  const payload = asObject(row.payload);
  return {
    page_key: key,
    payload: payload,
    view: resolver.normalizePage(payload),
    updated_at: row.updated_at || null,
    updated_by: row.updated_by || null
  };
}

async function listPageSeo() {
  const res = await query(
    `SELECT page_key, payload, updated_at, updated_by FROM page_seo_configs ORDER BY page_key ASC`
  );
  return (res.rows || []).map(function (r) {
    return {
      page_key: r.page_key,
      payload: asObject(r.payload),
      updated_at: r.updated_at,
      updated_by: r.updated_by
    };
  });
}

function normalizePagePatch(patch) {
  patch = patch && typeof patch === 'object' ? patch : {};
  var next = {};
  var seoTitle = patch.seoTitle != null ? patch.seoTitle : patch.title;
  var metaDescription = patch.metaDescription != null ? patch.metaDescription : patch.description;
  if (seoTitle != null) next.seoTitle = seoTitle == null ? '' : seoTitle;
  if (metaDescription != null) next.metaDescription = metaDescription == null ? '' : metaDescription;
  ['ogImageUrl', 'ogImageAssetId', 'ogImageAlt', 'socialImageUrl', 'socialImageAssetId', 'logoUrl'].forEach(
    function (k) {
      if (Object.prototype.hasOwnProperty.call(patch, k)) next[k] = patch[k] == null ? '' : patch[k];
    }
  );
  return next;
}

async function upsertPageSeo(pageKey, patch, meta) {
  const key = String(pageKey || '').trim();
  if (!key) throw AppError.badRequest('BAD_REQUEST', 'Thiếu pageKey');
  patch = patch && typeof patch === 'object' ? patch : {};
  const cur = await getPageSeo(key);
  const next = Object.assign({}, cur.payload, normalizePagePatch(patch));
  /* PD-13: strip residual page-level favicon — global-only */
  delete next.faviconUrl;
  delete next.faviconAssetId;

  const pageLabel = 'trang "' + key + '"';
  var qualityFields = {};
  if (patch.seoTitle != null || patch.title != null) {
    qualityFields.title = { value: patch.seoTitle != null ? patch.seoTitle : patch.title, label: pageLabel };
  }
  if (patch.metaDescription != null || patch.description != null) {
    qualityFields.description = {
      value: patch.metaDescription != null ? patch.metaDescription : patch.description,
      label: pageLabel
    };
  }
  const seoWarnings = await runContentQualityGate(qualityFields);

  // Empty string means UNSET/inherit — keep key as '' explicitly
  const actor = meta && meta.updated_by ? String(meta.updated_by) : null;
  const res = await query(
    `INSERT INTO page_seo_configs (page_key, payload, updated_at, updated_by)
     VALUES ($1, $2::jsonb, NOW(), $3)
     ON CONFLICT (page_key) DO UPDATE
       SET payload = EXCLUDED.payload,
           updated_at = NOW(),
           updated_by = EXCLUDED.updated_by
     RETURNING *`,
    [key, JSON.stringify(next), actor]
  );
  const row = res.rows[0];
  return {
    page_key: key,
    payload: asObject(row.payload),
    view: resolver.normalizePage(asObject(row.payload)),
    updated_at: row.updated_at,
    updated_by: row.updated_by,
    seoWarnings: seoWarnings
  };
}

/**
 * Resolve effective config for a page (+ optional article overlay object).
 */
async function resolveForPage(pageKey, articleOverlay) {
  const global = await getGlobalPayload();
  const pageRow = pageKey ? await getPageSeo(pageKey) : { payload: {} };
  return resolver.resolveEffectiveConfig({
    global: global,
    page: pageRow.payload,
    article: articleOverlay || {},
    fallback: { siteName: 'iFlux' }
  });
}

/**
 * Admin preview: Foundation field states + SEO Platform Contract preview/health (P8).
 * Same Contract engine as public First HTML — no second metadata engine.
 */
async function previewAdmin(pageKey, articleOverlay) {
  const resolved = await resolveForPage(pageKey, articleOverlay);
  var platform = null;
  var gaps = {
    versionHistory: false,
    rollbackUx: false,
    notes: [
      'Foundation có updated_at / updated_by trên page_seo_configs và brand payload — chưa có bảng revision / rollback UX.',
      'RBAC: marketing.seo_system.view|edit · marketing.seo_pages.view|edit (Foundation). Không tạo SEO Settings tree mới.',
      'SEO Platform /api/seo/platform/{preview,health,inspect} = runtime observability (read-only Contract).'
    ]
  };
  try {
    var seoPlatform = require('../seo-platform/seo-platform.service');
    var healthMod = require('../seo-platform/health');
    var contractBuilder = require('../seo-platform/seo-contract');
    var path =
      (pageKey && contractBuilder.PAGE_KEY_TO_PATH[pageKey]) ||
      '/thi-truong';
    var contract = await seoPlatform.resolveContract({
      pageKey: pageKey || 'market',
      path: path,
      httpStatus: 200
    });
    var preview = healthMod.buildPreviewFromContract(contract);
    var health = healthMod.evaluateSeoHealth(contract, {
      html: '<head>\n' + preview.headHtml + '</head>'
    });
    platform = {
      preview: preview,
      health: health,
      trace: contract.trace || null,
      identity: contract.identity || null,
      indexability: contract.indexability || null
    };
  } catch (e) {
    platform = {
      error: String(e && e.message ? e.message : e)
    };
  }
  return {
    page_key: pageKey || null,
    fields: resolved.fields,
    values: resolved.values,
    public: resolved.public,
    platform: platform,
    gaps: gaps
  };
}

/**
 * Public-safe projection only.
 * @param {string|null} pageKey
 * @param {object} [entityVars] — optional; when present, resolve title/description templates (Phase B).
 */
async function getPublicEffective(pageKey, entityVars) {
  const resolved = await resolveForPage(pageKey, null);
  const pub = Object.assign({}, resolved.public);
  /* canonical_path (relative — client tự ghép origin): dùng CHUNG PAGE_KEY_TO_PATH với
   * seo-platform/head-renderer (bot pipeline) để canonical human-DOM khớp bot-DOM (BR-45.5,
   * L5-TC-12). Chỉ áp dụng static page (market/community/flow/…) — page có entity riêng
   * (stock/sector/bài viết) đã tự set canonical qua IfluxSeoUrl ở client, không phụ thuộc field này. */
  try {
    const contractBuilder = require('../seo-platform/seo-contract');
    pub.canonical_path = (pageKey && contractBuilder.PAGE_KEY_TO_PATH[pageKey]) || null;
  } catch (e) {
    pub.canonical_path = null;
  }
  const placeholders = require('./page-seo-placeholders');
  const vars = entityVars && typeof entityVars === 'object' ? entityVars : null;
  if (vars && Object.keys(vars).length) {
    var rawTitle = resolved.values && resolved.values.seoTitle;
    var rawDesc = resolved.values && resolved.values.metaDescription;
    var titleRes = placeholders.resolveSeoTitleTemplate(rawTitle, vars);
    if (titleRes.title) pub.title = titleRes.title;
    var descRes = placeholders.resolveSeoTitleTemplate(rawDesc, vars);
    if (descRes.title) pub.description = descRes.title;
  }
  return pub;
}

module.exports = {
  getGlobalSeo,
  updateGlobalSeo,
  getPageSeo,
  listPageSeo,
  upsertPageSeo,
  resolveForPage,
  previewAdmin,
  getPublicEffective,
  GLOBAL_SEO_KEYS
};
