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
  var EMERGENCY_LOCK_KEY = 'iflux_emergency_lock_requests_v1';
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

  function defaultTrialDays(tier) {
    tier = tier || 'premium';
    if (global.PlansRuntimeReader && PlansRuntimeReader.getPlan) {
      var p = PlansRuntimeReader.getPlan(tier);
      if (p && p.trial > 0) return p.trial;
    }
    return tier === 'elite' ? 14 : 7;
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

  function activateTrial(tier) {
    tier = String(tier || 'premium').toLowerCase();
    var labels = tierLabels();
    var trialDays = defaultTrialDays(tier);
    return updateUser({
      tier: tier,
      tier_label: labels[tier] || tier,
      subscription_phase: 'trial_active',
      trial_expiry_pending: false,
      plan: {
        name: labels[tier] || tier,
        tier: tier,
        cycle: 'trial',
        price: 0,
        currency: '₫',
        period: 'dùng thử',
        days_left: trialDays,
        days_total: trialDays,
        expires_at: computeExpiresAt(trialDays)
      }
    });
  }

  function acknowledgeTrialExpiry() {
    return updateUser({
      tier: 'free',
      tier_label: tierLabels().free,
      subscription_phase: 'freemium',
      trial_expiry_pending: false,
      plan: {
        name: 'Miễn phí',
        tier: 'free',
        cycle: 'freemium',
        price: 0,
        currency: '₫',
        period: '',
        days_left: null,
        days_total: null,
        expires_at: null
      }
    });
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

  function findExistingByEmail(email, excludeUserId) {
    var key = normEmail(email);
    if (!key) return null;

    var user = getProfileByEmail(email);
    if (user && user.id !== excludeUserId) return user;

    if (global.IfluxCredentialsStore && IfluxCredentialsStore.hasPassword(key)) {
      return user || { id: '__credentials__', email: key };
    }

    if (global.IfluxCustomersStore && IfluxCustomersStore.getCustomerByEmail) {
      var customer = IfluxCustomersStore.getCustomerByEmail(key);
      if (customer) {
        var fromCustomer = customerToAppUser(customer);
        if (fromCustomer && fromCustomer.id !== excludeUserId) return fromCustomer;
      }
    }

    if (key === normEmail(DEFAULT_USER.email) && DEFAULT_USER.id !== excludeUserId) {
      return cloneUser(DEFAULT_USER);
    }
    return null;
  }

  function findExistingByPhone(phone, excludeUserId) {
    var key = normPhone(phone);
    if (!key) return null;

    var user = getProfileByPhone(phone);
    if (user && user.id !== excludeUserId) return user;

    if (global.IfluxCustomersStore && IfluxCustomersStore.listCustomers) {
      var list = IfluxCustomersStore.listCustomers();
      var i;
      for (i = 0; i < list.length; i++) {
        if (normPhone(list[i].phone) === key) {
          var fromCustomer = customerToAppUser(list[i]);
          if (fromCustomer && fromCustomer.id !== excludeUserId) return fromCustomer;
        }
      }
    }

    if (normPhone(DEFAULT_USER.phone) === key && DEFAULT_USER.id !== excludeUserId) {
      return cloneUser(DEFAULT_USER);
    }
    return null;
  }

  /** Sandbox only — email/phone uniqueness vs localStorage · customers · credentials */
  function assertRegistrationUniqueLocal(data) {
    data = data || {};
    var email = normEmail(data.email);
    var phoneRaw = String(data.phone || '').trim();
    var excludeUserId = data.excludeUserId || null;

    if (email && findExistingByEmail(email, excludeUserId)) {
      var emailErr = new Error('Email này đã được đăng ký. Vui lòng đăng nhập hoặc dùng email khác.');
      emailErr.code = 'EMAIL_TAKEN';
      emailErr.field = 'email';
      throw emailErr;
    }

    if (phoneRaw && findExistingByPhone(phoneRaw, excludeUserId)) {
      var phoneErr = new Error('Số điện thoại này đã được liên kết với tài khoản khác. Vui lòng dùng số khác hoặc đăng nhập.');
      phoneErr.code = 'PHONE_TAKEN';
      phoneErr.field = 'phone';
      throw phoneErr;
    }
  }

  /** Phone format — cả API và sandbox. Uniqueness: sandbox = local · API = server (PostgreSQL). */
  function assertRegistrationPhoneFormat(data) {
    data = data || {};
    var phoneRaw = String(data.phone || '').trim();
    if (!phoneRaw) return;
    var phoneKey = normPhone(data.phone);
    if (!phoneKey || phoneKey.length < 10 || phoneKey.length > 12) {
      var phoneInvalid = new Error('Số điện thoại không hợp lệ. Nhập số Việt Nam (vd: 0912 345 678).');
      phoneInvalid.code = 'INVALID_PHONE';
      phoneInvalid.field = 'phone';
      throw phoneInvalid;
    }
  }

  function assertRegistrationUnique(data) {
    assertRegistrationPhoneFormat(data);
    if (useApi()) return;
    assertRegistrationUniqueLocal(data);
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

  function resolveUserForLogin(opts) {
    opts = opts || {};
    var email = normEmail(opts.email);
    var phone = normPhone(opts.phone);
    var user = null;

    if (email) user = getProfileByEmail(email);
    if (!user && phone) user = getProfileByPhone(phone);

    if (!user && global.IfluxCustomersStore) {
      if (email) {
        var byEmail = IfluxCustomersStore.getCustomerByEmail(email);
        if (byEmail) user = customerToAppUser(byEmail);
      }
      if (!user && phone) {
        var list = IfluxCustomersStore.listCustomers();
        var i;
        for (i = 0; i < list.length; i++) {
          if (normPhone(list[i].phone) === phone) {
            user = customerToAppUser(list[i]);
            break;
          }
        }
      }
    }

    if (!user && email === normEmail(DEFAULT_USER.email)) user = cloneUser(DEFAULT_USER);
    if (!user && phone && phone === normPhone(DEFAULT_USER.phone)) user = cloneUser(DEFAULT_USER);

    return user ? syncPlanExpiry(cloneUser(user)) : null;
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

  function getActiveOwnerCode() {
    if (global.IfluxIdentityContext && IfluxIdentityContext.getActiveOwner) {
      return IfluxIdentityContext.getActiveOwner() || '';
    }
    return '';
  }

  function clearAffiliateContextAfterConsume() {
    if (global.IfluxAffiliateResolver && IfluxAffiliateResolver.clearContext) {
      IfluxAffiliateResolver.clearContext();
      return;
    }
    if (global.IfluxLoyaltyAffiliateStore && IfluxLoyaltyAffiliateStore.clearStoredRefCode) {
      IfluxLoyaltyAffiliateStore.clearStoredRefCode();
    }
  }

  function resolveRegistrationRefCode(data) {
    data = data || {};
    var fromForm = String(data.referral_code || '').trim().toUpperCase();
    var fromLink = data.referral_locked ||
      (global.IfluxLoyaltyAffiliateStore && IfluxLoyaltyAffiliateStore.isRefFromAffiliateLink &&
        IfluxLoyaltyAffiliateStore.isRefFromAffiliateLink());

    if (fromLink) {
      var fromCtx = getActiveOwnerCode();
      return fromForm || fromCtx;
    }
    return fromForm;
  }

  function applyRegistrationReferral(user, data) {
    if (!user) return;
    data = data || {};
    var refCode = resolveRegistrationRefCode(data);
    if (!refCode && !user.referred_by) return;

    if (global.IfluxLoyaltyAffiliateStore) {
      var referrerId = null;
      if (user.referred_by) {
        referrerId = IfluxLoyaltyAffiliateStore.applyReferralFromServer
          ? IfluxLoyaltyAffiliateStore.applyReferralFromServer(
            user.id,
            user.referred_by,
            refCode || user.referral_used_code || ''
          )
          : (IfluxLoyaltyAffiliateStore.setReferrer(user.id, user.referred_by), user.referred_by);
      }
      if (!referrerId && refCode) {
        referrerId = IfluxLoyaltyAffiliateStore.applyReferralAtSignup(user.id, refCode, { silent: true });
      }
      if (referrerId) {
        user.referred_by = referrerId;
        if (refCode) user.referral_used_code = refCode;
        saveProfile(user);
      }
      return;
    }

    if (refCode) user.referral_used_code = refCode;
  }

  function applyRegistrationReferralAsync(user, data) {
    if (!user) return Promise.resolve(null);
    data = data || {};
    var refCode = resolveRegistrationRefCode(data);
    if (!refCode && !user.referred_by) return Promise.resolve(null);

    applyRegistrationReferral(user, data);
    if (user.referred_by) {
      clearAffiliateContextAfterConsume();
    }
    if (user.referred_by || !refCode || !global.IfluxLoyaltyAffiliateStore) {
      return Promise.resolve(user.referred_by || null);
    }

    return IfluxLoyaltyAffiliateStore.validateReferralCodeAsync(refCode).then(function (check) {
      if (!check.valid || !check.referrer || String(check.referrer.id) === String(user.id)) {
        return user.referred_by || null;
      }
      var referrerId = IfluxLoyaltyAffiliateStore.applyReferralFromServer(
        user.id,
        check.referrer.id,
        refCode
      );
      if (referrerId) {
        user.referred_by = referrerId;
        user.referral_used_code = refCode;
        saveProfile(user);
      }
      return referrerId;
    }).catch(function () {
      return user.referred_by || null;
    });
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

  function getSubscriptionState(user) {
    user = user || getUser();
    if (!user) return 'anonymous';
    normalizeSubscriptionPhase(user);
    syncPlanExpiry(user);
    var phase = user.subscription_phase;
    if (phase === 'trial_eligible') return 'trial_eligible';
    if (phase === 'trial_expired' && user.trial_expiry_pending) return 'trial_expired';
    if (phase === 'freemium') return 'free';
    var tier = String(user.tier || 'free').toLowerCase();
    if (tier === 'free') return 'free';
    if (user.plan && user.plan.cycle === 'lifetime') return 'active';
    var days = getPlanDaysLeft(user);
    if (days !== null && days <= 0) {
      return phase === 'trial_active' ? 'trial_expired' : 'expired';
    }
    if (days !== null && days <= 3) return 'expiring';
    if (phase === 'trial_active') return 'trial_active';
    return 'active';
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

  function hasActiveSessionElsewhere() {
    if (isLoggedIn()) return false;
    var active = readActiveSession();
    if (!active || !active.userId) return false;
    return true;
  }

  function getActiveSessionInfo() {
    return readActiveSession();
  }

  function submitEmergencyLockRequest(data) {
    data = data || {};
    var email = normEmail(data.email);
    var reason = String(data.reason || '').trim();
    if (!email) throw new Error('Nhập email tài khoản cần khóa.');
    if (!reason || reason.length < 10) {
      throw new Error('Mô tả lý do tối thiểu 10 ký tự.');
    }
    var list = [];
    try {
      list = JSON.parse(localStorage.getItem(EMERGENCY_LOCK_KEY) || '[]');
      if (!Array.isArray(list)) list = [];
    } catch (e) {
      list = [];
    }
    list.unshift({
      id: 'elr_' + Date.now(),
      email: email,
      reason: reason,
      activeSession: readActiveSession(),
      status: 'pending',
      createdAt: new Date().toISOString()
    });
    localStorage.setItem(EMERGENCY_LOCK_KEY, JSON.stringify(list.slice(0, 50)));
    return list[0];
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
      global.location.replace(appHomePath());
      return;
    }
    if (loggedIn && (R ? R.isGuestPage(path) : /\/guest\/?$/.test(path))) {
      global.location.replace(appHomePath());
      return;
    }
    if (!loggedIn && (R ? R.requiresAuth(path) : false) && document.querySelector('.ifx-app')) {
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

  function loginWithEmailApi(email, password, opts) {
    opts = opts || {};
    email = normEmail(email);
    if (!email) return Promise.reject(new Error('Nhập email'));
    if (!password) return Promise.reject(new Error('Nhập mật khẩu'));

    return IfluxApiClient.authLogin(email, password, opts.remember_me).then(function (res) {
      var token = res.token;
      return IfluxApiClient.authMe(token).then(function (profile) {
        var user = apiProfileToAppUser(profile);
        establishSession(user, token, { refresh: true });
        return user;
      });
    });
  }

  function registerApi(data) {
    data = data || {};
    var name = String(data.display_name || '').trim();
    var email = normEmail(data.email);
    var phone = String(data.phone || '').trim();
    var password = String(data.password || '');
    var refCode = resolveRegistrationRefCode(data);

    if (!name) return Promise.reject(new Error('Nhập họ tên.'));
    if (!email) return Promise.reject(new Error('Nhập email để đăng ký (dữ liệu lưu trên server).'));
    if (!password || password.length < 8) {
      return Promise.reject(new Error('Mật khẩu tối thiểu 8 ký tự.'));
    }

    try {
      assertRegistrationUnique({ email: email, phone: phone });
    } catch (e) {
      return Promise.reject(e);
    }

    return IfluxApiClient.authRegister(email, password, refCode || null, {
      display_name: name,
      phone: phone
    }).then(function (res) {
      if (res.requiresVerification) {
        var err = new Error(res.message || 'Kiểm tra email và nhập mã xác thực 6 số.');
        err.code = 'VERIFY_EMAIL';
        err.email = res.email || email;
        err.pendingProfile = { display_name: name, phone: phone };
        err.verificationMode = res.verificationMode || 'email';
        err.demoCode = res.demoCode || null;
        throw err;
      }
      var token = res.token;
      return finishApiRegister(token, name, phone, data);
    });
  }

  function finishApiRegister(token, name, phone, data) {
    var patch = { nickname: name };
    if (phone) patch.phone = phone;
    return IfluxApiClient.updateProfile(token, patch).catch(function () { return null; })
      .then(function () {
        return IfluxApiClient.authMe(token);
      })
      .then(function (profile) {
        var user = apiProfileToAppUser(profile);
        if (!user.display_name || user.display_name === (profile.email || '').split('@')[0]) {
          user.display_name = name;
        }
        if (phone) user.phone = phone;
        if (!user.subscription_phase && String(user.tier || 'free').toLowerCase() === 'free') {
          user.subscription_phase = 'trial_eligible';
        }
        return applyRegistrationReferralAsync(user, data || {}).then(function () {
          if (global.IfluxCredentialsStore && data && data.password) {
            IfluxCredentialsStore.setPasswords({
              email: user.email,
              phone: user.phone,
              password: data.password
            });
          }
          establishSession(user, token, { refresh: true, pncReason: 'register' });
          markPendingOnboarding();
          return user;
        });
      });
  }

  var PENDING_VERIFY_KEY = 'iflux_pending_verify';
  var REGISTRATION_DRAFT_KEY = 'iflux_registration_draft_v1';
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

  function savePendingVerification(data) {
    try {
      sessionStorage.setItem(PENDING_VERIFY_KEY, JSON.stringify(data || {}));
    } catch (e) { /* ignore */ }
    try {
      if (data && data.registrationDraft) {
        localStorage.setItem(REGISTRATION_DRAFT_KEY, JSON.stringify(data.registrationDraft));
      }
    } catch (e2) { /* ignore */ }
  }

  function loadPendingVerification() {
    try {
      var raw = sessionStorage.getItem(PENDING_VERIFY_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function clearPendingVerification() {
    try {
      sessionStorage.removeItem(PENDING_VERIFY_KEY);
    } catch (e) { /* ignore */ }
    try {
      localStorage.removeItem(REGISTRATION_DRAFT_KEY);
    } catch (e2) { /* ignore */ }
  }

  function goToVerifyOtpPage(data) {
    data = data || {};
    if (data.registrationDraft) {
      data.pendingProfile = Object.assign({}, data.pendingProfile || {}, {
        display_name: data.registrationDraft.display_name || '',
        phone: data.registrationDraft.phone || ''
      });
    }
    savePendingVerification(data);
    global.location.href = 'verify-otp.html';
  }

  function loadRegistrationDraft() {
    var pending = loadPendingVerification();
    if (pending && pending.registrationDraft) {
      return pending.registrationDraft;
    }
    try {
      var raw = localStorage.getItem(REGISTRATION_DRAFT_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function resendVerificationEmail(email) {
    email = normEmail(email);
    if (!email) return Promise.reject(new Error('Nhập email.'));
    return IfluxApiClient.authResendVerification(email);
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

  function verifyEmailAndRegisterLocal(email, code, profile) {
    profile = profile || {};
    var verifyTarget = String(email || profile.phone || '').trim();
    code = String(code || '').trim();
    if (!verifyTarget || code.length !== 6) {
      return Promise.reject(new Error('Nhập thông tin và mã OTP 6 số.'));
    }
    if (code !== MOCK_OTP) {
      return Promise.reject(new Error('Mã OTP không đúng. Môi trường demo: ' + MOCK_OTP + '.'));
    }

    var registrationData = loadRegistrationDraft() || {};
    if (!registrationData.password) {
      return Promise.reject(new Error('Phiên đăng ký hết hạn hoặc thiếu mật khẩu. Vui lòng đăng ký lại.'));
    }
    registrationData.display_name = profile.display_name || registrationData.display_name || '';
    registrationData.phone = profile.phone || registrationData.phone || '';
    if (/@/.test(verifyTarget)) {
      registrationData.email = normEmail(registrationData.email || verifyTarget);
    }
    if (!registrationData.email || !/@/.test(registrationData.email)) {
      return Promise.reject(new Error('Thiếu email đăng ký. Vui lòng quay lại form đăng ký.'));
    }

    try {
      assertRegistrationUnique({
        email: registrationData.email,
        phone: registrationData.phone
      });
    } catch (e) {
      return Promise.reject(e);
    }

    try {
      var user = completeLocalRegistration(registrationData);
      clearPendingVerification();
      return Promise.resolve(user);
    } catch (e) {
      return Promise.reject(e);
    }
  }

  function verifyEmailAndRegister(email, code, profile) {
    profile = profile || {};
    var verifyTarget = String(email || profile.phone || '').trim();
    code = String(code || '').trim();
    if (!useApi()) {
      return verifyEmailAndRegisterLocal(verifyTarget, code, profile);
    }
    if (!verifyTarget || code.length !== 6) {
      return Promise.reject(new Error('Nhập thông tin và mã 6 số.'));
    }
    try {
      assertRegistrationUnique({
        email: /@/.test(verifyTarget) ? normEmail(verifyTarget) : '',
        phone: profile.phone || ''
      });
    } catch (e) {
      return Promise.reject(e);
    }
    var registrationData = loadRegistrationDraft() || {};
    var apiEmail = /@/.test(verifyTarget) ? normEmail(verifyTarget) : normEmail(registrationData.email);
    if (!apiEmail) {
      return Promise.reject(new Error('Thiếu email để xác thực qua API.'));
    }
    return IfluxApiClient.authVerifyEmail(apiEmail, code).then(function (res) {
      clearPendingVerification();
      return finishApiRegister(
        res.token,
        profile.display_name || registrationData.display_name || '',
        profile.phone || registrationData.phone || '',
        registrationData
      );
    });
  }

  function resetPasswordWithOtp(phone, otp, newPassword) {
    phone = String(phone || '').trim();
    otp = String(otp || '').trim();
    newPassword = String(newPassword || '');
    if (!phone) throw new Error('Nhập số điện thoại.');
    if (otp !== MOCK_OTP) throw new Error('Mã OTP không đúng. Demo: ' + MOCK_OTP + '.');
    if (newPassword.length < 8) throw new Error('Mật khẩu mới tối thiểu 8 ký tự.');
    if (!global.IfluxCredentialsStore) throw new Error('Không tải được hệ thống xác thực.');

    var user = resolveUserForLogin({ phone: phone });
    if (!user) throw new Error('Không tìm thấy tài khoản với số điện thoại này.');

    IfluxCredentialsStore.setPassword(phone, newPassword, { type: 'phone' });
    if (user.email) {
      IfluxCredentialsStore.setPassword(user.email, newPassword);
    }
    saveProfile(Object.assign({}, user, { phone: phone }));
    return user;
  }

  function resetPasswordWithOtpAsync(phone, otp, newPassword) {
    try {
      return Promise.resolve(resetPasswordWithOtp(phone, otp, newPassword));
    } catch (e) {
      return Promise.reject(e);
    }
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

  function loginWithEmailLocal(email, password, opts) {
    opts = opts || {};
    var identifier = String(email || '').trim();
    if (!identifier) throw new Error('Nhập email');
    if (!/@/.test(identifier)) throw new Error('Nhập đúng định dạng email.');
    var loginEmail = normEmail(identifier);

    if (!opts.skipPasswordCheck) {
      if (!password) throw new Error('Nhập mật khẩu');
      if (!global.IfluxCredentialsStore) throw new Error('Không tải được hệ thống xác thực.');
      if (!IfluxCredentialsStore.verifyPassword(loginEmail, password)) {
        throw new Error('Email hoặc mật khẩu không đúng.');
      }
    }

    var user = resolveUserForLogin({ email: loginEmail });
    var isNewSocial = false;
    if (!user && opts.skipPasswordCheck && opts.socialProvider) {
      isNewSocial = true;
      user = {
        id: 'usr_social_' + opts.socialProvider.toLowerCase(),
        display_name: 'Thành viên ' + opts.socialProvider,
        email: loginEmail || identifier,
        phone: '',
        username: '@social.' + opts.socialProvider.toLowerCase(),
        tier: 'free',
        tier_label: 'Miễn phí',
        subscription_phase: 'trial_eligible',
        trial_expiry_pending: false,
        status: 'active',
        status_label: 'Hoạt động',
        role: 'Thành viên',
        referral_code: 'IFLUX' + Math.random().toString(36).slice(2, 6).toUpperCase(),
        joined_at: new Date().toLocaleDateString('vi-VN'),
        stats: { posts: 0, followers: 0, following: 0 },
        plan: {
          name: 'Miễn phí',
          tier: 'free',
          cycle: 'freemium',
          price: 0,
          currency: '₫',
          period: '',
          days_left: null,
          days_total: null,
          expires_at: null
        }
      };
    }
    if (!user) throw new Error('Không tìm thấy tài khoản với email này.');

    user = Object.assign({}, user, { email: loginEmail });
    if (opts.socialProvider) {
      user.display_name = user.display_name || ('Thành viên ' + opts.socialProvider);
    }
    establishSession(user);
    if (isNewSocial) markPendingOnboarding();
    return user;
  }

  function loginWithSocial(provider, tokens, opts) {
    opts = opts || {};
    var p = String(provider || '').toLowerCase();
    if (useApi()) {
      // referral_code chỉ do SocialLoginUseCase (hoặc caller tường minh) gắn — không dual-inject AR tại đây
      return IfluxApiClient.authSocial(p, tokens || {}, opts).then(function (res) {
        return IfluxApiClient.authMe(res.token).then(function (profile) {
          var user = apiProfileToAppUser(profile);
          establishSession(user, res.token, { refresh: true });
          if (res.is_new) markPendingOnboarding();
          if (res.is_new && user.referred_by) {
            clearAffiliateContextAfterConsume();
          }
          return user;
        });
      });
    }
    var label = p.charAt(0).toUpperCase() + p.slice(1);
    return loginWithEmail('social+' + p + '@iflux.local', '', {
      skipPasswordCheck: true,
      socialProvider: label,
      skipReferrer: opts.skipReferrer
    });
  }

  function loginWithEmail(email, password, opts) {
    if (useApi() && !(opts && opts.skipPasswordCheck)) {
      return loginWithEmailApi(email, password, opts);
    }
    try {
      return Promise.resolve(loginWithEmailLocal(email, password, opts));
    } catch (e) {
      return Promise.reject(e);
    }
  }

  function loginWithPhone(phone, password) {
    if (useApi()) {
      return Promise.reject(new Error('Đăng nhập SĐT sẽ có sau — vui lòng dùng tab Email.'));
    }
    phone = String(phone || '').trim();
    if (!phone) throw new Error('Nhập số điện thoại');
    if (!password) throw new Error('Nhập mật khẩu');
    if (!global.IfluxCredentialsStore) throw new Error('Không tải được hệ thống xác thực.');
    if (!IfluxCredentialsStore.verifyPasswordByPhone(phone, password)) {
      throw new Error('Số điện thoại hoặc mật khẩu không đúng.');
    }

    var user = resolveUserForLogin({ phone: phone });
    if (!user) throw new Error('Số điện thoại chưa đăng ký.');

    user = Object.assign({}, user, { phone: phone });
    establishSession(user);
    return user;
  }

  function loginWithPhoneAsync(phone, otp) {
    try {
      return Promise.resolve(loginWithPhone(phone, otp));
    } catch (e) {
      return Promise.reject(e);
    }
  }

  function completeLocalRegistration(data) {
    data = data || {};
    var password = String(data.password || '');
    if (!password || password.length < 8) {
      throw new Error('Thiếu mật khẩu đăng ký. Vui lòng đăng ký lại từ đầu.');
    }

    var regEmail = data.email && /@/.test(String(data.email)) ? normEmail(data.email) : '';
    var regPhone = String(data.phone || '').trim();
    if (data.registration_mode === 'email' && !regEmail) {
      throw new Error('Thiếu email đăng ký. Vui lòng đăng ký lại.');
    }

    var user = {
      id: 'usr_' + Date.now(),
      display_name: String(data.display_name).trim(),
      email: regEmail,
      phone: regPhone,
      username: data.username || '@user' + Date.now().toString().slice(-4),
      tier: 'free',
      tier_label: 'Miễn phí',
      subscription_phase: 'trial_eligible',
      trial_expiry_pending: false,
      status: 'active',
      status_label: 'Hoạt động',
      role: 'Thành viên',
      referral_code: 'IFLUX' + Math.random().toString(36).slice(2, 6).toUpperCase(),
      joined_at: new Date().toLocaleDateString('vi-VN'),
      stats: { posts: 0, followers: 0, following: 0 },
      plan: {
        name: 'Miễn phí',
        tier: 'free',
        cycle: 'freemium',
        price: 0,
        currency: '₫',
        period: '',
        days_left: null,
        days_total: null,
        expires_at: null
      }
    };
    user.referral_link = '';

    applyRegistrationReferral(user, data);

    if (!global.IfluxCredentialsStore) throw new Error('Không tải được hệ thống xác thực.');
    var saved = IfluxCredentialsStore.setPasswords({
      email: user.email,
      phone: user.phone,
      password: password
    });
    if (!saved) {
      throw new Error('Không lưu được mật khẩu đăng ký. Vui lòng thử đăng ký lại.');
    }

    establishSession(user);
    markPendingOnboarding();
    return user;
  }

  function registerLocal(data) {
    data = data || {};
    if (!data.display_name || !String(data.display_name).trim()) {
      throw new Error('Nhập họ tên.');
    }
    if (!data.password || String(data.password).length < 8) {
      throw new Error('Mật khẩu tối thiểu 8 ký tự.');
    }

    var email = normEmail(data.email);
    var phone = String(data.phone || '').trim();
    var regMode = data.registration_mode || 'email';

    if (regMode === 'phone') {
      if (!phone) throw new Error('Nhập số điện thoại.');
    } else {
      if (!email) throw new Error('Nhập email để đăng ký.');
    }
    if (!email && !phone) {
      throw new Error('Nhập email hoặc số điện thoại.');
    }

    assertRegistrationUnique({ email: email, phone: phone });

    var verifyTarget = email || phone;
    var err = new Error('Nhập mã OTP để hoàn tất đăng ký lần đầu.');
    err.code = 'VERIFY_EMAIL';
    err.email = verifyTarget;
    err.verificationMode = 'demo';
    err.demoCode = MOCK_OTP;
    err.pendingProfile = { display_name: data.display_name, phone: phone };
    err.registrationDraft = Object.assign({}, data, {
      email: email,
      phone: phone,
      registration_mode: regMode
    });
    throw err;
  }

  function register(data) {
    if (useApi()) return registerApi(data);
    try {
      registerLocal(data);
      return Promise.resolve();
    } catch (e) {
      return Promise.reject(e);
    }
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
      ? IfluxRoutes.to('community', { canonical: true })
      : '../community/index.html';
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

  function requireAuth(loginPath) {
    if (!isLoggedIn()) {
      var dest;
      if (global.IfluxRoutes) {
        if (global.IfluxPncLifecycle && IfluxPncLifecycle.saveReturnTo) {
          IfluxPncLifecycle.saveReturnTo(IfluxRoutes.pathname());
        }
        dest = IfluxRoutes.loginWithReturn(IfluxRoutes.pathname());
      } else {
        dest = (loginPath || '../auth/login.html') + '?return=' + encodeURIComponent(currentReturnPath());
      }
      global.location.replace(dest);
      return false;
    }
    return true;
  }

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
        global.location.replace(path);
        return;
      }
      if (path.indexOf('../') === 0) {
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
        global.location.replace(R ? R.to(path) : canonical);
      }
      return;
    }
    if (!shellNavigate(R ? R.to('community', { skipDecorate: true }) : '/cong-dong')) {
      global.location.replace(defaultPath || appHomePath());
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
    getSubscriptionState: function () { return getSubscriptionState(); },
    syncSubscriptionLifecycle: syncSubscriptionLifecycle,
    activateTrial: activateTrial,
    acknowledgeTrialExpiry: acknowledgeTrialExpiry,
    updateUser: updateUser,
    loginWithEmail: loginWithEmail,
    loginWithSocial: loginWithSocial,
    loginWithPhone: loginWithPhoneAsync,
    resetPasswordWithOtp: resetPasswordWithOtpAsync,
    register: register,
    assertRegistrationUnique: assertRegistrationUnique,
    verifyEmailAndRegister: verifyEmailAndRegister,
    resendVerificationEmail: resendVerificationEmail,
    goToVerifyOtpPage: goToVerifyOtpPage,
    loadRegistrationDraft: loadRegistrationDraft,
    loadPendingVerification: loadPendingVerification,
    clearPendingVerification: clearPendingVerification,
    markPendingOnboarding: markPendingOnboarding,
    hasPendingOnboarding: hasPendingOnboarding,
    clearPendingOnboarding: clearPendingOnboarding,
    logout: logout,
    guestHomePath: guestHomePath,
    appHomePath: appHomePath,
    hasActiveSessionElsewhere: hasActiveSessionElsewhere,
    getActiveSessionInfo: getActiveSessionInfo,
    submitEmergencyLockRequest: submitEmergencyLockRequest,
    requireAuth: requireAuth,
    redirectAfterAuth: redirectAfterAuth,
    refreshSessionFromApi: refreshSessionFromApi,
    patchUserById: patchUserById
  };
})(window);
