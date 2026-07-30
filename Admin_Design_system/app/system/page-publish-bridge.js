/**
 * Page Publish Bridge — Admin Draft (composition) → PagePublished
 * Phase 4.1: Save ≠ Publish.
 *   Save  → PUT /api/page-composition (nháp)
 *   Publish → POST /api/admin/publish/page → publishPageDraft → PagePublished
 */
(function (global) {
  'use strict';

  function toast(msg, kind) {
    if (global.ixToast) ixToast(msg, kind || 'success');
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

  /**
   * Serialize manifest → page draft + widget drafts cho publishPageDraft.
   * Bridge KHÔNG chứa Business Rule Placement: không suy luận/remap section
   * theo page hoặc widgetId; chỉ ghi đúng dữ liệu Admin đã chọn.
   */
  function buildPublishPayload(pageKey, manifest) {
    if (!manifest) return null;
    var key = String(pageKey || '').toLowerCase();
    var widgets = (manifest.widgets || []).filter(function (w) { return w && w.id; });
    var sections = manifest.sections || [];

    var placements = widgets.map(function (w) {
      return {
        widgetId: w.id,
        section: w.section || 'main',
        position: w.position != null ? w.position : 0,
        span: w.span != null ? w.span : 12,
        enabled: w.enabled !== false,
        locked: !!w.locked,
        userCanOverride: !!w.userCanOverride,
        config: w.config || {}
      };
    });

    var pageDraft = {
      page: key,
      path: manifest.path || null,
      title: manifest.title || '',
      intro: manifest.intro || '',
      documentTitle: manifest.documentTitle || '',
      sections: sections,
      placements: placements
    };

    var widgetDrafts = {};
    widgets.forEach(function (w) {
      /* Bug A fix: giữ binding SoT #4 — không bịa TMP-LEGACY khi Definition đã có templateRef */
      var templateId = w.template || w.templateRef || null;
      if (!templateId && global.PageRuntimeManifest && PageRuntimeManifest.resolveTemplateRef) {
        templateId = PageRuntimeManifest.resolveTemplateRef(w.id);
      }
      if (!templateId) templateId = 'TMP-LEGACY';
      widgetDrafts[w.id] = {
        id: w.id,
        title: w.title || w.id,
        description: w.description || '',
        template: templateId,
        blocks: Array.isArray(w.blocks) ? w.blocks.slice() : [],
        minTier: w.minTier || 'free',
        css: Array.isArray(w.css) ? w.css.slice() : [],
        lazyModule: w.lazyModule || null,
        metadata: { config: w.config || {} }
      };
    });

    return { pageDraft: pageDraft, widgetDrafts: widgetDrafts };
  }

  /**
   * Publish PagePublished cho 1 pageKey (từ local catalog/store).
   * @returns {Promise<{ok, page?, widgets?, error?}>}
   */
  function publishPagePublished(pageKey) {
    var key = String(pageKey || '').trim().toLowerCase();
    if (!key) return Promise.resolve({ ok: false, error: 'thiếu pageKey' });

    if (!global.IfluxWidgetPublishClient || !IfluxWidgetPublishClient.publishPage) {
      return Promise.resolve({
        ok: false,
        error: 'Thiếu IfluxWidgetPublishClient — chưa nạp widget-publish-client.js'
      });
    }

    var manifest = manifestFor(key);
    if (!manifest) {
      return Promise.resolve({ ok: false, error: 'Không build được manifest cho ' + key });
    }

    var payload = buildPublishPayload(key, manifest);
    if (!payload) {
      return Promise.resolve({ ok: false, error: 'Không build được publish payload' });
    }

    return IfluxWidgetPublishClient.publishPage(payload.pageDraft, payload.widgetDrafts)
      .then(function (res) {
        if (!res) return { ok: false, error: 'empty response' };
        if (res.ok === false || (res.error && !res.page)) {
          return {
            ok: false,
            error: res.error || res.message || 'publish page thất bại',
            status: res.status
          };
        }
        /* Một số lỗi auth trả HTML / {error} không có ok:true */
        if (!res.page && !res.ok) {
          return { ok: false, error: res.error || res.message || 'publish thất bại' };
        }
        return {
          ok: true,
          page: res.page,
          widgets: res.widgets || [],
          version: res.page && res.page.version
        };
      })
      .catch(function (err) {
        return { ok: false, error: String(err && err.message ? err.message : err) };
      });
  }

  function publishPagePublishedWithToast(pageKey) {
    var key = String(pageKey || '').trim().toLowerCase();
    toast('Đang publish PagePublished · ' + key + '…', 'primary');
    return publishPagePublished(key).then(function (res) {
      if (res && res.ok) {
        toast(
          'Đã publish PagePublished · ' + key + ' @v' + (res.version || '?'),
          'success'
        );
      } else {
        toast(
          'Publish PagePublished thất bại · ' + key + ': ' + ((res && res.error) || ''),
          'danger'
        );
      }
      return res;
    });
  }

  global.IfluxPagePublishBridge = {
    buildPublishPayload: buildPublishPayload,
    publishPagePublished: publishPagePublished,
    publishPagePublishedWithToast: publishPagePublishedWithToast,
    manifestFor: manifestFor
  };
})(window);
