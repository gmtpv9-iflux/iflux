'use strict';

const fs = require('fs');
const path = require('path');
const { mediaRoot, publicBase, newId } = require('./media-util');

function ensureMediaRoot(config) {
  const root = mediaRoot(config);
  fs.mkdirSync(path.join(root, 'news'), { recursive: true });
  return root;
}

function assetDir(config, assetId, createdAt) {
  const d = createdAt ? new Date(createdAt) : new Date();
  const yyyy = String(d.getUTCFullYear());
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  return path.join('news', yyyy, mm, assetId);
}

function absolutePath(config, storageKey) {
  return path.join(mediaRoot(config), storageKey);
}

function toPublicUrl(config, storageKey) {
  const base = publicBase(config);
  const key = String(storageKey || '').replace(/^\/+/, '');
  return base + '/' + key;
}

async function writeVariantFile(config, storageKey, buffer) {
  const full = absolutePath(config, storageKey);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  await fs.promises.writeFile(full, buffer);
  return { storageKey, publicUrl: toPublicUrl(config, storageKey) };
}

module.exports = {
  ensureMediaRoot,
  assetDir,
  absolutePath,
  toPublicUrl,
  writeVariantFile,
  newId
};
