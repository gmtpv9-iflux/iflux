'use strict';

const { query } = require('../../core/database/connection');
const { AppError } = require('../../shared/exceptions/app-error');
const renderer = require('./renderer');

function typeRowToDto(row, templateRow) {
  var variables = row.variables || [];
  if (typeof variables === 'string') {
    try { variables = JSON.parse(variables); } catch (e) { variables = []; }
  }
  var sampleVars = row.sample_variables || {};
  if (typeof sampleVars === 'string') {
    try { sampleVars = JSON.parse(sampleVars); } catch (e) { sampleVars = {}; }
  }
  var tpl = templateRow ? templateDto(templateRow) : null;
  return {
    code: row.code,
    legacyCaseId: row.legacy_case_id,
    adminCode: row.admin_code,
    name: row.name,
    description: row.description,
    category: row.category,
    group: row.group_label,
    channel: row.channel_label,
    variables: variables,
    sampleVariables: sampleVars,
    supportedChannels: row.supported_channels || ['in_app'],
    enabled: row.enabled,
    icon: row.icon || 'ti-bell',
    template: tpl
  };
}

function templateDto(row) {
  return {
    id: row.id,
    typeCode: row.type_code,
    channel: row.channel,
    title: row.title,
    body: row.body,
    seedTitle: row.seed_title,
    seedBody: row.seed_body,
    enabled: row.enabled,
    version: row.version,
    isCustom: row.title !== row.seed_title || row.body !== row.seed_body,
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null
  };
}

function renderTemplateString(templateStr, variables, values) {
  return renderer.renderTemplateString(templateStr, variables, values);
}

function renderPreview(typeRow, title, body, overrideValues) {
  return renderer.renderPreview(typeRow, title, body, overrideValues);
}

async function listTypes() {
  const res = await query(
    `SELECT t.*, tpl.id AS tpl_id, tpl.channel AS tpl_channel, tpl.title AS tpl_title,
            tpl.body AS tpl_body, tpl.seed_title, tpl.seed_body, tpl.enabled AS tpl_enabled,
            tpl.version, tpl.updated_at AS tpl_updated_at
     FROM notification_types t
     LEFT JOIN notification_templates tpl ON tpl.type_code = t.code AND tpl.channel = 'in_app'
     ORDER BY t.admin_code ASC`
  );
  return (res.rows || []).map(function (row) {
    var templateRow = row.tpl_id ? {
      id: row.tpl_id,
      type_code: row.code,
      channel: row.tpl_channel,
      title: row.tpl_title,
      body: row.tpl_body,
      seed_title: row.seed_title,
      seed_body: row.seed_body,
      enabled: row.tpl_enabled,
      version: row.version,
      updated_at: row.tpl_updated_at
    } : null;
    return typeRowToDto(row, templateRow);
  });
}

async function getTypeByCode(code) {
  const res = await query('SELECT * FROM notification_types WHERE code = $1', [code]);
  if (!res.rows[0]) return null;
  const tpl = await getTemplateRow(code, 'in_app');
  return typeRowToDto(res.rows[0], tpl);
}

async function getTemplateRow(typeCode, channel) {
  channel = channel || 'in_app';
  const res = await query(
    'SELECT * FROM notification_templates WHERE type_code = $1 AND channel = $2',
    [typeCode, channel]
  );
  return res.rows[0] || null;
}

async function getTemplate(typeCode, channel) {
  const type = await getTypeByCode(typeCode);
  if (!type) throw AppError.notFound('Không tìm thấy loại thông báo');
  if (!type.template) throw AppError.notFound('Không tìm thấy mẫu thông báo');
  return type;
}

async function patchTemplate(typeCode, payload, adminUserId) {
  const existing = await getTemplateRow(typeCode, 'in_app');
  if (!existing) throw AppError.notFound('Không tìm thấy mẫu thông báo');

  if (payload.version != null && Number(payload.version) !== Number(existing.version)) {
    throw AppError.conflict('VERSION_CONFLICT', 'Mẫu đã được cập nhật bởi người khác — vui lòng tải lại');
  }

  const title = payload.title != null ? String(payload.title) : existing.title;
  const body = payload.body != null ? String(payload.body) : existing.body;

  const res = await query(
    `UPDATE notification_templates
     SET title = $3, body = $4, version = version + 1,
         updated_at = NOW(), updated_by = $5
     WHERE type_code = $1 AND channel = $2
     RETURNING *`,
    [typeCode, 'in_app', title, body, adminUserId || null]
  );
  return templateDto(res.rows[0]);
}

async function restoreTemplate(typeCode, adminUserId) {
  const existing = await getTemplateRow(typeCode, 'in_app');
  if (!existing) throw AppError.notFound('Không tìm thấy mẫu thông báo');

  const res = await query(
    `UPDATE notification_templates
     SET title = seed_title, body = seed_body, version = version + 1,
         updated_at = NOW(), updated_by = $2
     WHERE type_code = $1 AND channel = 'in_app'
     RETURNING *`,
    [typeCode, adminUserId || null]
  );
  return templateDto(res.rows[0]);
}

async function patchTypeName(typeCode, name, adminUserId) {
  const trimmed = String(name || '').trim();
  if (!trimmed) {
    throw AppError.badRequest('NAME_REQUIRED', 'Tên mẫu không được để trống');
  }
  const res = await query(
    `UPDATE notification_types
     SET name = $2, updated_at = NOW(), updated_by = $3
     WHERE code = $1
     RETURNING code, name`,
    [typeCode, trimmed, adminUserId || null]
  );
  if (!res.rows[0]) throw AppError.notFound('Không tìm thấy loại thông báo');
  return res.rows[0];
}

async function previewTemplate(typeCode, payload) {
  const res = await query('SELECT * FROM notification_types WHERE code = $1', [typeCode]);
  if (!res.rows[0]) throw AppError.notFound('Không tìm thấy loại thông báo');
  const typeRow = res.rows[0];
  const tpl = await getTemplateRow(typeCode, 'in_app');

  const title = payload && payload.title != null
    ? payload.title
    : (tpl ? tpl.title : '');
  const body = payload && payload.body != null
    ? payload.body
    : (tpl ? tpl.body : '');

  return renderPreview(typeRow, title, body, payload && payload.variables);
}

module.exports = {
  listTypes,
  getTypeByCode,
  getTemplate,
  patchTemplate,
  patchTypeName,
  restoreTemplate,
  previewTemplate,
  renderTemplateString,
  renderPreview
};
