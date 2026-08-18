/**
 * PlacementWidgetIndexReader — AB-07 read adapter.
 * GET /api/placement-widget-index + admin draft overlay (iflux_page_settings_v1).
 * Không import PageSettingsStore — chỉ projection read localStorage.
 */
(function (global) {
  'use strict';

  var DRAFT_STORAGE_KEY = 'iflux_page_settings_v1';
  var _cache = null;
  var _fetchPromise = null;

  function apiBase() {
    if (global.IfluxAdminAuth && IfluxAdminAuth.apiBase) return IfluxAdminAuth.apiBase();
    return '/api';
  }

  function authHeaders() {
    var h = { Accept: 'application/json' };
    if (global.IfluxAdminAuth && IfluxAdminAuth.getSession) {
      var s = IfluxAdminAuth.getSession();
      if (s && s.token) h.Authorization = 'Bearer ' + s.token;
    }
    return h;
  }

  function fetchIndex(opts) {
    opts = opts || {};
    if (opts.force) {
      _cache = null;
      _fetchPromise = null;
    }
    if (_fetchPromise) return _fetchPromise;
    _fetchPromise = fetch(apiBase() + '/placement-widget-index', {
      headers: authHeaders(),
      cache: 'no-store'
    }).then(function (res) {
      if (res.status === 304 && _cache) return _cache;
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    }).then(function (body) {
      _cache = (body && body.data) ? body.data : null;
      _fetchPromise = null;
      return _cache;
    }).catch(function (err) {
      _fetchPromise = null;
      throw err;
    });
    return _fetchPromise;
  }

  function l4IdSet() {
    var set = {};
    if (global.WidgetRegistryReader && WidgetRegistryReader.widgetIds) {
      WidgetRegistryReader.widgetIds().forEach(function (id) { set[id] = true; });
    } else if (global.PlatformLayersWidgets && PlatformLayersWidgets.widgetIds) {
      PlatformLayersWidgets.widgetIds().forEach(function (id) { set[id] = true; });
    }
    return set;
  }

  /** Parity page-settings-catalog.listEnabledPlacementWidgets — draft layoutSlots only. */
  function scanDraftPlacement() {
    var enabled = {};
    var disabled = {};
    try {
      var raw = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (!raw) return { enabled: enabled, disabled: disabled };
      var parsed = JSON.parse(raw);
      var pages = parsed.pages || {};
      var l4 = l4IdSet();
      var hasL4 = Object.keys(l4).length > 0;
      Object.keys(pages).forEach(function (pageKey) {
        var slots = (pages[pageKey] && pages[pageKey].layoutSlots) || {};
        Object.keys(slots).forEach(function (widgetId) {
          var slot = slots[widgetId];
          if (!slot || slot.removed) return;
          if (hasL4 && !l4[widgetId]) return;
          if (slot.enabled === true) enabled[widgetId] = true;
          if (slot.enabled === false) disabled[widgetId] = true;
        });
      });
    } catch (e) { /* ignore */ }
    return { enabled: enabled, disabled: disabled };
  }

  function mergedEnabledWidgetIds() {
    var published = (_cache && _cache.allEnabled) ? _cache.allEnabled.slice() : [];
    var draft = scanDraftPlacement();
    var set = {};
    published.forEach(function (id) {
      if (!draft.disabled[id]) set[id] = true;
    });
    Object.keys(draft.enabled).forEach(function (id) {
      set[id] = true;
    });
    return Object.keys(set).sort();
  }

  function matrixEntry(widgetId) {
    var copy = null;
    if (global.WidgetRegistryReader && WidgetRegistryReader.get) {
      copy = WidgetRegistryReader.get(widgetId);
    } else if (global.PlatformLayersWidgets && PlatformLayersWidgets.resolveWidgetCopy) {
      copy = PlatformLayersWidgets.resolveWidgetCopy(widgetId);
    }
    return {
      id: widgetId,
      title: (copy && copy.title) ? copy.title : widgetId,
      description: (copy && copy.description) ? copy.description : ''
    };
  }

  global.PlacementWidgetIndexReader = {
    fetch: fetchIndex,
    getCache: function () { return _cache; },
    listEnabledWidgetIds: function () {
      return mergedEnabledWidgetIds();
    },
    byPage: function (pageKey) {
      if (!_cache || !_cache.byPage) return [];
      return (_cache.byPage[pageKey] || []).slice();
    },
    /** Parity listEnabledPlacementWidgets → [{ id, title, description }] */
    listEnabledEntries: function () {
      return mergedEnabledWidgetIds().map(matrixEntry).sort(function (a, b) {
        return String(a.id).localeCompare(String(b.id));
      });
    }
  };
})(window);
