'use strict';

/**
 * SoT — WidgetPublished artifact (runtime-consumable, flattened).
 * Không chứa ViewModel. dependencies tách khỏi display.
 */

const WIDGET_ID_RE = /^WGT-[A-Z0-9][A-Z0-9_-]{2,48}$/;

function validateWidgetPublished(artifact) {
  const errors = [];
  if (!artifact || typeof artifact !== 'object') {
    return ['WidgetPublished phải là object'];
  }
  if (!artifact.id || !WIDGET_ID_RE.test(artifact.id)) {
    errors.push('id widget không hợp lệ');
  }
  if (artifact.version == null || Number(artifact.version) < 1) {
    errors.push('version phải >= 1');
  }
  if (!artifact.content || typeof artifact.content !== 'object') {
    errors.push('thiếu content');
  } else {
    if (!artifact.content.title) errors.push('content.title bắt buộc');
  }
  if (!artifact.display || typeof artifact.display !== 'object') {
    errors.push('thiếu display');
  } else {
    if (!artifact.display.renderer) errors.push('display.renderer bắt buộc');
    if (!artifact.display.module) errors.push('display.module bắt buộc');
    if (artifact.display.css) errors.push('display không được chứa css');
    if (artifact.display.dependencies) errors.push('dependencies phải nằm ngoài display');
  }
  if (!Array.isArray(artifact.dependencies)) {
    errors.push('dependencies phải là mảng');
  }
  if (!artifact.permission || typeof artifact.permission !== 'object') {
    errors.push('thiếu permission');
  }
  if (!artifact.capabilities || typeof artifact.capabilities !== 'object') {
    errors.push('thiếu capabilities');
  }
  if (artifact.viewModel != null) {
    errors.push('WidgetPublished không được chứa viewModel');
  }
  if (!artifact.publishMeta || typeof artifact.publishMeta !== 'object') {
    errors.push('thiếu publishMeta');
  } else {
    if (!artifact.publishMeta.etag) errors.push('publishMeta.etag bắt buộc');
    if (!artifact.publishMeta.checksum) errors.push('publishMeta.checksum bắt buộc');
  }
  return errors;
}

function toWidgetRef(artifact) {
  if (!artifact) return null;
  return {
    widgetId: artifact.id,
    version: artifact.version,
    etag: artifact.publishMeta && artifact.publishMeta.etag
  };
}

module.exports = { WIDGET_ID_RE, validateWidgetPublished, toWidgetRef };
