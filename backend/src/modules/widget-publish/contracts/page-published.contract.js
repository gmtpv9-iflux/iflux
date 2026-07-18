'use strict';

/**
 * SoT — PagePublished artifact.
 * Canonical persistence: placements + widgetRefs (logical reference).
 * Response có thể embed widgets[] — không lưu canonical dạng physical copy.
 */

const PAGE_KEY_RE = /^[a-z0-9][a-z0-9-]{0,60}$/;

function validatePageCanonical(artifact) {
  const errors = [];
  if (!artifact || typeof artifact !== 'object') {
    return ['PagePublished phải là object'];
  }
  if (!artifact.page || !PAGE_KEY_RE.test(artifact.page)) {
    errors.push('page key không hợp lệ');
  }
  if (artifact.version == null || Number(artifact.version) < 1) {
    errors.push('version phải >= 1');
  }
  if (!Array.isArray(artifact.sections)) {
    errors.push('sections phải là mảng');
  }
  if (!Array.isArray(artifact.placements)) {
    errors.push('placements phải là mảng');
  }
  if (!Array.isArray(artifact.widgetRefs)) {
    errors.push('widgetRefs phải là mảng');
  } else {
    artifact.widgetRefs.forEach(function (ref, i) {
      if (!ref || !ref.widgetId) errors.push('widgetRefs[' + i + '].widgetId bắt buộc');
      if (ref && ref.version == null) errors.push('widgetRefs[' + i + '].version bắt buộc');
    });
  }
  if (artifact.widgets != null) {
    errors.push('canonical PagePublished không được lưu widgets[] — chỉ dùng ở response embed');
  }
  if (!artifact.publishMeta || !artifact.publishMeta.etag) {
    errors.push('publishMeta.etag bắt buộc');
  }
  return errors;
}

/**
 * Gắn widgets[] vào response runtime (một request, không N+1 phía client).
 */
function buildPageResponse(canonical, embeddedWidgets) {
  const out = Object.assign({}, canonical);
  if (Array.isArray(embeddedWidgets) && embeddedWidgets.length) {
    out.widgets = embeddedWidgets;
  }
  return out;
}

module.exports = {
  PAGE_KEY_RE,
  validatePageCanonical,
  buildPageResponse
};
