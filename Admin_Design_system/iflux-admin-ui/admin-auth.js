/* iFlux Admin — đăng nhập Gmail + ghi nhớ phiên */
(function (global) {
  'use strict';

  var STORAGE_KEY = 'iflux_admin_session';
  var googleInitialized = false;
  var socialConfig = null;

  function apiBase() {
    var loc = global.location || {};
    if (loc.origin && loc.origin !== 'null') return loc.origin + '/api';
    return '/api';
  }

  function isPublicPage() {
    var path = (global.location && global.location.pathname) || '';
    if (/\/auth\/(login|forgot|register|verify-2fa)\.html$/i.test(path)) return true;
    if (/\/admin\/login\/?$/i.test(path)) return true;
    return false;
  }

  function isLoginPage() {
    return isPublicPage();
  }

  function loginUrl(returnTo) {
    var url = '/admin/dang-nhap';
    if (returnTo) url += '?return=' + encodeURIComponent(returnTo);
    return url;
  }

  function readRaw() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  function writeSession(data, remember) {
    try {
      localStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem(STORAGE_KEY);
      var store = remember ? localStorage : sessionStorage;
      store.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) { /* ignore */ }
  }

  function clearSession() {
    try {
      localStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem(STORAGE_KEY);
    } catch (e) { /* ignore */ }
  }

  function decodeJwtExp(token) {
    try {
      var parts = String(token || '').split('.');
      if (parts.length < 2) return null;
      var payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
      return payload && payload.exp ? payload.exp * 1000 : null;
    } catch (e) {
      return null;
    }
  }

  function getSession() {
    var s = readRaw();
    if (!s || !s.token) return null;
    var exp = s.exp || decodeJwtExp(s.token);
    if (exp && exp < Date.now()) {
      clearSession();
      return null;
    }
    return s;
  }

  function getAdmin() {
    var s = getSession();
    return s && s.admin ? s.admin : null;
  }

  function isAuthenticated() {
    return !!getSession();
  }

  function fetchJson(url, opts) {
    return fetch(url, opts).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (data) {
        if (!res.ok) {
          var msg = data.error || data.message || ('HTTP ' + res.status);
          if (typeof msg === 'object') msg = msg.message || JSON.stringify(msg);
          throw new Error(msg);
        }
        return data;
      });
    });
  }

  function loadSocialConfig() {
    if (socialConfig) return Promise.resolve(socialConfig);
    return fetchJson(apiBase() + '/admin/auth/config').then(function (cfg) {
      socialConfig = cfg || {};
      return socialConfig;
    });
  }

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      if (document.querySelector('script[src="' + src + '"]')) {
        resolve();
        return;
      }
      var s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.defer = true;
      s.onload = function () { resolve(); };
      s.onerror = function () { reject(new Error('Không tải được SDK: ' + src)); };
      document.head.appendChild(s);
    });
  }

  function initGoogle(cfg) {
    if (!cfg || !cfg.enabled || !cfg.clientId) return Promise.resolve();
    if (googleInitialized) return Promise.resolve();
    return loadScript('https://accounts.google.com/gsi/client').then(function () {
      if (!global.google || !google.accounts || !google.accounts.id) {
        throw new Error('Google Sign-In SDK không khả dụng.');
      }
      google.accounts.id.initialize({
        client_id: cfg.clientId,
        callback: function (response) {
          global.__ifxAdminGoogleCredential = response;
          if (global.__ifxOnAdminGoogleCredential) {
            global.__ifxOnAdminGoogleCredential(response);
          }
        },
        auto_select: false,
        cancel_on_tap_outside: true,
        use_fedcm_for_prompt: true
      });
      googleInitialized = true;
    });
  }

  /* Đổi Google credential (id_token) lấy phiên admin. */
  function exchangeGoogleCredential(credential, remember) {
    return fetchJson(apiBase() + '/admin/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ id_token: credential, remember: !!remember })
    }).then(function (data) {
      var exp = decodeJwtExp(data.token);
      writeSession({ token: data.token, admin: data.admin, remember: !!remember, exp: exp }, !!remember);
      return data;
    });
  }

  /* Vẽ nút Google chính thức (mở cửa sổ chọn tài khoản đáng tin — thay One Tap prompt hay lỗi). */
  function renderGoogleButton(container, remember, onDone, onError) {
    return loadSocialConfig().then(function (cfg) {
      var g = (cfg && cfg.google) || {};
      if (!g.enabled || !g.clientId) return false;
      return initGoogle(g).then(function () {
        global.__ifxOnAdminGoogleCredential = function (response) {
          if (!response || !response.credential) {
            if (onError) onError(new Error('Đăng nhập Google bị hủy.'));
            return;
          }
          exchangeGoogleCredential(response.credential, remember())
            .then(function (data) { if (onDone) onDone(data); })
            .catch(function (err) { if (onError) onError(err); });
        };
        container.innerHTML = '';
        google.accounts.id.renderButton(container, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          shape: 'pill',
          logo_alignment: 'center',
          width: Math.min(360, container.offsetWidth || 320)
        });
        return true;
      });
    });
  }

  function loginWithGoogle(remember) {
    return loadSocialConfig().then(function (cfg) {
      var g = (cfg && cfg.google) || {};
      if (!g.enabled || !g.clientId) {
        throw new Error('Google chưa được cấu hình trên server.');
      }
      return initGoogle(g).then(function () {
        return new Promise(function (resolve, reject) {
          global.__ifxOnAdminGoogleCredential = function (response) {
            global.__ifxOnAdminGoogleCredential = null;
            if (!response || !response.credential) {
              reject(new Error('Đăng nhập Google bị hủy.'));
              return;
            }
            fetchJson(apiBase() + '/admin/auth/google', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'same-origin',
              body: JSON.stringify({ id_token: response.credential, remember: !!remember })
            }).then(function (data) {
              var exp = decodeJwtExp(data.token);
              writeSession({
                token: data.token,
                admin: data.admin,
                remember: !!remember,
                exp: exp
              }, !!remember);
              resolve(data);
            }).catch(reject);
          };
          google.accounts.id.prompt(function (notification) {
            if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
              reject(new Error('Không mở được cửa sổ Google. Cho phép popup hoặc thử trình duyệt khác.'));
            }
          });
        });
      });
    });
  }

  function loginWithPassword(email, password, remember) {
    return fetchJson(apiBase() + '/admin/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ email: email, password: password, remember: !!remember })
    }).then(function (data) {
      var exp = decodeJwtExp(data.token);
      writeSession({
        token: data.token,
        admin: data.admin,
        remember: !!remember,
        exp: exp
      }, !!remember);
      return data;
    });
  }

  function logout() {
    clearSession();
    global.location.href = loginUrl();
  }

  function loadRbacClient() {
    if (document.querySelector('script[data-ix-rbac]')) return;
    var s = document.createElement('script');
    s.src = '/Admin_Design_system/iflux-admin-ui/admin-rbac-client.js?v=20260716rbacfix1';
    s.setAttribute('data-ix-rbac', '');
    s.async = true;
    document.head.appendChild(s);
  }

  function requireAuth() {
    if (isPublicPage()) return;
    if (isAuthenticated()) {
      loadRbacClient();
      return;
    }
    var path = (global.location.pathname || '') + (global.location.search || '') + (global.location.hash || '');
    global.location.replace(loginUrl(path));
  }

  function returnUrl() {
    var q = new URLSearchParams(global.location.search || '');
    var ret = q.get('return');
    if (ret && ret.indexOf('/admin/dang-nhap') < 0 && ret.indexOf('/dang-nhap') < 0) {
      return ret;
    }
    return '/admin/tong-quan';
  }

  function initLoginPage() {
    var googleBtn = document.getElementById('ix-admin-google-login');
    var googleBtnBox = document.getElementById('ix-admin-google-btn');
    var googleSection = document.getElementById('ix-admin-google-section');
    var rememberEl = document.getElementById('ix-admin-remember');
    var errEl = document.getElementById('ix-admin-login-error');
    var form = document.getElementById('ix-admin-login-form');
    var emailEl = document.getElementById('ix-admin-email');
    var passEl = document.getElementById('ix-admin-password');
    var submitBtn = document.getElementById('ix-admin-login-submit');
    var tabsWrap = document.getElementById('ix-admin-login-tabs');
    var tabGmail = document.getElementById('ix-admin-tab-gmail');
    var tabPassword = document.getElementById('ix-admin-tab-password');
    var panelGmail = document.getElementById('ix-tab-gmail');
    var panelPassword = document.getElementById('ix-tab-password');
    var googleUnavailEl = document.getElementById('ix-admin-google-unavailable');
    var busy = false;

    if (isAuthenticated()) {
      global.location.replace(returnUrl());
      return;
    }

    function activateTab(name) {
      var isPw = name === 'password';
      if (tabGmail) tabGmail.classList.toggle('active', !isPw);
      if (tabPassword) tabPassword.classList.toggle('active', isPw);
      if (panelGmail) panelGmail.style.display = isPw ? 'none' : '';
      if (panelPassword) panelPassword.style.display = isPw ? '' : 'none';
    }
    if (tabGmail) tabGmail.addEventListener('click', function () { activateTab('gmail'); });
    if (tabPassword) tabPassword.addEventListener('click', function () { activateTab('password'); });

    function showError(msg) {
      if (!errEl) return;
      errEl.textContent = msg || '';
      // .ix-alert có display cố định → phải dùng style.display thay cho [hidden]
      errEl.style.display = msg ? '' : 'none';
    }

    function remember() {
      return rememberEl ? !!rememberEl.checked : true;
    }

    /* ── Đăng nhập email + mật khẩu (phương thức chính, chạy mọi trình duyệt) ── */
    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (busy) return;
        var email = emailEl ? emailEl.value.trim() : '';
        var password = passEl ? passEl.value : '';
        if (!email || !password) {
          showError('Nhập email và mật khẩu.');
          return;
        }
        busy = true;
        showError('');
        if (submitBtn) submitBtn.setAttribute('aria-busy', 'true');
        loginWithPassword(email, password, remember())
          .then(function () {
            global.location.replace(returnUrl());
          })
          .catch(function (err) {
            showError((err && err.message) || 'Đăng nhập thất bại.');
          })
          .finally(function () {
            busy = false;
            if (submitBtn) submitBtn.removeAttribute('aria-busy');
          });
      });
    }

    /* ── Google (tuỳ chọn, chỉ hiện khi server cấu hình + origin hợp lệ) ── */
    if (googleBtn) {
      googleBtn.addEventListener('click', function () {
        if (busy) return;
        busy = true;
        showError('');
        googleBtn.setAttribute('aria-busy', 'true');
        loginWithGoogle(remember())
          .then(function () {
            global.location.replace(returnUrl());
          })
          .catch(function (err) {
            showError((err && err.message) || 'Đăng nhập Google thất bại. Hãy dùng email + mật khẩu.');
          })
          .finally(function () {
            busy = false;
            googleBtn.removeAttribute('aria-busy');
          });
      });
    }

    // Google chỉ dùng được trên domain + HTTPS (Google cấm origin IP / HTTP)
    loadSocialConfig().then(function (cfg) {
      var g = (cfg && cfg.google) || {};
      var loc = global.location || {};
      var httpsOk = loc.protocol === 'https:';
      var isIp = /^\d{1,3}(\.\d{1,3}){3}$/.test(loc.hostname || '');
      var googleUsable = !!(g.enabled && g.clientId) && httpsOk && !isIp;
      if (!googleUsable) {
        // Không dùng được Google (IP/HTTP/chưa cấu hình) → mặc định sang tab mật khẩu.
        if (googleUnavailEl) googleUnavailEl.style.display = '';
        if (tabGmail) tabGmail.disabled = true;
        activateTab('password');
        return;
      }
      if (!googleSection) return;

      function onDone() { global.location.replace(returnUrl()); }
      function onErr(err) { showError((err && err.message) || 'Đăng nhập Google thất bại. Hãy dùng email + mật khẩu.'); }

      // Ưu tiên nút Google chính thức (mở cửa sổ đáng tin). Chỉ hiện nút tùy biến nếu render lỗi.
      if (googleBtnBox) {
        renderGoogleButton(googleBtnBox, remember, onDone, onErr)
          .then(function (ok) {
            if (!ok && googleBtn) googleBtn.style.display = '';
          })
          .catch(function () { if (googleBtn) googleBtn.style.display = ''; });
      } else if (googleBtn) {
        googleBtn.style.display = '';
      }
    }).catch(function () {
      if (googleUnavailEl) googleUnavailEl.style.display = '';
      if (tabGmail) tabGmail.disabled = true;
      activateTab('password');
    });
  }

  function patchNavbarAdmin() {
    var admin = getAdmin();
    if (!admin) return;

    function initials(name) {
      return String(name || '')
        .split(/\s+/)
        .filter(Boolean)
        .map(function (w) { return w.charAt(0); })
        .join('')
        .slice(0, 2)
        .toUpperCase();
    }

    document.querySelectorAll('.ix-avatar').forEach(function (el) {
      if (admin.avatarUrl) {
        el.innerHTML = '<img src="' + String(admin.avatarUrl).replace(/"/g, '&quot;') + '" alt="">';
      } else {
        el.textContent = initials(admin.name || admin.email);
      }
      el.title = admin.name ? admin.name + ' · ' + admin.email : admin.email;
    });

    var navActions = document.querySelector('.ix-nav-actions');
    if (navActions && !navActions.querySelector('[data-ix-admin-logout]')) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ix-btn ix-btn-ghost ix-btn-sm';
      btn.setAttribute('data-ix-admin-logout', '');
      btn.innerHTML = '<i class="ti ti-logout"></i>';
      btn.title = 'Đăng xuất';
      navActions.insertBefore(btn, navActions.firstChild);
    }

    document.querySelectorAll('[data-ix-admin-logout]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        logout();
      });
    });
  }

  global.IfluxAdminAuth = {
    STORAGE_KEY: STORAGE_KEY,
    isLoginPage: isLoginPage,
    loginUrl: loginUrl,
    getSession: getSession,
    getAdmin: getAdmin,
    isAuthenticated: isAuthenticated,
    loginWithGoogle: loginWithGoogle,
    loginWithPassword: loginWithPassword,
    renderGoogleButton: renderGoogleButton,
    logout: logout,
    requireAuth: requireAuth,
    initLoginPage: initLoginPage,
    patchNavbarAdmin: patchNavbarAdmin,
    apiBase: apiBase
  };

  if (!isPublicPage()) {
    requireAuth();
  }
})(window);
