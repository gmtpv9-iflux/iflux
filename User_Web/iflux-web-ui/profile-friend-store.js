/* Kết bạn — yêu cầu / chấp nhận (sandbox localStorage) */
(function (global) {
  'use strict';

  var STORAGE_KEY = 'iflux_profile_friends_v1';

  function emptyData() {
    return { friends: {}, pending: {} };
  }

  function readAll() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return emptyData();
      var parsed = JSON.parse(raw);
      return {
        friends: parsed.friends && typeof parsed.friends === 'object' ? parsed.friends : {},
        pending: parsed.pending && typeof parsed.pending === 'object' ? parsed.pending : {}
      };
    } catch (e) {
      return emptyData();
    }
  }

  function writeAll(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data || emptyData()));
    if (typeof document !== 'undefined') {
      document.dispatchEvent(new CustomEvent('iflux-friends-change'));
    }
  }

  function friendKey(a, b) {
    return [String(a), String(b)].sort().join('__');
  }

  function isFriend(userId, peerId) {
    if (!userId || !peerId || userId === peerId) return false;
    return !!readAll().friends[friendKey(userId, peerId)];
  }

  function getPending(fromId, toId) {
    if (!fromId || !toId) return null;
    return readAll().pending[String(fromId) + '->' + String(toId)] || null;
  }

  function hasOutgoingRequest(fromId, toId) {
    return !!getPending(fromId, toId);
  }

  function hasIncomingRequest(userId, fromId) {
    return !!getPending(fromId, userId);
  }

  /** none | friends | outgoing | incoming */
  function status(userId, peerId) {
    if (!userId || !peerId || userId === peerId) return 'none';
    if (isFriend(userId, peerId)) return 'friends';
    if (hasOutgoingRequest(userId, peerId)) return 'outgoing';
    if (hasIncomingRequest(userId, peerId)) return 'incoming';
    return 'none';
  }

  function request(fromUser, toPeer) {
    if (!fromUser || !fromUser.id || !toPeer || !toPeer.id) return { ok: false, reason: 'invalid' };
    if (fromUser.id === toPeer.id) return { ok: false, reason: 'self' };
    if (isFriend(fromUser.id, toPeer.id)) return { ok: false, reason: 'already_friends' };
    if (hasOutgoingRequest(fromUser.id, toPeer.id)) return { ok: false, reason: 'already_sent' };

    var data = readAll();
    var reverseKey = String(toPeer.id) + '->' + String(fromUser.id);
    /* Nếu đối phương đã gửi yêu cầu → chấp nhận luôn */
    if (data.pending[reverseKey]) {
      delete data.pending[reverseKey];
      data.friends[friendKey(fromUser.id, toPeer.id)] = {
        a: String(fromUser.id),
        b: String(toPeer.id),
        since: new Date().toISOString()
      };
      writeAll(data);
      return { ok: true, status: 'friends' };
    }

    data.pending[String(fromUser.id) + '->' + String(toPeer.id)] = {
      from: String(fromUser.id),
      to: String(toPeer.id),
      from_name: fromUser.display_name || fromUser.name || '',
      to_name: toPeer.display_name || toPeer.name || '',
      at: new Date().toISOString()
    };
    writeAll(data);
    return { ok: true, status: 'outgoing' };
  }

  function accept(userId, fromId) {
    if (!userId || !fromId) return { ok: false };
    var data = readAll();
    var key = String(fromId) + '->' + String(userId);
    if (!data.pending[key]) return { ok: false, reason: 'no_request' };
    delete data.pending[key];
    data.friends[friendKey(userId, fromId)] = {
      a: String(userId),
      b: String(fromId),
      since: new Date().toISOString()
    };
    writeAll(data);
    return { ok: true, status: 'friends' };
  }

  function reject(userId, fromId) {
    if (!userId || !fromId) return { ok: false };
    var data = readAll();
    var key = String(fromId) + '->' + String(userId);
    if (!data.pending[key]) return { ok: false };
    delete data.pending[key];
    writeAll(data);
    return { ok: true };
  }

  function cancel(fromId, toId) {
    if (!fromId || !toId) return { ok: false };
    var data = readAll();
    var key = String(fromId) + '->' + String(toId);
    if (!data.pending[key]) return { ok: false };
    delete data.pending[key];
    writeAll(data);
    return { ok: true };
  }

  function unfriend(userId, peerId) {
    if (!userId || !peerId) return { ok: false };
    var data = readAll();
    var key = friendKey(userId, peerId);
    if (!data.friends[key]) return { ok: false };
    delete data.friends[key];
    writeAll(data);
    return { ok: true };
  }

  global.IfluxProfileFriendStore = {
    isFriend: isFriend,
    status: status,
    request: request,
    accept: accept,
    reject: reject,
    cancel: cancel,
    unfriend: unfriend,
    hasOutgoingRequest: hasOutgoingRequest,
    hasIncomingRequest: hasIncomingRequest
  };
})(window);
