'use strict';

/**
 * SEO Content Quality Validation — BR-19 (Description Automation) + BR-20 (Title Automation).
 * `01 - Business Requirement.md` §23-24: title/description phải validate empty/duplicate/length/
 * invalid-characters/HTML/quality-threshold; description không đạt chất lượng → SEO Warning
 * (không silently tạo nội dung SEO rác). Errors = block save (phá vỡ correctness của <head>).
 * Warnings = trả về cho Admin, không block save (chất lượng/best-practice).
 */

var TITLE_MIN = 10;
var TITLE_MAX_RECOMMENDED = 70;
var DESC_MIN = 50;
var DESC_MAX_RECOMMENDED = 160;

var HTML_TAG_RE = /<[a-z][\s\S]*?>|<\/[a-z][\s\S]*?>/i;
var INVALID_CHAR_RE = /[\r\n\t\u0000-\u0008\u000b-\u001f]/; // control chars / line breaks trong <title>

function normalize(value) {
  return typeof value === 'string' ? value : value == null ? '' : String(value);
}

function isBlankButExplicit(raw) {
  return raw != null && normalize(raw).trim().length === 0;
}

function findDuplicateOwner(value, others) {
  var trimmed = normalize(value).trim().toLowerCase();
  if (!trimmed) return null;
  for (var i = 0; i < others.length; i++) {
    var o = others[i];
    if (o && o.value && normalize(o.value).trim().toLowerCase() === trimmed) {
      return o.owner || null;
    }
  }
  return null;
}

/**
 * @param {string|null} value
 * @param {{ others?: Array<{owner:string, value:string}> }} ctx others = giá trị title hiện có ở các scope khác (Global/Page khác) để check duplicate
 */
function validateTitle(value, ctx) {
  ctx = ctx || {};
  var errors = [];
  var warnings = [];
  if (value == null) return { errors: errors, warnings: warnings }; // null = unset/inherit, hợp lệ

  if (isBlankButExplicit(value)) {
    warnings.push({ code: 'TITLE_EMPTY', message: 'Tiêu đề SEO trống — sẽ dùng giá trị kế thừa (Page/Global fallback).' });
    return { errors: errors, warnings: warnings };
  }

  var trimmed = normalize(value).trim();

  if (HTML_TAG_RE.test(trimmed)) {
    errors.push({ code: 'TITLE_HTML', message: 'Tiêu đề SEO không được chứa thẻ HTML.' });
  }
  if (INVALID_CHAR_RE.test(value)) {
    errors.push({ code: 'TITLE_INVALID_CHARS', message: 'Tiêu đề SEO chứa ký tự không hợp lệ (xuống dòng/control character).' });
  }
  if (trimmed.length < TITLE_MIN) {
    warnings.push({
      code: 'TITLE_TOO_SHORT',
      message: 'Tiêu đề SEO quá ngắn (' + trimmed.length + ' ký tự, khuyến nghị tối thiểu ' + TITLE_MIN + ').'
    });
  }
  if (trimmed.length > TITLE_MAX_RECOMMENDED) {
    warnings.push({
      code: 'TITLE_TOO_LONG',
      message:
        'Tiêu đề SEO dài hơn khuyến nghị (' + trimmed.length + ' ký tự, nên ≤ ' + TITLE_MAX_RECOMMENDED + ' để không bị Google cắt).'
    });
  }
  var dupOwner = findDuplicateOwner(trimmed, ctx.others || []);
  if (dupOwner) {
    warnings.push({ code: 'TITLE_DUPLICATE', message: 'Tiêu đề SEO trùng với ' + dupOwner + '.' });
  }

  return { errors: errors, warnings: warnings };
}

/**
 * @param {string|null} value
 * @param {{ others?: Array<{owner:string, value:string}> }} ctx
 */
function validateDescription(value, ctx) {
  ctx = ctx || {};
  var errors = [];
  var warnings = [];
  if (value == null) return { errors: errors, warnings: warnings };

  if (isBlankButExplicit(value)) {
    warnings.push({ code: 'DESCRIPTION_EMPTY', message: 'Meta description trống — sẽ dùng giá trị kế thừa (Page/Global fallback).' });
    return { errors: errors, warnings: warnings };
  }

  var trimmed = normalize(value).trim();

  if (HTML_TAG_RE.test(trimmed)) {
    errors.push({ code: 'DESCRIPTION_HTML', message: 'Meta description không được chứa thẻ HTML.' });
  }
  if (trimmed.length < DESC_MIN) {
    warnings.push({
      code: 'DESCRIPTION_TOO_SHORT',
      message: 'Meta description quá ngắn (' + trimmed.length + ' ký tự, khuyến nghị tối thiểu ' + DESC_MIN + ') — SEO Warning: chất lượng thấp.'
    });
  }
  if (trimmed.length > DESC_MAX_RECOMMENDED) {
    warnings.push({
      code: 'DESCRIPTION_TOO_LONG',
      message:
        'Meta description dài hơn khuyến nghị (' + trimmed.length + ' ký tự, nên ≤ ' + DESC_MAX_RECOMMENDED + ' để không bị Google cắt).'
    });
  }
  var dupOwner = findDuplicateOwner(trimmed, ctx.others || []);
  if (dupOwner) {
    warnings.push({ code: 'DESCRIPTION_DUPLICATE', message: 'Meta description trùng với ' + dupOwner + '.' });
  }

  return { errors: errors, warnings: warnings };
}

module.exports = {
  validateTitle: validateTitle,
  validateDescription: validateDescription,
  TITLE_MIN: TITLE_MIN,
  TITLE_MAX_RECOMMENDED: TITLE_MAX_RECOMMENDED,
  DESC_MIN: DESC_MIN,
  DESC_MAX_RECOMMENDED: DESC_MAX_RECOMMENDED
};
