/**
 * Interaction Persistence Adapter — RC-PS-01…04 · PS-1.0
 * Không chứa business rules Interaction.
 */
(function (global) {
  'use strict';
  if (global.IfluxInteractionPersistence) return;

  var SUMMARY_TTL_MS = 30000; /* PS-007 LOCKED */
  var PREFIX = 'iflux_ix_';

  /* Slice 4.5: iflux_stock_comments_v6 RETIRED — cấm đọc/ghi/migrate/restore */
  var FORBIDDEN_KEYS = {
    iflux_stock_comments_v6: 1,
    iflux_community_v1: 1,
    iflux_community_v2: 1
  };

  function assertKey(key) {
    var k = String(key || '');
    if (FORBIDDEN_KEYS[k]) {
      throw new Error('RC-PS-04: cấm dùng key authoritative legacy: ' + k);
    }
    if (k.indexOf(PREFIX) !== 0 && k.indexOf('iflux_ix_draft_') !== 0) {
      /* cho phép draft namespace riêng */
    }
  }

  function memory() {
    if (!global.__IFLUX_IX_MEM__) global.__IFLUX_IX_MEM__ = {};
    return global.__IFLUX_IX_MEM__;
  }

  function getJson(key, storage) {
    assertKey(key);
    try {
      var raw = (storage || global.localStorage).getItem(key);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  function setJson(key, value, storage) {
    assertKey(key);
    try {
      (storage || global.localStorage).setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      return false;
    }
  }

  function remove(key, storage) {
    assertKey(key);
    try {
      (storage || global.localStorage).removeItem(key);
    } catch (e) { /* ignore */ }
  }

  /** Cache Summary counts — memory TTL 30s (RC-PS-03). CẤM localStorage cho counts. */
  function getSummaryCache(cacheKey) {
    var wrap = memory()['summary_' + cacheKey];
    if (!wrap || wrap.expiresAt == null) return null;
    if (Date.now() > wrap.expiresAt) {
      delete memory()['summary_' + cacheKey];
      return null;
    }
    return wrap.data || null;
  }

  function setSummaryCache(cacheKey, data) {
    memory()['summary_' + cacheKey] = {
      expiresAt: Date.now() + SUMMARY_TTL_MS,
      data: data
    };
    /* Purge legacy LS nếu còn từ bản cũ */
    try {
      if (global.localStorage) global.localStorage.removeItem(PREFIX + 'summary_' + cacheKey);
    } catch (e) { /* ignore */ }
    return true;
  }

  function invalidateSummaryCache(cacheKey) {
    delete memory()['summary_' + cacheKey];
    try {
      if (global.localStorage) global.localStorage.removeItem(PREFIX + 'summary_' + cacheKey);
    } catch (e) { /* ignore */ }
  }

  /** Draft composer — PS-002 Draft OK */
  function getDraft(draftKey) {
    return getJson(PREFIX + 'draft_' + draftKey);
  }

  function setDraft(draftKey, payload) {
    return setJson(PREFIX + 'draft_' + draftKey, payload || {});
  }

  function clearDraft(draftKey) {
    remove(PREFIX + 'draft_' + draftKey);
  }

  function memGet(k) {
    return memory()[k];
  }

  function memSet(k, v) {
    memory()[k] = v;
    return v;
  }

  global.IfluxInteractionPersistence = {
    SUMMARY_TTL_MS: SUMMARY_TTL_MS,
    getSummaryCache: getSummaryCache,
    setSummaryCache: setSummaryCache,
    invalidateSummaryCache: invalidateSummaryCache,
    getDraft: getDraft,
    setDraft: setDraft,
    clearDraft: clearDraft,
    memGet: memGet,
    memSet: memSet,
    getJson: getJson,
    setJson: setJson,
    remove: remove
  };
})(typeof window !== 'undefined' ? window : globalThis);
