'use strict';

const { query } = require('../../core/database/connection');
const { AppError } = require('../../shared/exceptions/app-error');
const { newId, slugify } = require('./media-util');
const storage = require('./media-storage');
const processImg = require('./media-process');

function mapAsset(row, variants, source, usageCount) {
  if (!row) return null;
  return {
    id: row.id,
    status: row.status,
    fingerprint: row.fingerprint,
    filename: row.filename,
    alt_text: row.alt_text || '',
    caption: row.caption || '',
    public_url: row.public_url,
    mime: row.mime,
    byte_size: row.byte_size != null ? Number(row.byte_size) : null,
    width: row.width,
    height: row.height,
    created_by: row.created_by,
    created_at: row.created_at,
    updated_at: row.updated_at,
    variants: variants || [],
    source: source || null,
    usage_count: usageCount != null ? Number(usageCount) : undefined
  };
}

async function loadVariants(assetId) {
  const res = await query(
    `SELECT id, asset_id, role, format, width, height, byte_size, storage_key, public_url, created_at
     FROM media_variants WHERE asset_id = $1 ORDER BY role`,
    [assetId]
  );
  return res.rows;
}

async function loadSource(assetId) {
  const res = await query(
    `SELECT id, asset_id, original_url, channel, provider, captured_at
     FROM media_sources WHERE asset_id = $1 ORDER BY captured_at DESC LIMIT 1`,
    [assetId]
  );
  return res.rows[0] || null;
}

async function getAsset(id) {
  const res = await query(`SELECT * FROM media_assets WHERE id = $1 LIMIT 1`, [id]);
  const row = res.rows[0];
  if (!row) return null;
  const [variants, source, uc] = await Promise.all([
    loadVariants(id),
    loadSource(id),
    query(`SELECT COUNT(*)::int AS c FROM media_usages WHERE asset_id = $1`, [id])
  ]);
  return mapAsset(row, variants, source, uc.rows[0] && uc.rows[0].c);
}

async function findByFingerprint(fp) {
  if (!fp) return null;
  const res = await query(
    `SELECT * FROM media_assets WHERE fingerprint = $1 AND status = 'active' LIMIT 1`,
    [fp]
  );
  if (!res.rows[0]) return null;
  return getAsset(res.rows[0].id);
}

async function listAssets(filters) {
  filters = filters || {};
  const params = [];
  let where = `WHERE status <> 'deleted_soft'`;
  if (filters.status) {
    params.push(filters.status);
    where = `WHERE status = $${params.length}`;
  }
  if (filters.q) {
    params.push('%' + String(filters.q).trim() + '%');
    where += ` AND (filename ILIKE $${params.length} OR alt_text ILIKE $${params.length} OR public_url ILIKE $${params.length})`;
  }
  const limit = Math.min(Math.max(Number(filters.limit) || 40, 1), 100);
  const offset = Math.max(Number(filters.offset) || 0, 0);
  params.push(limit, offset);
  const res = await query(
    `SELECT a.*,
      (SELECT COUNT(*)::int FROM media_usages u WHERE u.asset_id = a.id) AS usage_count
     FROM media_assets a
     ${where}
     ORDER BY a.created_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );
  return res.rows.map(function (r) {
    return mapAsset(r, null, null, r.usage_count);
  });
}

async function listUsages(assetId) {
  const res = await query(
    `SELECT id, asset_id, article_id, scope, owner_ref, field_ref, created_at
     FROM media_usages WHERE asset_id = $1 ORDER BY created_at DESC`,
    [assetId]
  );
  return res.rows;
}

/** ARTICLE path — preserved for existing callers */
async function upsertUsage(assetId, articleId, fieldRef) {
  return upsertUsageScoped(assetId, 'ARTICLE', String(articleId || ''), fieldRef, articleId);
}

/**
 * Scoped usage for GLOBAL / PAGE / ARTICLE.
 * ARTICLE keeps article_id; GLOBAL/PAGE set article_id NULL.
 */
async function upsertUsageScoped(assetId, scope, ownerRef, fieldRef, articleId) {
  const id = newId('usu');
  const sc = String(scope || 'ARTICLE').toUpperCase();
  const owner = String(ownerRef || '').trim();
  const field = fieldRef || 'body';
  let art = null;
  if (sc === 'ARTICLE') {
    art = articleId != null ? String(articleId) : owner;
    if (!art) throw AppError.badRequest('BAD_REQUEST', 'Thiếu article_id cho usage ARTICLE');
  }
  await query(
    `INSERT INTO media_usages (id, asset_id, article_id, scope, owner_ref, field_ref)
     VALUES ($1,$2,$3,$4,$5,$6)
     ON CONFLICT (asset_id, scope, owner_ref, field_ref) DO NOTHING`,
    [id, assetId, art, sc, owner || art || 'global', field]
  );
}

async function softDeleteAsset(assetId) {
  const uc = await query(`SELECT COUNT(*)::int AS c FROM media_usages WHERE asset_id = $1`, [assetId]);
  if (uc.rows[0] && uc.rows[0].c > 0) {
    throw AppError.conflict('MEDIA_IN_USE', 'Ảnh đang được sử dụng — không thể xóa');
  }
  await query(
    `UPDATE media_assets SET status = 'deleted_soft', updated_at = NOW() WHERE id = $1`,
    [assetId]
  );
  return getAsset(assetId);
}

async function updateAlt(assetId, altText) {
  await query(
    `UPDATE media_assets SET alt_text = $2, updated_at = NOW() WHERE id = $1`,
    [assetId, String(altText || '').trim()]
  );
  return getAsset(assetId);
}

/**
 * Persist buffer as new asset (or return existing via dedup).
 */
async function createAssetFromBuffer(config, buf, opts) {
  opts = opts || {};
  storage.ensureMediaRoot(config);
  const variantsPack = await processImg.normalizeAndVariants(buf);
  const existing = await findByFingerprint(variantsPack.fingerprint);
  if (existing) {
    return { asset: existing, reused: true };
  }

  const assetId = newId('mas');
  const now = new Date();
  const dir = storage.assetDir(config, assetId, now);
  const baseName = slugify(opts.filenameHint || opts.title || 'img') + '-' + String(opts.seq || 1).padStart(3, '0');

  const roles = [
    { role: 'original', pack: variantsPack.original },
    { role: 'delivery', pack: variantsPack.delivery },
    { role: 'thumbnail', pack: variantsPack.thumbnail }
  ];
  if (variantsPack.social) {
    roles.push({ role: 'social', pack: variantsPack.social });
  }

  const written = [];
  for (let i = 0; i < roles.length; i++) {
    const r = roles[i];
    const key = pathJoin(dir, baseName + (r.role === 'delivery' ? '' : '.' + r.role) + '.' + r.pack.ext);
    const w = await storage.writeVariantFile(config, key, r.pack.buffer);
    written.push({
      role: r.role,
      format: r.pack.ext,
      width: r.pack.width,
      height: r.pack.height,
      byte_size: r.pack.buffer.length,
      storage_key: w.storageKey,
      public_url: w.publicUrl,
      mime: r.pack.mime
    });
  }

  const delivery = written.find(function (x) {
    return x.role === 'delivery';
  });
  const original = written.find(function (x) {
    return x.role === 'original';
  });

  await query(
    `INSERT INTO media_assets
      (id, status, fingerprint, filename, alt_text, caption, public_url, mime, byte_size, width, height, created_by)
     VALUES ($1,'active',$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
    [
      assetId,
      variantsPack.fingerprint,
      baseName,
      String(opts.alt || '').trim(),
      String(opts.caption || '').trim(),
      delivery.public_url,
      delivery.mime || original.mime,
      delivery.byte_size,
      delivery.width || original.width,
      delivery.height || original.height,
      opts.createdBy || null
    ]
  );

  for (let j = 0; j < written.length; j++) {
    const v = written[j];
    await query(
      `INSERT INTO media_variants
        (id, asset_id, role, format, width, height, byte_size, storage_key, public_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [
        newId('mvar'),
        assetId,
        v.role,
        v.format,
        v.width,
        v.height,
        v.byte_size,
        v.storage_key,
        v.public_url
      ]
    );
  }

  if (opts.sourceUrl || opts.channel) {
    await query(
      `INSERT INTO media_sources (id, asset_id, original_url, channel, provider)
       VALUES ($1,$2,$3,$4,$5)`,
      [
        newId('msrc'),
        assetId,
        opts.sourceUrl || null,
        opts.channel || 'upload',
        opts.provider || null
      ]
    );
  }

  const asset = await getAsset(assetId);
  return { asset: asset, reused: false };
}

function pathJoin() {
  return Array.prototype.slice.call(arguments).join('/').replace(/\/+/g, '/');
}

async function createJob(kind, articleId, actorId) {
  const id = newId('mjob');
  await query(
    `INSERT INTO media_jobs (id, article_id, kind, status, actor_id, result)
     VALUES ($1,$2,$3,'running',$4,'{}'::jsonb)`,
    [id, articleId || null, kind || 'import', actorId || null]
  );
  return id;
}

async function finishJob(jobId, status, result) {
  await query(
    `UPDATE media_jobs SET status = $2, result = $3::jsonb, updated_at = NOW() WHERE id = $1`,
    [jobId, status, JSON.stringify(result || {})]
  );
}

async function getJob(jobId) {
  const res = await query(`SELECT * FROM media_jobs WHERE id = $1 LIMIT 1`, [jobId]);
  return res.rows[0] || null;
}

var MIME_BY_FORMAT = { webp: 'image/webp', jpeg: 'image/jpeg', jpg: 'image/jpeg', png: 'image/png' };

function formatToMime(format) {
  return MIME_BY_FORMAT[String(format || '').toLowerCase()] || '';
}

/**
 * PD-20 / SOL-IMG: prefer JPEG/PNG public URL for OG/social (delivery is often WebP);
 * also returns real width/height/mime from media_variants so callers can emit
 * og:image:width|height|type instead of a bare URL (BR-05 social preview gap, 2026-08-11).
 * Looks up media_variants by delivery public_url; returns original jpeg/png when present.
 */
async function resolveSocialCompatibleImage(url) {
  var raw = String(url || '').trim();
  if (!raw) return { url: '', width: null, height: null, mime: '' };
  var pathOnly = raw;
  try {
    if (/^https?:\/\//i.test(raw)) {
      pathOnly = new URL(raw).pathname || raw;
    }
  } catch (e) {
    pathOnly = raw.split('?')[0];
  }
  pathOnly = String(pathOnly || '').split('?')[0];
  if (pathOnly.indexOf('/media/') !== 0) {
    return { url: raw, width: null, height: null, mime: '' };
  }
  try {
    if (/\.webp$/i.test(pathOnly)) {
      const swap = await query(
        `SELECT v.public_url, v.format, v.width, v.height
         FROM media_variants d
         JOIN media_variants v ON v.asset_id = d.asset_id
         WHERE d.public_url = $1 AND d.role = 'delivery'
           AND v.role IN ('social', 'original')
           AND lower(v.format) IN ('jpeg','jpg','png')
         ORDER BY CASE WHEN v.role = 'social' THEN 0 ELSE 1 END
         LIMIT 1`,
        [pathOnly]
      );
      var swapped = swap.rows[0];
      if (swapped && swapped.public_url) {
        var swappedUrl = swapped.public_url;
        if (/^https?:\/\//i.test(raw)) {
          try {
            var u = new URL(raw);
            u.pathname = swappedUrl;
            u.search = '';
            swappedUrl = u.toString();
          } catch (e2) {
            /* keep bare path */
          }
        }
        return {
          url: swappedUrl,
          width: swapped.width || null,
          height: swapped.height || null,
          mime: formatToMime(swapped.format)
        };
      }
    }
    const own = await query(
      `SELECT format, width, height FROM media_variants WHERE public_url = $1 LIMIT 1`,
      [pathOnly]
    );
    if (own.rows[0]) {
      return {
        url: raw,
        width: own.rows[0].width || null,
        height: own.rows[0].height || null,
        mime: formatToMime(own.rows[0].format)
      };
    }
  } catch (e) {
    /* keep raw, no metadata */
  }
  return { url: raw, width: null, height: null, mime: '' };
}

module.exports = {
  getAsset,
  listAssets,
  listUsages,
  upsertUsage,
  upsertUsageScoped,
  softDeleteAsset,
  updateAlt,
  createAssetFromBuffer,
  findByFingerprint,
  resolveSocialCompatibleImage,
  createJob,
  finishJob,
  getJob,
  mapAsset
};
