/**
 * Interaction Permission — RC-IP-01…03 · IP-001
 * Runtime không tự quyết policy — chỉ Permission.resolve → UI state.
 */
(function (global) {
  'use strict';
  if (global.IfluxInteractionPermission) return;

  var Allow = 'Allow';
  var LoginRequired = 'LoginRequired';
  var NoPermission = 'NoPermission';
  var ReadOnly = 'ReadOnly';

  function actorFromAuth() {
    try {
      if (global.IfluxAuth) {
        var token = IfluxAuth.getToken
          ? IfluxAuth.getToken()
          : (IfluxAuth.getAccessToken ? IfluxAuth.getAccessToken() : null);
        if (token && IfluxAuth.getUser && IfluxAuth.getUser()) return 'user';
        if (IfluxAuth.isLoggedIn && IfluxAuth.isLoggedIn()) return 'user';
      }
    } catch (e) { /* ignore */ }
    return 'guest';
  }

  /**
   * Matrix IP-001 — Owner chốt 2026-10: TRỪ Chia sẻ, mọi tương tác khác (like/comment/reply/
   * bookmark/share_bump/reaction/favorite) luôn LoginRequired với khách qua popup
   * IfluxAuth.promptLogin trước khi cho thao tác. Chia sẻ KHÔNG đi qua matrix này — chính sách
   * guest-allowed của Share nằm riêng ở Foundation (design_system/28_share/share.js
   * executeShare/requireShareLogin, cờ allowGuest) vì Share còn quyết định affiliate ref, không
   * phải thuần Allow/LoginRequired — tránh 2 nơi cùng quyết định 1 policy mà lệch nhau.
   */
  function resolve(input) {
    input = input || {};
    var actor = input.actor || actorFromAuth();
    var action = String(input.action || '');
    /* entitlement reserved — Phase 3 wire tối thiểu */

    if (action === 'view_summary') {
      return Allow;
    }

    if (actor === 'guest') {
      if (
        action === 'comment' ||
        action === 'reply' ||
        action === 'like' ||
        action === 'bookmark' ||
        action === 'share_bump' ||
        action === 'reaction' ||
        action === 'favorite'
      ) {
        return LoginRequired;
      }
      return NoPermission;
    }

    /* user — YES* trừ entitlement (chưa chặn Phase 3) */
    return Allow;
  }

  function assertAllow(input) {
    var r = resolve(input);
    if (r !== Allow) {
      var err = new Error(r);
      err.code = r;
      throw err;
    }
    return r;
  }

  global.IfluxInteractionPermission = {
    Allow: Allow,
    LoginRequired: LoginRequired,
    NoPermission: NoPermission,
    ReadOnly: ReadOnly,
    resolve: resolve,
    assertAllow: assertAllow,
    actorFromAuth: actorFromAuth
  };
})(typeof window !== 'undefined' ? window : globalThis);
