/**
 * ADM — Page Composition Client (Admin → Backend)
 * Save Draft: PUT /api/page-composition/:pageKey (nháp — không phải User Web SoT).
 * Publish PagePublished: dùng IfluxPagePublishBridge → POST /api/admin/publish/page.
 */
(function (global) {
  'use strict';

  function apiBase() {
    if (global.IfluxApiConfig && global.IfluxApiConfig.getBaseUrl) {
      var b = global.IfluxApiConfig.getBaseUrl();
      if (b) return String(b).replace(/\/$/, '');
    }
    return (global.location ? global.location.origin : '') + '/api';
  }

  function endpoint(pageKey) {
    return apiBase() + '/page-composition' + (pageKey ? '/' + encodeURIComponent(pageKey) : '');
  }

  function manifestFor(pageKey) {
    var cat = global.PageSettingsCatalog;
    var store = global.PageSettingsStore;
    var rt = global.PageRuntimeManifest;
    if (!cat || !store || !rt) return null;
    var page = cat.getPageByKey(cat.buildModel(store.read()), pageKey);
    if (!page) return null;
    return rt.toRuntimeManifest(page);
  }

  /** Lưu nháp composition — KHÔNG ghi PagePublished, KHÔNG đổi User Web. */
  function saveDraft(pageKey) {
    var manifest = manifestFor(pageKey);
    if (!manifest) return Promise.resolve({ ok: false, error: 'no-manifest' });
    return fetch(endpoint(pageKey), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ manifest: manifest })
    }).then(function (r) { return r.json(); }).catch(function (err) {
      return { ok: false, error: String(err) };
    });
  }

  function saveAllDrafts() {
    var cat = global.PageSettingsCatalog;
    var store = global.PageSettingsStore;
    if (!cat || !store) return Promise.resolve([]);
    var pages = cat.buildModel(store.read());
    return Promise.all(pages.map(function (p) { return saveDraft(p.key); }));
  }

  /**
   * Publish PagePublished (User Web SoT).
   * Không ghi composition — gọi bridge → publishPageDraft.
   */
  function publishPagePublished(pageKey) {
    if (global.IfluxPagePublishBridge && IfluxPagePublishBridge.publishPagePublished) {
      return IfluxPagePublishBridge.publishPagePublished(pageKey);
    }
    return Promise.resolve({
      ok: false,
      error: 'Thiếu IfluxPagePublishBridge'
    });
  }

  /**
   * @deprecated Tên cũ gây hiểu nhầm — chỉ còn alias Save Draft.
   * Không dùng cho User Web. Dùng saveDraft / publishPagePublished.
   */
  function publishPage(pageKey) {
    return saveDraft(pageKey);
  }

  /** @deprecated alias saveAllDrafts */
  function publishAll() {
    return saveAllDrafts();
  }

  global.PageCompositionClient = {
    apiBase: apiBase,
    endpoint: endpoint,
    manifestFor: manifestFor,
    saveDraft: saveDraft,
    saveAllDrafts: saveAllDrafts,
    publishPagePublished: publishPagePublished,
    publishPage: publishPage,
    publishAll: publishAll
  };
})(window);
