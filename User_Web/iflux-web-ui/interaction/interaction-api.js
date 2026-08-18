/**
 * Interaction API client — RC-API-01…12 · IA-003
 * Canonical: /api/interaction/v1 — alias post community giữ tới cutover.
 */
(function (global) {
  'use strict';
  if (global.IfluxInteractionApi) return;

  function rootApi() {
    return (global.IFLUX_API_BASE || global.__IFLUX_API_BASE__ || '/api').replace(/\/$/, '');
  }

  function ixBase() {
    return rootApi() + '/interaction/v1';
  }

  function communityBase() {
    return rootApi() + '/community';
  }

  function authHeaders() {
    var h = { Accept: 'application/json', 'Content-Type': 'application/json' };
    try {
      if (global.IfluxAuth) {
        var t = null;
        if (IfluxAuth.getToken) t = IfluxAuth.getToken();
        else if (IfluxAuth.getAccessToken) t = IfluxAuth.getAccessToken();
        if (t) h.Authorization = 'Bearer ' + t;
      }
    } catch (e) { /* ignore */ }
    return h;
  }

  function unwrap(res) {
    return res.json().then(function (body) {
      if (!res.ok) {
        var msg =
          (body && body.error && body.error.message) ||
          (body && typeof body.error === 'string' ? body.error : null) ||
          (body && body.message) ||
          null;
        if (!msg && res.status === 401) msg = 'Cần đăng nhập để tiếp tục';
        if (!msg && res.status === 403) msg = 'Không có quyền thực hiện';
        if (!msg) msg = res.statusText || 'API error';
        var err = new Error(msg);
        err.status = res.status;
        err.body = body;
        throw err;
      }
      return body && body.data !== undefined ? body.data : body;
    });
  }

  function normalizeType(raw) {
    var t = String(raw || 'post').toLowerCase();
    if (t === 'article') return 'post';
    if (t === 'ecosystem') return 'family';
    return t;
  }

  function normalizeId(type, raw) {
    var id = String(raw || '').trim();
    if (type === 'stock') return id.toUpperCase();
    return id;
  }

  function normalizeTarget(target) {
    target = target || {};
    var type = normalizeType(target.type);
    var id = normalizeId(type, target.id);
    return { type: type, id: id };
  }

  function targetKey(target) {
    var t = normalizeTarget(target);
    return t.type + ':' + t.id;
  }

  function fetchSummary(target) {
    var t = normalizeTarget(target);
    var url = ixBase() + '/summary?type=' + encodeURIComponent(t.type) + '&id=' + encodeURIComponent(t.id);
    return fetch(url, { headers: authHeaders(), credentials: 'same-origin' }).then(unwrap).then(function (data) {
      if (data && Array.isArray(data.comments)) {
        data = Object.assign({}, data, {
          comments: data.total != null ? Number(data.total) : data.comments.length
        });
      }
      return {
        likes: Number(data && data.likes) || 0,
        comments: Number(data && data.comments) || 0,
        shares: Number(data && data.shares) || 0,
        favorites: Number(data && data.favorites) || 0,
        views: data && data.views != null ? Number(data.views) || 0 : undefined
      };
    }).catch(function (err) {
      /* Alias post: fallback community summary nếu canonical lỗi mạng cũ */
      if (t.type !== 'post') throw err;
      var url2 = communityBase() + '/interaction/summary?type=post&id=' + encodeURIComponent(t.id);
      return fetch(url2, { headers: authHeaders(), credentials: 'same-origin' }).then(unwrap).then(function (data) {
        return {
          likes: Number(data && data.likes) || 0,
          comments: Number(data && data.comments) || 0,
          shares: Number(data && data.shares) || 0,
          favorites: Number(data && data.favorites) || 0,
          views: data && data.views != null ? Number(data.views) || 0 : undefined
        };
      });
    });
  }

  function fetchThread(target, opts) {
    opts = opts || {};
    var t = normalizeTarget(target);
    var lim = opts.limit != null ? Number(opts.limit) : 50;
    var url = ixBase() + '/threads/' + encodeURIComponent(t.type) + '/' + encodeURIComponent(t.id) +
      '/comments?limit=' + lim;
    return fetch(url, { headers: authHeaders(), credentials: 'same-origin' }).then(unwrap).catch(function (err) {
      if (t.type !== 'post') throw err;
      var url2 = communityBase() + '/articles/' + encodeURIComponent(t.id) + '/comments?limit=' + lim;
      return fetch(url2, { headers: authHeaders(), credentials: 'same-origin' }).then(unwrap);
    });
  }

  function postComment(target, payload) {
    var t = normalizeTarget(target);
    var url = ixBase() + '/threads/' + encodeURIComponent(t.type) + '/' + encodeURIComponent(t.id) + '/comments';
    return fetch(url, {
      method: 'POST',
      headers: authHeaders(),
      credentials: 'same-origin',
      body: JSON.stringify(payload || {})
    }).then(unwrap).catch(function (err) {
      if (t.type !== 'post') throw err;
      var url2 = communityBase() + '/articles/' + encodeURIComponent(t.id) + '/comments';
      return fetch(url2, {
        method: 'POST',
        headers: authHeaders(),
        credentials: 'same-origin',
        body: JSON.stringify(payload || {})
      }).then(unwrap);
    });
  }

  function migrateComments(target, comments) {
    var t = normalizeTarget(target);
    if (t.type === 'post') return Promise.resolve({ inserted: 0, total: 0 });
    var url = ixBase() + '/threads/' + encodeURIComponent(t.type) + '/' + encodeURIComponent(t.id) +
      '/comments/migrate';
    return fetch(url, {
      method: 'POST',
      headers: authHeaders(),
      credentials: 'same-origin',
      body: JSON.stringify({ comments: comments || [] })
    }).then(unwrap);
  }

  function mutate(target, action) {
    var t = normalizeTarget(target);
    /* Mutate AS-IS chỉ post — giữ community alias */
    var url = communityBase() + '/interaction/' + encodeURIComponent(t.id) + '/mutate';
    return fetch(url, {
      method: 'POST',
      headers: authHeaders(),
      credentials: 'same-origin',
      body: JSON.stringify({ type: t.type, action: action })
    }).then(unwrap);
  }

  global.IfluxInteractionApi = {
    targetKey: targetKey,
    normalizeTarget: normalizeTarget,
    fetchSummary: fetchSummary,
    fetchThread: fetchThread,
    postComment: postComment,
    migrateComments: migrateComments,
    mutate: mutate
  };
})(typeof window !== 'undefined' ? window : globalThis);
