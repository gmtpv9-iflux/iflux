/**
 * iFlux — Google One Tap
 * Khách (chưa đăng nhập) vào web sẽ tự động được đề xuất đăng ký / đăng nhập bằng Google.
 * Chỉ chạy ở chế độ API (id_token phải được backend xác thực) và ngoài trang đăng nhập/đăng ký.
 */
(function (global) {
  'use strict';

  var GSI_SRC = 'https://accounts.google.com/gsi/client';
  var DISMISS_KEY = 'iflux_gonetap_dismiss_at';
  var DISMISS_COOLDOWN_MS = 6 * 60 * 60 * 1000; // 6 giờ sau khi khách bỏ qua
  var started = false;

  function isAuthPage() {
    var p = String(global.location.pathname || '');
    return /\/auth\//.test(p) || /\/verify/.test(p);
  }

  function isLoggedIn() {
    return !!(global.IfluxAuth && IfluxAuth.isLoggedIn && IfluxAuth.isLoggedIn());
  }

  function isApiMode() {
    return global.IfluxData ? IfluxData.isApi() : false;
  }

  function inCooldown() {
    try {
      var at = parseInt(localStorage.getItem(DISMISS_KEY) || '0', 10);
      return at && (Date.now() - at) < DISMISS_COOLDOWN_MS;
    } catch (e) {
      return false;
    }
  }

  function markDismissed() {
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch (e) { /* ignore */ }
  }

  function loadGsi() {
    return new Promise(function (resolve, reject) {
      if (global.google && google.accounts && google.accounts.id) return resolve();
      if (document.querySelector('script[src="' + GSI_SRC + '"]')) {
        var t = setInterval(function () {
          if (global.google && google.accounts && google.accounts.id) {
            clearInterval(t);
            resolve();
          }
        }, 100);
        setTimeout(function () { clearInterval(t); reject(new Error('gsi timeout')); }, 8000);
        return;
      }
      var s = document.createElement('script');
      s.src = GSI_SRC;
      s.async = true;
      s.defer = true;
      s.onload = function () { resolve(); };
      s.onerror = function () { reject(new Error('gsi load error')); };
      document.head.appendChild(s);
    });
  }

  function getConfig() {
    if (global.IfluxApiClient && IfluxApiClient.getSocialAuthConfig) {
      return IfluxApiClient.getSocialAuthConfig().catch(function () { return null; });
    }
    return Promise.resolve(null);
  }

  function onCredential(response) {
    if (!response || !response.credential) return;
    if (!global.IfluxAuth || !IfluxAuth.loginWithSocial) return;
    var refCode = null;
    if (global.IfluxIdentityContext && IfluxIdentityContext.getActiveOwner) {
      refCode = String(IfluxIdentityContext.getActiveOwner() || '')
        .trim()
        .toUpperCase() || null;
    }
    IfluxAuth.loginWithSocial('google', { id_token: response.credential }, {
      referral_code: refCode
    })
      .then(function () {
        try { localStorage.removeItem(DISMISS_KEY); } catch (e) { /* ignore */ }
        var to = (IfluxAuth.appHomePath && IfluxAuth.appHomePath()) || null;
        if (to && !isLoggedInPage()) {
          if (global.IfluxHref && global.IfluxHref.navigate) {
            global.IfluxHref.navigate(to);
          } else if (global.IfluxShellUrlWriter && global.IfluxShellUrlWriter.navigate) {
            global.IfluxShellUrlWriter.navigate(to);
          } else {
            global.location.href = to;
          }
        } else {
          global.location.reload();
        }
      })
      .catch(function () {
        if (global.ixToast) ixToast('Không đăng nhập được bằng Google. Vui lòng thử lại.', 'danger');
      });
  }

  // Nếu đang ở chính trang home ứng dụng thì reload thay vì điều hướng lại.
  function isLoggedInPage() {
    return /\/home\//.test(String(global.location.pathname || ''));
  }

  function prompt(cfg) {
    if (!global.google || !google.accounts || !google.accounts.id) return;
    google.accounts.id.initialize({
      client_id: cfg.clientId,
      callback: onCredential,
      auto_select: false,
      cancel_on_tap_outside: true,
      context: 'signup',
      use_fedcm_for_prompt: true,
      itp_support: true
    });
    google.accounts.id.prompt(function (notification) {
      try {
        if (notification.isDismissedMoment && notification.isDismissedMoment()) {
          var reason = notification.getDismissedReason && notification.getDismissedReason();
          if (reason === 'user_cancel' || reason === 'cancel_called') markDismissed();
        } else if (notification.isSkippedMoment && notification.isSkippedMoment()) {
          markDismissed();
        }
      } catch (e) { /* ignore */ }
    });
  }

  function boot() {
    if (started) return;
    if (isAuthPage() || isLoggedIn() || !isApiMode() || inCooldown()) return;
    if (!document.querySelector('.ifx-app')) return;
    started = true;
    getConfig().then(function (c) {
      var g = c && c.google;
      if (!g || !g.enabled || !g.clientId) return;
      loadGsi().then(function () { prompt(g); }).catch(function () { /* ignore */ });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  global.IfluxGoogleOneTap = { boot: boot };
})(window);
