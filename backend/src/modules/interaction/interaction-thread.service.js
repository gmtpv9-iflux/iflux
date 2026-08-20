'use strict';

/**
 * Interaction Thread + Summary — RC-API-08…12 · IA-001 §6b · IA-003 §3b–3d
 */
const { query } = require('../../core/database/connection');
const { AppError } = require('../../shared/exceptions/app-error');
const newsComments = require('../news/news-comments.service');
  const newsInteraction = require('../news/interaction.service');

const REGISTRY = {
  post: 1,
  stock: 1,
  sector: 1,
  family: 1,
  story: 1
};

function normalizeType(raw) {
  var t = String(raw || 'post').toLowerCase().trim();
  if (t === 'article') t = 'post';
  if (t === 'ecosystem') t = 'family';
  if (!REGISTRY[t]) {
    throw AppError.badRequest('IX_TARGET_UNSUPPORTED', 'entityType không thuộc Interaction v1 registry');
  }
  return t;
}

function normalizeId(type, raw) {
  var id = String(raw || '').trim();
  if (!id) throw AppError.badRequest('IX_TARGET_ID_REQUIRED', 'Thiếu entityId');
  if (type === 'stock') return id.toUpperCase();
  return id;
}

function rowToComment(row) {
  if (!row) return null;
  return {
    id: row.id,
    user_id: row.user_id || null,
    user_name: row.user_name || 'Thành viên',
    body: row.body || '',
    image: row.image_url || null,
    parent_id: row.parent_id || null,
    created_at: row.created_at ? new Date(row.created_at).toISOString() : null
  };
}

async function listEntityComments(type, id, opts) {
  opts = opts || {};
  const limit = Math.min(Math.max(Number(opts.limit) || 100, 1), 200);
  const res = await query(
    `SELECT id, user_id, user_name, body, image_url, parent_id, created_at
     FROM interaction_comments
     WHERE deleted_at IS NULL
       AND entity_type = $1 AND entity_id = $2
     ORDER BY created_at DESC
     LIMIT $3`,
    [type, id, limit]
  );
  const comments = res.rows.map(rowToComment);
  return {
    target: { type: type, id: id },
    comments: comments,
    total: comments.length
  };
}

async function countEntityComments(type, id) {
  const res = await query(
    `SELECT COUNT(*)::int AS n
     FROM interaction_comments
     WHERE deleted_at IS NULL AND entity_type = $1 AND entity_id = $2`,
    [type, id]
  );
  return (res.rows[0] && res.rows[0].n) || 0;
}

async function createEntityComment(type, id, user, payload) {
  const body = String((payload && payload.body) || '').trim();
  const image = (payload && (payload.image || payload.image_url)) || null;
  const parentId = (payload && (payload.parentId || payload.parent_id)) || null;
  if (!body && !image) {
    throw AppError.badRequest('COMMENT_EMPTY', 'Nhập nội dung hoặc đính kèm hình ảnh');
  }
  if (body.length > 4000) {
    throw AppError.badRequest('COMMENT_TOO_LONG', 'Bình luận tối đa 4000 ký tự');
  }
  let imageUrl = null;
  if (image) {
    const raw = String(image);
    if (raw.length > 900000) {
      throw AppError.badRequest('COMMENT_IMAGE_TOO_LARGE', 'Ảnh đính kèm quá lớn');
    }
    imageUrl = raw;
  }
  const userId = user && user.id ? user.id : null;
  const userName = (user && (user.display_name || user.name)) || 'Thành viên';

  const res = await query(
    `INSERT INTO interaction_comments
       (entity_type, entity_id, user_id, user_name, body, image_url, parent_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, user_id, user_name, body, image_url, parent_id, created_at`,
    [type, id, userId, userName, body, imageUrl, parentId]
  );
  const comment = rowToComment(res.rows[0]);
  const total = await countEntityComments(type, id);

  let parentOwnerId = null;
  if (parentId) {
    try {
      const prow = await query(
        `SELECT user_id FROM interaction_comments WHERE id = $1 LIMIT 1`,
        [parentId]
      );
      parentOwnerId = prow.rows[0] && prow.rows[0].user_id ? prow.rows[0].user_id : null;
    } catch (e) { /* ignore */ }
  }
  try {
    const bus = require('../../core/events/bus');
    await bus.publish(bus.EVENTS.ENTITY_COMMENT_CREATED, {
      commentId: comment.id,
      entityType: type,
      entityId: id,
      authorId: userId,
      authorName: userName,
      parentId: parentId,
      parentOwnerId: parentOwnerId,
      bodyPreview: body
    });
  } catch (e) { /* ignore */ }

  return { comment: comment, total: total, target: { type: type, id: id } };
}

/**
 * Migrate one-shot từ client LS payload — giữ user_name lịch sử; user_id optional.
 * RC-API-12
 */
async function migrateEntityComments(type, id, items) {
  const existing = await countEntityComments(type, id);
  if (existing > 0) {
    return {
      inserted: 0,
      total: existing,
      skipped: 'already_has_comments',
      target: { type: type, id: id }
    };
  }
  const list = Array.isArray(items) ? items : [];
  let inserted = 0;
  for (let i = 0; i < list.length; i++) {
    const c = list[i] || {};
    const body = String(c.body || '').trim();
    const image = c.image || c.image_url || null;
    if (!body && !image) continue;
    const userName = String(c.user_name || c.userName || 'Thành viên').slice(0, 160);
    let userId = c.user_id || c.userId || null;
    if (userId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(userId))) {
      userId = null;
    }
    const createdAt = c.created_at || c.createdAt || null;
    try {
      if (createdAt) {
        await query(
          `INSERT INTO interaction_comments
             (entity_type, entity_id, user_id, user_name, body, image_url, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7::timestamptz)`,
          [type, id, userId, userName, body, image ? String(image) : null, createdAt]
        );
      } else {
        await query(
          `INSERT INTO interaction_comments
             (entity_type, entity_id, user_id, user_name, body, image_url)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [type, id, userId, userName, body, image ? String(image) : null]
        );
      }
      inserted += 1;
    } catch (e) {
      /* skip bad row */
    }
  }
  const total = await countEntityComments(type, id);
  return { inserted: inserted, total: total, target: { type: type, id: id } };
}

async function listThread(entityType, entityId, opts) {
  const type = normalizeType(entityType);
  const id = normalizeId(type, entityId);
  if (type === 'post') {
    const data = await newsComments.listComments(id, opts);
    return {
      target: { type: 'post', id: data.post_id || id, slug: data.post_slug || '' },
      comments: (data.comments || []).map(function (c) {
        return {
          id: c.id,
          user_id: c.user_id,
          user_name: c.user_name,
          body: c.body,
          image: c.image,
          parent_id: null,
          created_at: c.created_at
        };
      }),
      total: data.total != null ? data.total : (data.comments || []).length
    };
  }
  return listEntityComments(type, id, opts);
}

async function createThreadComment(entityType, entityId, user, payload) {
  const type = normalizeType(entityType);
  const id = normalizeId(type, entityId);
  if (type === 'post') {
    const data = await newsComments.createComment(id, user, payload);
    return {
      comment: {
        id: data.comment.id,
        user_id: data.comment.user_id,
        user_name: data.comment.user_name,
        body: data.comment.body,
        image: data.comment.image,
        parent_id: null,
        created_at: data.comment.created_at
      },
      total: data.total,
      target: { type: 'post', id: data.post_id || id }
    };
  }
  return createEntityComment(type, id, user, payload);
}

async function getSummary(entityType, entityId) {
  const type = normalizeType(entityType);
  const id = normalizeId(type, entityId);
  if (type === 'post') {
    return newsInteraction.getSummary('post', id);
  }
  const comments = await countEntityComments(type, id);
  return {
    target: { type: type, id: id },
    likes: 0,
    comments: comments,
    shares: 0,
    favorites: 0
  };
}

async function likeComment(commentId, user) {
  const uid = user && user.id ? user.id : null;
  if (!uid) throw AppError.unauthorized('Cần đăng nhập');
  const cRes = await query(
    `SELECT id, user_id, user_name, body, entity_type, entity_id
     FROM interaction_comments
     WHERE id = $1 AND deleted_at IS NULL
     LIMIT 1`,
    [commentId]
  );
  const row = cRes.rows[0];
  if (!row) throw AppError.notFound('Không tìm thấy bình luận');
  await query(
    `INSERT INTO interaction_comment_likes (comment_id, user_id)
     VALUES ($1, $2)
     ON CONFLICT DO NOTHING`,
    [commentId, uid]
  );
  try {
    const bus = require('../../core/events/bus');
    await bus.publish(bus.EVENTS.COMMENT_LIKED, {
      commentId: commentId,
      ownerId: row.user_id,
      likerId: uid,
      likerName: (user && (user.display_name || user.name)) || 'Thành viên',
      bodyPreview: row.body,
      entityType: row.entity_type,
      entityId: row.entity_id
    });
  } catch (e) { /* ignore */ }
  return { ok: true, commentId: commentId };
}

module.exports = {
  normalizeType: normalizeType,
  normalizeId: normalizeId,
  listThread: listThread,
  createThreadComment: createThreadComment,
  migrateEntityComments: migrateEntityComments,
  getSummary: getSummary,
  countEntityComments: countEntityComments,
  likeComment: likeComment
};
