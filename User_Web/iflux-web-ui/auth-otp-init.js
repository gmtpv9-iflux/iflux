/* Phase A extracted from auth/verify-otp.html */
if (window.IfluxAuth && IfluxAuth.isLoggedIn && IfluxAuth.isLoggedIn()) {
  location.replace(
    (window.IfluxAuth.appHomePath && IfluxAuth.appHomePath()) ||
    (window.IfluxRoutes ? IfluxRoutes.to('news', { canonical: true }) : '/tin-tuc')
  );
}

var pending = IfluxAuth.loadPendingVerification();
var resendCooldownTimer = null;

if (!pending || !pending.email) {
  var draft = IfluxAuth.loadRegistrationDraft();
  if (draft && (draft.email || draft.phone)) {
    pending = {
      email: draft.email || draft.phone,
      message: 'Nhập mã OTP 6 số để hoàn tất đăng ký',
      verificationMode: 'demo',
      demoCode: '123456',
      pendingProfile: {
        display_name: draft.display_name || '',
        phone: draft.phone || ''
      },
      registrationDraft: draft
    };
  } else {
    location.replace('register.html');
  }
}

var pendingEmail = pending.email;
var pendingProfile = pending.pendingProfile || {};
var verificationMode = pending.verificationMode || 'email';
var demoCode = pending.demoCode || '123456';

document.getElementById('verify-msg').textContent = pending.message || ('Nhập mã OTP 6 số để hoàn tất đăng ký');
var targetLabel = /@/.test(String(pendingEmail)) ? 'Email' : 'Số điện thoại';
document.getElementById('verify-email-display').innerHTML = targetLabel + ': <strong>' + pendingEmail + '</strong>';

var demoHint = document.getElementById('verify-demo-hint');
var resendBtn = document.getElementById('btn-resend');
var otpWidget = IfluxOtpInput.create(document.getElementById('otp-input-row'), {
  hiddenId: 'verify-code',
  onEnter: function () { submitVerify(); },
  onComplete: function (code) {
    if (verificationMode === 'demo' && code === demoCode) {
      submitVerify();
    }
  }
});

if (verificationMode === 'demo') {
  demoHint.hidden = false;
  demoHint.innerHTML = 'Môi trường local (chưa có email provider): mã OTP demo là <strong>' + demoCode + '</strong>';
  otpWidget.setCode('');
  resendBtn.style.display = 'none';
  document.getElementById('btn-open-mail').hidden = true;
} else if (IfluxMailDeepLink) {
  IfluxMailDeepLink.bindButton(document.getElementById('btn-open-mail'), pendingEmail);
}

function startResendCooldown(seconds) {
  if (!resendBtn || resendBtn.style.display === 'none') return;
  var left = seconds || 60;
  resendBtn.disabled = true;
  resendBtn.textContent = 'Gửi lại mã (' + left + 's)';
  if (resendCooldownTimer) clearInterval(resendCooldownTimer);
  resendCooldownTimer = setInterval(function () {
    left -= 1;
    if (left <= 0) {
      clearInterval(resendCooldownTimer);
      resendBtn.disabled = false;
      resendBtn.textContent = 'Gửi lại mã xác thực';
      return;
    }
    resendBtn.textContent = 'Gửi lại mã (' + left + 's)';
  }, 1000);
}

startResendCooldown(60);

document.getElementById('btn-resend').addEventListener('click', function () {
  IfluxAuth.resendVerificationEmail(pendingEmail)
    .then(function (res) {
      ixToast(res.message || 'Đã gửi lại mã xác thực', 'success');
      startResendCooldown(60);
      otpWidget.focus();
    })
    .catch(function (e) {
      ixToast(e.message, 'danger');
    });
});

function submitVerify() {
  var code = otpWidget.getCode().trim();
  if (code.length !== 6) {
    ixToast('Nhập mã OTP 6 số.', 'warning');
    otpWidget.focus();
    return;
  }
  var profileSource = pending.registrationDraft || pending.pendingProfile || {};
  var btn = document.getElementById('btn-verify');
  if (btn) btn.disabled = true;
  IfluxAuth.verifyEmailAndRegister(pendingEmail, code, {
    display_name: profileSource.display_name || '',
    phone: profileSource.phone || ''
  })
    .then(function () {
      ixToast('Xác thực thành công!', 'success');
      location.replace(
        (IfluxAuth.appHomePath && IfluxAuth.appHomePath()) ||
        (window.IfluxRoutes ? IfluxRoutes.to('news', { canonical: true }) : '/tin-tuc')
      );
    })
    .catch(function (e) {
      if (btn) btn.disabled = false;
      ixToast((e && e.message) || 'Không xác thực được. Thử lại.', 'danger');
      otpWidget.focus();
    });
}

document.getElementById('btn-verify').addEventListener('click', submitVerify);
