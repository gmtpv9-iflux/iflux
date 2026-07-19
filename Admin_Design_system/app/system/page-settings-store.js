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

  /**
   * Hydrate bản đã Publish từ Server SoT vào vùng draft hiện tại.
   * Server luôn thắng khi reload; localStorage chỉ là draft/cache làm việc,
   * không được merge ngược để ghi đè PagePublished.
   */
  function hydratePublishedPage(pageKey, published) {
    if (!published || !Array.isArray(published.placements)) return readRaw();
    var data = readRaw();
    var bucket = pageBucket(pageKey, data);
    bucket.layoutSlots = {};
    published.placements.forEach(function (placement) {
      if (!placement || !placement.widgetId) return;
      bucket.layoutSlots[placement.widgetId] = {
        section: placement.section,
        position: Number(placement.position || 0),
        span: Number(placement.span || 12),
        enabled: placement.enabled !== false,
        userCanOverride: !!placement.userCanOverride,
        config: placement.config || {}
      };
    });
    bucket.sections = {};
    (published.sections || []).forEach(function (section) {
      if (!section || !section.key) return;
      bucket.sections[section.key] = {
        label: section.label,
        visible: section.visible !== false,
        layout: section.layout || null
      };
    });
    bucket.publishedVersion = published.version || null;
    bucket.publishedAt = published.publishMeta && published.publishMeta.publishedAt || null;
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
    hydratePublishedPage: hydratePublishedPage,
    resetAll: resetAll
  };
})(window);
