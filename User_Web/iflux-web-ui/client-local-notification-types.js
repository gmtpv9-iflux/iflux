/* CLIENT_LOCAL allowlist — KHÔNG phải Notification Platform thứ hai.
 *
 * Owner: Notification Platform Foundation (Phase D)
 * SoT gate: docs/Product Backlog/270728_Notification Platform Foundation/PhaseD-D4-Architecture-Verification.md § Gate 4
 *
 * Quy tắc thêm type:
 *   1. Owner + Impact Analysis (CG-030)
 *   2. Chỉ thêm khi CHƯA có server consumer
 *   3. Khi server consumer PASS → XÓA khỏi allowlist (không giữ song song)
 *
 * FAIL D4 nếu: thêm type mới chỉ vào array client mà không qua quy trình trên.
 */
(function (global) {
  'use strict';

  /** Platform type_code đã migrate — cấm ghi localStorage client */
  var PLATFORM_MIGRATED_TYPE_CODES = {
    AFFILIATE_REFERRAL_SUCCESS: true,
    COMMUNITY_POST_FROM_FOLLOWING: true,
    FOLLOW_ENTITY_TAGGED_POST: true,
    FOLLOW_USER_SHARE: true,
    INTERACTION_COMMENT_REPLY: true,
    FOLLOW_ENTITY_COMMENT: true,
    INTERACTION_COMMENT_LIKED: true
  };

  /** Legacy client keys đã retire — cấm ghi mới */
  var RETIRED_CLIENT_TYPE_KEYS = {
    referral_signup: true,
    community_post: true
  };

  /** Allowlist tạm — chờ server consumer slice (xóa từng dòng khi migrate) */
  var CLIENT_LOCAL_ALLOWLIST = {
    subscription_order: {
      owner: 'Orders consumer slice (backlog)',
      serverTypeCode: null,
      deleteWhen: 'Orders dispatch PASS → remove from allowlist'
    },
    affiliate_commission: {
      owner: 'Affiliate commission slice (backlog)',
      serverTypeCode: 'AFFILIATE_COMMISSION_EARNED',
      deleteWhen: 'Commission dispatch PASS → remove from allowlist'
    },
    alert_triggered: {
      owner: 'Alert consumer slice (backlog)',
      serverTypeCode: null,
      deleteWhen: 'Alert dispatch PASS → remove from allowlist'
    },
    community_message: {
      owner: 'DM consumer slice (backlog)',
      serverTypeCode: null,
      deleteWhen: 'Messages dispatch PASS → remove from allowlist'
    }
  };

  function isClientLocalType(type) {
    return !!(type && CLIENT_LOCAL_ALLOWLIST[type]);
  }

  function isRetiredClientType(type) {
    return !!(type && (RETIRED_CLIENT_TYPE_KEYS[type] || PLATFORM_MIGRATED_TYPE_CODES[type]));
  }

  /** @returns {boolean} true nếu được phép ghi localStorage */
  function assertClientLocalWrite(type) {
    if (isRetiredClientType(type)) {
      if (typeof console !== 'undefined' && console.warn) {
        console.warn('[iflux-notif] BLOCKED localStorage write — migrated/retired type:', type);
      }
      return false;
    }
    if (!isClientLocalType(type)) {
      if (typeof console !== 'undefined' && console.warn) {
        console.warn('[iflux-notif] BLOCKED localStorage write — not in CLIENT_LOCAL allowlist:', type);
      }
      return false;
    }
    return true;
  }

  global.IfluxClientLocalNotificationTypes = {
    ALLOWLIST: CLIENT_LOCAL_ALLOWLIST,
    PLATFORM_MIGRATED_TYPE_CODES: PLATFORM_MIGRATED_TYPE_CODES,
    RETIRED_CLIENT_TYPE_KEYS: RETIRED_CLIENT_TYPE_KEYS,
    isClientLocalType: isClientLocalType,
    isRetiredClientType: isRetiredClientType,
    assertClientLocalWrite: assertClientLocalWrite,
    allowlistKeys: function () { return Object.keys(CLIENT_LOCAL_ALLOWLIST); }
  };
})(typeof window !== 'undefined' ? window : global);
