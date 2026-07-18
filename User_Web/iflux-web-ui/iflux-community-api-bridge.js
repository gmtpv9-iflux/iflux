/* iFlux — đồng bộ bài viết cộng đồng từ API */
(function (global) {
  'use strict';

  var STORAGE_KEY = 'iflux_community_v1';

  function enabled() {
    return global.IfluxApiConfig && global.IfluxData && IfluxData.isApi()
      && global.IfluxApiClient && IfluxApiClient.listCommunityPosts;
  }

  function readAll() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function writeAll(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    document.dispatchEvent(new CustomEvent('iflux-community-change'));
  }

  function mergePosts(apiPosts) {
    if (!apiPosts || !apiPosts.length) return;
    var data = readAll() || { posts: [], version: 5 };
    if (!data.posts) data.posts = [];
    var ids = {};
    data.posts.forEach(function (p) { if (p && p.id) ids[p.id] = true; });
    apiPosts.forEach(function (p) {
      if (p && p.id && !ids[p.id]) data.posts.unshift(p);
    });
    writeAll(data);
  }

  function hydrate() {
    if (!enabled()) return Promise.resolve();
    return IfluxApiClient.listCommunityPosts({ limit: 50 }).then(function (res) {
      var posts = (res.data && res.data.posts) || res.posts || [];
      mergePosts(posts);
    }).catch(function () { /* fallback seed */ });
  }

  global.IfluxCommunityApiBridge = { hydrate: hydrate };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', hydrate);
  } else {
    hydrate();
  }
})(window);
