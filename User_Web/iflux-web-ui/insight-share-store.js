/* Insight Card — link affiliate về trang chủ (không lưu ảnh / snapshot) */
(function (global) {
  'use strict';

  var STORAGE_KEY = 'iflux_insight_shares_v1';

  function userWebPrefix() {
    var path = (global.location && global.location.pathname) || '';
    var idx = path.indexOf('/User_Web/');
    if (idx >= 0) return path.slice(0, idx + '/User_Web/'.length);
    return '/User_Web/';
  }

  function origin() {
    var o = global.location && global.location.origin;
    return o && o !== 'null' ? o : '';
  }

  function getAffiliateRef() {
    var user = global.IfluxAuth && IfluxAuth.getUser();
    if (user && user.referral_code) return String(user.referral_code).trim().toUpperCase();
    if (global.IfluxLoyaltyAffiliateStore && IfluxLoyaltyAffiliateStore.getStoredRefCode) {
      var stored = IfluxLoyaltyAffiliateStore.getStoredRefCode();
      if (stored) return String(stored).trim().toUpperCase();
    }
    return '';
  }

  /** Link rút gọn: trang chủ + mã giới thiệu (QR & sao chép link) */
  function buildReferralHomeUrl(ref) {
    var prefix = userWebPrefix();
    if (prefix.charAt(0) !== '/') prefix = '/' + prefix;
    var url = (origin() || '') + prefix + 'home/index.html';
    if (ref) url += '?ref=' + encodeURIComponent(ref);
    return url;
  }

  function clearShareStorage() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) { /* ignore */ }
  }

  function createShare(payload) {
    payload = payload || {};
    clearShareStorage();
    var ref = payload.ref || getAffiliateRef();
    var url = buildReferralHomeUrl(ref);
    return {
      ref: ref,
      url: url,
      qrUrl: url,
      record: {
        ref: ref,
        title: payload.title || 'Insight iFlux',
        created_at: new Date().toISOString()
      }
    };
  }

  function registerUrlAttribution(loc) {
    if (global.IfluxLoyaltyAffiliateStore && IfluxLoyaltyAffiliateStore.captureRefFromUrl) {
      IfluxLoyaltyAffiliateStore.captureRefFromUrl(loc);
    }
  }

  global.IfluxInsightShareStore = {
    createShare: createShare,
    buildReferralHomeUrl: buildReferralHomeUrl,
    getAffiliateRef: getAffiliateRef,
    clearShareStorage: clearShareStorage,
    registerUrlAttribution: registerUrlAttribution,
    userWebPrefix: userWebPrefix
  };
})(window);
