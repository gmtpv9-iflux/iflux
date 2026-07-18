/**
 * Page Publish Bridge — Admin Draft (composition) → PagePublished
 * Phase 4.1: Save ≠ Publish.
 *   Save  → PUT /api/page-composition (nháp)
 *   Publish → POST /api/admin/publish/page → publishPageDraft → PagePublished
 */
(function (global) {
  'use strict';

  /** Flow Page Feature sections — khớp Layout Engine Host Tree (không đổi Runtime). */
  var FLOW_SECTION_BY_ID = {
    'WGT-FLW-SUBJ-STOCK': 'sidebar',
    'WGT-FLW-SUBJ-SECTOR': 'sidebar',
    'WGT-FLW-STAT_STOCK': 'basic',
    'WGT-FLW-STAT_SECTOR': 'advanced',
    'WGT-FLW-STAT_HST': 'advanced',
    'WGT-FLW-STAT_STORY': 'advanced',
    'WGT-FLW-EX_TM_IN': 'exclusive',
    'WGT-FLW-EX_TM_SECTOR_IN': 'exclusive',
    'WGT-FLW-EX_TM_HST_IN': 'exclusive',
    'WGT-FLW-EX_TM_STORY_IN': 'exclusive'
  };

  var FLOW_CONFIG_BY_ID = {
    'WGT-FLW-SUBJ-STOCK': { scope: 'stock' },
    'WGT-FLW-SUBJ-SECTOR': { scope: 'sector' }
  };

  var FLOW_SECTIONS = [
    { key: 'sidebar', label: 'Sidebar dòng tiền', visible: true, layout: null },
    { key: 'basic', label: 'Thống kê cơ bản', visible: true, layout: 'grid-12' },
    { key: 'advanced', label: 'Thống kê nâng cao', visible: true, layout: 'grid-12' },
    { key: 'exclusive', label: 'Độc quyền', visible: true, layout: 'grid-12' }
  ];

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
   * Normalize manifest → page draft + widget drafts cho publishPageDraft.
   * dashboard: chỉ sidebar (Phase 4 — Main = Dashboard Engine).
   * flow: remap section → basic|advanced|exclusive.
   */
  function buildPublishPayload(pageKey, manifest) {
    if (!manifest) return null;
    var key = String(pageKey || '').toLowerCase();
    var widgets = (manifest.widgets || []).filter(function (w) {
      return w && w.id && w.enabled !== false;
    });

    if (key === 'dashboard') {
      widgets = widgets.filter(function (w) { return w.section === 'sidebar'; });
    }

    if (key === 'flow') {
      widgets = widgets.map(function (w) {
        var section = FLOW_SECTION_BY_ID[w.id] || w.section || 'main';
        var config = Object.assign({}, w.config || {}, FLOW_CONFIG_BY_ID[w.id] || {});
        return Object.assign({}, w, { section: section, config: config });
      });
    }

    var sections = manifest.sections || [];
    if (key === 'flow') sections = FLOW_SECTIONS.slice();
    if (key === 'dashboard') {
      sections = [
        { key: 'sidebar', label: 'Thông tin cá nhân', visible: true, layout: null },
        { key: 'main', label: 'Bảng tổng quan', visible: true, layout: 'stack' }
      ];
    }

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
      title: key === 'dashboard' ? '' : (manifest.title || ''),
      intro: key === 'dashboard' ? '' : (manifest.intro || ''),
      documentTitle: manifest.documentTitle || '',
      sections: sections,
      placements: placements
    };

    var widgetDrafts = {};
    widgets.forEach(function (w) {
      widgetDrafts[w.id] = {
        id: w.id,
        title: w.title || w.id,
        description: w.description || '',
        template: w.template || 'TMP-LEGACY',
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
