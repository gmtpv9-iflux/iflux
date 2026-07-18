/**
 * ADM-SYS-011 — Lưu Cài đặt Trang (localStorage)
 */
(function (global) {
  'use strict';

  var STORAGE_KEY = 'iflux_page_settings_v1';

  function readRaw() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { pages: {}, updatedAt: null };
      var parsed = JSON.parse(raw);
      return { pages: parsed.pages || {}, updatedAt: parsed.updatedAt || null };
    } catch (e) {
      return { pages: {}, updatedAt: null };
    }
  }

  function write(data) {
    data.updatedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return data;
  }

  function read() {
    return readRaw();
  }

  function pageBucket(pageKey, data) {
    data = data || readRaw();
    if (!data.pages[pageKey]) data.pages[pageKey] = {};
    return data.pages[pageKey];
  }

  function savePageMeta(pageKey, patch) {
    var data = readRaw();
    var bucket = pageBucket(pageKey, data);
    Object.keys(patch || {}).forEach(function (k) {
      if (patch[k] === undefined) return;
      bucket[k] = patch[k];
    });
    return write(data);
  }

  function saveSection(pageKey, sectionKey, patch) {
    var data = readRaw();
    var bucket = pageBucket(pageKey, data);
    if (!bucket.sections) bucket.sections = {};
    if (!bucket.sections[sectionKey]) bucket.sections[sectionKey] = {};
    Object.keys(patch || {}).forEach(function (k) {
      bucket.sections[sectionKey][k] = patch[k];
    });
    return write(data);
  }

  function saveLayoutSlot(pageKey, widgetId, patch) {
    var data = readRaw();
    var bucket = pageBucket(pageKey, data);
    if (!bucket.layoutSlots) bucket.layoutSlots = {};
    if (!bucket.layoutSlots[widgetId]) bucket.layoutSlots[widgetId] = {};
    Object.keys(patch || {}).forEach(function (k) {
      bucket.layoutSlots[widgetId][k] = patch[k];
    });
    return write(data);
  }

  function removeLayoutSlot(pageKey, widgetId) {
    var data = readRaw();
    var bucket = pageBucket(pageKey, data);
    if (bucket.layoutSlots && bucket.layoutSlots[widgetId] != null) {
      // Nếu là widget Admin thêm → xoá hẳn key; nếu là slot mặc định → đánh dấu removed.
      delete bucket.layoutSlots[widgetId];
    }
    // Đánh dấu removed để ẩn slot mặc định (không xoá được khỏi catalog).
    if (!bucket.layoutSlots) bucket.layoutSlots = {};
    bucket.layoutSlots[widgetId] = { removed: true };
    return write(data);
  }

  function purgeLayoutSlot(pageKey, widgetId) {
    var data = readRaw();
    var bucket = pageBucket(pageKey, data);
    if (bucket.layoutSlots && bucket.layoutSlots[widgetId] != null) {
      delete bucket.layoutSlots[widgetId];
    }
    return write(data);
  }

  function resetAll() {
    localStorage.removeItem(STORAGE_KEY);
    return readRaw();
  }

  global.PageSettingsStore = {
    read: read,
    savePageMeta: savePageMeta,
    saveSection: saveSection,
    saveLayoutSlot: saveLayoutSlot,
    removeLayoutSlot: removeLayoutSlot,
    purgeLayoutSlot: purgeLayoutSlot,
    resetAll: resetAll
  };
})(window);
