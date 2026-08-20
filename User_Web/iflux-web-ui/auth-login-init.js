/* extracted from auth/login.html — Phase A */

(function () {
  if (IfluxAuth.isLoggedIn()) {
    IfluxAuth.redirectAfterAuth();
    return;
  }

  var loginMain = document.getElementById('login-main');
  var emergencyPanel = document.getElementById('emergency-lock-panel');

  function showEmergencyLock(email) {
    if (loginMain) loginMain.hidden = true;
    if (emergencyPanel) {
      emergencyPanel.hidden = false;
      var em = document.getElementById('emergency-email');
      if (em && email) em.value = email;
    }
  }

  function showLoginError(msg) {
    var el = document.getElementById('login-error');
    if (!el) return;
    if (msg) {
      el.textContent = msg;
      el.hidden = false;
    } else {
      el.textContent = '';
      el.hidden = true;
    }
  }

  function handleSessionBlocked(err, email) {
    if (err && err.code === 'SESSION_ALREADY_ACTIVE') {
      showEmergencyLock(email);
      ixToast(err.message, 'warning');
      return true;
    }
    return false;
  }

  if (IfluxAuth.hasActiveSessionElsewhere && IfluxAuth.hasActiveSessionElsewhere()) {
    showLoginError('Có phiên đăng nhập cũ trên thiết bị này. Bạn vẫn có thể đăng nhập lại — phiên cũ sẽ được thay thế.');
  }

  document.getElementById('emergency-lock-form').addEventListener('submit', function (e) {
    e.preventDefault();
    try {
      IfluxAuth.submitEmergencyLockRequest({
        email: document.getElementById('emergency-email').value.trim(),
        reason: document.getElementById('emergency-reason').value.trim()
      });
      ixToast('Đã gửi yêu cầu khóa khẩn cấp. Đội hỗ trợ sẽ liên hệ qua email.', 'success');
      setTimeout(function () {
        if (window.IfluxShellUrlWriter && IfluxShellUrlWriter.navigate) {
          IfluxShellUrlWriter.navigate('/tin-tuc', { replace: true });
        } else {
          location.href = '/tin-tuc';
        }
      }, 800);
    } catch (err) {
      ixToast(err.message, 'danger');
    }
  });

  document.getElementById('btn-emergency-back').addEventListener('click', function () {
    if (window.IfluxShellUrlWriter && IfluxShellUrlWriter.navigate) {
      IfluxShellUrlWriter.navigate('/tin-tuc', { replace: true });
    } else {
      location.href = '/tin-tuc';
    }
  });

  var tabs = document.querySelectorAll('[data-login-tab]');
  var panelPhone = document.getElementById('panel-phone');
  var panelEmail = document.getElementById('panel-email');

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      tabs.forEach(function (t) { t.classList.remove('active'); });
      tab.classList.add('active');
      var mode = tab.getAttribute('data-login-tab');
      panelPhone.style.display = mode === 'phone' ? '' : 'none';
      panelEmail.style.display = mode === 'email' ? '' : 'none';
    });
  });

  if (IfluxAuth.useApi && IfluxAuth.useApi()) {
    var phoneHint = document.getElementById('phone-login-hint');
    if (phoneHint) {
      phoneHint.innerHTML = 'Đăng nhập SĐT chưa hỗ trợ — vui lòng dùng tab <strong>Email</strong>.';
    }
  }

  document.getElementById('panel-phone').addEventListener('submit', function (e) {
    e.preventDefault();
    showLoginError('');
    var phone = document.getElementById('login-phone').value.trim();
    var password = document.getElementById('login-phone-password').value;
    IfluxAuth.loginWithPhone(phone, password).then(function () {
      ixToast('Đăng nhập thành công', 'success');
      setTimeout(function () { IfluxAuth.redirectAfterAuth(); }, 400);
    }).catch(function (err) {
      if (!handleSessionBlocked(err, phone)) {
        showLoginError(err.message || 'Đăng nhập thất bại.');
        ixToast(err.message, 'danger');
      }
    });
  });

  document.getElementById('panel-email').addEventListener('submit', function (e) {
    e.preventDefault();
    showLoginError('');
    var email = document.getElementById('login-email').value.trim();
    if (!email) { showLoginError('Nhập email'); ixToast('Nhập email', 'warning'); return; }
    var remember = document.querySelector('#panel-email .ix-checkbox');
    IfluxAuth.loginWithEmail(email, document.getElementById('login-password').value, {
      remember_me: remember && remember.checked
    }).then(function () {
      ixToast('Đăng nhập thành công', 'success');
      setTimeout(function () { IfluxAuth.redirectAfterAuth(); }, 400);
    }).catch(function (err) {
      if (!handleSessionBlocked(err, email)) {
        showLoginError(err.message || 'Đăng nhập thất bại.');
        ixToast(err.message, 'danger');
      }
    });
  });

  function socialAuthSuccess(provider, user) {
    ixToast('Đăng nhập ' + providerLabel(provider) + ' thành công', 'success');
    setTimeout(function () { IfluxAuth.redirectAfterAuth(); }, 400);
  }

  function socialAuthError(provider, err) {
    if (!handleSessionBlocked(err, '')) {
      showLoginError(err.message || 'Đăng nhập thất bại.');
      ixToast(err.message || 'Đăng nhập thất bại.', 'danger');
    }
  }

  function providerLabel(p) {
    var map = { google: 'Google', apple: 'Apple', facebook: 'Facebook', zalo: 'Zalo' };
    return map[String(p || '').toLowerCase()] || p;
  }

  function affiliateReferralCodeForIdentity() {
    if (window.IfluxIdentityContext && IfluxIdentityContext.getActiveOwner) {
      var code = String(IfluxIdentityContext.getActiveOwner() || '')
        .trim()
        .toUpperCase();
      return code || undefined;
    }
    return undefined;
  }

  function enableAuthSocialButtons() {
    /* Google: nút GIS #ifx-google-signin-btn — không disabled custom */
    ['btn-apple', 'btn-facebook', 'btn-zalo'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.removeAttribute('disabled');
    });
  }

  var socialInit = IfluxAuthSocial.initPage({
    onSuccess: socialAuthSuccess,
    onError: socialAuthError,
    referral_code: affiliateReferralCodeForIdentity()
  });
  if (socialInit && typeof socialInit.then === 'function') {
    socialInit.then(enableAuthSocialButtons, enableAuthSocialButtons);
  } else {
    enableAuthSocialButtons();
  }
})();
