/* Điều kiện mở khóa chat giữa 2 user */
(function (global) {
  'use strict';

  var REASONS = {
    self: 'Không thể nhắn tin cho chính bạn.',
    login: 'Đăng nhập để nhắn tin.',
    blocked: 'Không thể nhắn tin vì một bên đã chặn.',
    denied: 'Không thể nhắn tin. Cần: người nhận cho phép tin từ người lạ, hoặc đã kết bạn, hoặc theo dõi lẫn nhau, hoặc có liên hệ affiliate (3 cấp).'
  };

  function blockedEither(a, b) {
    if (!global.IfluxProfileBlockStore) return false;
    return IfluxProfileBlockStore.isBlocked(a, b) || IfluxProfileBlockStore.isBlocked(b, a);
  }

  function allowsStrangerMessages(recipientId) {
    if (!global.IfluxProfilePrivacyStore || !recipientId) return false;
    var s = IfluxProfilePrivacyStore.get(recipientId);
    return !!(s && s.allow_stranger_messages);
  }

  function isMutualFriend(a, b) {
    return !!(global.IfluxProfileFriendStore && IfluxProfileFriendStore.isFriend(a, b));
  }

  function isMutualFollow(a, b) {
    if (!global.IfluxProfileFollowStore) return false;
    if (IfluxProfileFollowStore.isMutual) return IfluxProfileFollowStore.isMutual(a, b);
    return IfluxProfileFollowStore.isFollowing(a, b) && IfluxProfileFollowStore.isFollowing(b, a);
  }

  function isAffiliateRelated(a, b, maxDepth) {
    maxDepth = maxDepth || 3;
    if (!a || !b || a === b) return false;
    var aff = global.IfluxLoyaltyAffiliateStore;
    if (!aff || !aff.getUplineChain) return false;

    function chainIncludes(fromId, targetId) {
      var chain = aff.getUplineChain(String(fromId), maxDepth) || [];
      return chain.indexOf(String(targetId)) >= 0;
    }

    /* A trong upline ≤3 cấp của B, hoặc ngược lại */
    return chainIncludes(b, a) || chainIncludes(a, b);
  }

  /**
   * Chat được phép khi (không block) và thỏa ≥1:
   * 1) Người nhận bật "nhận tin nhắn người lạ"
   * 2) Đã kết bạn
   * 3) Theo dõi lẫn nhau
   * 4) Liên hệ affiliate trong 3 cấp
   */
  function evaluate(viewerId, peerId) {
    if (!viewerId || !peerId) {
      return { ok: false, reason: 'login', message: REASONS.login, matches: [] };
    }
    if (String(viewerId) === String(peerId)) {
      return { ok: false, reason: 'self', message: REASONS.self, matches: [] };
    }
    if (blockedEither(viewerId, peerId)) {
      return { ok: false, reason: 'blocked', message: REASONS.blocked, matches: [] };
    }

    var matches = [];
    if (allowsStrangerMessages(peerId)) matches.push('stranger');
    if (isMutualFriend(viewerId, peerId)) matches.push('friends');
    if (isMutualFollow(viewerId, peerId)) matches.push('mutual_follow');
    if (isAffiliateRelated(viewerId, peerId, 3)) matches.push('affiliate');

    if (!matches.length) {
      return { ok: false, reason: 'denied', message: REASONS.denied, matches: [] };
    }
    return { ok: true, reason: 'ok', message: '', matches: matches };
  }

  function canChat(viewerId, peerId) {
    return evaluate(viewerId, peerId).ok;
  }

  function denyMessage(viewerId, peerId) {
    var r = evaluate(viewerId, peerId);
    return r.ok ? '' : (r.message || REASONS.denied);
  }

  global.IfluxProfileChatAccess = {
    evaluate: evaluate,
    canChat: canChat,
    denyMessage: denyMessage,
    allowsStrangerMessages: allowsStrangerMessages,
    isMutualFriend: isMutualFriend,
    isMutualFollow: isMutualFollow,
    isAffiliateRelated: isAffiliateRelated,
    REASONS: REASONS
  };
})(window);
