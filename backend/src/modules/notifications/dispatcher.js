'use strict';

const templateService = require('./template.service');
const preferenceService = require('./preference.service');
const renderer = require('./renderer');
const deliveryChannel = require('./delivery-channel');
const { isDispatchableTypeCode } = require('./variable-alias');
const { AppError } = require('../../shared/exceptions/app-error');

async function loadTemplate(typeCode, channel) {
  if (!isDispatchableTypeCode(typeCode)) {
    throw AppError.badRequest('TYPE_NOT_DISPATCHABLE', 'Type nội bộ — không được dispatch: ' + typeCode);
  }
  return templateService.getTemplate(typeCode, channel || 'in_app');
}

function validateDispatchRequest(opts) {
  opts = opts || {};
  if (!opts.typeCode) {
    throw AppError.badRequest('TYPE_REQUIRED', 'typeCode bắt buộc');
  }
  if (!opts.recipientUserId) {
    throw AppError.badRequest('RECIPIENT_REQUIRED', 'recipientUserId bắt buộc');
  }
  if (!isDispatchableTypeCode(opts.typeCode)) {
    throw AppError.badRequest('TYPE_NOT_DISPATCHABLE', 'Type nội bộ — không được dispatch');
  }
  if (opts.variables != null && typeof opts.variables !== 'object') {
    throw AppError.badRequest('VARIABLES_INVALID', 'variables phải là object');
  }
  return opts;
}

async function dispatch(opts) {
  const req = validateDispatchRequest(opts);
  const typeData = await templateService.getTypeByCode(req.typeCode);

  if (!typeData) {
    throw AppError.notFound('Không tìm thấy loại thông báo');
  }
  if (typeData.enabled === false) {
    return { skipped: true, reason: 'type_disabled' };
  }
  if (!typeData.template) {
    throw AppError.notFound('Không tìm thấy mẫu thông báo');
  }

  const canSend = await preferenceService.canDeliver(req.recipientUserId, req.typeCode);
  if (!canSend) {
    return { skipped: true, reason: 'preference_off' };
  }

  const tpl = typeData.template;
  const rendered = renderer.renderNotification(
    { variables: typeData.variables },
    tpl.title,
    tpl.body,
    req.variables || {}
  );

  const item = await deliveryChannel.sendInApp({
    recipientUserId: req.recipientUserId,
    templateCode: req.typeCode,
    title: rendered.title,
    body: rendered.body,
    href: req.href || '',
    icon: req.icon || typeData.icon || 'ti-bell',
    dedupeKey: req.dedupeKey || null,
    metadata: req.metadata || null
  });

  return {
    delivered: !!item,
    skipped: !item,
    reason: item ? null : 'dedupe_or_empty',
    item: item
  };
}

module.exports = {
  loadTemplate,
  dispatch,
  preview: templateService.previewTemplate
};
