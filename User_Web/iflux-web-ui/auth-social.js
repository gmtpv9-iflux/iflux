/**
 * iFlux — Social login (Google / Apple / Facebook / Zalo)
 * Google: GIS Architecture — One Tap (prompt @ load) + renderButton visible (Button flow).
 * Gọi IfluxAuth.loginWithSocial → POST /auth/social khi dataMode=api
 *
 * SoT: docs/.../26-Google-SignIn-Target-Architecture.md
 */
(function (global) {
  'use strict';

  var config = null;
  var googleInitialized = false;
  var googleButtonReady = false;
  var pageSocialOpts = null;

  function resolveSocialApiBase() {
    if (global.IfluxApiConfig && IfluxApiConfig.isEnabled && IfluxApiConfig.isEnabled()) {
      return IfluxApiConfig.getBaseUrl();
    }
    if (global.IfluxRuntime && IfluxRuntime.getConfig) {
      var rc = IfluxRuntime.getConfig();
      if (rc && rc.apiBaseUrl) return rc.apiBaseUrl;
      if (rc && rc.environment === 'production') {
        var l = global.location || {};
        if (l.host) return String(l.protocol || 'http:') + '//' + l.host + '/api';
      }
    }
    return '';
  }

  function fetchSocialConfigDirect() {
    var base = resolveSocialApiBase();
    if (!base) return Promise.reject(new Error('Không xác định được API base URL.'));
    return fetch(base + '/auth/social/config', { method: 'GET', credentials: 'same-origin' })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data && data.google) return data;
        throw new Error('Phản hồi cấu hình social không hợp lệ.');
      });
  }

  function loadConfig() {
    if (config) return Promise.resolve(config);
    if (global.__IFX_SOCIAL_CONFIG__) {
      config = global.__IFX_SOCIAL_CONFIG__;
      return Promise.resolve(config);
    }
    if (global.IfluxApiClient && IfluxApiClient.getSocialAuthConfig) {
      return IfluxApiClient.getSocialAuthConfig()
        .then(function (c) {
          config = c || {};
          return config;
        })
        .catch(function () {
          return fetchSocialConfigDirect()
            .then(function (c) {
              config = c || {};
              return config;
            })
            .catch(function () {
              config = {};
              return config;
            });
        });
    }
    return fetchSocialConfigDirect()
      .then(function (c) {
        config = c || {};
        return config;
      })
      .catch(function () {
        config = {};
        return config;
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

  function providerLabel(provider) {
    var map = { google: 'Google', apple: 'Apple', facebook: 'Facebook', zalo: 'Zalo' };
    return map[String(provider || '').toLowerCase()] || provider;
  }

  function notConfigured(provider) {
    return Promise.reject(
      new Error(providerLabel(provider) + ' chưa được cấu hình — liên hệ quản trị viên.')
    );
  }

  function ensureAuth() {
    if (!global.IfluxAuth || !IfluxAuth.loginWithSocial) {
      return Promise.reject(new Error('Hệ thống đăng nhập chưa sẵn sàng.'));
    }
  }

  function finishSocialLogin(provider, tokens, opts) {
    ensureAuth();
    return IfluxAuth.loginWithSocial(provider, tokens || {}, opts || {});
  }

  function affiliateCodeForSocial(frozen) {
    if (global.IfluxAffiliateResolver && IfluxAffiliateResolver.getCodeForIdentityCreation) {
      var fresh = IfluxAffiliateResolver.getCodeForIdentityCreation();
      if (fresh) return fresh;
    }
    return frozen || null;
  }

  function buildGoogleRunOpts() {
    var opts = pageSocialOpts || {};
    return {
      referral_code: affiliateCodeForSocial(opts.referral_code),
      remember_me: opts.remember_me
    };
  }

  function onGoogleCredential(response) {
    if (!response || !response.credential) return;
    var opts = pageSocialOpts || {};
    var runOpts = buildGoogleRunOpts();
    if (opts.onStart) opts.onStart('google');
    finishSocialLogin('google', { id_token: response.credential }, runOpts)
      .then(function (user) {
        if (opts.onSuccess) opts.onSuccess('google', user);
      })
      .catch(function (err) {
        if (opts.onError) opts.onError('google', err);
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
        callback: onGoogleCredential,
        auto_select: false,
        cancel_on_tap_outside: true,
        use_fedcm_for_prompt: true,
        use_fedcm_for_button: true,
        itp_support: true
      });
      googleInitialized = true;
    });
  }

  /** GIS Button thật — slot nhìn thấy (#ifx-google-signin-btn). Không offscreen / không JS proxy. */
  function renderVisibleGoogleButton() {
    var slot = document.getElementById('ifx-google-signin-btn');
    if (!slot || !global.google || !google.accounts || !google.accounts.id) {
      googleButtonReady = false;
      return false;
    }
    slot.innerHTML = '';
    google.accounts.id.renderButton(slot, {
      type: 'icon',
      theme: 'outline',
      size: 'medium',
      shape: 'circle'
    });
    googleButtonReady = true;
    return true;
  }

  /**
   * One Tap — chỉ gọi lúc page ready (không gắn user click).
   * Skip / not displayed / dismiss không credential → im lặng (không toast hệ thống).
   */
  function promptOneTapOnLoad() {
    if (!global.google || !google.accounts || !google.accounts.id) return;
    if (typeof google.accounts.id.prompt !== 'function') return;
    try {
      google.accounts.id.prompt(function (notification) {
        if (!notification) return;
        /* intentional no-op on skip / notDisplayed / dismiss — Button vẫn sẵn sàng */
      });
    } catch (e) {
      /* ignore */
    }
  }

  /** API tương thích — không còn custom-icon → prompt. */
  function loginGoogle() {
    return Promise.reject(
      new Error('Dùng nút Google trên trang để đăng nhập.')
    );
  }

  function loginApple(opts) {
    return loadConfig().then(function (c) {
      var cfg = c.apple || {};
      if (!cfg.enabled || !cfg.clientId) return notConfigured('apple');
      return loadScript('https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js')
        .then(function () {
          if (!global.AppleID) throw new Error('Apple Sign In SDK không khả dụng.');
          AppleID.auth.init({
            clientId: cfg.clientId,
            scope: 'name email',
            redirectURI: window.location.origin + window.location.pathname,
            usePopup: true
          });
          return AppleID.auth.signIn();
        })
        .then(function (res) {
          var idToken = res.authorization && res.authorization.id_token;
          if (!idToken) throw new Error('Apple không trả id_token.');
          return finishSocialLogin('apple', { id_token: idToken }, opts);
        });
    });
  }

  function loginFacebook(opts) {
    return loadConfig().then(function (c) {
      var cfg = c.facebook || {};
      if (!cfg.enabled || !cfg.appId) return notConfigured('facebook');
      return loadScript('https://connect.facebook.net/vi_VN/sdk.js').then(function () {
        return new Promise(function (resolve, reject) {
          if (!global.FB) {
            reject(new Error('Facebook SDK không khả dụng.'));
            return;
          }
          FB.init({ appId: cfg.appId, cookie: true, xfbml: false, version: 'v19.0' });
          FB.login(function (response) {
            if (!response.authResponse || !response.authResponse.accessToken) {
              reject(new Error('Đăng nhập Facebook bị hủy.'));
              return;
            }
            finishSocialLogin('facebook', { access_token: response.authResponse.accessToken }, opts)
              .then(resolve)
              .catch(reject);
          }, { scope: 'public_profile,email' });
        });
      });
    });
  }

  function loginZalo(opts) {
    return loadConfig().then(function (c) {
      var cfg = c.zalo || {};
      if (!cfg.enabled || !cfg.appId) return notConfigured('zalo');
      var redirect = cfg.redirectUri || (window.location.origin + window.location.pathname);
      var state = 'ifx_' + Math.random().toString(36).slice(2, 10);
      try {
        sessionStorage.setItem('ifx_zalo_oauth_state', state);
      } catch (e) { /* ignore */ }
      var url =
        'https://oauth.zaloapp.com/v4/permission?app_id=' +
        encodeURIComponent(cfg.appId) +
        '&redirect_uri=' +
        encodeURIComponent(redirect) +
        '&state=' +
        encodeURIComponent(state);
      window.location.href = url;
      return new Promise(function () { /* redirect */ });
    });
  }

  function handleZaloCallback() {
    var params = new URLSearchParams(window.location.search);
    var code = params.get('code');
    var state = params.get('state');
    if (!code) return Promise.resolve(null);
    var saved = null;
    try {
      saved = sessionStorage.getItem('ifx_zalo_oauth_state');
      sessionStorage.removeItem('ifx_zalo_oauth_state');
    } catch (e) { /* ignore */ }
    if (saved && state && saved !== state) {
      return Promise.reject(new Error('Zalo OAuth state không khớp.'));
    }
    var ref = null;
    if (global.IfluxAffiliateResolver && IfluxAffiliateResolver.getCodeForIdentityCreation) {
      ref = IfluxAffiliateResolver.getCodeForIdentityCreation() || null;
    }
    return finishSocialLogin('zalo', { oauth_code: code }, { referral_code: ref }).then(function (user) {
      if (window.history && window.history.replaceState) {
        window.history.replaceState({}, '', window.location.pathname + window.location.hash);
      }
      return user;
    });
  }

  function bindSocialButtons(root, opts) {
    opts = opts || {};
    root = root || document;
    
    var googleSlot = root.getElementById('ifx-google-signin-btn');
    if (googleSlot) {
      googleSlot.addEventListener('click', function (e) {
        if (!googleButtonReady) {
          e.preventDefault();
        }
      });
    }

    var map = {
      apple: loginApple,
      facebook: loginFacebook,
      zalo: loginZalo
    };
    Object.keys(map).forEach(function (provider) {
      var el = root.getElementById('btn-' + provider);
      if (!el) return;
      el.addEventListener('click', function (e) {
        e.preventDefault();
        var run = map[provider];
        var runOpts = {
          referral_code: affiliateCodeForSocial(opts.referral_code),
          remember_me: opts.remember_me
        };
        if (opts.onStart) opts.onStart(provider);
        run(runOpts)
          .then(function (user) {
            if (opts.onSuccess) opts.onSuccess(provider, user);
          })
          .catch(function (err) {
            if (opts.onError) opts.onError(provider, err);
          });
      });
    });
  }

  function initPage(opts) {
    opts = opts || {};
    pageSocialOpts = opts;
    return loadConfig()
      .then(function (c) {
        if (c.google && c.google.enabled) {
          return initGoogle(c.google)
            .then(function () {
              renderVisibleGoogleButton();
              promptOneTapOnLoad();
            })
            .catch(function () { /* optional */ });
        }
      })
      .then(function () {
        return handleZaloCallback()
          .then(function (user) {
            if (user && opts.onSuccess) opts.onSuccess('zalo', user);
            bindSocialButtons(document, opts);
          })
          .catch(function (err) {
            bindSocialButtons(document, opts);
            if (opts.onError) opts.onError('zalo', err);
          });
      });
  }

  global.IfluxAuthSocial = {
    loadConfig: loadConfig,
    loginGoogle: loginGoogle,
    loginApple: loginApple,
    loginFacebook: loginFacebook,
    loginZalo: loginZalo,
    bindSocialButtons: bindSocialButtons,
    initPage: initPage,
    handleZaloCallback: handleZaloCallback,
    isGoogleButtonReady: function () { return googleButtonReady; }
  };
})(window);
