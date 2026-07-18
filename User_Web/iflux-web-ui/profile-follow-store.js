/* Danh sách user đang theo dõi — sandbox localStorage */
(function (global) {
  'use strict';

  var STORAGE_KEY = 'iflux_profile_follows_v1';

  var SEED = [
    { id: 'u2', display_name: 'Lan Hương', username: '@lan.huong', initials: 'LH', role: 'Phân tích', followers: 1280 },
    { id: 'u3', display_name: 'Đức Anh', username: '@duc.anh', initials: 'DA', role: 'Sáng tạo', followers: 890 },
    { id: 'u4', display_name: 'Thu Hà', username: '@thu.ha', initials: 'TH', role: 'Tiêu chuẩn', followers: 456 },
    { id: 'u5', display_name: 'Quốc Bảo', username: '@qb.trader', initials: 'QB', role: 'Chuyên gia cộng đồng', followers: 2100 },
    { id: 'u6', display_name: 'Hoàng Nam', username: '@hoang.nam', initials: 'HN', role: 'Phân tích', followers: 670 }
  ];

  function readAll() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* ignore */ }
    return null;
  }

  function writeAll(map) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  }

  function ensure(userId) {
    var map = readAll();
    if (!map) {
      map = {};
      map[userId] = SEED.slice();
      writeAll(map);
    }
    if (!map[userId]) {
      map[userId] = [];
      writeAll(map);
    }
    return map;
  }

  function listFollowing(userId) {
    userId = userId || 'default';
    var map = ensure(userId);
    return (map[userId] || []).slice();
  }

  function countFollowing(userId) {
    return listFollowing(userId).length;
  }

  function isFollowing(userId, targetId) {
    return listFollowing(userId).some(function (u) { return u.id === targetId; });
  }

  /** Theo dõi lẫn nhau = cả hai chiều cùng tồn tại trong follow store */
  function isMutual(userId, peerId) {
    if (!userId || !peerId || userId === peerId) return false;
    return isFollowing(userId, peerId) && isFollowing(peerId, userId);
  }

  function listFollowers(userId) {
    userId = String(userId || '');
    if (!userId) return [];
    var map = readAll() || {};
    var out = [];
    Object.keys(map).forEach(function (followerId) {
      if (followerId === userId) return;
      var list = map[followerId] || [];
      if (list.some(function (u) { return String(u.id) === userId; })) {
        out.push({ id: followerId });
      }
    });
    return out;
  }

  function follow(userId, target) {
    if (!target || !target.id) return false;
    var map = ensure(userId);
    var list = map[userId] || [];
    if (list.some(function (u) { return u.id === target.id; })) return false;
    list.push({
      id: target.id,
      display_name: target.display_name || target.name,
      username: target.username || '',
      initials: target.initials || 'U',
      role: target.role || 'Thành viên',
      followers: target.followers || 0
    });
    map[userId] = list;
    writeAll(map);
    return true;
  }

  function unfollow(userId, targetId) {
    var map = ensure(userId);
    map[userId] = (map[userId] || []).filter(function (u) { return u.id !== targetId; });
    writeAll(map);
  }

  global.IfluxProfileFollowStore = {
    listFollowing: listFollowing,
    listFollowers: listFollowers,
    countFollowing: countFollowing,
    isFollowing: isFollowing,
    isMutual: isMutual,
    follow: follow,
    unfollow: unfollow
  };
})(window);
