/* iFlux — HTTP API client (ApiDataProvider). Requires: iflux-runtime-config → iflux-data-provider → iflux-api-config */
(function (global) {
  'use strict';

  function baseUrl() {
    return global.IfluxApiConfig ? IfluxApiConfig.getBaseUrl() : '';
  }

  function authHeaders(token) {
    var h = { 'Content-Type': 'application/json' };
    if (token) h.Authorization = 'Bearer ' + token;
    return h;
  }

  function friendlyNetworkError(err) {
    var msg = (err && err.message) || '';
    if (msg === 'Failed to fetch' || (err && err.name === 'TypeError')) {
      if (global.IfluxData && !IfluxData.isApi()) {
        var mode = global.IfluxRuntime ? IfluxRuntime.getDataMode() : 'sandbox';
        return new Error('dataMode=' + mode + ' — UI dùng ' + (IfluxData.getProvider().label || 'local provider') + ', không gọi HTTP API.');
      }
      var base = baseUrl();
      if (!base) {
        return new Error('dataMode=api nhưng chưa cấu hình apiBaseUrl trong runtime manifest.');
      }
      return new Error(
        'Không kết nối được API (' + base + '). ' +
        (base.indexOf('localhost') >= 0
          ? 'Chạy backend: cd backend && npm start (port 3001), hoặc đổi ?dataMode=sandbox.'
          : 'Kiểm tra server hoặc đổi dataMode trong iflux-runtime-manifest.json.')
      );
    }
    return err;
  }

  function request(path, options) {
    if (!global.IfluxData || !IfluxData.isApi()) {
      var provider = global.IfluxData ? IfluxData.getProvider().label : 'SandboxDataProvider';
      return Promise.reject(new Error('Provider hiện tại: ' + provider + ' — không dùng HTTP request.'));
    }
    if (!global.IfluxApiConfig || !IfluxApiConfig.isEnabled()) {
      return Promise.reject(new Error('dataMode=api nhưng apiBaseUrl chưa được cấu hình.'));
    }
    options = options || {};
    var url = baseUrl() + path;
    var headers = Object.assign({ 'Content-Type': 'application/json' }, options.headers || {});
    return fetch(url, {
      method: options.method || 'GET',
      headers: headers,
      body: options.body != null ? JSON.stringify(options.body) : undefined
    }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (data) {
        if (!res.ok) {
          var msg = data.error || (data.error && data.error.message) || data.message || ('HTTP ' + res.status);
          if (typeof msg === 'object') msg = msg.message || JSON.stringify(msg);
          if (msg === 'Invalid credentials') msg = 'Email hoặc mật khẩu không đúng.';
          if (msg === 'Email already registered') msg = 'Email đã được đăng ký.';
          if (msg === 'Phone already registered') msg = 'Số điện thoại này đã được liên kết với tài khoản khác.';
          if (msg === 'Invalid verification code') msg = 'Mã xác thực không đúng.';
          if (msg === 'Verification code expired') msg = 'Mã xác thực đã hết hạn. Vui lòng đăng ký lại hoặc gửi lại mã.';
          if (msg === 'Too many verification attempts') msg = 'Nhập sai quá nhiều lần. Vui lòng gửi lại mã.';
          if (msg === 'Email not verified') msg = 'Email chưa xác thực. Hoàn tất xác thực trước khi đăng nhập.';
          if (msg === 'Email service not configured') msg = 'Hệ thống email chưa cấu hình. Liên hệ quản trị viên.';
          if (msg.indexOf('Please wait') === 0) msg = msg.replace('Please wait', 'Vui lòng đợi').replace('seconds before resending', 'giây trước khi gửi lại');
          throw new Error(msg);
        }
        return data;
      });
    }).catch(function (err) {
      throw friendlyNetworkError(err);
    });
  }

  function authRegister(email, password, referralCode, extra) {
    extra = extra || {};
    return request('/auth/register', {
      method: 'POST',
      body: {
        email: email,
        password: password,
        referral_code: referralCode || null,
        display_name: extra.display_name || null,
        phone: extra.phone || null
      }
    });
  }

  function authVerifyEmail(email, code) {
    return request('/auth/verify-email', {
      method: 'POST',
      body: { email: email, code: code }
    });
  }

  function authResendVerification(email) {
    return request('/auth/resend-verification', {
      method: 'POST',
      body: { email: email }
    });
  }

  function authLogin(email, password, rememberMe) {
    return request('/auth/login', {
      method: 'POST',
      body: { email: email, password: password, remember_me: !!rememberMe }
    });
  }

  function authSocial(provider, tokens, opts) {
    opts = opts || {};
    tokens = tokens || {};
    var body = {
      provider: provider,
      referral_code: opts.referral_code || null
    };
    if (tokens.id_token) body.id_token = tokens.id_token;
    if (tokens.access_token) body.access_token = tokens.access_token;
    if (tokens.oauth_code) body.oauth_code = tokens.oauth_code;
    if (opts.remember_me) body.remember_me = !!opts.remember_me;
    return request('/auth/social', { method: 'POST', body: body });
  }

  function getSocialAuthConfig() {
    return request('/auth/social/config', { method: 'GET' });
  }

  function authMe(token) {
    return request('/auth/me', { headers: authHeaders(token) });
  }

  function validateReferralCode(code) {
    return request('/auth/referral/validate/' + encodeURIComponent(String(code || '').trim().toUpperCase()));
  }

  function getAffiliateSync(token) {
    return request('/auth/referrals/sync', { headers: authHeaders(token) });
  }

  function listMyAffiliatePayoutRequests(token) {
    return request('/affiliate-payouts/requests/mine', { headers: authHeaders(token) });
  }

  function createAffiliatePayoutRequest(token, payload) {
    return request('/affiliate-payouts/requests', {
      method: 'POST',
      headers: authHeaders(token),
      body: payload
    });
  }

  function listAffiliatePayoutRequestsAdmin(filters) {
    filters = filters || {};
    var qs = [];
    if (filters.status) qs.push('status=' + encodeURIComponent(filters.status));
    if (filters.q) qs.push('q=' + encodeURIComponent(filters.q));
    var suffix = qs.length ? '?' + qs.join('&') : '';
    return request('/affiliate-payouts/requests' + suffix, { headers: adminHeaders() });
  }

  function approveAffiliatePayoutAdmin(id) {
    return request('/affiliate-payouts/requests/' + encodeURIComponent(id) + '/approve', {
      method: 'POST',
      headers: adminHeaders(),
      body: {}
    });
  }

  function completeAffiliatePayoutAdmin(id) {
    return request('/affiliate-payouts/requests/' + encodeURIComponent(id) + '/complete', {
      method: 'POST',
      headers: adminHeaders(),
      body: {}
    });
  }

  function rejectAffiliatePayoutAdmin(id, reason) {
    return request('/affiliate-payouts/requests/' + encodeURIComponent(id) + '/reject', {
      method: 'POST',
      headers: adminHeaders(),
      body: { reason: reason || '' }
    });
  }

  function updateProfile(token, patch) {
    return request('/users/profile', {
      method: 'PUT',
      headers: authHeaders(token),
      body: patch
    });
  }

  function changePassword(token, currentPassword, newPassword) {
    return request('/users/change-password', {
      method: 'POST',
      headers: authHeaders(token),
      body: {
        current_password: currentPassword,
        new_password: newPassword
      }
    });
  }

  function getNotificationPreferences(token) {
    return request('/users/me/notification-preferences', {
      headers: authHeaders(token)
    });
  }

  function patchNotificationPreferences(token, payload) {
    return request('/users/me/notification-preferences', {
      method: 'PATCH',
      headers: authHeaders(token),
      body: payload
    });
  }

  function getUserDataSync(token) {
    return request('/user-data/sync', { headers: authHeaders(token) });
  }

  function getWatchlist(token) {
    return request('/user-data/watchlist', { headers: authHeaders(token) });
  }

  function saveWatchlist(token, data) {
    return request('/user-data/watchlist', {
      method: 'PUT',
      headers: authHeaders(token),
      body: { data: data }
    });
  }

  function getAlerts(token) {
    return request('/user-data/alerts', { headers: authHeaders(token) });
  }

  function saveAlerts(token, data) {
    return request('/user-data/alerts', {
      method: 'PUT',
      headers: authHeaders(token),
      body: { data: data }
    });
  }

  function getDashboard(token) {
    return request('/user-data/dashboard', { headers: authHeaders(token) });
  }

  function saveDashboard(token, data) {
    return request('/user-data/dashboard', {
      method: 'PUT',
      headers: authHeaders(token),
      body: { data: data }
    });
  }

  function getNotifications(token) {
    return request('/user-data/notifications', { headers: authHeaders(token) });
  }

  function saveNotifications(token, data) {
    return request('/user-data/notifications', {
      method: 'PUT',
      headers: authHeaders(token),
      body: { data: data }
    });
  }

  function getMessages(token) {
    return request('/user-data/messages', { headers: authHeaders(token) });
  }

  function saveMessages(token, data) {
    return request('/user-data/messages', {
      method: 'PUT',
      headers: authHeaders(token),
      body: { data: data }
    });
  }

  function adminHeaders() {
    var key = 'iflux-admin-local-dev';
    try {
      var stored = localStorage.getItem('iflux_admin_api_key');
      if (stored) key = stored;
    } catch (e) { /* ignore */ }
    return { 'Content-Type': 'application/json', 'X-Admin-Key': key };
  }

  function createSubscriptionOrder(token, payload) {
    return request('/subscriptions/orders', {
      method: 'POST',
      headers: authHeaders(token),
      body: {
        plan_tier: payload.planTier,
        plan_name: payload.planName,
        cycle: payload.cycle,
        amount: payload.amount,
        coupon_discount: payload.couponDiscount || 0,
        pay_method: payload.payMethod,
        transfer_ref: payload.transferRef || '',
        user_name: payload.userName || '',
        email: payload.email || ''
      }
    });
  }

  function listMySubscriptionOrders(token) {
    return request('/subscriptions/orders/mine', { headers: authHeaders(token) });
  }

  function listSubscriptionOrdersAdmin(filters) {
    filters = filters || {};
    var qs = [];
    if (filters.status) qs.push('status=' + encodeURIComponent(filters.status));
    if (filters.payMethod) qs.push('pay_method=' + encodeURIComponent(filters.payMethod));
    if (filters.q) qs.push('q=' + encodeURIComponent(filters.q));
    var suffix = qs.length ? '?' + qs.join('&') : '';
    return request('/subscriptions/orders' + suffix, { headers: adminHeaders() });
  }

  function approveSubscriptionOrderAdmin(id) {
    return request('/subscriptions/orders/' + encodeURIComponent(id) + '/approve', {
      method: 'POST',
      headers: adminHeaders(),
      body: { admin_name: 'Admin' }
    });
  }

  function rejectSubscriptionOrderAdmin(id, reason) {
    return request('/subscriptions/orders/' + encodeURIComponent(id) + '/reject', {
      method: 'POST',
      headers: adminHeaders(),
      body: { reason: reason || '', admin_name: 'Admin' }
    });
  }

  function getMarketSnapshot() {
    return request('/snapshot/market');
  }

  function listCommunityPosts(params) {
    params = params || {};
    var qs = [];
    if (params.type) qs.push('type=' + encodeURIComponent(params.type));
    if (params.limit) qs.push('limit=' + encodeURIComponent(params.limit));
    var suffix = qs.length ? '?' + qs.join('&') : '';
    return request('/news/posts' + suffix);
  }

  function listContentFeed(params) {
    params = params || {};
    var qs = [];
    if (params.limit) qs.push('limit=' + encodeURIComponent(params.limit));
    var suffix = qs.length ? '?' + qs.join('&') : '';
    return request('/content/feed' + suffix);
  }

  function listContentTopics(params) {
    params = params || {};
    var qs = [];
    if (params.limit) qs.push('limit=' + encodeURIComponent(params.limit));
    if (params.period) qs.push('period=' + encodeURIComponent(params.period));
    if (params.trending || params.period) {
      return request('/content/chu-de-ung-vien/trending' + (qs.length ? '?' + qs.join('&') : ''));
    }
    if (params.status) qs.push('status=' + encodeURIComponent(params.status));
    return request('/content/chu-de-ung-vien' + (qs.length ? '?' + qs.join('&') : ''));
  }

  function recordContentInterest(payload) {
    return request('/content/interest', { method: 'POST', body: payload || {} });
  }

  function promoteContentTopic(topicId, payload) {
    return request('/content/topics/' + encodeURIComponent(topicId) + '/promote', {
      method: 'POST',
      headers: adminHeaders(),
      body: payload || {}
    });
  }

  function listContentStories(params) {
    params = params || {};
    var qs = [];
    if (params.status) qs.push('status=' + encodeURIComponent(params.status));
    if (params.limit) qs.push('limit=' + encodeURIComponent(params.limit));
    return request('/content/chu-de' + (qs.length ? '?' + qs.join('&') : ''));
  }

  function getContentStory(idOrSlug) {
    return request('/content/chu-de/' + encodeURIComponent(idOrSlug));
  }

  function listContentMappings(params) {
    params = params || {};
    var qs = [];
    if (params.story_id) qs.push('story_id=' + encodeURIComponent(params.story_id));
    if (params.slug) qs.push('slug=' + encodeURIComponent(params.slug));
    if (params.ticker) qs.push('ticker=' + encodeURIComponent(params.ticker));
    if (params.recompute) qs.push('recompute=1');
    if (params.limit) qs.push('limit=' + encodeURIComponent(params.limit));
    return request('/content/mappings' + (qs.length ? '?' + qs.join('&') : ''));
  }

  function recordContentRelevance(payload) {
    return request('/content/relevance', { method: 'POST', body: payload || {} });
  }

  function recomputeContentRelevance(payload) {
    return request('/content/relevance/recompute', {
      method: 'POST',
      headers: adminHeaders(),
      body: payload || {}
    });
  }

  function autoPromoteContentTopics(payload) {
    return request('/content/topics/auto-promote', {
      method: 'POST',
      headers: adminHeaders(),
      body: payload || {}
    });
  }

  function listCommunityCategories(params) {
    params = params || {};
    var qs = [];
    if (params.featured) qs.push('featured=1');
    if (params.q) qs.push('q=' + encodeURIComponent(params.q));
    var suffix = qs.length ? '?' + qs.join('&') : '';
    return request('/news/categories' + suffix);
  }

  function listCommunityCategoriesAdmin(params) {
    params = params || {};
    var qs = [];
    if (params.q) qs.push('q=' + encodeURIComponent(params.q));
    if (params.parent_id != null) qs.push('parent_id=' + encodeURIComponent(params.parent_id));
    var suffix = qs.length ? '?' + qs.join('&') : '';
    return request('/news/admin/categories' + suffix, { headers: adminHeaders() });
  }

  function getCommunityCategoryAdmin(id) {
    return request('/news/admin/categories/' + encodeURIComponent(id), { headers: adminHeaders() });
  }

  function createCommunityCategoryAdmin(payload) {
    return request('/news/admin/categories', {
      method: 'POST',
      headers: adminHeaders(),
      body: payload
    });
  }

  function updateCommunityCategoryAdmin(id, payload) {
    return request('/news/admin/categories/' + encodeURIComponent(id), {
      method: 'PUT',
      headers: adminHeaders(),
      body: payload
    });
  }

  function deleteCommunityCategoryAdmin(id) {
    return request('/news/admin/categories/' + encodeURIComponent(id), {
      method: 'DELETE',
      headers: adminHeaders()
    });
  }

  function createCommunityPost(token, payload) {
    return request('/news/posts', {
      method: 'POST',
      headers: authHeaders(token),
      body: payload
    });
  }

  function listOnboardingSteps(channel) {
    return request('/onboarding/steps?channel=' + encodeURIComponent(channel || 'web'));
  }

  function listOnboardingStepsAdmin(channel) {
    var qs = channel ? '?channel=' + encodeURIComponent(channel) : '';
    return request('/onboarding/admin/steps' + qs, { headers: adminHeaders() });
  }

  function createOnboardingStepAdmin(payload) {
    return request('/onboarding/admin/steps', {
      method: 'POST',
      headers: adminHeaders(),
      body: payload
    });
  }

  function updateOnboardingStepAdmin(id, payload) {
    return request('/onboarding/admin/steps/' + encodeURIComponent(id), {
      method: 'PUT',
      headers: adminHeaders(),
      body: payload
    });
  }

  function deleteOnboardingStepAdmin(id) {
    return request('/onboarding/admin/steps/' + encodeURIComponent(id), {
      method: 'DELETE',
      headers: adminHeaders()
    });
  }

  function getOnboardingState(token) {
    return request('/user-data/onboarding', { headers: authHeaders(token) });
  }

  function saveOnboardingState(token, patch) {
    return getOnboardingState(token).then(function (res) {
      var data = Object.assign({}, (res && res.data) || {}, patch || {});
      return request('/user-data/onboarding', {
        method: 'PUT',
        headers: authHeaders(token),
        body: { data: data }
      });
    });
  }

  global.IfluxApiClient = {
    request: request,
    authRegister: authRegister,
    authVerifyEmail: authVerifyEmail,
    authResendVerification: authResendVerification,
    authLogin: authLogin,
    authSocial: authSocial,
    getSocialAuthConfig: getSocialAuthConfig,
    authMe: authMe,
    validateReferralCode: validateReferralCode,
    getAffiliateSync: getAffiliateSync,
    listMyAffiliatePayoutRequests: listMyAffiliatePayoutRequests,
    createAffiliatePayoutRequest: createAffiliatePayoutRequest,
    listAffiliatePayoutRequestsAdmin: listAffiliatePayoutRequestsAdmin,
    approveAffiliatePayoutAdmin: approveAffiliatePayoutAdmin,
    completeAffiliatePayoutAdmin: completeAffiliatePayoutAdmin,
    rejectAffiliatePayoutAdmin: rejectAffiliatePayoutAdmin,
    updateProfile: updateProfile,
    changePassword: changePassword,
    getNotificationPreferences: getNotificationPreferences,
    patchNotificationPreferences: patchNotificationPreferences,
    getUserDataSync: getUserDataSync,
    getWatchlist: getWatchlist,
    saveWatchlist: saveWatchlist,
    getAlerts: getAlerts,
    saveAlerts: saveAlerts,
    getDashboard: getDashboard,
    saveDashboard: saveDashboard,
    getNotifications: getNotifications,
    saveNotifications: saveNotifications,
    getMessages: getMessages,
    saveMessages: saveMessages,
    createSubscriptionOrder: createSubscriptionOrder,
    listMySubscriptionOrders: listMySubscriptionOrders,
    listSubscriptionOrdersAdmin: listSubscriptionOrdersAdmin,
    approveSubscriptionOrderAdmin: approveSubscriptionOrderAdmin,
    rejectSubscriptionOrderAdmin: rejectSubscriptionOrderAdmin,
    getMarketSnapshot: getMarketSnapshot,
    listCommunityPosts: listCommunityPosts,
    listContentFeed: listContentFeed,
    listContentTopics: listContentTopics,
    recordContentInterest: recordContentInterest,
    promoteContentTopic: promoteContentTopic,
    listContentStories: listContentStories,
    getContentStory: getContentStory,
    listContentMappings: listContentMappings,
    recordContentRelevance: recordContentRelevance,
    recomputeContentRelevance: recomputeContentRelevance,
    autoPromoteContentTopics: autoPromoteContentTopics,
    createCommunityPost: createCommunityPost,
    listCommunityCategories: listCommunityCategories,
    listCommunityCategoriesAdmin: listCommunityCategoriesAdmin,
    getCommunityCategoryAdmin: getCommunityCategoryAdmin,
    createCommunityCategoryAdmin: createCommunityCategoryAdmin,
    updateCommunityCategoryAdmin: updateCommunityCategoryAdmin,
    deleteCommunityCategoryAdmin: deleteCommunityCategoryAdmin,
    listOnboardingSteps: listOnboardingSteps,
    listOnboardingStepsAdmin: listOnboardingStepsAdmin,
    createOnboardingStepAdmin: createOnboardingStepAdmin,
    updateOnboardingStepAdmin: updateOnboardingStepAdmin,
    deleteOnboardingStepAdmin: deleteOnboardingStepAdmin,
    getOnboardingState: getOnboardingState,
    saveOnboardingState: saveOnboardingState
  };
})(window);
