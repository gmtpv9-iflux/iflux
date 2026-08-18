'use strict';

const path = require('path');
const crypto = require('crypto');

function mediaRoot(config) {
  const base = config.STORAGE_LOCAL_PATH || './storage';
  return path.resolve(base, 'media');
}

function publicBase(config) {
  const raw = (config.MEDIA_PUBLIC_BASE_URL || '').trim();
  if (raw) return raw.replace(/\/$/, '');
  return '/media';
}

function isMediaPublicUrl(url, config) {
  const u = String(url || '').trim();
  if (!u) return false;
  const base = publicBase(config);
  if (u.startsWith(base + '/') || u === base) return true;
  if (u.startsWith('/media/')) return true;
  try {
    const parsed = new URL(u);
    if (parsed.pathname.indexOf('/media/') === 0) return true;
  } catch (e) { /* ignore */ }
  return false;
}

function isExternalImageUrl(url, config) {
  const u = String(url || '').trim();
  if (!u) return false;
  if (!/^https?:\/\//i.test(u)) {
    return !isMediaPublicUrl(u, config);
  }
  return !isMediaPublicUrl(u, config);
}

function newId(prefix) {
  return (
    (prefix || 'med') +
    '_' +
    Date.now().toString(36) +
    '_' +
    crypto.randomBytes(4).toString('hex')
  );
}

function slugify(input, maxLen) {
  let s = String(input || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (!s) s = 'img';
  const max = maxLen || 60;
  if (s.length > max) s = s.slice(0, max).replace(/-+$/g, '');
  return s || 'img';
}

module.exports = {
  mediaRoot,
  publicBase,
  isMediaPublicUrl,
  isExternalImageUrl,
  newId,
  slugify
};
