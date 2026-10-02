/* ===== IFX-AUDIT-BEGIN =====
AUDIT-ID: T5A-P1-006
Priority: P1
STATUS: Used|dep-dong
OWNER (hiện tại): Auth
Owner đích (map): Auth
Usage audit: ✓
Dep động: Có
Migration ROI: 1
Khả năng bỏ load: Không
P1 Gate: FAIL
Refs: docs/runtime-opt/task5/PhaseA-P1-Gate.json
Note: Coverage unused cao nhưng dep guest/login — không P1 PASS
===== IFX-AUDIT-END ===== */
/* iFlux User Web — auth (PostgreSQL via iflux-api hoặc local sandbox) */
(function (global) {
  'use strict';

  var STORAGE_KEY = 'iflux_user_session';
  var ACTIVE_SESSION_KEY = 'iflux_active_session';
  var TAB_ID_KEY = 'iflux_tab_id';
  var PROFILES_KEY = 'iflux_user_profiles_v1';
  var MOCK_OTP = '123456';
  var DEMO_PASSWORD = 'Demo@1234';
  var REF_COOKIE = 'iflux_ref_code';

  function useApi() {
    return global.IfluxData ? IfluxData.isApi() : false;
  }

  function tierLabels() {
    return { free: 'Miễn phí', premium: 'Premium', elite: 'Elite' };
  }

  function normalizeSubscriptionPhase(user) {
    if (!user) return user;
    if (user.subscription_phase) return user;
    var tier = String(user.tier || 'free').toLowerCase();
    user.subscription_phase = tier === 'free' ? 'freemium' : 'paid';
    return user;
  }

  function getMenuTierLabel(user) {
    user = user || getUser();
    if (!user) return 'Miễn phí';
    normalizeSubscriptionPhase(user);
    syncPlanExpiry(user);
    var phase = user.subscription_phase || 'freemium';
    var labels = tierLabels();
    var tier = String(user.tier || 'free').toLowerCase();

    if (phase === 'trial_eligible') return 'Dùng thử';
    if (phase === 'freemium') return 'Miễn phí';
    if (phase === 'trial_expired' && user.trial_expiry_pending) {
      return labels[tier] || user.tier_label || labels.premium;
    }
    if (tier !== 'free') return labels[tier] || user.tier_label || 'Premium';
    return 'Miễn phí';
  }

  function syncSubscriptionLifecycle() {
    var s = read();
    if (!s || !s.user) return null;
    var user = s.user;
    normalizeSubscriptionPhase(user);
    syncPlanExpiry(user);
    var phase = user.subscription_phase;
    var days = getPlanDaysLeft(user);
    var changed = false;

    if (phase === 'trial_active' && days !== null && days <= 0) {
      user.subscription_phase = 'trial_expired';
      user.trial_expiry_pending = true;
      changed = true;
    }

    if (phase === 'paid' && String(user.tier || 'free').toLowerCase() !== 'free') {
      if (user.plan && user.plan.cycle === 'lifetime') { /* active */ }
      else if (days !== null && days <= 0) {
        user.tier = 'free';
        user.tier_label = tierLabels().free;
        user.subscription_phase = 'freemium';
        user.plan = {
          name: 'Miễn phí',
          tier: 'free',
          cycle: 'freemium',
          price: 0,
          currency: '₫',
          period: '',
          days_left: null,
          days_total: null,
          expires_at: null
        };
        changed = true;
      }
    }

    if (changed) {
      s.user = user;
      write(s);
      saveProfile(user);
      persistCustomer(user);
      if (typeof document !== 'undefined') {
        document.dispatchEvent(new CustomEvent('iflux-tier-changed'));
      }
    }
    return user;
  }

  function apiProfileToAppUser(profile) {
    if (!profile) return null;
    var labels = tierLabels();
    var tier = String(profile.plan || 'free').toLowerCase();
    var daysLeft = null;
    var expiresAt = profile.plan_expired_at || null;
    if (expiresAt) {
      daysLeft = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86400000);
    } else if (profile.trial_remaining_days != null) {
      daysLeft = profile.trial_remaining_days;
    }
    var displayName = profile.display_name || profile.full_name || profile.nickname
      || (profile.email ? profile.email.split('@')[0] : 'Thành viên');
    return {
      id: String(profile.id),
      display_name: displayName,
      username: profile.nickname ? '@' + profile.nickname : '',
      email: profile.email || '',
      phone: profile.phone || '',
      tier: tier,
      tier_label: labels[tier] || labels.free,
      subscription_phase: profile.subscription_phase
        || (profile.is_trial ? 'trial_active'
          : (tier !== 'free' ? 'paid' : (profile.trial_eligible ? 'trial_eligible' : 'freemium'))),
      trial_expiry_pending: !!profile.trial_expiry_pending,
      status: profile.status === 'suspended' ? 'suspended' : 'active',
      status_label: profile.status === 'suspended' ? 'Tạm khóa' : 'Hoạt động',
      role: profile.role === 'expert' ? 'Chuyên gia' : (profile.role === 'analyst' ? 'Phân tích' : 'Thành viên'),
      referral_code: profile.referral_code || '',
      referred_by: profile.referred_by ? String(profile.referred_by) : '',
      referral_link: '',
      joined_at: profile.created_at
        ? new Date(profile.created_at).toLocaleDateString('vi-VN')
        : new Date().toLocaleDateString('vi-VN'),
      stats: { posts: 0, followers: 0, following: 0 },
      plan: {
        name: labels[tier] || labels.free,
        tier: tier,
        cycle: tier === 'free' ? 'freemium' : 'monthly',
        price: tier === 'free' ? 0 : undefined,
        currency: '₫',
        period: tier === 'free' ? '' : 'tháng',
        days_left: daysLeft,
        days_total: daysLeft,
        expires_at: expiresAt
      }
    };
  }

  function normEmail(email) {
    return String(email || '').trim().toLowerCase();
  }

  function normPhone(phone) {
    var digits = String(phone || '').replace(/\D/g, '');
    if (!digits) return '';
    if (digits.charAt(0) === '0') {
      digits = '84' + digits.slice(1);
    } else if (digits.length === 9 && /^[35789]/.test(digits)) {
      digits = '84' + digits;
    }
    return digits;
  }

  function readProfiles() {
    try {
      var raw = localStorage.getItem(PROFILES_KEY);
      return raw ? JSON.parse(raw) : { byEmail: {}, byPhone: {}, byId: {} };
    } catch (e) {
      return { byEmail: {}, byPhone: {}, byId: {} };
    }
  }

  function writeProfiles(data) {
    localStorage.setItem(PROFILES_KEY, JSON.stringify(data));
  }

  function saveProfile(user) {
    if (!user) return;
    var data = readProfiles();
    if (user.id) data.byId[user.id] = user;
    if (user.email) data.byEmail[normEmail(user.email)] = user;
    if (user.phone) data.byPhone[normPhone(user.phone)] = user;
    writeProfiles(data);
  }

  function getProfileByEmail(email) {
    var key = normEmail(email);
    if (!key) return null;
    var data = readProfiles();
    return data.byEmail[key] || null;
  }

  function getProfileByPhone(phone) {
    var key = normPhone(phone);
    if (!key) return null;
    var data = readProfiles();
    if (data.byPhone[key]) return data.byPhone[key];
    if (key.indexOf('84') === 0 && key.length > 2) {
      var legacy = '0' + key.slice(2);
      if (data.byPhone[legacy]) return data.byPhone[legacy];
    }
    return null;
  }

  function getProfileById(id) {
    if (!id) return null;
    return readProfiles().byId[id] || null;
  }

  function cloneUser(user) {
    return JSON.parse(JSON.stringify(user));
  }

  function customerToAppUser(c) {
    if (!c) return null;
    var tierMap = {
      Premium: { tier: 'premium', label: 'Premium' },
      Elite: { tier: 'elite', label: 'Elite' },
      Free: { tier: 'free', label: 'Miễn phí' }
    };
    var tierInfo = tierMap[c.package] || tierMap.Free;
    var daysLeft = null;
    var expiresAt = null;
    if (c.expiresAt) {
      var exp = new Date(c.expiresAt);
      expiresAt = exp.toISOString();
      daysLeft = Math.ceil((exp.getTime() - Date.now()) / 86400000);
    }
    return {
      id: c.id,
      display_name: c.name,
      email: c.email,
      phone: c.phone || '',
      tier: tierInfo.tier,
      tier_label: tierInfo.label,
      status: c.accountStatus === 'suspended' ? 'suspended' : 'active',
      status_label: c.accountStatus === 'suspended' ? 'Tạm khóa' : 'Hoạt động',
      referral_code: c.affiliate || '',
      plan: {
        name: tierInfo.label,
        tier: tierInfo.tier,
        cycle: c.planType === 'freemium' ? 'freemium' : (c.planType || 'monthly'),
        price: tierInfo.tier === 'free' ? 0 : undefined,
        currency: '₫',
        period: tierInfo.tier === 'free' ? '' : 'tháng',
        days_left: daysLeft,
        days_total: daysLeft,
        expires_at: expiresAt
      }
    };
  }

  function ensureDemoAccount() {
    saveProfile(DEFAULT_USER);
    if (global.IfluxCredentialsStore && !IfluxCredentialsStore.hasPassword(DEFAULT_USER.email)) {
      IfluxCredentialsStore.setPasswords({
        email: DEFAULT_USER.email,
        phone: DEFAULT_USER.phone,
        password: DEMO_PASSWORD
      });
    }
    persistCustomer(DEFAULT_USER);
  }

  function syncReferralParentToStore(user) {
    if (!user || !user.id || !user.referred_by || !global.IfluxLoyaltyAffiliateStore) return;
    if (IfluxLoyaltyAffiliateStore.applyReferralFromServer) {
      IfluxLoyaltyAffiliateStore.applyReferralFromServer(String(user.id), String(user.referred_by), user.referral_used_code || '');
    } else if (!IfluxLoyaltyAffiliateStore.getReferrerId(user.id)) {
      IfluxLoyaltyAffiliateStore.setReferrer(user.id, user.referred_by);
    }
  }

  var DEFAULT_USER = {
    id: 'usr_demo_001',
    display_name: 'Nguyễn Văn Minh',
    username: '@minh.ndt',
    email: 'minh@iflux.vn',
    phone: '+84912345678',
    tier: 'premium',
    tier_label: 'Premium',
    subscription_phase: 'paid',
    trial_expiry_pending: false,
    status: 'active',
    status_label: 'Hoạt động',
    role: 'Thành viên',
    country: 'Việt Nam',
    joined_at: '15/01/2024',
    bio: 'Nhà đầu tư cá nhân — theo dõi dòng tiền và ngành.',
    referral_code: 'IFLMVN10',
    referral_link: '',
    stats: { posts: 0, followers: 0, following: 0 },
    plan: {
      name: 'Premium',
      tier: 'premium',
      cycle: 'monthly',
      price: 199000,
      currency: '₫',
      period: 'tháng',
      days_left: 26,
      days_total: 30,
      expires_at: null
    }
  };

  function computeExpiresAt(daysLeft) {
    var d = new Date();
    d.setHours(23, 59, 59, 999);
    d.setDate(d.getDate() + (daysLeft || 0));
    return d.toISOString();
  }

  DEFAULT_USER.plan.expires_at = computeExpiresAt(DEFAULT_USER.plan.days_left);

  function syncPlanExpiry(user) {
    if (!user || !user.plan) return user;
    if (user.plan.days_left != null && !user.plan.expires_at) {
      user.plan.expires_at = computeExpiresAt(user.plan.days_left);
    }
    if (user.plan.expires_at && user.plan.days_left == null) {
      var diff = new Date(user.plan.expires_at).getTime() - Date.now();
      user.plan.days_left = Math.ceil(diff / 86400000);
    }
    return user;
  }

  function getPlanDaysLeft(user) {
    user = user || getUser();
    if (!user || !user.plan) return null;
    syncPlanExpiry(user);
    if (user.plan.days_left != null) return user.plan.days_left;
    return null;
  }

  function updateUser(patch) {
    var s = read();
    if (!s || !s.user) return null;
    s.user = Object.assign({}, s.user, patch);
    if (patch.plan) {
      s.user.plan = Object.assign({}, s.user.plan, patch.plan);
      if (s.user.plan.cycle !== 'lifetime') syncPlanExpiry(s.user);
      else {
        s.user.plan.expires_at = null;
        s.user.plan.days_left = null;
      }
    }
    write(s);
    persistCustomer(s.user);
    saveProfile(s.user);

    if (typeof document !== 'undefined' && (
      patch.tier != null || patch.tier_label != null || patch.subscription_phase != null
    )) {
      document.dispatchEvent(new CustomEvent('iflux-tier-changed'));
    }

    if (useApi() && s.access_token && global.IfluxApiClient && IfluxApiClient.updateProfile) {
      var apiPatch = {};
      if (patch.display_name != null) apiPatch.display_name = patch.display_name;
      if (patch.nickname != null) apiPatch.nickname = String(patch.nickname).replace(/^@/, '');
      if (patch.phone != null) apiPatch.phone = patch.phone;
      if (Object.keys(apiPatch).length) {
        IfluxApiClient.updateProfile(s.access_token, apiPatch).catch(function () { /* offline */ });
      }
    }
    return s.user;
  }

  function getTabId() {
    try {
      var id = sessionStorage.getItem(TAB_ID_KEY);
      if (!id) {
        id = 'tab_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);
        sessionStorage.setItem(TAB_ID_KEY, id);
      }
      return id;
    } catch (e) {
      return 'tab_fallback';
    }
  }

  function generateSessionId() {
    return 'sess_' + Date.now() + '_' + Math.random().toString(36).slice(2, 10);
  }

  function readActiveSession() {
    try {
      var raw = localStorage.getItem(ACTIVE_SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function writeActiveSession(userId, sessionId, tabId) {
    if (!userId || !sessionId) return;
    localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify({
      userId: userId,
      sessionId: sessionId,
      tabId: tabId || getTabId(),
      at: Date.now()
    }));
  }

  function clearActiveSession() {
    localStorage.removeItem(ACTIVE_SESSION_KEY);
  }

  function assertSessionAllowed(userId) {
    var active = readActiveSession();
    if (!active || !active.userId) return;
    var current = read();
    if (current && current.user && current.user.id === userId
        && current.session_id === active.sessionId) {
      return;
    }
    if (active.userId !== userId) return;
    if (active.tabId === getTabId()) return;
    var err = new Error('Tài khoản đang được đăng nhập ở tab hoặc thiết bị khác. Nếu không phải bạn, gửi yêu cầu khóa tài khoản khẩn cấp.');
    err.code = 'SESSION_ALREADY_ACTIVE';
    throw err;
  }

  function validateLocalSession() {
    var s = read();
    var active = readActiveSession();
    if (!s || !s.access_token) {
      if (active && !s) clearActiveSession();
      return;
    }
    if (!s.user) {
      write(null);
      clearActiveSession();
      return;
    }
    if (!active) {
      var sid = s.session_id || generateSessionId();
      writeActiveSession(s.user.id, sid, s.tab_id || getTabId());
      if (!s.session_id) {
        s.session_id = sid;
        s.tab_id = getTabId();
        write(s);
      }
      return;
    }
    if (active.userId !== s.user.id || (s.session_id && active.sessionId !== s.session_id)) {
      var sid = s.session_id || generateSessionId();
      writeActiveSession(s.user.id, sid, s.tab_id || getTabId());
      if (!s.session_id) {
        s.session_id = sid;
        s.tab_id = getTabId();
        write(s);
      }
      return;
    }
  }

  function handleCrossTabAuthSync() {
    if (typeof document === 'undefined') return;
    var loggedIn = isLoggedIn();
    var path = global.location.pathname || '';
    var R = global.IfluxRoutes;
    var isAuthPage = R ? R.isAuthPage(path) : /\/auth\//.test(path);

    if (loggedIn && isAuthPage) {
      if (!shellNavigate(R ? R.to('news', { skipDecorate: true }) : '/tin-tuc')) {
        global.location.replace(appHomePath());
      }
      return;
    }
    if (loggedIn && (R ? R.isGuestPage(path) : /\/guest\/?$/.test(path))) {
      if (!shellNavigate(R ? R.to('news', { skipDecorate: true }) : '/tin-tuc')) {
        global.location.replace(appHomePath());
      }
      return;
    }
    if (!loggedIn && (R ? R.requiresAuth(path) : false) && document.querySelector('.ifx-app')) {
      /* Auth zone entry — allowlist DQ-02: loginWithReturn, không Writer.navigate vào auth */
      global.location.replace(R ? R.loginWithReturn(path) : guestHomePath());
      return;
    }
    document.dispatchEvent(new CustomEvent('iflux-auth-changed', { detail: { loggedIn: loggedIn } }));
  }

  function initCrossTabSync() {
    if (typeof global.addEventListener !== 'function') return;
    global.addEventListener('storage', function (e) {
      if (!e) return;
      if (e.key === STORAGE_KEY || e.key === ACTIVE_SESSION_KEY) {
        handleCrossTabAuthSync();
      }
    });
  }

  function read() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function write(session) {
    if (session) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  function isLoggedIn() {
    var s = read();
    return !!(s && s.access_token);
  }

  function getUser() {
    var s = read();
    return s && s.user ? s.user : null;
  }

  function getToken() {
    var s = read();
    return s && s.access_token ? s.access_token : null;
  }

  function persistCustomer(user) {
    if (global.IfluxCustomersStore && global.IfluxCustomersStore.upsertFromAppUser) {
      global.IfluxCustomersStore.upsertFromAppUser(user);
    }
  }

  function syncReferralLink(user) {
    if (!user || !user.referral_code) return user;
    if (global.IfluxLoyaltyAffiliateStore && IfluxLoyaltyAffiliateStore.buildReferralLink) {
      user.referral_link = IfluxLoyaltyAffiliateStore.buildReferralLink(user.referral_code);
    }
    return user;
  }

  function establishSession(user, accessToken, opts) {
    opts = opts || {};
    if (!opts.refresh && !opts.skipSessionGuard && useApi()) {
      assertSessionAllowed(user.id);
    }
    var existing = read();
    var sessionId = (opts.refresh && existing && existing.session_id)
      ? existing.session_id
      : generateSessionId();
    var tabId = getTabId();
    normalizeSubscriptionPhase(user);
    syncReferralLink(user);
    syncPlanExpiry(user);
    write({
      access_token: accessToken || ('mock_jwt_' + Date.now()),
      user: user,
      session_id: sessionId,
      tab_id: tabId
    });
    writeActiveSession(user.id, sessionId, tabId);
    saveProfile(user);
    persistCustomer(user);
    syncReferralParentToStore(user);
    if (global.IfluxLoyaltyAffiliateStore && IfluxLoyaltyAffiliateStore.syncFromServerAsync) {
      IfluxLoyaltyAffiliateStore.syncFromServerAsync(user.id);
    }
    if (global.IfluxUserDataSync) {
      IfluxUserDataSync.resetHydration();
      IfluxUserDataSync.hydrateFromServer();
    }
    if (global.IfluxPncLifecycle && IfluxPncLifecycle.onSessionEstablished) {
      IfluxPncLifecycle.onSessionEstablished(user, { reason: opts.pncReason || 'login' });
    }
    return user;
  }

  var PENDING_ONBOARDING_KEY = 'iflux_pending_onboarding';

  function markPendingOnboarding() {
    try {
      sessionStorage.setItem(PENDING_ONBOARDING_KEY, '1');
    } catch (e) { /* ignore */ }
  }

  function hasPendingOnboarding() {
    try {
      return sessionStorage.getItem(PENDING_ONBOARDING_KEY) === '1';
    } catch (e) {
      return false;
    }
  }

  function clearPendingOnboarding() {
    try {
      sessionStorage.removeItem(PENDING_ONBOARDING_KEY);
    } catch (e) { /* ignore */ }
  }

  function patchUserById(userId, patch) {
    if (!userId) return null;
    userId = String(userId);
    patch = patch || {};

    var data = readProfiles();
    var user = data.byId[userId] ? Object.assign({}, data.byId[userId]) : { id: userId };
    user = Object.assign({}, user, patch);
    if (patch.plan) {
      user.plan = Object.assign({}, user.plan || {}, patch.plan);
    }
    saveProfile(user);

    var session = read();
    if (session && session.user && String(session.user.id) === userId) {
      session.user = Object.assign({}, session.user, patch);
      if (patch.plan) {
        session.user.plan = Object.assign({}, session.user.plan || {}, patch.plan);
      }
      write(session);
    }

    if (global.IfluxCustomersStore && IfluxCustomersStore.upsertFromAppUser) {
      IfluxCustomersStore.upsertFromAppUser(user);
    }

    if (patch.tier != null || patch.tier_label != null || patch.subscription_phase != null) {
      document.dispatchEvent(new CustomEvent('iflux-tier-changed'));
    }

    return user;
  }

  function refreshSessionFromApi() {
    var token = getToken();
    if (!token || token.indexOf('mock_jwt_') === 0) {
      logout();
      return Promise.resolve(null);
    }
    return IfluxApiClient.authMe(token).then(function (profile) {
      var user = apiProfileToAppUser(profile);
      establishSession(user, token, { refresh: true });
      return user;
    }).catch(function () {
      logout();
      return null;
    });
  }

  function logout() {
    if (global.IfluxPncLifecycle && IfluxPncLifecycle.onLogout) {
      IfluxPncLifecycle.onLogout();
    }
    clearActiveSession();
    var s = read();
    if (global.IfluxUserDataSync) IfluxUserDataSync.resetHydration();
    write(null);
  }

  function guestHomePath() {
    if (global.IfluxRoutes) return IfluxRoutes.siteRoot();
    return '/';
  }

  function appHomePath() {
    /* Trang chủ mặc định sau đăng nhập = Cộng đồng (không phải Nhà của tôi). */
    return global.IfluxRoutes
      ? IfluxRoutes.to('news', { canonical: true })
      : '../news/index.html';
  }

  function currentReturnPath() {
    if (global.IfluxRoutes) return IfluxRoutes.currentReturnPath();
    if (global.location.protocol === 'file:') {
      var parts = global.location.href.split('/');
      var file = parts[parts.length - 1].split('?')[0];
      var dir = parts[parts.length - 2];
      return dir + '/' + file;
    }
    var path = global.location.pathname || '';
    var segs = path.split('/').filter(Boolean);
    if (segs.length >= 2) {
      return segs.slice(-2).join('/');
    }
    return segs[segs.length - 1] || 'index.html';
  }

  /* Hộp xác nhận đăng nhập (DS Modal + platform/web/auth-prompt) — chỉ nạp khi khách thật sự cần. */
  var AUTH_PROMPT_VER = 'authPrompt20260928';
  var authPromptLoading = null;
  function loadAuthPrompt() {
    if (global.IfluxAuthPrompt && global.IfxModal) return Promise.resolve();
    if (authPromptLoading) return authPromptLoading;
    var css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = '/design_system/04_components/09_modal/modal.css?v=' + AUTH_PROMPT_VER;
    document.head.appendChild(css);
    function script(src) {
      return new Promise(function (resolve, reject) {
        var el = document.createElement('script');
        el.src = src + '?v=' + AUTH_PROMPT_VER;
        el.onload = resolve;
        el.onerror = reject;
        document.head.appendChild(el);
      });
    }
    authPromptLoading = Promise.all([
      global.IfxModal ? null : script('/design_system/04_components/09_modal/modal.js'),
      script('/platform/web/auth-prompt/auth-prompt.js')
    ]).catch(function (err) { authPromptLoading = null; throw err; });
    return authPromptLoading;
  }

  function loginDest(returnPath) {
    if (!global.IfluxRoutes) return '/dang-nhap?return=' + encodeURIComponent(returnPath || currentReturnPath());
    if (global.IfluxPncLifecycle && IfluxPncLifecycle.saveReturnTo) {
      IfluxPncLifecycle.saveReturnTo(returnPath || IfluxRoutes.pathname());
    }
    return IfluxRoutes.loginWithReturn(returnPath || IfluxRoutes.pathname());
  }

  /** Khách muốn mở nội dung cần đăng nhập → hỏi xác nhận, đồng ý mới chuyển sang trang đăng nhập. */
  function promptLogin(returnPath, opts) {
    var dest = loginDest(returnPath);
    return loadAuthPrompt().then(function () {
      IfluxAuthPrompt.ask(dest, opts);
    }).catch(function () {
      global.location.assign(dest);
    });
  }

  /* MỘT quy tắc cho mọi trường hợp: khách chỉ bị hỏi đăng nhập khi hệ thống thật sự cần danh tính để
   * đồng bộ dữ liệu (lưu / kiểm tra / xem / sửa) — tức server trả 401 cho API của iFlux (like, share,
   * bình luận, bình chọn, dữ liệu cá nhân…). Không cần gắn điều kiện riêng ở từng nút / trang.
   * (Widget theo Phân quyền sử dụng → lớp khoá; trang cá nhân → shell-boot.) */
  var authAskAt = 0;
  function isAuthEndpoint(url) {
    return /\/api\/(auth|v1\/auth)\//.test(url);
  }
  function installAuthRequiredRule() {
    var orig = global.fetch;
    if (!orig || orig.__ifxAuthRule) return;
    var wrapped = function (input) {
      var url = typeof input === 'string' ? input : (input && input.url) || '';
      return orig.apply(this, arguments).then(function (res) {
        if (res && res.status === 401 && !isLoggedIn() && url.indexOf('/api/') >= 0 &&
            !isAuthEndpoint(url) && Date.now() - authAskAt > 1500) {
          authAskAt = Date.now();
          promptLogin();
        }
        return res;
      });
    };
    wrapped.__ifxAuthRule = true;
    global.fetch = wrapped;
  }
  installAuthRequiredRule();

  function newsHref() {
    return global.IfluxRoutes ? IfluxRoutes.to('news', { canonical: true, skipDecorate: true }) : '/tin-tuc';
  }

  /* Trang hiện tại cần đăng nhập mà khách chưa đăng nhập: hỏi trước; «Để sau» → về Tin tức (trang mặc định). */
  function requireAuth() {
    if (!isLoggedIn()) {
      promptLogin(null, { onCancel: function () { global.location.replace(newsHref()); } });
      return false;
    }
    return true;
  }

  /** P6-API-01 — thin alias only → IfluxShellUrlWriter.navigate */
  function shellNavigate(canonical, opts) {
    opts = opts || {};
    var W = global.IfluxShellUrlWriter;
    if (W && W.navigate) {
      W.navigate(canonical, Object.assign({ replace: true }, opts));
      return true;
    }
    return false;
  }

  function redirectAfterAuth(defaultPath) {
    var R = global.IfluxRoutes;
    var params = new URLSearchParams(global.location.search);
    var ret = params.get('return');
    if (ret && ret.indexOf('auth') === -1) {
      var path = decodeURIComponent(ret);
      if (path.indexOf('http') === 0) {
        /* Allowlist: absolute external / full URL hop */
        global.location.replace(path);
        return;
      }
      if (path.indexOf('../') === 0) {
        /* Allowlist: legacy relative auth-zone file hop */
        global.location.replace(path);
        return;
      }
      var canonical = path;
      if (R) {
        if (R.route(path)) canonical = R.to(path, { skipDecorate: true });
        else canonical = R.normalizePath(path);
      }
      if (canonical.indexOf('/') !== 0) {
        global.location.replace('../' + canonical);
        return;
      }
      if (!shellNavigate(canonical)) {
        /* Dev/file fallback only when Writer missing */
        global.location.replace(canonical);
      }
      return;
    }
    var homeCanonical = R ? R.to('news', { skipDecorate: true }) : '/tin-tuc';
    if (!shellNavigate(homeCanonical)) {
      global.location.replace(defaultPath || homeCanonical);
    }
  }

  /** Authentication Capability — sole post-auth Redirect Policy (OD-SOL-12 / WP4). */
  global.IfluxAuthRedirectPolicy = {
    execute: redirectAfterAuth
  };

  validateLocalSession();
  initCrossTabSync();
  if (!useApi()) {
    ensureDemoAccount();
    var bootUser = getUser();
    if (bootUser) saveProfile(bootUser);
  } else if (isLoggedIn()) {
    refreshSessionFromApi();
  }
  /* App Shell Header: platform-boot có thể paint trước khi Auth chạy — báo ngay sau boot sync */
  try {
    document.dispatchEvent(new CustomEvent('iflux-auth-changed', {
      detail: { loggedIn: isLoggedIn(), boot: true }
    }));
  } catch (eBootAuth) { /* ignore */ }

  global.IfluxUserStorage = {
    DEMO_USER_ID: DEFAULT_USER.id,
    currentUserId: function () {
      var u = getUser();
      return (u && u.id) ? u.id : 'anon';
    },
    scopedKey: function (baseKey, userId) {
      userId = userId || global.IfluxUserStorage.currentUserId();
      return baseKey + '_' + userId;
    },
    migrateLegacyOnce: function (baseKey, userId) {
      userId = userId || global.IfluxUserStorage.currentUserId();
      if (userId !== DEFAULT_USER.id) return false;
      var scoped = global.IfluxUserStorage.scopedKey(baseKey, userId);
      if (localStorage.getItem(scoped)) return false;
      var legacy = localStorage.getItem(baseKey);
      if (!legacy) return false;
      localStorage.setItem(scoped, legacy);
      localStorage.removeItem(baseKey);
      return true;
    },
    readJson: function (baseKey, fallback, userId) {
      global.IfluxUserStorage.migrateLegacyOnce(baseKey, userId);
      try {
        var raw = localStorage.getItem(global.IfluxUserStorage.scopedKey(baseKey, userId));
        if (raw) return JSON.parse(raw);
      } catch (e) { /* ignore */ }
      return typeof fallback === 'function' ? fallback() : fallback;
    },
    writeJson: function (baseKey, value, userId) {
      localStorage.setItem(global.IfluxUserStorage.scopedKey(baseKey, userId), JSON.stringify(value));
    },
    removeScoped: function (baseKey, userId) {
      localStorage.removeItem(global.IfluxUserStorage.scopedKey(baseKey, userId));
    }
  };

  global.IfluxAuth = {
    MOCK_OTP: MOCK_OTP,
    DEMO_EMAIL: DEFAULT_USER.email,
    DEMO_PASSWORD: DEMO_PASSWORD,
    useApi: useApi,
    isLoggedIn: isLoggedIn,
    getUser: getUser,
    getToken: getToken,
    getPlanDaysLeft: function () { return getPlanDaysLeft(); },
    getMenuTierLabel: function () { return getMenuTierLabel(); },
    syncSubscriptionLifecycle: syncSubscriptionLifecycle,
    updateUser: updateUser,
    markPendingOnboarding: markPendingOnboarding,
    hasPendingOnboarding: hasPendingOnboarding,
    clearPendingOnboarding: clearPendingOnboarding,
    logout: logout,
    guestHomePath: guestHomePath,
    appHomePath: appHomePath,
    requireAuth: requireAuth,
    promptLogin: promptLogin,
    redirectAfterAuth: redirectAfterAuth,
    refreshSessionFromApi: refreshSessionFromApi,
    patchUserById: patchUserById,
    /* Bridge nội bộ — chỉ dùng bởi auth-forms.js (register/login-form/forgot/OTP,
       chỉ tải trên 4 trang auth). Không phải API public, không gọi từ nơi khác. */
    _bridge: {
      useApi: useApi,
      normEmail: normEmail,
      normPhone: normPhone,
      getProfileByEmail: getProfileByEmail,
      getProfileByPhone: getProfileByPhone,
      cloneUser: cloneUser,
      customerToAppUser: customerToAppUser,
      DEFAULT_USER: DEFAULT_USER,
      saveProfile: saveProfile,
      establishSession: establishSession,
      markPendingOnboarding: markPendingOnboarding,
      readActiveSession: readActiveSession,
      apiProfileToAppUser: apiProfileToAppUser,
      isLoggedIn: isLoggedIn,
      syncPlanExpiry: syncPlanExpiry
    }
  };
})(window);
