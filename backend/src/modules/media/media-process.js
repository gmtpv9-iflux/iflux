'use strict';

const crypto = require('crypto');
const path = require('path');
const { AppError } = require('../../shared/exceptions/app-error');
const { COVER_IMAGE_PROFILES } = require('./cover-image-profiles');

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
      rotatedBuffer: buf,
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
    rotatedBuffer: rotatedBuf,
    delivery: {
      buffer: deliveryBuf,
      mime: 'image/webp',
      width: deliveryMeta.width || null,
      height: deliveryMeta.height || null,
      ext: 'webp'
    }
  };
}

/* Khung hiển thị thật trên web (Header brand ≤ 150px ngang, favicon ≤ 32px vuông,
   apple-touch-icon ≤ 180px vuông) × buffer Retina/2x. Resize "inside" — KHÔNG crop,
   KHÔNG upscale (ảnh gốc nhỏ hơn khung thì giữ nguyên) — để không méo logo/biểu tượng. */
const BRAND_MARK_BOUNDS = {
  logo: { width: 320, height: 120 },
  favicon: { width: 256, height: 256 }
};

/**
 * Chuẩn hoá ảnh logo header / favicon — khác ảnh cover (không crop theo khung hiển thị,
 * vì logo cần giữ toàn bộ nội dung + tỉ lệ gốc). Dùng purpose='logo'|'favicon'.
 */
async function normalizeBrandMarkBuffer(buf, purpose) {
  const bounds = BRAND_MARK_BOUNDS[purpose] || BRAND_MARK_BOUNDS.logo;
  const fp = fingerprint(buf);
  if (!sharp) {
    const meta = await validateImageBuffer(buf);
    return {
      fingerprint: fp,
      rotatedBuffer: buf,
      delivery: { buffer: buf, mime: meta.mime, width: null, height: null, ext: extForMime(meta.mime) }
    };
  }

  const meta = await sharp(buf, { failOn: 'none' }).rotate().metadata();
  if ((meta.width || 0) > 8000 || (meta.height || 0) > 8000) {
    throw AppError.badRequest('MEDIA_DIMENSION', 'Kích thước ảnh vượt giới hạn');
  }

  const rotatedBuf = await sharp(buf, { failOn: 'none' }).rotate().toBuffer();
  const deliveryBuf = await sharp(rotatedBuf)
    .resize(bounds.width, bounds.height, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 90 })
    .toBuffer();
  const deliveryMeta = await sharp(deliveryBuf).metadata();
  return {
    fingerprint: fingerprint(rotatedBuf),
    rotatedBuffer: rotatedBuf,
    delivery: {
      buffer: deliveryBuf,
      mime: 'image/webp',
      width: deliveryMeta.width || null,
      height: deliveryMeta.height || null,
      ext: 'webp'
    }
  };
}

/**
 * Sinh các bản kích thước cố định cho ẢNH ĐẠI DIỆN (cover) — theo COVER_IMAGE_PROFILES
 * (backend/src/modules/media/cover-image-profiles.js). Chỉ gọi cho ảnh cover, không
 * gọi cho ảnh thân bài / ảnh thường để tránh phình storage ngoài ý muốn.
 */
async function generateCoverVariants(rotatedBuf) {
  if (!sharp || !rotatedBuf) return [];
  const out = [];
  for (let i = 0; i < COVER_IMAGE_PROFILES.length; i++) {
    const p = COVER_IMAGE_PROFILES[i];
    const isJpeg = p.format === 'jpeg';
    let pipeline = sharp(rotatedBuf).resize(p.width, p.height, {
      fit: p.fit || 'cover',
      position: 'centre'
    });
    pipeline = isJpeg
      ? pipeline.flatten({ background: '#ffffff' }).jpeg({ quality: p.quality || 85 })
      : pipeline.webp({ quality: p.quality || 82 });
    const buffer = await pipeline.toBuffer();
    out.push({
      role: p.key,
      buffer: buffer,
      mime: isJpeg ? 'image/jpeg' : 'image/webp',
      width: p.width,
      height: p.height,
      ext: isJpeg ? 'jpg' : 'webp'
    });
  }
  return out;
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
  normalizeBrandMarkBuffer,
  generateCoverVariants,
  downloadImage,
  extForMime,
  MAX_BYTES,
  path
};
