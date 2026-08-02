/**
 * Social Auth — Google Provider (Adapter only).
 * Boundary: Browser → GIS → IdentityProof. Không AR / Session / Redirect / remember.
 */
(function (global) {
  'use strict';

  var GSI_SRC = 'https://accounts.google.com/gsi/client';
  var initializedClientId = null;

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

  function fetchGoogleConfig() {
    if (global.__IFX_SOCIAL_CONFIG__ && global.__IFX_SOCIAL_CONFIG__.google) {
      return Promise.resolve(global.__IFX_SOCIAL_CONFIG__.google);
    }
    if (global.IfluxApiClient && IfluxApiClient.getSocialAuthConfig) {
      return IfluxApiClient.getSocialAuthConfig().then(function (c) {
        return (c && c.google) || {};
      });
    }
    var base = resolveSocialApiBase();
    if (!base) return Promise.reject(new Error('Không xác định được API base URL.'));
    return fetch(base + '/auth/social/config', { method: 'GET', credentials: 'same-origin' })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        return (data && data.google) || {};
      });
  }

  function ensureGis(clientId) {
    return loadScript(GSI_SRC).then(function () {
      if (!global.google || !google.accounts || !google.accounts.id) {
        throw new Error('Google Sign-In SDK không khả dụng.');
      }
      if (initializedClientId === clientId) return;
      google.accounts.id.initialize({
        client_id: clientId,
        callback: function (response) {
          if (typeof global.__ifxGoogleProviderCredential === 'function') {
            global.__ifxGoogleProviderCredential(response);
          }
        },
        auto_select: false,
        cancel_on_tap_outside: true
      });
      initializedClientId = clientId;
    });
  }

  /**
   * @returns {Promise<Readonly<{provider:string,kind:string,value:string}>>}
   */
  function getProof() {
    if (!global.IfluxIdentityProof || !IfluxIdentityProof.create) {
      return Promise.reject(new Error('IdentityProof chưa sẵn sàng.'));
    }
    return fetchGoogleConfig().then(function (cfg) {
      if (!cfg || !cfg.enabled || !cfg.clientId) {
        return Promise.reject(new Error('Google chưa được cấu hình — liên hệ quản trị viên.'));
      }
      return ensureGis(cfg.clientId).then(function () {
        return new Promise(function (resolve, reject) {
          global.__ifxGoogleProviderCredential = function (response) {
            global.__ifxGoogleProviderCredential = null;
            if (!response || !response.credential) {
              reject(new Error('Đăng nhập Google bị hủy.'));
              return;
            }
            try {
              resolve(
                IfluxIdentityProof.create('google', 'id_token', response.credential)
              );
            } catch (err) {
              reject(err);
            }
          };
          google.accounts.id.prompt(function (notification) {
            if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
              global.__ifxGoogleProviderCredential = null;
              reject(
                new Error(
                  'Không mở được cửa sổ Google. Thử trình duyệt khác hoặc cho phép đăng nhập bên thứ ba.'
                )
              );
            }
          });
        });
      });
    });
  }

  global.IfluxGoogleProvider = {
    id: 'google',
    getProof: getProof
  };
})(window);
