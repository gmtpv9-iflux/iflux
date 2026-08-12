'use strict';

/**
 * Admin Default SEO Templates (page_seo_configs) — VI placeholder resolve.
 * Reuses seo-platform applyTemplate. Admin seoTitle = SoT (not P3 TITLE_TEMPLATES).
 */

var applyTemplate = require('../seo-platform/entity-templates').applyTemplate;

function trimStr(v) {
  return String(v == null ? '' : v).trim();
}

function hasPlaceholder(s) {
  return /\{[^}]+\}/.test(String(s || ''));
}

/**
 * Build vars for Admin VI tokens (+ EN aliases for shared applyTemplate callers).
 * Pass explicit fields — do not overload a single `name` across entity kinds.
 */
function buildPlaceholderVars(input) {
  input = input || {};
  var ticker = trimStr(input.ticker || input['Mã']);
  var stockName = trimStr(input.stockName || input['Tên cổ phiếu']);
  var sectorName = trimStr(input.sectorName || input['Tên ngành']);
  var ecoName = trimStr(input.ecoName || input['Tên hệ sinh thái']);
  var authorName = trimStr(input.authorName || input['Tên tác giả']);
  var storyName = trimStr(input.storyName || input['Tên câu chuyện']);
  var categoryName = trimStr(input.categoryName || input['Tên danh mục']);
  var title = trimStr(input.title);
  var name = trimStr(input.name);

  var v = {};
  if (ticker) {
    v['Mã'] = ticker;
    v.ticker = ticker;
  }
  if (stockName) {
    v['Tên cổ phiếu'] = stockName;
    v.name = stockName;
  }
  if (sectorName) {
    v['Tên ngành'] = sectorName;
    if (!v.name) v.name = sectorName;
  }
  if (ecoName) {
    v['Tên hệ sinh thái'] = ecoName;
    if (!v.name) v.name = ecoName;
  }
  if (authorName) {
    v['Tên tác giả'] = authorName;
    if (!v.name) v.name = authorName;
  }
  if (storyName) {
    v['Tên câu chuyện'] = storyName;
    if (!v.name) v.name = storyName;
  }
  if (categoryName) {
    v['Tên danh mục'] = categoryName;
  }
  if (title) v.title = title;
  if (name && !v.name) v.name = name;
  return v;
}

/**
 * @returns {{ title: string, unresolved: boolean, template: string }}
 * title is '' when unresolved or empty — never returns string still containing {…}.
 */
function resolveSeoTitleTemplate(template, inputVars) {
  var tpl = trimStr(template);
  if (!tpl) return { title: '', unresolved: false, template: '' };
  if (!hasPlaceholder(tpl)) {
    return { title: tpl, unresolved: false, template: tpl };
  }
  var vars = buildPlaceholderVars(inputVars);
  var resolved = applyTemplate(tpl, vars);
  if (!resolved || hasPlaceholder(resolved)) {
    return { title: '', unresolved: true, template: tpl };
  }
  return { title: resolved, unresolved: false, template: tpl };
}

function templateField(raw) {
  var s = trimStr(raw);
  return hasPlaceholder(s) ? s : null;
}

function entityVarsFromQuery(q) {
  q = q || {};
  return buildPlaceholderVars({
    ticker: q.ticker,
    stockName: q.stockName || q.stock_name,
    sectorName: q.sectorName || q.sector_name,
    ecoName: q.ecoName || q.eco_name,
    authorName: q.authorName || q.author_name,
    storyName: q.storyName || q.story_name,
    categoryName: q.categoryName || q.category_name,
    name: q.name,
    title: q.title
  });
}

module.exports = {
  hasPlaceholder: hasPlaceholder,
  buildPlaceholderVars: buildPlaceholderVars,
  resolveSeoTitleTemplate: resolveSeoTitleTemplate,
  templateField: templateField,
  entityVarsFromQuery: entityVarsFromQuery,
  applyTemplate: applyTemplate
};
