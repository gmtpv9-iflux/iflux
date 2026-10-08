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
   * Matrix IP-001 — Owner đổi quyết định 2026-10: Guest share_url = Allow (đồng bộ đăng nhập —
   * TRỪ Chia sẻ, mọi tương tác khác luôn hỏi đăng nhập qua popup trước khi cho thao tác; Chia sẻ
   * là ngoại lệ duy nhất, khách vẫn chia sẻ được link bài viết không cần đăng nhập).
   * (Supersedes Phase 7 Owner LOCK trước đó: Guest share = LoginRequired / DQ-01 / Brief §6B —
   * bản thân LOCK đó cũng đã supersede quyết định Q3 gốc là Allow, nay quay lại Allow.)
   */
  function resolve(input) {
    input = input || {};
    var actor = input.actor || actorFromAuth();
    var action = String(input.action || '');
    /* entitlement reserved — Phase 3 wire tối thiểu */

    if (action === 'view_summary') {
      return Allow;
    }

    if (action === 'share_url') {
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
