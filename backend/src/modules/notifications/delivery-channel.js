'use strict';

const inbox = require('./inbox.service');

async function sendInApp(payload) {
  payload = payload || {};
  if (!payload.recipientUserId) return null;
  return inbox.pushToUser(payload.recipientUserId, {
    templateCode: payload.templateCode || payload.typeCode || 'SYS',
    title: payload.title,
    body: payload.body,
    icon: payload.icon,
    href: payload.href,
    dedupeKey: payload.dedupeKey
  });
}

module.exports = {
  sendInApp
};
