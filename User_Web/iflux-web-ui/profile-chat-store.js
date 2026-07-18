/* Tin nhắn hồ sơ — localStorage scoped theo user + sync server */
(function (global) {
  'use strict';

  var STORAGE_KEY = 'iflux_profile_messages_v1';
  var LEGACY_KEY = 'iflux_profile_messages_v1';

  function us() { return global.IfluxUserStorage; }

  function uid() {
    if (us() && us().currentUserId) return us().currentUserId();
    var u = global.IfluxAuth && IfluxAuth.getUser();
    return (u && u.id) ? u.id : null;
  }

  function emptyData() {
    return { threads: {} };
  }

  function normalizeData(raw) {
    if (!raw || typeof raw !== 'object') return emptyData();
    if (!raw.threads || typeof raw.threads !== 'object') return { threads: {} };
    return raw;
  }

  function migrateLegacyOnce(userId) {
    if (!userId || userId === 'anon') return;
    try {
      var scoped = us() ? us().scopedKey(STORAGE_KEY, userId) : (STORAGE_KEY + '_' + userId);
      if (localStorage.getItem(scoped)) return;
      var legacy = localStorage.getItem(LEGACY_KEY);
      if (!legacy) return;
      var parsed = JSON.parse(legacy);
      var data = normalizeData(parsed);
      var next = emptyData();
      Object.keys(data.threads || {}).forEach(function (key) {
        if (key.indexOf(userId) !== -1) next.threads[key] = data.threads[key];
      });
      if (Object.keys(next.threads).length) {
        if (us()) us().writeJson(STORAGE_KEY, next, userId);
        else localStorage.setItem(scoped, JSON.stringify(next));
      }
    } catch (e) { /* ignore */ }
  }

  function readAll(userId) {
    userId = userId || uid();
    migrateLegacyOnce(userId);
    if (us() && userId) {
      return normalizeData(us().readJson(STORAGE_KEY, emptyData(), userId));
    }
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return normalizeData(raw ? JSON.parse(raw) : emptyData());
    } catch (e) {
      return emptyData();
    }
  }

  function writeAll(data, userId) {
    userId = userId || uid();
    data = normalizeData(data);
    if (us() && userId) us().writeJson(STORAGE_KEY, data, userId);
    else localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    if (global.IfluxUserDataSync && IfluxUserDataSync.scheduleMessagesSync) {
      IfluxUserDataSync.scheduleMessagesSync(data);
    }
    if (typeof document !== 'undefined') {
      document.dispatchEvent(new CustomEvent('iflux-messages-change'));
    }
  }

  function threadKey(userId, peerId) {
    return [String(userId), String(peerId)].sort().join('__');
  }

  function initials(name) {
    var parts = String(name || '').trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    return String(name || 'U').trim().slice(0, 2).toUpperCase();
  }

  function ensureThread(userId, peer) {
    if (!userId || !peer || !peer.id) return null;
    var data = readAll(userId);
    var key = threadKey(userId, peer.id);
    if (!data.threads[key]) {
      data.threads[key] = {
        id: key,
        peer: {
          id: peer.id,
          display_name: peer.display_name || 'Thành viên',
          username: peer.username || '',
          role: peer.role || 'Thành viên',
          avatar_url: peer.avatar_url || '',
          initials: peer.initials || initials(peer.display_name)
        },
        messages: [],
        updated_at: new Date().toISOString(),
        last_read_at: null
      };
      writeAll(data, userId);
    }
    return data.threads[key];
  }

  function listThreads(userId) {
    if (!userId) return [];
    var data = readAll(userId);
    return Object.keys(data.threads)
      .filter(function (key) { return key.indexOf(String(userId)) !== -1; })
      .map(function (key) { return data.threads[key]; })
      .sort(function (a, b) {
        var pa = a.pinned ? 1 : 0;
        var pb = b.pinned ? 1 : 0;
        if (pa !== pb) return pb - pa;
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      });
  }

  function togglePin(userId, peerId) {
    if (!userId || !peerId) return false;
    var data = readAll(userId);
    var t = data.threads[threadKey(userId, peerId)];
    if (!t) return false;
    t.pinned = !t.pinned;
    writeAll(data, userId);
    return !!t.pinned;
  }

  function isPinned(userId, peerId) {
    var t = getThread(userId, peerId);
    return !!(t && t.pinned);
  }

  /* Cập nhật trạng thái gửi cho 1 tin: sending | failed | sent | seen */
  function updateMessageStatus(userId, peerId, msgId, status) {
    if (!userId || !peerId || !msgId) return;
    var data = readAll(userId);
    var t = data.threads[threadKey(userId, peerId)];
    if (!t) return;
    var found = false;
    (t.messages || []).forEach(function (m) {
      if (m.id === msgId) { m.status = status; found = true; }
    });
    if (found) writeAll(data, userId);
  }

  /* Đánh dấu mọi tin mình đã gửi (status sent) là đã xem — mô phỏng peer đọc */
  function markSentMessagesSeen(userId, peerId) {
    if (!userId || !peerId) return false;
    var data = readAll(userId);
    var t = data.threads[threadKey(userId, peerId)];
    if (!t) return false;
    var changed = false;
    (t.messages || []).forEach(function (m) {
      if (m.from === userId && m.status === 'sent') { m.status = 'seen'; changed = true; }
    });
    if (changed) writeAll(data, userId);
    return changed;
  }

  function getThread(userId, peerId) {
    if (!userId || !peerId) return null;
    var data = readAll(userId);
    return data.threads[threadKey(userId, peerId)] || null;
  }

  function getMessages(userId, peerId) {
    var t = getThread(userId, peerId);
    return t ? t.messages.slice() : [];
  }

  function isThreadUnread(userId, thread) {
    if (!userId || !thread || !thread.messages || !thread.messages.length) return false;
    var last = thread.messages[thread.messages.length - 1];
    if (!last || last.from === userId) return false;
    if (!thread.last_read_at) return true;
    return new Date(last.at).getTime() > new Date(thread.last_read_at).getTime();
  }

  function unreadCount(userId) {
    return listThreads(userId).filter(function (t) { return isThreadUnread(userId, t); }).length;
  }

  function markThreadRead(userId, peerId) {
    if (!userId || !peerId) return;
    var data = readAll(userId);
    var key = threadKey(userId, peerId);
    var t = data.threads[key];
    if (!t) return;
    var last = t.messages && t.messages.length ? t.messages[t.messages.length - 1] : null;
    var stamp = last && last.at ? last.at : new Date().toISOString();
    if (t.last_read_at === stamp) return;
    t.last_read_at = stamp;
    writeAll(data, userId);
  }

  function sendMessage(userId, peer, text, status) {
    if (!userId || !peer || !peer.id || !String(text || '').trim()) return null;
    var data = readAll(userId);
    var key = threadKey(userId, peer.id);
    if (!data.threads[key]) {
      data.threads[key] = {
        id: key,
        peer: {
          id: peer.id,
          display_name: peer.display_name || 'Thành viên',
          username: peer.username || '',
          role: peer.role || 'Thành viên',
          avatar_url: peer.avatar_url || '',
          initials: peer.initials || initials(peer.display_name)
        },
        messages: [],
        updated_at: new Date().toISOString(),
        last_read_at: null
      };
    }
    var msg = {
      id: 'm_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      from: userId,
      text: String(text).trim(),
      at: new Date().toISOString(),
      status: status || 'sent'
    };
    data.threads[key].messages.push(msg);
    data.threads[key].updated_at = msg.at;
    data.threads[key].last_read_at = msg.at;
    data.threads[key].peer = Object.assign({}, data.threads[key].peer, {
      display_name: peer.display_name || data.threads[key].peer.display_name,
      username: peer.username || data.threads[key].peer.username,
      role: peer.role || data.threads[key].peer.role,
      avatar_url: peer.avatar_url || data.threads[key].peer.avatar_url
    });
    writeAll(data, userId);
    return msg;
  }

  function receiveMessage(recipientId, sender, text) {
    if (!recipientId || !sender || !sender.id || !String(text || '').trim()) return null;
    var data = readAll(recipientId);
    var key = threadKey(recipientId, sender.id);
    if (!data.threads[key]) {
      ensureThread(recipientId, sender);
      data = readAll(recipientId);
    }
    var msg = {
      id: 'm_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      from: sender.id,
      text: String(text).trim(),
      at: new Date().toISOString()
    };
    data.threads[key].messages.push(msg);
    data.threads[key].updated_at = msg.at;
    /* Tin nhắn mới chỉ hiện badge/panel biểu tượng nhắn tin — không đẩy vào chuông */
    writeAll(data, recipientId);
    return msg;
  }

  function seedIfEmpty(userId) {
    if (!userId || !global.IfluxProfileUsersStore) return;
    var threads = listThreads(userId);
    if (threads.length) return;
    /* Không seed demo làm “ảo” tin nhắn — chỉ seed khi user chưa từng có dữ liệu local/server */
    var raw = readAll(userId);
    if (raw && raw._seeded) return;
    raw._seeded = true;
    writeAll(raw, userId);
  }

  function hydrateFromServer(payload) {
    var userId = uid();
    if (!userId || userId === 'anon') return;
    var data = normalizeData(payload);
    if (us()) us().writeJson(STORAGE_KEY, data, userId);
    else localStorage.setItem(STORAGE_KEY + '_' + userId, JSON.stringify(data));
    if (typeof document !== 'undefined') {
      document.dispatchEvent(new CustomEvent('iflux-messages-change'));
    }
  }

  function exportForSync(userId) {
    return readAll(userId || uid());
  }

  global.IfluxProfileChatStore = {
    listThreads: listThreads,
    getThread: getThread,
    getMessages: getMessages,
    ensureThread: ensureThread,
    sendMessage: sendMessage,
    receiveMessage: receiveMessage,
    togglePin: togglePin,
    isPinned: isPinned,
    updateMessageStatus: updateMessageStatus,
    markSentMessagesSeen: markSentMessagesSeen,
    seedIfEmpty: seedIfEmpty,
    isThreadUnread: isThreadUnread,
    unreadCount: unreadCount,
    markThreadRead: markThreadRead,
    hydrateFromServer: hydrateFromServer,
    exportForSync: exportForSync,
    initials: initials
  };
})(window);
