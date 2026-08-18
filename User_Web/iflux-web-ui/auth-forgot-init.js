/* Phase A extracted from auth/forgot.html */
document.querySelectorAll('[data-forgot-tab]').forEach(function (tab) {
  tab.addEventListener('click', function () {
    document.querySelectorAll('#forgot-tabs .ix-tab').forEach(function (t) { t.classList.remove('active'); });
    tab.classList.add('active');
    var mode = tab.getAttribute('data-forgot-tab');
    document.getElementById('forgot-email').style.display = mode === 'email' ? '' : 'none';
    document.getElementById('forgot-phone').style.display = mode === 'phone' ? '' : 'none';
  });
});

document.getElementById('btn-forgot-email').addEventListener('click', function () {
  ixToast('Đã gửi link đặt lại mật khẩu (demo)', 'success');
});

document.getElementById('forgot-phone-step1').addEventListener('submit', function (e) {
  e.preventDefault();
  var phone = document.getElementById('forgot-phone-input').value.trim();
  if (!phone) { ixToast('Nhập số điện thoại', 'warning'); return; }
  document.getElementById('forgot-phone-step1').classList.remove('active');
  document.getElementById('forgot-phone-step2').classList.add('active');
  document.getElementById('forgot-otp').focus();
  ixToast('Đã gửi OTP (demo: 123456)', 'success');
});

document.getElementById('btn-forgot-back').addEventListener('click', function () {
  document.getElementById('forgot-phone-step2').classList.remove('active');
  document.getElementById('forgot-phone-step1').classList.add('active');
});

document.getElementById('forgot-phone-step2').addEventListener('submit', function (e) {
  e.preventDefault();
  var phone = document.getElementById('forgot-phone-input').value.trim();
  var otp = document.getElementById('forgot-otp').value.trim();
  var newPassword = document.getElementById('forgot-new-password').value;
  IfluxAuth.resetPasswordWithOtp(phone, otp, newPassword).then(function () {
    ixToast('Đã đặt lại mật khẩu — hãy đăng nhập bằng SĐT + mật khẩu mới', 'success');
    setTimeout(function () { location.href = 'login.html'; }, 600);
  }).catch(function (err) {
    ixToast(err.message, 'danger');
  });
});
