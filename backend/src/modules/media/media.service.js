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
    is_animated: !!row.is_animated,
    limitation: row.limitation || null,
    master_variant_id: row.master_variant_id || null,
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
    `SELECT id, asset_id, role, format, width, height, byte_size, storage_key, public_url,
            profile_version_id, created_at
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
    `SELECT * FROM media_assets WHERE fingerprint = $1 AND status IN ('active','PROCESSING','READY') LIMIT 1`,
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
 * Persist master only + enqueue GENERATE. Worker (P5) generates derivatives.
 */
async function createAssetFromBuffer(config, buf, opts) {
  opts = opts || {};
  storage.ensureMediaRoot(config);
  const masterPack = await processImg.createMaster(buf, opts.declaredMime);
  const existing = await findByFingerprint(masterPack.fingerprint);
  if (existing) {
    return { asset: existing, reused: true };
  }

  const assetId = newId('mas');
  const now = new Date();
  const dir = storage.assetDir(config, assetId, now);
  const master = masterPack.master;
  const masterName = assetId + '-master@v1.' + master.ext;
  const key = pathJoin(dir, masterName);
  const written = await storage.writeVariantFile(config, key, master.buffer);
  const variantId = newId('mvar');

  await query(
    `INSERT INTO media_assets
      (id, status, fingerprint, filename, alt_text, caption, public_url, mime, byte_size, width, height,
       created_by, is_animated, limitation)
     VALUES ($1,'PROCESSING',$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
    [
      assetId,
      masterPack.fingerprint,
      masterName,
      String(opts.alt || '').trim(),
      String(opts.caption || '').trim(),
      '',
      master.mime,
      master.buffer.length,
      master.width,
      master.height,
      opts.createdBy || null,
      !!masterPack.isAnimated,
      masterPack.limitation || null
    ]
  );

  await query(
    `INSERT INTO media_variants
      (id, asset_id, role, format, width, height, byte_size, storage_key, public_url)
     VALUES ($1,$2,'master',$3,$4,$5,$6,$7,$8)`,
    [
      variantId,
      assetId,
      master.ext,
      master.width,
      master.height,
      master.buffer.length,
      written.storageKey,
      written.publicUrl
    ]
  );

  await query(
    `UPDATE media_assets SET master_variant_id = $2, updated_at = NOW() WHERE id = $1`,
    [assetId, variantId]
  );

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

  const queued = await enqueueGenerateForAsset(assetId, opts.createdBy, 'GENERATE');
  const asset = await getAsset(assetId);
  return { asset: asset, reused: false, masterPack: masterPack, jobIds: queued.jobIds };
}

async function persistRequiredDerivatives(config, assetId, masterBuf, dir) {
  const profiles = await listImageProfiles();
  for (let i = 0; i < profiles.length; i++) {
    const profile = profiles[i];
    const generated = await processImg.generateDerivative(masterBuf, profile);
    const ext = generated.pack.ext;
    const fileName = assetId + '-' + profile.profile_key + '@v' + profile.version + '.' + ext;
    const key = pathJoin(dir, fileName);
    const written = await storage.writeVariantFile(config, key, generated.pack.buffer);
    await query(
      `INSERT INTO media_variants
        (id, asset_id, role, format, width, height, byte_size, storage_key, public_url, profile_version_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       ON CONFLICT (asset_id, role) DO UPDATE SET
         format = EXCLUDED.format,
         width = EXCLUDED.width,
         height = EXCLUDED.height,
         byte_size = EXCLUDED.byte_size,
         storage_key = EXCLUDED.storage_key,
         public_url = EXCLUDED.public_url,
         profile_version_id = EXCLUDED.profile_version_id`,
      [
        newId('mvar'),
        assetId,
        profile.profile_key,
        generated.pack.ext,
        generated.pack.width,
        generated.pack.height,
        generated.pack.buffer.length,
        written.storageKey,
        written.publicUrl,
        profile.version_id
      ]
    );
  }
  await query(
    `UPDATE media_assets SET status = 'READY', updated_at = NOW() WHERE id = $1 AND status = 'PROCESSING'`,
    [assetId]
  );
}

function pathJoin() {
  return Array.prototype.slice.call(arguments).join('/').replace(/\/+/g, '/');
}

const PLATFORM_JOB_KINDS = ['GENERATE', 'REGENERATE', 'REBUILD', 'VERIFY', 'CLEANUP'];

async function createJob(kind, articleId, actorId, extra) {
  extra = extra || {};
  const id = newId('mjob');
  const status = extra.status || (extra.assetId ? 'queued' : 'running');
  await query(
    `INSERT INTO media_jobs
      (id, article_id, kind, status, actor_id, result, asset_id, profile_id, profile_version_id, attempt_count)
     VALUES ($1,$2,$3,$4,$5,'{}'::jsonb,$6,$7,$8,$9)`,
    [
      id,
      articleId || extra.articleId || null,
      kind || 'import',
      status,
      actorId || null,
      extra.assetId || null,
      extra.profileId || null,
      extra.profileVersionId || null,
      extra.attemptCount || 0
    ]
  );
  return id;
}

async function loadMasterVariant(assetId) {
  const res = await query(
    `SELECT id, storage_key, public_url, format, width, height
       FROM media_variants
      WHERE asset_id = $1 AND role = 'master'
      LIMIT 1`,
    [assetId]
  );
  return res.rows[0] || null;
}

async function markRegenerationUnavailable(assetId) {
  await query(
    `UPDATE media_assets SET status = 'REGENERATION_UNAVAILABLE', updated_at = NOW() WHERE id = $1`,
    [assetId]
  );
}

async function enqueueGenerateForProfile(profileKey, actorId, opts) {
  opts = opts || {};
  const profile = await getActiveProfileVersionByKey(profileKey);
  if (!profile) return { unavailable: 0, enqueued: 0, skipped: 0 };
  const limit = opts.limit != null ? Number(opts.limit) : 50;
  const res = await query(
    `SELECT a.id
       FROM media_assets a
       JOIN media_variants m ON m.asset_id = a.id AND m.role = 'master'
      WHERE a.status IN ('READY','active','PROCESSING')
      ORDER BY a.updated_at DESC
      LIMIT $1`,
    [limit]
  );
  let enqueued = 0;
  const jobIds = [];
  for (let i = 0; i < res.rows.length; i++) {
    const id = await createJob('GENERATE', null, actorId, {
      assetId: res.rows[i].id,
      profileId: profile.profile_id,
      profileVersionId: profile.version_id,
      status: 'queued'
    });
    jobIds.push(id);
    enqueued += 1;
  }
  return { enqueued: enqueued, jobIds: jobIds, profile: profile.profile_key, version: profile.version };
}

async function updateProfileStatus(profileKey, status) {
  const next = String(status || '').toUpperCase();
  if (next !== 'ACTIVE' && next !== 'INACTIVE' && next !== 'DEPRECATED') {
    throw AppError.badRequest('MEDIA_PROFILE', 'Trạng thái profile không hợp lệ');
  }
  const res = await query(
    `UPDATE media_image_profiles SET status = $2, updated_at = NOW()
      WHERE profile_key = $1 RETURNING id, profile_key, status`,
    [profileKey, next]
  );
  return res.rows[0] || null;
}

async function enqueueGenerateForAsset(assetId, actorId, kind) {
  const jobKind = kind || 'GENERATE';
  const master = await loadMasterVariant(assetId);
  if (!master) {
    await markRegenerationUnavailable(assetId);
    return { unavailable: true, jobIds: [] };
  }
  const profiles = await listImageProfiles();
  const jobIds = [];
  for (let i = 0; i < profiles.length; i++) {
    const p = profiles[i];
    const id = await createJob(jobKind, null, actorId, {
      assetId: assetId,
      profileId: p.id,
      profileVersionId: p.version_id,
      status: 'queued'
    });
    jobIds.push(id);
  }
  return { unavailable: false, jobIds: jobIds };
}

async function evaluateCleanupEligibility(assetId) {
  const asset = await getAsset(assetId);
  if (!asset) {
    return { eligible: false, reason: 'ASSET_MISSING' };
  }
  const master = (asset.variants || []).find(function (v) {
    return v.role === 'master';
  });
  const required = await listImageProfiles();
  const missing = [];
  for (let i = 0; i < required.length; i++) {
    const key = required[i].profile_key;
    const hit = (asset.variants || []).find(function (v) {
      return v.role === key && v.public_url;
    });
    if (!hit) missing.push(key);
  }
  const usageRes = await query(`SELECT COUNT(*)::int AS c FROM media_usages WHERE asset_id = $1`, [assetId]);
  const usageCount = usageRes.rows[0] ? usageRes.rows[0].c : 0;
  const masterReady = !!(master && master.public_url) && (asset.status === 'READY' || asset.status === 'active');
  const derivativesReady = missing.length === 0;
  const referencesUpdated = usageCount > 0 || asset.status === 'READY';
  const integrityVerified = masterReady && derivativesReady;
  const eligible = masterReady && derivativesReady && referencesUpdated && integrityVerified;
  return {
    eligible: eligible,
    masterReady: masterReady,
    derivativesReady: derivativesReady,
    referencesUpdated: referencesUpdated,
    integrityVerified: integrityVerified,
    missing: missing,
    usageCount: usageCount
  };
}

async function processPlatformJob(config, job) {
  const kind = String(job.kind || '').toUpperCase();
  const assetId = job.asset_id;
  if (!assetId) {
    await finishJob(job.id, 'failed', { error: 'MISSING_ASSET' });
    return;
  }
  const masterRow = await loadMasterVariant(assetId);
  if (!masterRow && kind !== 'VERIFY' && kind !== 'CLEANUP') {
    await markRegenerationUnavailable(assetId);
    await finishJob(job.id, 'REGENERATION_UNAVAILABLE', { error: 'NO_MASTER' });
    return;
  }

  if (kind === 'CLEANUP') {
    const gate = await evaluateCleanupEligibility(assetId);
    await finishJob(job.id, gate.eligible ? 'succeeded' : 'failed', { cleanup: gate, deleted: false });
    return;
  }

  if (kind === 'VERIFY') {
    const asset = await getAsset(assetId);
    const variants = (asset && asset.variants) || [];
    const missingFiles = [];
    for (let i = 0; i < variants.length; i++) {
      const full = storage.absolutePath(config, variants[i].storage_key);
      try {
        await require('fs').promises.access(full);
      } catch (e) {
        missingFiles.push(variants[i].role);
      }
    }
    await finishJob(job.id, missingFiles.length ? 'failed' : 'succeeded', { missingFiles: missingFiles });
    return;
  }

  const dir = storage.assetDir(config, assetId);
  const fs = require('fs');
  const masterBuf = await fs.promises.readFile(storage.absolutePath(config, masterRow.storage_key));

  if (kind === 'REBUILD') {
    await persistRequiredDerivatives(config, assetId, masterBuf, dir);
    await finishJob(job.id, 'succeeded', { rebuilt: true });
    return;
  }

  if (kind === 'GENERATE' || kind === 'REGENERATE') {
    let profile = null;
    if (job.profile_version_id) {
      const res = await query(
        `SELECT p.id, p.profile_key, v.id AS version_id, v.version, v.width, v.height,
                v.max_width, v.max_height, v.crop, v.format, v.quality, v.lossless, v.status
           FROM media_image_profile_versions v
           JOIN media_image_profiles p ON p.id = v.profile_id
          WHERE v.id = $1 LIMIT 1`,
        [job.profile_version_id]
      );
      profile = res.rows[0] || null;
    }
    if (!profile) {
      await finishJob(job.id, 'failed', { error: 'PROFILE_MISSING' });
      return;
    }
    const generated = await processImg.generateDerivative(masterBuf, profile);
    const fileName = assetId + '-' + profile.profile_key + '@v' + profile.version + '.' + generated.pack.ext;
    const key = pathJoin(dir, fileName);
    const written = await storage.writeVariantFile(config, key, generated.pack.buffer);
    await query(
      `INSERT INTO media_variants
        (id, asset_id, role, format, width, height, byte_size, storage_key, public_url, profile_version_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       ON CONFLICT (asset_id, role) DO UPDATE SET
         format = EXCLUDED.format,
         width = EXCLUDED.width,
         height = EXCLUDED.height,
         byte_size = EXCLUDED.byte_size,
         storage_key = EXCLUDED.storage_key,
         public_url = EXCLUDED.public_url,
         profile_version_id = EXCLUDED.profile_version_id`,
      [
        newId('mvar'),
        assetId,
        profile.profile_key,
        generated.pack.ext,
        generated.pack.width,
        generated.pack.height,
        generated.pack.buffer.length,
        written.storageKey,
        written.publicUrl,
        profile.version_id
      ]
    );
    await finishJob(job.id, 'succeeded', { profile: profile.profile_key, version: profile.version });
    return;
  }

  await finishJob(job.id, 'failed', { error: 'UNKNOWN_KIND' });
}

async function processQueuedMediaJobs(config, opts) {
  opts = opts || {};
  const limit = opts.limit || 4;
  const claimed = await query(
    `WITH next AS (
       SELECT id FROM media_jobs
        WHERE status = 'queued'
          AND kind IN ('GENERATE','REGENERATE','REBUILD','VERIFY','CLEANUP')
        ORDER BY created_at
        LIMIT $1
        FOR UPDATE SKIP LOCKED
     )
     UPDATE media_jobs j
        SET status = 'PROCESSING', started_at = NOW(), updated_at = NOW(),
            attempt_count = j.attempt_count + 1
       FROM next
      WHERE j.id = next.id
     RETURNING j.*`,
    [limit]
  );
  const jobs = claimed.rows || [];
  for (let i = 0; i < jobs.length; i++) {
    try {
      await processPlatformJob(config, jobs[i]);
    } catch (err) {
      await finishJob(jobs[i].id, 'failed', { error: (err && err.message) || 'JOB_ERROR' });
    }
  }
  return { claimed: jobs.length };
}

async function finishJob(jobId, status, result) {
  await query(
    `UPDATE media_jobs
        SET status = $2, result = $3::jsonb, updated_at = NOW(), completed_at = NOW()
      WHERE id = $1`,
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

async function listImageProfiles() {
  const res = await query(
    `SELECT p.id, p.profile_key, p.display_name, p.purpose, p.status,
            v.id AS version_id, v.version, v.width, v.height, v.max_width, v.max_height,
            v.crop, v.format, v.quality, v.lossless, v.status AS version_status, v.spec
       FROM media_image_profiles p
       JOIN media_image_profile_versions v
         ON v.profile_id = p.id AND v.status = 'ACTIVE'
      ORDER BY p.profile_key`
  );
  return res.rows;
}

async function getActiveProfileVersionByKey(profileKey) {
  const key = String(profileKey || '').trim();
  if (!key) return null;
  const res = await query(
    `SELECT p.id AS profile_id, p.profile_key, p.display_name, p.purpose,
            p.status AS profile_status,
            v.id AS version_id, v.version, v.width, v.height, v.max_width, v.max_height,
            v.crop, v.format, v.quality, v.lossless, v.status AS version_status, v.spec
       FROM media_image_profiles p
       JOIN media_image_profile_versions v ON v.profile_id = p.id
      WHERE p.profile_key = $1 AND p.status = 'ACTIVE' AND v.status = 'ACTIVE'
      ORDER BY v.version DESC
      LIMIT 1`,
    [key]
  );
  return res.rows[0] || null;
}

const PROFILE_ALIAS = { 'media-detail': 'media-hero' };
const LEGACY_ROLE_FALLBACK = {
  'media-compact': ['thumbnail'],
  'media-card': ['delivery'],
  'media-hero': ['delivery'],
  'media-body': ['delivery'],
  'media-og': ['social', 'delivery']
};

function profileTargetWidth(profile) {
  if (!profile) return null;
  if (profile.width != null) return Number(profile.width);
  if (profile.max_width != null) return Number(profile.max_width);
  return null;
}

function variantMime(v) {
  if (!v) return '';
  const fmt = String(v.format || '').toLowerCase();
  if (fmt === 'jpg' || fmt === 'jpeg') return 'image/jpeg';
  if (fmt === 'png') return 'image/png';
  if (fmt === 'gif') return 'image/gif';
  if (fmt === 'avif') return 'image/avif';
  if (fmt === 'webp') return 'image/webp';
  return v.mime || '';
}

function resolvedFromVariant(v, profileKey, version, status, fallback) {
  return {
    url: v && v.public_url ? v.public_url : '',
    width: v && v.width != null ? v.width : null,
    height: v && v.height != null ? v.height : null,
    mime: variantMime(v),
    profile: profileKey,
    version: version != null ? version : null,
    status: status,
    fallback: fallback || null
  };
}

async function resolveMedia(assetId, profileKey) {
  const rawKey = String(profileKey || '').trim();
  const requested = PROFILE_ALIAS[rawKey] || rawKey;
  const asset = await getAsset(assetId);
  if (!asset) {
    return {
      url: '',
      width: null,
      height: null,
      mime: '',
      profile: requested,
      version: null,
      status: 'NOT_FOUND',
      fallback: null
    };
  }
  const variants = asset.variants || [];
  const profile = requested ? await getActiveProfileVersionByKey(requested) : null;
  const version = profile ? profile.version : null;
  const registry = await listImageProfiles();
  const widthByKey = {};
  for (let i = 0; i < registry.length; i++) {
    const w = profileTargetWidth(registry[i]);
    if (w != null) widthByKey[registry[i].profile_key] = w;
  }

  const exact = variants.find(function (v) {
    return v.role === requested;
  });
  if (exact && exact.public_url) {
    return resolvedFromVariant(exact, requested, version, 'READY', rawKey === requested ? null : 'alias');
  }

  const registered = variants.filter(function (v) {
    return widthByKey[v.role] != null && v.public_url;
  });
  const target = widthByKey[requested];
  if (registered.length && target != null) {
    registered.sort(function (a, b) {
      return Math.abs(widthByKey[a.role] - target) - Math.abs(widthByKey[b.role] - target);
    });
    return resolvedFromVariant(registered[0], requested, version, 'FALLBACK', registered[0].role);
  }

  const legacyRoles = LEGACY_ROLE_FALLBACK[requested] || [];
  for (let i = 0; i < legacyRoles.length; i++) {
    const hit = variants.find(function (v) {
      return v.role === legacyRoles[i] && v.public_url;
    });
    if (hit) {
      return resolvedFromVariant(hit, requested, version, 'FALLBACK', hit.role);
    }
  }

  const master = variants.find(function (v) {
    return v.role === 'master' && v.public_url;
  });
  if (master) {
    return resolvedFromVariant(master, requested, version, 'FALLBACK', 'master');
  }

  return {
    url: '',
    width: null,
    height: null,
    mime: '',
    profile: requested,
    version: version,
    status: 'UNAVAILABLE',
    fallback: null
  };
}

async function findAssetByPublicUrl(url) {
  const raw = String(url || '').trim();
  if (!raw) return null;
  let pathOnly = raw;
  try {
    if (/^https?:\/\//i.test(raw)) pathOnly = new URL(raw).pathname;
  } catch (e) {
    pathOnly = raw;
  }
  const res = await query(
    `SELECT asset_id, role, public_url FROM media_variants
      WHERE public_url = $1 OR public_url = $2 OR storage_key = $3
      LIMIT 1`,
    [raw, pathOnly, pathOnly.replace(/^\/media\//, '')]
  );
  return res.rows[0] || null;
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
  resolveMedia,
  findAssetByPublicUrl,
  createJob,
  finishJob,
  getJob,
  enqueueGenerateForAsset,
  enqueueGenerateForProfile,
  updateProfileStatus,
  evaluateCleanupEligibility,
  processQueuedMediaJobs,
  PLATFORM_JOB_KINDS,
  listImageProfiles,
  getActiveProfileVersionByKey,
  mapAsset
};
