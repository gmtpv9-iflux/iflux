/* Community V1 Phase 4 — API client thật cho Post + Story (SoT "Community (Cộng đồng) Architecture
 * V1" §4/§7/§9). Thin wrapper quanh fetch, cùng pattern apiBase/authHeaders/unwrap đã dùng ở
 * profile-follow-store.js — KHÔNG mirror dữ liệu vào memStore (Post/Story không cần taxonomy
 * linking phức tạp như news-store.js), server luôn là Source of Truth, gọi lại khi cần hiển thị.
 */
(function (global) {
  'use strict';

  function apiBase() {
    try {
      var host = String((global.location && location.hostname) || '').toLowerCase();
      if (host === 'iflux.vn' || host === 'www.iflux.vn' || host.indexOf('staging.') === 0) {
        return '/api';
      }
    } catch (e) { /* ignore */ }
    if (global.IfluxApiConfig && IfluxApiConfig.getBaseUrl) {
      var b = IfluxApiConfig.getBaseUrl();
      if (b) return String(b).replace(/\/$/, '');
    }
    return '/api';
  }

  function token() {
    try {
      if (global.IfluxAuth && IfluxAuth.getToken) return IfluxAuth.getToken();
    } catch (e) { /* ignore */ }
    return null;
  }

  function authHeaders() {
    var h = { Accept: 'application/json', 'Content-Type': 'application/json' };
    var t = token();
    if (t) h.Authorization = 'Bearer ' + t;
    return h;
  }

  function unwrap(res, data) {
    if (!res.ok) {
      var msg = (data && data.error && data.error.message) || (data && data.error) || (data && data.message) || ('HTTP ' + res.status);
      throw new Error(typeof msg === 'string' ? msg : 'Lỗi Cộng đồng');
    }
    return (data && data.data != null) ? data.data : data;
  }

  function request(method, url, body) {
    var opts = { method: method, headers: authHeaders(), credentials: 'same-origin' };
    if (body != null) opts.body = JSON.stringify(body);
    return fetch(url, opts).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (data) {
        return unwrap(res, data);
      });
    });
  }

  function qs(params) {
    var out = new URLSearchParams();
    Object.keys(params || {}).forEach(function (k) {
      if (params[k] != null && params[k] !== '') out.set(k, params[k]);
    });
    var s = out.toString();
    return s ? '?' + s : '';
  }

  /* ───────────────────────── Post (§4) ───────────────────────── */

  function getFeed(opts) {
    opts = opts || {};
    return request('GET', apiBase() + '/community/feed' + qs({ mode: opts.mode, cursor: opts.cursor, limit: opts.limit }));
  }

  function getUserTimeline(userId, opts) {
    opts = opts || {};
    return request('GET', apiBase() + '/community/users/' + encodeURIComponent(userId) + '/timeline' + qs({ cursor: opts.cursor, limit: opts.limit }));
  }

  function createPost(input) {
    return request('POST', apiBase() + '/community/posts', input);
  }

  function deletePost(id) {
    return request('DELETE', apiBase() + '/community/posts/' + encodeURIComponent(id));
  }

  /* 'post' trong Interaction registry LUÔN nghĩa là bài Tin tức (rẽ nhánh riêng sang
     news/interaction.service.js) — Post Cộng đồng dùng ĐÚNG entity_type riêng 'communitypost'
     (đã sửa lại 2026-10 sau khi phát hiện đổi sang 'post' làm Like Cộng đồng 404). */
  function likePost(id) {
    return request('POST', apiBase() + '/interaction/v1/communitypost/' + encodeURIComponent(id) + '/like');
  }

  function unlikePost(id) {
    return request('DELETE', apiBase() + '/interaction/v1/communitypost/' + encodeURIComponent(id) + '/like');
  }

  /* Dislike (Owner 2026-10, II.2) — loại trừ Like qua cùng row interaction_likes. */
  function dislikePost(id) {
    return request('POST', apiBase() + '/interaction/v1/communitypost/' + encodeURIComponent(id) + '/dislike');
  }

  /* ───────────────────────── Story/Chủ đề (§7) ───────────────────────── */

  function listStories(opts) {
    opts = opts || {};
    return request('GET', apiBase() + '/community/stories' + qs({ sort: opts.sort, range: opts.range, cursor: opts.cursor, limit: opts.limit }));
  }

  function createStory(input) {
    return request('POST', apiBase() + '/community/stories', input);
  }

  function archiveStory(id) {
    return request('DELETE', apiBase() + '/community/stories/' + encodeURIComponent(id));
  }

  /* Gợi ý hashtag/chủ đề — chỉ gọi lazy khi user tương tác với ô hashtag (xem community-page.js). */
  function suggestHashtags(q) {
    return request('GET', apiBase() + '/community/suggest' + qs({ q: q }));
  }

  /* Owner 2026-10 (Phase 6) — "Chủ đề đang thịnh hành" (Top N Engagement cao nhất) và "Top chủ
     đề mới nổi" (Top N Hot Score) — 2 khối tách biệt, thay "Chủ đề HOT" cũ (dựa Story). */
  function getTrendingTopics(range, limit) {
    return request('GET', apiBase() + '/community/topics/trending' + qs({ range: range, limit: limit }));
  }

  function getHotTopics(range, limit) {
    return request('GET', apiBase() + '/community/topics/hot' + qs({ range: range, limit: limit }));
  }

  /* Owner 2026-10 — "Bình luận" trên trang chi tiết Thực thể (Stock/Sector/Family) = Post Cộng
     đồng gắn thẻ Thực thể đó, "chỉ có 1, xuất hiện ở 2 nơi" (xem entity-posts-panel.js). */
  function getEntityPosts(entityType, entityId, opts) {
    opts = opts || {};
    return request('GET', apiBase() + '/community/entities/' + encodeURIComponent(entityType) + '/' + encodeURIComponent(entityId) + '/posts' + qs({ cursor: opts.cursor, limit: opts.limit }));
  }

  function createEntityPost(entityType, entityId, content) {
    return request('POST', apiBase() + '/community/entities/' + encodeURIComponent(entityType) + '/' + encodeURIComponent(entityId) + '/posts', { content: content });
  }

  global.IfluxCommunityStore = {
    getFeed: getFeed,
    getUserTimeline: getUserTimeline,
    createPost: createPost,
    deletePost: deletePost,
    likePost: likePost,
    unlikePost: unlikePost,
    dislikePost: dislikePost,
    listStories: listStories,
    createStory: createStory,
    archiveStory: archiveStory,
    suggestHashtags: suggestHashtags,
    getEntityPosts: getEntityPosts,
    createEntityPost: createEntityPost,
    getTrendingTopics: getTrendingTopics,
    getHotTopics: getHotTopics
  };
})(window);
