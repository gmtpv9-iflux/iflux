/**
 * iFlux — Social residual (Apple / Facebook / Zalo) + UI bind.
 * Google → SocialLoginUseCase.execute (Registry → Provider).
 * Không GIS · không đọc AR (UseCase sở hữu AR read).
 */
(function (global) {
  'use strict';

  var config = null;

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

  function runGoogle(opts) {
    var uc = global.IfluxSocialLoginUseCase;
    if (!uc || !uc.execute) {
      return Promise.reject(new Error('SocialLoginUseCase chưa sẵn sàng.'));
    }
    return uc.execute('google', opts || {});
  }

  function completeTokens(provider, tokens, opts) {
    var uc = global.IfluxSocialLoginUseCase;
    if (!uc || !uc.completeWithTokens) {
      return Promise.reject(new Error('SocialLoginUseCase chưa sẵn sàng.'));
    }
    return uc.completeWithTokens(provider, tokens, opts || {});
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
          return completeTokens('apple', { id_token: idToken }, opts);
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
            completeTokens('facebook', { access_token: response.authResponse.accessToken }, opts)
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
    return completeTokens('zalo', { oauth_code: code }, {}).then(function (user) {
      if (window.history && window.history.replaceState) {
        window.history.replaceState({}, '', window.location.pathname + window.location.hash);
      }
      return user;
    });
  }

  function bindSocialButtons(root, opts) {
    opts = opts || {};
    root = root || document;
    var map = {
      google: runGoogle,
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
    return loadConfig()
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
    loginApple: loginApple,
    loginFacebook: loginFacebook,
    loginZalo: loginZalo,
    bindSocialButtons: bindSocialButtons,
    initPage: initPage,
    handleZaloCallback: handleZaloCallback
  };
})(window);
