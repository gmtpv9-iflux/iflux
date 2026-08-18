/* Wave B — localStorage map scoped theo userId (Account / Profile stores) */
(function (global) {
  'use strict';

  function useApi() {
    return !!(global.IfluxData && IfluxData.isApi && IfluxData.isApi());
  }

  function readMap(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : (fallback != null ? fallback : {});
    } catch (e) {
      return fallback != null ? fallback : {};
    }
  }

  function writeMap(key, map) {
    localStorage.setItem(key, JSON.stringify(map));
  }

  function bucket(map, userId, emptyFactory) {
    var id = String(userId || '');
    if (!id) return null;
    if (!map[id]) map[id] = emptyFactory ? emptyFactory() : [];
    return map[id];
  }

  function migrateFlatListToMap(legacyKey, mapKey, userField) {
    userField = userField || 'userId';
    try {
      var raw = localStorage.getItem(legacyKey);
      if (!raw) return false;
      var list = JSON.parse(raw);
      if (!Array.isArray(list) || !list.length) {
        localStorage.removeItem(legacyKey);
        return false;
      }
      var map = readMap(mapKey, {});
      list.forEach(function (item) {
        if (!item) return;
        var uid = String(item[userField] || '');
        if (!uid) return;
        if (!map[uid]) map[uid] = [];
        map[uid].push(item);
      });
      writeMap(mapKey, map);
      localStorage.removeItem(legacyKey);
      return true;
    } catch (e) {
      return false;
    }
  }

  global.IfluxProfileLocalScope = {
    useApi: useApi,
    readMap: readMap,
    writeMap: writeMap,
    bucket: bucket,
    migrateFlatListToMap: migrateFlatListToMap
  };
})(window);
