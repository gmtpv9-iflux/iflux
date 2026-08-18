'use strict';

const { LEGACY_TAG_TO_CANONICAL } = require('./variable-alias');

function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function resolveVariables(variables) {
  return Object.assign({}, variables || {});
}

function buildReplacementMap(variables, values) {
  var map = Object.create(null);
  (variables || []).forEach(function (v) {
    var val = values && values[v.key] != null ? values[v.key] : '';
    if (v.legacy_tag) {
      map[v.legacy_tag] = val;
      map['{' + v.legacy_tag + '}'] = val;
    }
    map[v.key] = val;
    map['{' + v.key + '}'] = val;
  });
  Object.keys(LEGACY_TAG_TO_CANONICAL).forEach(function (legacyTag) {
    var key = LEGACY_TAG_TO_CANONICAL[legacyTag];
    if (values && values[key] != null && map[legacyTag] == null) {
      map[legacyTag] = values[key];
      map['{' + legacyTag + '}'] = values[key];
    }
  });
  return map;
}

function renderTemplateString(templateStr, variables, values) {
  var text = String(templateStr || '');
  var resolved = resolveVariables(values);
  var map = buildReplacementMap(variables, resolved);
  var keys = Object.keys(map).filter(function (k) { return k.charAt(0) === '{'; });
  keys.sort(function (a, b) { return b.length - a.length; });
  keys.forEach(function (token) {
    text = text.split(token).join(escapeHtml(map[token]));
  });
  Object.keys(map).forEach(function (key) {
    if (key.charAt(0) === '{') return;
    var token = '{' + key + '}';
    if (text.indexOf(token) >= 0) {
      text = text.split(token).join(escapeHtml(map[key]));
    }
  });
  return text;
}

function normalizeVariableSchema(raw) {
  var variables = raw || [];
  if (typeof variables === 'string') {
    try { variables = JSON.parse(variables); } catch (e) { variables = []; }
  }
  return variables;
}

function renderNotification(typeRow, templateTitle, templateBody, variables) {
  var schema = normalizeVariableSchema(typeRow && typeRow.variables);
  var resolved = resolveVariables(variables);
  return {
    title: renderTemplateString(templateTitle, schema, resolved),
    body: renderTemplateString(templateBody, schema, resolved)
  };
}

function renderPreview(typeRow, title, body, overrideValues) {
  var variables = normalizeVariableSchema(typeRow && typeRow.variables);
  var sample = typeRow && typeRow.sample_variables ? typeRow.sample_variables : {};
  if (typeof sample === 'string') {
    try { sample = JSON.parse(sample); } catch (e) { sample = {}; }
  }
  var values = Object.assign({}, sample, resolveVariables(overrideValues));
  return {
    title: renderTemplateString(title, variables, values),
    body: renderTemplateString(body, variables, values)
  };
}

module.exports = {
  resolveVariables,
  renderTemplateString,
  renderNotification,
  renderPreview
};
