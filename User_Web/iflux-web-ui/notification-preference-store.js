/* Notification preferences — type-level sync (D1-rev) */
(function (global) {
  'use strict';

  function collectItemsFromGroups(groups) {
    var items = [];
    (groups || []).forEach(function (g) {
      (g.types || []).forEach(function (t) {
        items.push({
          type_code: t.type_code,
          admin_code: t.admin_code,
          name: t.name,
          enabled: t.enabled !== false,
          groupKey: g.key,
          groupLabel: g.label
        });
      });
    });
    return items;
  }

  function itemsForPatch(typeStates) {
    typeStates = typeStates || {};
    return Object.keys(typeStates).map(function (code) {
      return { type_code: code, enabled: typeStates[code] !== false };
    });
  }

  global.IfluxNotificationPreferenceStore = {
    _cache: null,
    collectItemsFromGroups: collectItemsFromGroups,
    itemsForPatch: itemsForPatch,
    setCache: function (data) {
      this._cache = data || { groups: [] };
    },
    getGroups: function () {
      return (this._cache && this._cache.groups) ? this._cache.groups : [];
    }
  };
})(window);
