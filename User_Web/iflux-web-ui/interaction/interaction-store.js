/**
 * InteractionStore — RC-API-04 · RC-API-07 · RC-IA-04
 * Slice 4.5: API only — không dual-read / peek / migrate client LS.
 */
(function (global) {
  'use strict';
  if (global.IfluxInteractionStore) return;

  var _inited = false;
  var _projection = {}; /* key → counts */
  var _threads = {}; /* key → { comments, total } — Interactive only */
  var _listeners = [];

  function pers() {
    return global.IfluxInteractionPersistence;
  }

  function api() {
    return global.IfluxInteractionApi;
  }

  function keyOf(target) {
    return api() ? api().targetKey(target) : String((target && target.id) || '');
  }

  function emit() {
    _listeners.forEach(function (fn) {
      try { fn(); } catch (e) { /* ignore */ }
    });
  }

  function subscribe(fn) {
    if (typeof fn !== 'function') return function () {};
    _listeners.push(fn);
    return function () {
      _listeners = _listeners.filter(function (x) { return x !== fn; });
    };
  }

  /** RC-IR / RC-IA-01: chỉ gọi khi Interactive Host mount */
  function initInteractive() {
    _inited = true;
  }

  function isInited() {
    return _inited;
  }

  function resetForSummaryMode() {
    _threads = {};
    _inited = false;
  }

  function getProjection(target) {
    var k = keyOf(target);
    if (_projection[k]) return _projection[k];
    var cached = pers() && pers().getSummaryCache(k);
    if (cached) {
      _projection[k] = cached;
      return cached;
    }
    return { likes: 0, comments: 0, shares: 0, favorites: 0 };
  }

  /**
   * RC-API-07 Refresh Contract:
   * Mutation Success → Projection Refresh → Summary Refresh → không UI++
   */
  function refreshProjection(target) {
    if (!api()) return Promise.reject(new Error('IfluxInteractionApi missing'));
    var k = keyOf(target);
    return api().fetchSummary(target).then(function (counts) {
      _projection[k] = counts;
      if (pers()) {
        pers().setSummaryCache(k, counts);
      }
      emit();
      return counts;
    });
  }

  function applyThread(k, data) {
    _threads[k] = {
      comments: (data && data.comments) || [],
      total: data && data.total != null ? data.total : ((data && data.comments) || []).length
    };
    emit();
    return _threads[k];
  }

  /** Slice 4.5: chỉ API — không đọc LS */
  function loadThread(target, opts) {
    if (!_inited) {
      return Promise.reject(new Error('RC-IA-01: Store chưa init Interactive'));
    }
    if (!api()) return Promise.reject(new Error('IfluxInteractionApi missing'));
    var k = keyOf(target);
    return api().fetchThread(target, opts).then(function (data) {
      return applyThread(k, data);
    });
  }

  function getThread(target) {
    return _threads[keyOf(target)] || null;
  }

  function runMutation(target, action) {
    if (!api()) return Promise.reject(new Error('IfluxInteractionApi missing'));
    return api().mutate(target, action).then(function (res) {
      return refreshProjection(target).then(function (counts) {
        return { result: res, projection: counts };
      });
    });
  }

  function addComment(target, payload) {
    if (!_inited) {
      return Promise.reject(new Error('RC-IA-01: Store chưa init Interactive'));
    }
    if (!api()) return Promise.reject(new Error('IfluxInteractionApi missing'));
    return api().postComment(target, payload).then(function (res) {
      return loadThread(target).then(function () {
        return refreshProjection(target).then(function (counts) {
          return { result: res, projection: counts };
        });
      });
    });
  }

  global.IfluxInteractionStore = {
    initInteractive: initInteractive,
    isInited: isInited,
    resetForSummaryMode: resetForSummaryMode,
    getProjection: getProjection,
    refreshProjection: refreshProjection,
    loadThread: loadThread,
    getThread: getThread,
    runMutation: runMutation,
    addComment: addComment,
    subscribe: subscribe
  };
})(typeof window !== 'undefined' ? window : globalThis);
