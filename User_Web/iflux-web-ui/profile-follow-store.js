/* Follow User — API SoT (FN-001). count/exist/cursor — cấm full list.
 * Legacy LS chỉ cache ngắn; server = SoT. */
(function (global) {
  'use strict';

  var cacheFollowing = null;
  var cacheMe = null;

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
      var msg = (data && data.error && data.error.message) || data.error || data.message || ('HTTP ' + res.status);
      throw new Error(typeof msg === 'string' ? msg : 'Lỗi follow');
    }
    return (data && data.data != null) ? data.data : data;
  }

  function getJson(url) {
    return fetch(url, { headers: authHeaders(), credentials: 'same-origin' }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (data) {
        return unwrap(res, data);
      });
    });
  }

  function send(method, url) {
    return fetch(url, { method: method, headers: authHeaders(), credentials: 'same-origin' }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (data) {
        return unwrap(res, data);
      });
    });
  }

  function meId() {
    try {
      if (global.IfluxAuth && IfluxAuth.getUser) {
        var u = IfluxAuth.getUser();
        return u && u.id ? u.id : null;
      }
    } catch (e) { /* ignore */ }
    return null;
  }

  function isFollowing(userId, targetId) {
    /* sync helper — prefer last exist cache; callers should use existAsync when possible */
    if (cacheMe && String(cacheMe.follower) === String(userId) && String(cacheMe.target) === String(targetId)) {
      return !!cacheMe.following;
    }
    return false;
  }

  function existAsync(targetId) {
    return getJson(apiBase() + '/follow/users/' + encodeURIComponent(targetId) + '/exist').then(function (data) {
      cacheMe = { follower: meId(), target: targetId, following: !!(data && data.following) };
      return cacheMe.following;
    });
  }

  function follow(userId, target) {
    if (!target || !target.id) return Promise.resolve(false);
    return send('POST', apiBase() + '/follow/users/' + encodeURIComponent(target.id)).then(function () {
      cacheMe = { follower: userId || meId(), target: target.id, following: true };
      cacheFollowing = null;
      return true;
    });
  }

  function unfollow(userId, targetId) {
    return send('DELETE', apiBase() + '/follow/users/' + encodeURIComponent(targetId)).then(function () {
      cacheMe = { follower: userId || meId(), target: targetId, following: false };
      cacheFollowing = null;
      return true;
    });
  }

  function countsAsync(userId) {
    return getJson(apiBase() + '/follow/users/' + encodeURIComponent(userId) + '/counts');
  }

  function countFollowing(userId) {
    /* sync stub for profile bind — use countsAsync when mounting */
    return (cacheFollowing && cacheFollowing.userId === userId) ? cacheFollowing.n : 0;
  }

  function listFollowing(userId) {
    return (cacheFollowing && cacheFollowing.userId === userId) ? (cacheFollowing.items || []).slice() : [];
  }

  function loadFollowingPage(opts) {
    opts = opts || {};
    var qs = [];
    if (opts.cursor) qs.push('cursor=' + encodeURIComponent(opts.cursor));
    if (opts.limit) qs.push('limit=' + encodeURIComponent(opts.limit));
    var url = apiBase() + '/follow/users/me/following' + (qs.length ? '?' + qs.join('&') : '');
    return getJson(url).then(function (data) {
      cacheFollowing = {
        userId: meId(),
        items: data.items || [],
        n: (data.items || []).length,
        next_cursor: data.next_cursor || null
      };
      return data;
    });
  }

  function isMutual() {
    return false;
  }

  function listFollowers() {
    return [];
  }

  global.IfluxProfileFollowStore = {
    listFollowing: listFollowing,
    countFollowing: countFollowing,
    isFollowing: isFollowing,
    isMutual: isMutual,
    listFollowers: listFollowers,
    follow: follow,
    unfollow: unfollow,
    existAsync: existAsync,
    countsAsync: countsAsync,
    loadFollowingPage: loadFollowingPage
  };
})(window);
