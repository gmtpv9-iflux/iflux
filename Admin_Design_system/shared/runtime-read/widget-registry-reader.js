/**
 * WidgetRegistryReader — AB-07 read adapter (Admin Permission context).
 * Projection from L4 read API already on page — no Store import.
 */
(function (global) {
  'use strict';

  function l4() {
    return global.PlatformLayersWidgets;
  }

  function normalizeEntry(m) {
    if (!m) return null;
    var id = m.id || m.widgetId || m.type;
    if (!id) return null;
    return {
      widgetId: id,
      id: id,
      title: m.title || id,
      description: m.description || '',
      category: m.category || m.group || '',
      capability: m.capability || '',
      templateRef: m.templateRef || m.renderAs || null
    };
  }

  function listSync() {
    var P = l4();
    if (P && typeof P.entitlementList === 'function') {
      return P.entitlementList().map(normalizeEntry).filter(Boolean);
    }
    if (global.WidgetLibraryCatalog && typeof WidgetLibraryCatalog.allWidgetIdsInLibrary === 'function') {
      return WidgetLibraryCatalog.allWidgetIdsInLibrary().map(function (id) {
        var copy = (P && P.resolveWidgetCopy) ? P.resolveWidgetCopy(id) : null;
        return normalizeEntry({
          id: id,
          title: (copy && copy.title) || id,
          description: (copy && copy.description) || ''
        });
      });
    }
    return [];
  }

  function getSync(widgetId) {
    widgetId = String(widgetId || '');
    var found = null;
    listSync().some(function (e) {
      if (e.id === widgetId) { found = e; return true; }
      return false;
    });
    return found;
  }

  global.WidgetRegistryReader = {
    list: function () { return listSync(); },
    get: function (widgetId) { return getSync(widgetId); },
    widgetIds: function () {
      return listSync().map(function (e) { return e.id; });
    },
    isKnown: function (widgetId) {
      return !!getSync(widgetId);
    },
    /** Matrix UI shape { id, title, description } */
    listMatrixEntries: function () {
      return listSync().map(function (e) {
        return { id: e.id, title: e.title, description: e.description };
      }).sort(function (a, b) {
        return String(a.id).localeCompare(String(b.id));
      });
    }
  };
})(window);
