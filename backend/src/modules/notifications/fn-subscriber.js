'use strict';

const bus = require('../../core/events/bus');
const follow = require('../follow/follow.service');
const dispatcher = require('./dispatcher');
const inbox = require('./inbox.service');

function preview(text, n) {
  const s = String(text || '').replace(/\s+/g, ' ').trim();
  if (s.length <= (n || 120)) return s;
  return s.slice(0, n || 120) + '…';
}

function postHref(slug, id) {
  const key = slug || id;
  if (!key) return '/cong-dong';
  return '/cong-dong/bai-viet/' + encodeURIComponent(key);
}

function entityHref(type, id, commentId) {
  var path = '/co-phieu/' + encodeURIComponent(id);
  if (type === 'sector') path = '/nganh/' + encodeURIComponent(id);
  else if (type === 'family') path = '/he-sinh-thai/' + encodeURIComponent(id);
  else if (type === 'story') path = '/chu-de/' + encodeURIComponent(id);
  else if (type === 'post') path = postHref(null, id);
  if (commentId) path += '#comment-' + commentId;
  return path;
}

function entityTypeLabel(type) {
  if (type === 'sector') return 'Ngành';
  if (type === 'family') return 'Hệ sinh thái';
  if (type === 'story') return 'Chủ đề';
  if (type === 'post') return 'Bài viết';
  return 'Cổ phiếu';
}

async function dispatchSafe(payload) {
  try {
    await dispatcher.dispatch(payload);
  } catch (e) {
    /* non-blocking subscriber */
  }
}

async function onPostPublished(payload) {
  const post = payload || {};
  if (post.status && post.status !== 'published' && post.status !== 'published_rss') return;
  const authorId = post.authorId || post.author_id || null;
  const title = post.title || 'Bài viết mới';
  const slug = post.slug || '';
  const postId = post.postId || post.id;
  const href = postHref(slug, postId);
  const authorName = post.authorName || post.author_name || 'Thành viên';

  if (authorId) {
    const followerIds = await follow.listFollowerIds(authorId, 200);
    for (let i = 0; i < followerIds.length; i++) {
      if (String(followerIds[i]) === String(authorId)) continue;
      await dispatchSafe({
        typeCode: 'COMMUNITY_POST_FROM_FOLLOWING',
        recipientUserId: followerIds[i],
        variables: {
          actor: authorName,
          post_title: title
        },
        href: href,
        icon: 'ti-news',
        dedupeKey: 'comm_post:' + postId + ':' + followerIds[i]
      });
    }
  }

  const tickers = Array.isArray(post.tickers) ? post.tickers : [];
  const seen = Object.create(null);
  for (let t = 0; t < tickers.length; t++) {
    const tk = String(tickers[t] || '').toUpperCase();
    if (!tk || seen[tk]) continue;
    seen[tk] = true;
    const userIds = await inbox.findWatchlistUserIdsByTicker(tk, 200);
    for (let i = 0; i < userIds.length; i++) {
      if (authorId && String(userIds[i]) === String(authorId)) continue;
      await dispatchSafe({
        typeCode: 'FOLLOW_ENTITY_TAGGED_POST',
        recipientUserId: userIds[i],
        variables: {
          entity_name: tk,
          entity_type: 'Cổ phiếu',
          actor: authorName,
          post_title: title
        },
        href: href,
        icon: 'ti-bookmark',
        dedupeKey: 'wl_tag:' + postId + ':' + tk + ':' + userIds[i]
      });
    }
  }
}

async function onPostShared(payload) {
  const p = payload || {};
  const actorId = p.actorId || p.actor_id;
  if (!actorId) return;
  const followerIds = await follow.listFollowerIds(actorId, 200);
  const title = p.title || 'Bài viết';
  const href = postHref(p.slug, p.postId || p.id);
  const actorName = p.actorName || p.actor_name || 'Thành viên';
  const postId = p.postId || p.id;
  for (let i = 0; i < followerIds.length; i++) {
    if (String(followerIds[i]) === String(actorId)) continue;
    await dispatchSafe({
      typeCode: 'FOLLOW_USER_SHARE',
      recipientUserId: followerIds[i],
      variables: {
        actor: actorName,
        post_title: title
      },
      href: href,
      icon: 'ti-share-3',
      dedupeKey: 'share:' + postId + ':' + actorId + ':' + followerIds[i]
    });
  }
}

async function onEntityComment(payload) {
  const p = payload || {};
  const authorId = p.authorId || p.author_id;
  const parentId = p.parentId || p.parent_id || null;
  const authorName = p.authorName || p.author_name || 'Thành viên';
  const bodyPreview = preview(p.bodyPreview || p.body, 100);
  const href = entityHref(p.entityType, p.entityId, p.commentId);

  if (parentId) {
    const ownerId = p.parentOwnerId || p.parent_owner_id;
    if (ownerId && authorId && String(ownerId) !== String(authorId)) {
      await dispatchSafe({
        typeCode: 'INTERACTION_COMMENT_REPLY',
        recipientUserId: ownerId,
        variables: {
          actor: authorName,
          comment_preview: bodyPreview
        },
        href: href,
        icon: 'ti-message-reply',
        dedupeKey: 'reply:' + p.commentId
      });
    }
    return;
  }

  if (!authorId) return;
  if (p.entityType === 'post') return;
  const entityName = String(p.entityId || '');
  const followerIds = await follow.listFollowerIds(authorId, 200);
  for (let i = 0; i < followerIds.length; i++) {
    if (String(followerIds[i]) === String(authorId)) continue;
    await dispatchSafe({
      typeCode: 'FOLLOW_ENTITY_COMMENT',
      recipientUserId: followerIds[i],
      variables: {
        actor: authorName,
        entity_name: entityName,
        entity_type: entityTypeLabel(p.entityType),
        comment_preview: bodyPreview
      },
      href: href,
      icon: 'ti-message-plus',
      dedupeKey: 'ent_cmt:' + p.commentId + ':' + followerIds[i]
    });
  }
}

async function onCommentLiked(payload) {
  const p = payload || {};
  const ownerId = p.ownerId || p.owner_id;
  const likerId = p.likerId || p.liker_id;
  if (!ownerId || !likerId || String(ownerId) === String(likerId)) return;
  const likerName = p.likerName || 'Ai đó';
  const bodyPreview = preview(p.bodyPreview || p.body, 100);
  await dispatchSafe({
    typeCode: 'INTERACTION_COMMENT_LIKED',
    recipientUserId: ownerId,
    variables: {
      actor: likerName,
      comment_preview: bodyPreview
    },
    href: p.href || entityHref(p.entityType, p.entityId, p.commentId),
    icon: 'ti-heart',
    dedupeKey: 'cmt_like:' + p.commentId + ':' + likerId
  });
}

let registered = false;

function registerFnNotificationSubscribers() {
  if (registered) return;
  registered = true;
  bus.subscribe(bus.EVENTS.NEWS_POST_PUBLISHED, onPostPublished);
  bus.subscribe(bus.EVENTS.NEWS_POST_SHARED, onPostShared);
  bus.subscribe(bus.EVENTS.ENTITY_COMMENT_CREATED, onEntityComment);
  bus.subscribe(bus.EVENTS.COMMENT_LIKED, onCommentLiked);
}

module.exports = {
  registerFnNotificationSubscribers,
  onPostPublished,
  onPostShared,
  onEntityComment,
  onCommentLiked
};
