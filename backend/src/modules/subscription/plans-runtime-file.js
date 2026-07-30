'use strict';

const fs = require('fs');
const path = require('path');
const { buildPublishedArtifact } = require('./plan-normalize-publish');

const RUNTIME_FILE = path.join(__dirname, '../../../data/plans-runtime.json');
const USER_WEB_FILE = path.join(__dirname, '../../../../User_Web/data/iflux-plans-v1.json');

function readRuntimeFile() {
  try {
    if (!fs.existsSync(RUNTIME_FILE)) {
      return buildPublishedArtifact({ version: 1, updatedAt: 0, overrides: {}, custom: [] });
    }
    const raw = JSON.parse(fs.readFileSync(RUNTIME_FILE, 'utf8'));
    if (Array.isArray(raw.plans) && raw.plans.length) return raw;
    return buildPublishedArtifact(raw);
  } catch (e) {
    return buildPublishedArtifact({ version: 1, updatedAt: 0, overrides: {}, custom: [] });
  }
}

function writeRuntimeFile(data) {
  const artifact = buildPublishedArtifact(data);
  const json = JSON.stringify(artifact, null, 2);
  fs.mkdirSync(path.dirname(RUNTIME_FILE), { recursive: true });
  fs.writeFileSync(RUNTIME_FILE, json, 'utf8');
  try {
    fs.mkdirSync(path.dirname(USER_WEB_FILE), { recursive: true });
    fs.writeFileSync(USER_WEB_FILE, json, 'utf8');
  } catch (e) {
    /* User_Web path optional in some deploy layouts */
  }
  return artifact;
}

/** Entitlement matrix payload → plans runtime file shape. */
function entitlementPayloadToRuntime(payload) {
  if (!payload || typeof payload !== 'object') return null;
  if (!payload.overrides && !payload.custom) return null;
  return {
    version: payload.version || 1,
    updatedAt: payload.updatedAt || Date.now(),
    overrides: payload.overrides || {},
    custom: payload.custom || []
  };
}

module.exports = {
  readRuntimeFile,
  writeRuntimeFile,
  entitlementPayloadToRuntime,
  RUNTIME_FILE
};
