/* Production auth-social.js — extract only
 * Source: /var/www/iflux/production/User_Web/iflux-web-ui/auth-social.js
 * CDN: /User_Web/iflux-web-ui/auth-social.js?v=googleProxy20260728
 * md5: 8b16bbe7cd56116eea883756f843ebc3
 * Functions: initGoogle, ensureOffscreenGoogleActivator, clickOffscreenGoogleActivator,
 *            startGoogleLoginFromUserGesture, loginGoogle
 * NO ANALYSIS — Owner review only
 */

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
          global.__ifxGoogleCredential = response;
          if (global.__ifxOnGoogleCredential) {
            global.__ifxOnGoogleCredential(response);
          }
        },
        auto_select: false,
        cancel_on_tap_outside: true,
        use_fedcm_for_prompt: true,
        itp_support: true
      });
      googleInitialized = true;
    });
  }

  /** GIS renderButton off-screen — giữ icon DS, không chen nút thứ hai trên UI. */
  function ensureOffscreenGoogleActivator(cfg) {
    if (!cfg || !cfg.enabled || !cfg.clientId) return Promise.resolve(false);
    return initGoogle(cfg).then(function () {
      if (googleActivatorReady) return true;
      var proxy = document.getElementById('ifx-google-auth-proxy');
      if (!proxy) {
        proxy = document.createElement('div');
        proxy.id = 'ifx-google-auth-proxy';
        proxy.setAttribute('aria-hidden', 'true');
        proxy.style.position = 'fixed';
        proxy.style.left = '-9999px';
        proxy.style.top = '0';
        proxy.style.width = '48px';
        proxy.style.height = '48px';
        proxy.style.overflow = 'hidden';
        proxy.style.opacity = '0';
        proxy.style.pointerEvents = 'none';
        document.body.appendChild(proxy);
      }
      google.accounts.id.renderButton(proxy, {
        type: 'icon',
        theme: 'outline',
        size: 'medium',
        shape: 'circle'
      });
      googleActivatorReady = true;
      return true;
    });
  }

  function clickOffscreenGoogleActivator() {
    var proxy = document.getElementById('ifx-google-auth-proxy');
    if (!proxy) return false;
    proxy.style.pointerEvents = 'auto';
    var btn = proxy.querySelector('[role="button"]') || proxy.querySelector('div[tabindex]');
    if (!btn) {
      proxy.style.pointerEvents = 'none';
      return false;
    }
    btn.click();
    proxy.style.pointerEvents = 'none';
    return true;
  }

  function startGoogleLoginFromUserGesture(opts) {
    return new Promise(function (resolve, reject) {
      if (!googleActivatorReady) {
        reject(new Error('Google Sign-In chưa sẵn sàng — tải lại trang.'));
        return;
      }
      var settled = false;
      var timer = setTimeout(function () {
        if (settled) return;
        settled = true;
        global.__ifxOnGoogleCredential = null;
        reject(new Error('Đăng nhập Google bị hủy.'));
      }, 120000);
      global.__ifxOnGoogleCredential = function (response) {
        if (settled) return;
        settled = true;
        global.__ifxOnGoogleCredential = null;
        clearTimeout(timer);
        if (!response || !response.credential) {
          reject(new Error('Đăng nhập Google bị hủy.'));
          return;
        }
        finishSocialLogin('google', { id_token: response.credential }, opts || {})
          .then(resolve)
          .catch(reject);
      };
      if (!clickOffscreenGoogleActivator()) {
        settled = true;
        global.__ifxOnGoogleCredential = null;
        clearTimeout(timer);
        reject(new Error('Không mở được cửa sổ Google. Thử trình duyệt khác hoặc cho phép đăng nhập bên thứ ba.'));
      }
    });
  }

  function loginGoogle(opts) {
    if (googleActivatorReady) {
      return startGoogleLoginFromUserGesture(opts);
    }
    return loadConfig().then(function (c) {
      var cfg = c.google || {};
      if (!cfg.enabled || !cfg.clientId) return notConfigured('google');
      return ensureOffscreenGoogleActivator(cfg).then(function (ready) {
        if (!ready) {
          return Promise.reject(new Error('Google Sign-In chưa sẵn sàng — tải lại trang.'));
        }
        return startGoogleLoginFromUserGesture(opts);
      });
    });
  }

