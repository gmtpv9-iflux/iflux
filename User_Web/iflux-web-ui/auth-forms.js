/* iFlux User Web — auth-forms (register/login-form/forgot/OTP/emergency-lock flows)
   Tách từ auth.js — chỉ tải trên 4 trang auth (login/register/forgot/verify-otp) qua
   runtime/auth-*-boot.js. Core (auth.js) giữ session/guard — chạy trên MỌI trang. */
(function (global) {
  'use strict';

  var B = (global.IfluxAuth && global.IfluxAuth._bridge) || {};
  var useApi = B.useApi;
  var normEmail = B.normEmail;
  var normPhone = B.normPhone;
  var getProfileByEmail = B.getProfileByEmail;
  var getProfileByPhone = B.getProfileByPhone;
  var cloneUser = B.cloneUser;
  var customerToAppUser = B.customerToAppUser;
  var DEFAULT_USER = B.DEFAULT_USER;
  var saveProfile = B.saveProfile;
  var establishSession = B.establishSession;
  var markPendingOnboarding = B.markPendingOnboarding;
  var readActiveSession = B.readActiveSession;
  var apiProfileToAppUser = B.apiProfileToAppUser;
  var isLoggedIn = B.isLoggedIn;
  var syncPlanExpiry = B.syncPlanExpiry;
  var MOCK_OTP = global.IfluxAuth.MOCK_OTP;

  var EMERGENCY_LOCK_KEY = 'iflux_emergency_lock_requests_v1';
  var PENDING_VERIFY_KEY = 'iflux_pending_verify';
  var REGISTRATION_DRAFT_KEY = 'iflux_registration_draft_v1';

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


  Object.assign(global.IfluxAuth, {
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
    hasActiveSessionElsewhere: hasActiveSessionElsewhere,
    getActiveSessionInfo: getActiveSessionInfo,
    submitEmergencyLockRequest: submitEmergencyLockRequest
  });

  if (global.IfluxAuth._onFormsReady) {
    try { global.IfluxAuth._onFormsReady(); } catch (e) { /* ignore */ }
  }
})(window);
