'use strict';

/**
 * Interaction Summary + mutations — RC-API-01 · RC-API-03 · RC-API-07
 * Summary = counts-only (không comments[]).
 */
const articles = require('./community-articles.service');
const comments = require('./community-comments.service');
const { AppError } = require('../../shared/exceptions/app-error');
const { query } = require('../../core/database/connection');

function statsFromArticle(article) {
  const s = (article && article.stats) || {};
  return {
    likes: Number(s.likes) || 0,
    comments: Number(s.comments) || 0,
    shares: Number(s.shares) || 0,
    favorites: Number(s.favorites) || 0,
    views: Number(s.views) || 0
  };
}

/**
 * RC-API-01 counts-only
 */
async function getSummary(type, idOrSlug) {
  const t = String(type || 'post');
  if (t !== 'post' && t !== 'article') {
    throw AppError.badRequest('IX_TARGET_UNSUPPORTED', 'Phase 3 chỉ hỗ trợ target post/article');
  }
  const article = await articles.getArticle(idOrSlug);
  if (!article) throw AppError.notFound('Không tìm thấy bài viết');

  const base = statsFromArticle(article);
  /* Đồng bộ comment count từ SoT comment table khi có */
  try {
    const n = await comments.countComments(String(article.id), String(article.slug || ''));
    if (typeof n === 'number') base.comments = n;
  } catch (e) {
    /* giữ stats.comments */
  }

  /* Không trả comments[] */
  return {
    target: { type: 'post', id: String(article.id), slug: article.slug || '' },
    likes: base.likes,
    comments: base.comments,
    shares: base.shares,
    favorites: base.favorites,
    views: base.views
  };
}

async function persistStats(articleId, stats, likedBy, favoritedBy) {
  const res = await query(
    `UPDATE community_posts
     SET payload = jsonb_set(
           jsonb_set(
             jsonb_set(payload, '{stats}', $2::jsonb, true),
             '{liked_by}', $3::jsonb, true
           ),
           '{favorited_by}', $4::jsonb, true
         ),
         updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [
      articleId,
      JSON.stringify(stats),
      JSON.stringify(likedBy || []),
      JSON.stringify(favoritedBy || [])
    ]
  );
  return res.rows[0];
}

/**
 * RC-API-03 mutate: like | unlike | favorite | unfavorite | share_bump
 */
async function mutate(idOrSlug, user, action) {
  const article = await articles.getArticle(idOrSlug);
  if (!article) throw AppError.notFound('Không tìm thấy bài viết');

  const uid = user && user.id ? String(user.id) : null;
  if (!uid && action !== 'share_bump') {
    throw AppError.unauthorized('AUTH_REQUIRED', 'Cần đăng nhập');
  }

  const stats = statsFromArticle(article);
  let likedBy = Array.isArray(article.liked_by) ? article.liked_by.map(String) : [];
  let favoritedBy = Array.isArray(article.favorited_by) ? article.favorited_by.map(String) : [];
  const act = String(action || '');

  if (act === 'like') {
    if (likedBy.indexOf(uid) === -1) {
      likedBy.push(uid);
      stats.likes = (stats.likes || 0) + 1;
    }
  } else if (act === 'unlike') {
    if (likedBy.indexOf(uid) !== -1) {
      likedBy = likedBy.filter(function (x) { return x !== uid; });
      stats.likes = Math.max(0, (stats.likes || 0) - 1);
    }
  } else if (act === 'favorite') {
    if (favoritedBy.indexOf(uid) === -1) {
      favoritedBy.push(uid);
      stats.favorites = (stats.favorites || 0) + 1;
    }
  } else if (act === 'unfavorite') {
    if (favoritedBy.indexOf(uid) !== -1) {
      favoritedBy = favoritedBy.filter(function (x) { return x !== uid; });
      stats.favorites = Math.max(0, (stats.favorites || 0) - 1);
    }
  } else if (act === 'share_bump') {
    stats.shares = (stats.shares || 0) + 1;
  } else {
    throw AppError.badRequest('IX_ACTION_UNKNOWN', 'Action không hỗ trợ: ' + act);
  }

  await persistStats(String(article.id), stats, likedBy, favoritedBy);
  if (act === 'share_bump') {
    try {
      const bus = require('../../core/events/bus');
      const author = article.author || {};
      await bus.publish(bus.EVENTS.COMMUNITY_POST_SHARED, {
        postId: String(article.id),
        id: String(article.id),
        slug: article.slug,
        title: article.title,
        actorId: uid,
        actorName: (user && (user.display_name || user.name)) || 'Thành viên',
        authorId: article.user_id || author.id || null
      });
    } catch (e) { /* ignore */ }
  }
  return {
    ok: true,
    action: act,
    target: { type: 'post', id: String(article.id) }
  };
}

module.exports = {
  getSummary,
  mutate
};
