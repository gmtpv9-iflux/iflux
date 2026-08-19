'use strict';

const crypto = require('crypto');
const path = require('path');
const { AppError } = require('../../shared/exceptions/app-error');

let sharp = null;
try {
  sharp = require('sharp');
} catch (e) {
  sharp = null;
}

const MAX_BYTES = 15 * 1024 * 1024;
const ALLOWED = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif'
]);

function fingerprint(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

function sniffMime(buf) {
  if (!buf || buf.length < 12) return '';
  if (buf[0] === 0xff && buf[1] === 0xd8) return 'image/jpeg';
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'image/png';
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) return 'image/gif';
  if (buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 && buf[8] === 0x57 && buf[9] === 0x45) {
    return 'image/webp';
  }
  return '';
}

async function validateImageBuffer(buf, declaredMime) {
  if (!buf || !Buffer.isBuffer(buf)) {
    throw AppError.badRequest('MEDIA_EMPTY', 'File ảnh trống');
  }
  if (buf.length > MAX_BYTES) {
    throw AppError.badRequest('MEDIA_TOO_LARGE', 'Ảnh vượt quá 15MB');
  }
  const mime = sniffMime(buf) || String(declaredMime || '').toLowerCase();
  if (!ALLOWED.has(mime) && !ALLOWED.has(mime.replace('image/jpg', 'image/jpeg'))) {
    throw AppError.badRequest('MEDIA_TYPE', 'Định dạng ảnh không được hỗ trợ');
  }
  return { mime: mime === 'image/jpg' ? 'image/jpeg' : mime, byteSize: buf.length };
}

async function validateShareImageBuffer(buf, declaredMime) {
  const meta = await validateImageBuffer(buf, declaredMime);
  if (meta.mime !== 'image/jpeg' && meta.mime !== 'image/png') {
    throw AppError.badRequest('MEDIA_TYPE', 'Ảnh Social/OG phải là JPEG hoặc PNG');
  }
  return meta;
}

async function normalizeAndVariants(buf) {
  const fp = fingerprint(buf);
  if (!sharp) {
    const meta = await validateImageBuffer(buf);
    return {
      fingerprint: fp,
      delivery: { buffer: buf, mime: meta.mime, width: null, height: null, ext: extForMime(meta.mime) }
    };
  }

  const meta = await sharp(buf, { failOn: 'none' }).rotate().metadata();
  if ((meta.width || 0) > 8000 || (meta.height || 0) > 8000) {
    throw AppError.badRequest('MEDIA_DIMENSION', 'Kích thước ảnh vượt giới hạn');
  }

  const rotatedBuf = await sharp(buf, { failOn: 'none' }).rotate().toBuffer();
  const deliveryBuf = await sharp(rotatedBuf).webp({ quality: 80 }).toBuffer();
  const deliveryMeta = await sharp(deliveryBuf).metadata();
  return {
    fingerprint: fingerprint(rotatedBuf),
    delivery: {
      buffer: deliveryBuf,
      mime: 'image/webp',
      width: deliveryMeta.width || null,
      height: deliveryMeta.height || null,
      ext: 'webp'
    }
  };
}

function extForMime(mime) {
  if (mime === 'image/png') return 'png';
  if (mime === 'image/webp') return 'webp';
  if (mime === 'image/gif') return 'gif';
  if (mime === 'image/avif') return 'avif';
  return 'jpg';
}

function isPrivateHost(hostname) {
  const h = String(hostname || '').toLowerCase();
  if (!h || h === 'localhost' || h.endsWith('.local')) return true;
  if (h === 'metadata.google.internal') return true;
  const m = /^(\d+)\.(\d+)\.(\d+)\.(\d+)$/.exec(h);
  if (!m) return false;
  const a = Number(m[1]);
  const b = Number(m[2]);
  if (a === 10 || a === 127 || a === 0) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  return false;
}

async function downloadImage(url, opts) {
  opts = opts || {};
  let parsed;
  try {
    parsed = new URL(url);
  } catch (e) {
    throw AppError.badRequest('MEDIA_URL', 'URL ảnh không hợp lệ');
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw AppError.badRequest('MEDIA_URL', 'Chỉ hỗ trợ http/https');
  }
  if (isPrivateHost(parsed.hostname)) {
    throw AppError.badRequest('MEDIA_SSRF', 'URL ảnh không được phép');
  }

  const controller = new AbortController();
  const timer = setTimeout(function () {
    controller.abort();
  }, opts.timeoutMs || 20000);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: { 'User-Agent': 'iFluxMediaBot/1.0' }
    });
    if (!res.ok) {
      throw AppError.badRequest('MEDIA_DOWNLOAD', 'Tải ảnh thất bại: HTTP ' + res.status);
    }
    const ctype = String(res.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
    const ab = await res.arrayBuffer();
    const buf = Buffer.from(ab);
    if (buf.length > MAX_BYTES) {
      throw AppError.badRequest('MEDIA_TOO_LARGE', 'Ảnh tải về vượt quá 15MB');
    }
    await validateImageBuffer(buf, ctype);
    return buf;
  } finally {
    clearTimeout(timer);
  }
}

module.exports = {
  fingerprint,
  validateImageBuffer,
  validateShareImageBuffer,
  normalizeAndVariants,
  downloadImage,
  extForMime,
  MAX_BYTES,
  path
};
