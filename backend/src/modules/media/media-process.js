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
const MAX_DIMENSION = 8000;
const MAX_FRAMES = 120;
const MAX_PIXELS = 40 * 1000 * 1000;
const MAX_REDIRECTS = 5;
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
  const brand = buf.slice(4, 8).toString('ascii');
  const compat = buf.slice(8, 12).toString('ascii');
  if (brand === 'ftyp' && (compat === 'avif' || compat === 'avis' || compat === 'mif1')) {
    return 'image/avif';
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
  const sniffed = sniffMime(buf);
  if (!sniffed) {
    throw AppError.badRequest('MEDIA_TYPE', 'Không nhận diện được định dạng ảnh');
  }
  const declared = String(declaredMime || '').toLowerCase();
  if (declared && declared !== 'application/octet-stream' && declared.indexOf('image/') === 0) {
    const normDeclared = declared === 'image/jpg' ? 'image/jpeg' : declared;
    if (sniffed !== normDeclared && !(sniffed === 'image/jpeg' && normDeclared === 'image/jpg')) {
      throw AppError.badRequest('MEDIA_TYPE', 'MIME khai báo không khớp nội dung file');
    }
  }
  const norm = sniffed === 'image/jpg' ? 'image/jpeg' : sniffed;
  if (!ALLOWED.has(norm)) {
    throw AppError.badRequest('MEDIA_TYPE', 'Định dạng ảnh không được hỗ trợ');
  }
  return { mime: norm, byteSize: buf.length };
}

function mimeFromSharp(fmt) {
  const m = {
    jpeg: 'image/jpeg',
    jpg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    gif: 'image/gif',
    avif: 'image/avif'
  };
  return m[String(fmt || '').toLowerCase()] || '';
}

function extForMime(mime) {
  if (mime === 'image/png') return 'png';
  if (mime === 'image/webp') return 'webp';
  if (mime === 'image/gif') return 'gif';
  if (mime === 'image/avif') return 'avif';
  return 'jpg';
}

function assertSafeDimensions(meta) {
  const w = meta.width || 0;
  const h = meta.height || 0;
  const pages = meta.pages || 1;
  if (w > MAX_DIMENSION || h > MAX_DIMENSION) {
    throw AppError.badRequest('MEDIA_DIMENSION', 'Kích thước ảnh vượt giới hạn');
  }
  if (pages > MAX_FRAMES) {
    throw AppError.badRequest('MEDIA_FRAMES', 'Số frame vượt giới hạn');
  }
  if (w * h * pages > MAX_PIXELS) {
    throw AppError.badRequest('MEDIA_BOMB', 'Ảnh vượt giới hạn pixel an toàn');
  }
}

function isAnimatedMeta(meta) {
  const pages = meta.pages || 1;
  if (pages > 1) return true;
  const fmt = String(meta.format || '').toLowerCase();
  if (fmt === 'gif' && pages > 1) return true;
  if (Array.isArray(meta.delay) && meta.delay.length > 1) return true;
  return false;
}

function packBuffer(buffer, mime, width, height) {
  return {
    buffer: buffer,
    mime: mime,
    width: width || null,
    height: height || null,
    ext: extForMime(mime)
  };
}

/**
 * Master only. Does not emit delivery / thumbnail / social / original-permanent roles.
 */
async function createMaster(buf, declaredMime) {
  const validated = await validateImageBuffer(buf, declaredMime);
  const fp = fingerprint(buf);
  if (!sharp) {
    return {
      fingerprint: fp,
      master: packBuffer(buf, validated.mime, null, null),
      isAnimated: false,
      limitation: 'SHARP_UNAVAILABLE',
      usedOriginal: true
    };
  }

  let meta;
  try {
    meta = await sharp(buf, {
      failOn: 'none',
      animated: true,
      limitInputPixels: MAX_PIXELS
    }).metadata();
  } catch (e) {
    const msg = String((e && e.message) || e || '');
    if (/pixel|limitInputPixels/i.test(msg)) {
      throw AppError.badRequest('MEDIA_BOMB', 'Ảnh vượt giới hạn pixel an toàn');
    }
    throw AppError.badRequest('MEDIA_MALFORMED', 'Không đọc được ảnh');
  }
  assertSafeDimensions(meta);

  const animated = isAnimatedMeta(meta);
  if (animated) {
    try {
      const masterBuf = await sharp(buf, {
        failOn: 'none',
        animated: true,
        limitInputPixels: MAX_PIXELS
      })
        .rotate()
        .webp({ effort: 4 })
        .toBuffer();
      const outMeta = await sharp(masterBuf, { animated: true, failOn: 'none' }).metadata();
      if ((outMeta.pages || 1) < (meta.pages || 1)) {
        return {
          fingerprint: fp,
          master: packBuffer(buf, validated.mime, meta.width, meta.height),
          isAnimated: true,
          limitation: 'ANIMATION_NOT_PRESERVED',
          usedOriginal: true
        };
      }
      return {
        fingerprint: fp,
        master: packBuffer(masterBuf, 'image/webp', outMeta.width, outMeta.height),
        isAnimated: true,
        limitation: null,
        usedOriginal: false
      };
    } catch (e) {
      return {
        fingerprint: fp,
        master: packBuffer(buf, validated.mime, meta.width, meta.height),
        isAnimated: true,
        limitation: 'ANIMATION_ENCODE_FAILED',
        usedOriginal: true
      };
    }
  }

  const masterBuf = await sharp(buf, { failOn: 'none', limitInputPixels: MAX_PIXELS })
    .rotate()
    .webp({ lossless: true })
    .toBuffer();
  const outMeta = await sharp(masterBuf, { failOn: 'none' }).metadata();
  return {
    fingerprint: fp,
    master: packBuffer(masterBuf, 'image/webp', outMeta.width, outMeta.height),
    isAnimated: false,
    limitation: null,
    usedOriginal: false
  };
}

/**
 * Generate one derivative from master using a DB profile version row.
 * Does not read hardcoded consumer sizes.
 */
async function generateDerivative(masterBuf, profileVersion) {
  if (!masterBuf || !Buffer.isBuffer(masterBuf)) {
    throw AppError.badRequest('MEDIA_EMPTY', 'Master trống');
  }
  if (!profileVersion || !profileVersion.profile_key) {
    throw AppError.badRequest('MEDIA_PROFILE', 'Thiếu profile version');
  }
  if (!sharp) {
    throw AppError.badRequest('MEDIA_PROCESSOR', 'Sharp không khả dụng');
  }

  const crop = String(profileVersion.crop || 'none').toLowerCase();
  const format = String(profileVersion.format || 'webp').toLowerCase();
  const quality = profileVersion.quality != null ? Number(profileVersion.quality) : 80;
  const width = profileVersion.width != null ? Number(profileVersion.width) : null;
  const height = profileVersion.height != null ? Number(profileVersion.height) : null;
  const maxWidth = profileVersion.max_width != null ? Number(profileVersion.max_width) : null;

  let pipeline = sharp(masterBuf, { failOn: 'none', limitInputPixels: MAX_PIXELS }).rotate();

  if (crop === 'cover' && width && height) {
    pipeline = pipeline.resize(width, height, { fit: 'cover', position: 'centre' });
  } else if (maxWidth) {
    pipeline = pipeline.resize({ width: maxWidth, withoutEnlargement: true });
  } else if (width) {
    pipeline = pipeline.resize({ width: width, withoutEnlargement: true });
  }

  if (format === 'jpeg' || format === 'jpg') {
    pipeline = pipeline.flatten({ background: '#ffffff' }).jpeg({ quality: quality });
  } else if (format === 'png') {
    pipeline = pipeline.png();
  } else {
    pipeline = pipeline.webp({ quality: quality });
  }

  const buffer = await pipeline.toBuffer();
  const meta = await sharp(buffer, { failOn: 'none' }).metadata();
  const mime = format === 'jpeg' || format === 'jpg' ? 'image/jpeg' : format === 'png' ? 'image/png' : 'image/webp';
  return {
    profileKey: profileVersion.profile_key,
    version: profileVersion.version,
    versionId: profileVersion.version_id || profileVersion.id,
    pack: packBuffer(buffer, mime, meta.width, meta.height)
  };
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

function assertSafeUrl(url) {
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
  return parsed;
}

async function downloadImage(url, opts) {
  opts = opts || {};
  let current = String(url || '');
  assertSafeUrl(current);

  const controller = new AbortController();
  const timer = setTimeout(function () {
    controller.abort();
  }, opts.timeoutMs || 20000);

  try {
    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      const res = await fetch(current, {
        signal: controller.signal,
        redirect: 'manual',
        headers: { 'User-Agent': 'iFluxMediaBot/1.0' }
      });
      if (res.status >= 300 && res.status < 400) {
        const loc = res.headers.get('location');
        if (!loc) {
          throw AppError.badRequest('MEDIA_DOWNLOAD', 'Redirect không hợp lệ');
        }
        current = new URL(loc, current).toString();
        assertSafeUrl(current);
        continue;
      }
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
    }
    throw AppError.badRequest('MEDIA_SSRF', 'Quá nhiều redirect');
  } finally {
    clearTimeout(timer);
  }
}

module.exports = {
  fingerprint,
  validateImageBuffer,
  createMaster,
  generateDerivative,
  downloadImage,
  extForMime,
  mimeFromSharp,
  sniffMime,
  MAX_BYTES,
  MAX_DIMENSION,
  MAX_FRAMES,
  path
};
