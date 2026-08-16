/**
 * Staging 2 — trang Đăng nhập quản trị
 * Segmented Gmail / mật khẩu. GIS = Bước 10. Không Shell.
 */
(function () {
  'use strict';

  var AFTER_LOGIN = '/admin';

  var form = document.getElementById('login-form');
  var emailEl = document.getElementById('login-email');
  var passwordEl = document.getElementById('login-password');
  var rememberEl = document.getElementById('login-remember');
  var submitEl = document.getElementById('login-submit');
  var errorEl = document.getElementById('login-error');
  var tabGmail = document.getElementById('login-tab-gmail');
  var tabPassword = document.getElementById('login-tab-password');
  var panelGmail = document.getElementById('login-panel-gmail');
  var panelPassword = document.getElementById('login-panel-password');
  var googleUnavailEl = document.getElementById('login-google-unavailable');

  function showError(msg) {
    if (!errorEl) return;
    if (!msg) {
      errorEl.hidden = true;
      errorEl.textContent = '';
      return;
    }
    errorEl.textContent = msg;
    errorEl.hidden = false;
  }

  function setBusy(busy) {
    if (submitEl) {
      if (busy) submitEl.setAttribute('aria-busy', 'true');
      else submitEl.removeAttribute('aria-busy');
      submitEl.disabled = !!busy;
    }
    if (emailEl) emailEl.disabled = !!busy;
    if (passwordEl) passwordEl.disabled = !!busy;
    if (rememberEl) rememberEl.disabled = !!busy;
  }

  function activateTab(name) {
    var isPw = name === 'password';
    if (tabGmail) tabGmail.classList.toggle('is-active', !isPw);
    if (tabPassword) tabPassword.classList.toggle('is-active', isPw);
    if (panelGmail) panelGmail.hidden = isPw;
    if (panelPassword) panelPassword.hidden = !isPw;
  }

  function googleUsable(cfg) {
    var g = cfg && cfg.google ? cfg.google : {};
    var loc = window.location || {};
    var httpsOk = loc.protocol === 'https:';
    var host = loc.hostname || '';
    var isIp = /^\d{1,3}(\.\d{1,3}){3}$/.test(host);
    return !!(g.enabled && g.clientId) && httpsOk && !isIp;
  }

  function markGoogleUnavailable() {
    if (googleUnavailEl) googleUnavailEl.hidden = false;
    if (tabGmail) tabGmail.disabled = true;
    activateTab('password');
  }

  if (window.IfluxAdminSession && IfluxAdminSession.isAuthenticated()) {
    window.location.replace(AFTER_LOGIN);
    return;
  }

  if (tabGmail) {
    tabGmail.addEventListener('click', function () {
      if (tabGmail.disabled) return;
      activateTab('gmail');
    });
  }
  if (tabPassword) {
    tabPassword.addEventListener('click', function () {
      activateTab('password');
    });
  }

  if (window.IfluxAdminAuthApi) {
    IfluxAdminAuthApi.config()
      .then(function (out) {
        if (!out.ok || !googleUsable(out.data)) markGoogleUnavailable();
      })
      .catch(function () {
        markGoogleUnavailable();
      });
  } else {
    markGoogleUnavailable();
  }

  if (!form || !window.IfluxAdminAuthApi) return;

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    showError('');
    var email = emailEl && emailEl.value ? emailEl.value.trim() : '';
    var password = passwordEl && passwordEl.value ? passwordEl.value : '';
    var remember = !!(rememberEl && rememberEl.checked);
    if (!email || !password) {
      showError('Nhập email và mật khẩu.');
      return;
    }
    setBusy(true);
    IfluxAdminAuthApi.login(email, password, remember)
      .then(function (out) {
        if (out.ok && out.data && out.data.token && IfluxAdminSession.isAuthenticated()) {
          window.location.replace(AFTER_LOGIN);
          return;
        }
        var msg = (out.data && out.data.error) || 'Đăng nhập thất bại.';
        showError(msg);
        setBusy(false);
      })
      .catch(function () {
        showError('Không kết nối được. Thử lại sau.');
        setBusy(false);
      });
  });
})();
