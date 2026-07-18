/* Chặn người dùng — sandbox localStorage */
(function (global) {
  'use strict';

  var STORAGE_KEY = 'iflux_profile_blocked_v1';

  function readAll() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function writeAll(map) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  }

  function list(userId) {
    if (!userId) return [];
    var map = readAll();
    return map[userId] ? map[userId].slice() : [];
  }

  function isBlocked(userId, targetId) {
    return list(userId).indexOf(targetId) !== -1;
  }

  function block(userId, targetId) {
    if (!userId || !targetId || userId === targetId) return list(userId);
    var map = readAll();
    var arr = map[userId] ? map[userId].slice() : [];
    if (arr.indexOf(targetId) === -1) arr.push(targetId);
    map[userId] = arr;
    writeAll(map);
    return arr;
  }

  function unblock(userId, targetId) {
    if (!userId || !targetId) return list(userId);
    var map = readAll();
    map[userId] = (map[userId] || []).filter(function (id) { return id !== targetId; });
    writeAll(map);
    return map[userId];
  }

  global.IfluxProfileBlockStore = {
    list: list,
    isBlocked: isBlocked,
    block: block,
    unblock: unblock
  };
})(window);
