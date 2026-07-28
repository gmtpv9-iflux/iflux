/* Phase A extracted from auth/register.html */
function affiliateContextCode() {
  if (window.IfluxAffiliateResolver && IfluxAffiliateResolver.getCodeForIdentityCreation) {
    return IfluxAffiliateResolver.getCodeForIdentityCreation() || '';
  }
  return '';
}

function isRefFromAffiliateLink() {
  if (window.IfluxAffiliateResolver && IfluxAffiliateResolver.readActive) {
    return !!IfluxAffiliateResolver.readActive();
  }
  return false;
}

function resolveRefCode() {
  return affiliateContextCode();
}

/** Mã gửi đi khi đăng ký: ô nhập là nguồn chính; chỉ dùng Affiliate Context khi khóa từ link */
function getEffectiveRefCode() {
  var input = document.getElementById('reg-referral');
  var locked = isRefFromAffiliateLink();
  if (locked) return resolveRefCode();
  return input ? input.value.trim().toUpperCase() : '';
}

(function initReferralField() {
  var input = document.getElementById('reg-referral');
  var hint = document.getElementById('reg-ref-hint');
  var label = document.getElementById('reg-ref-label');
  if (!input) return;

  var refCode = affiliateContextCode();
  var fromAffiliateLink = isRefFromAffiliateLink() && !!refCode;

  if (!refCode) return;

  function applyRefToField(code) {
    input.defaultValue = code;
    input.value = code;
    input.placeholder = '';
  }

  if (fromAffiliateLink) {
    var validateLocked = window.IfluxLoyaltyAffiliateStore && (
      IfluxLoyaltyAffiliateStore.validateReferralCodeAsync
        ? IfluxLoyaltyAffiliateStore.validateReferralCodeAsync(refCode)
        : Promise.resolve(IfluxLoyaltyAffiliateStore.validateReferralCode(refCode))
    );
    if (validateLocked) {
      validateLocked.then(function (check) {
        if (!check.valid) {
          if (window.IfluxLoyaltyAffiliateStore.clearStoredRefCode) {
            IfluxLoyaltyAffiliateStore.clearStoredRefCode();
          }
          input.readOnly = false;
          input.classList.remove('is-ref-locked');
          input.removeAttribute('aria-readonly');
          input.value = '';
          if (label) {
            label.innerHTML = 'Mã giới thiệu <span style="font-weight:400;color:var(--ix-text-muted)">(tuỳ chọn)</span>';
          }
          if (hint) {
            hint.hidden = false;
            hint.textContent = 'Mã từ link trước đó không còn hợp lệ — bạn có thể đăng ký không cần mã hoặc nhập mã khác.';
          }
          return;
        }
        applyRefToField(refCode);
        input.readOnly = true;
        input.classList.add('is-ref-locked');
        input.setAttribute('aria-readonly', 'true');
        if (label) {
          label.innerHTML = 'Mã giới thiệu <span style="font-weight:400;color:var(--ix-accent)">(từ link Affiliate)</span>';
        }
        if (hint) {
          hint.hidden = false;
          hint.innerHTML = 'Giới thiệu bởi <strong>' + (check.referrer.display_name || 'đối tác') + '</strong> — giữ tới khi đăng ký, không thể sửa';
        }
      });
      return;
    }
    applyRefToField(refCode);
    return;
  }

  /* Mã lưu cũ (cookie/localStorage) — chỉ gợi ý nếu còn hợp lệ; không hợp lệ thì xóa cache */
  if (window.IfluxLoyaltyAffiliateStore) {
    var validateFn = IfluxLoyaltyAffiliateStore.validateReferralCodeAsync || function (code) {
      return Promise.resolve(IfluxLoyaltyAffiliateStore.validateReferralCode(code));
    };
    validateFn(refCode).then(function (check) {
      if (!check.valid) {
        if (window.IfluxLoyaltyAffiliateStore.clearStoredRefCode) {
          IfluxLoyaltyAffiliateStore.clearStoredRefCode();
        }
        return;
      }
      applyRefToField(refCode);
      if (hint) {
        hint.hidden = false;
        hint.innerHTML = 'Giới thiệu bởi <strong>' + (check.referrer.display_name || 'đối tác') + '</strong> — có thể xóa nếu không dùng';
      }
    });
    return;
  }

  applyRefToField(refCode);
})();

(function bindReferralInputClear() {
  var input = document.getElementById('reg-referral');
  if (!input) return;
  input.addEventListener('input', function () {
    if (isRefFromAffiliateLink()) return;
    var val = input.value.trim();
    if (!val && window.IfluxLoyaltyAffiliateStore && IfluxLoyaltyAffiliateStore.clearStoredRefCode) {
      IfluxLoyaltyAffiliateStore.clearStoredRefCode();
    }
    var hint = document.getElementById('reg-ref-hint');
    if (hint && !val) hint.hidden = true;
  });
})();

function getRegMode() {
  var active = document.querySelector('[data-reg-tab].active');
  return (active && active.getAttribute('data-reg-tab')) || 'email';
}

function collectRegistrationDraft() {
  var refInput = document.getElementById('reg-referral');
  var fromLink = isRefFromAffiliateLink();
  var refCode = getEffectiveRefCode();
  var mode = getRegMode();
  var email = mode === 'phone'
    ? document.getElementById('reg-email-optional').value.trim()
    : document.getElementById('reg-email').value.trim();
  var phone = mode === 'phone'
    ? document.getElementById('reg-phone-primary').value.trim()
    : document.getElementById('reg-phone').value.trim();
  return {
    display_name: document.getElementById('reg-name').value.trim(),
    phone: phone,
    email: email,
    password: document.getElementById('reg-password').value,
    referral_code: refCode,
    referral_locked: fromLink && !!refCode,
    terms_accepted: !!document.getElementById('reg-terms').checked,
    registration_mode: mode
  };
}

function restoreRegistrationDraft() {
  if (!window.IfluxAuth || !IfluxAuth.loadRegistrationDraft) return;
  var draft = IfluxAuth.loadRegistrationDraft();
  if (!draft) return;

  if (draft.display_name) document.getElementById('reg-name').value = draft.display_name;
  if (draft.phone) {
    document.getElementById('reg-phone').value = draft.phone;
    document.getElementById('reg-phone-primary').value = draft.phone;
  }
  if (draft.email) {
    document.getElementById('reg-email').value = draft.email;
    document.getElementById('reg-email-optional').value = draft.email;
  }
  if (draft.password) document.getElementById('reg-password').value = draft.password;
  if (draft.terms_accepted) document.getElementById('reg-terms').checked = true;
  if (draft.registration_mode === 'phone') {
    document.querySelectorAll('[data-reg-tab]').forEach(function (t) {
      t.classList.toggle('active', t.getAttribute('data-reg-tab') === 'phone');
    });
    document.getElementById('reg-panel-email').style.display = 'none';
    document.getElementById('reg-panel-phone').style.display = '';
  }

  var refInput = document.getElementById('reg-referral');
  if (refInput && draft.referral_code && !isRefFromAffiliateLink()) {
    refInput.value = draft.referral_code;
  }
}

restoreRegistrationDraft();

document.querySelectorAll('[data-reg-tab]').forEach(function (tab) {
  tab.addEventListener('click', function () {
    document.querySelectorAll('[data-reg-tab]').forEach(function (t) { t.classList.remove('active'); });
    tab.classList.add('active');
    var mode = tab.getAttribute('data-reg-tab');
    document.getElementById('reg-panel-email').style.display = mode === 'email' ? '' : 'none';
    document.getElementById('reg-panel-phone').style.display = mode === 'phone' ? '' : 'none';
  });
});

function clearRegFieldErrors() {
  ['reg-email', 'reg-email-optional', 'reg-phone', 'reg-phone-primary'].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.classList.remove('is-invalid');
  });
  document.querySelectorAll('.ifx-field-error').forEach(function (el) {
    el.parentNode.removeChild(el);
  });
}

function showRegFieldError(fieldId, message) {
  var el = document.getElementById(fieldId);
  if (!el) return;
  el.classList.add('is-invalid');
  var hint = document.createElement('p');
  hint.className = 'ifx-field-error';
  hint.textContent = message;
  var group = el.closest('.ix-form-group');
  if (group) group.appendChild(hint);
  el.focus();
}

document.getElementById('btn-register').addEventListener('click', function () {
  clearRegFieldErrors();
  if (!document.getElementById('reg-terms').checked) {
    ixToast('Vui lòng đồng ý điều khoản', 'warning');
    return;
  }
  var name = document.getElementById('reg-name').value.trim();
  if (!name) { ixToast('Nhập họ tên', 'warning'); return; }

  var draftPreview = collectRegistrationDraft();
  if (draftPreview.registration_mode === 'phone' && !draftPreview.phone) {
    ixToast('Nhập số điện thoại', 'warning');
    return;
  }
  if (draftPreview.registration_mode === 'email' && !draftPreview.email) {
    ixToast('Nhập email', 'warning');
    return;
  }
  if (!draftPreview.password) {
    ixToast('Nhập mật khẩu', 'warning');
    return;
  }

  var refInput = document.getElementById('reg-referral');
  var refCode = getEffectiveRefCode();
  var refLocked = isRefFromAffiliateLink() && !!refCode;

  if (refCode && window.IfluxLoyaltyAffiliateStore) {
    var validateFn = IfluxLoyaltyAffiliateStore.validateReferralCodeAsync || function (code) {
      return Promise.resolve(IfluxLoyaltyAffiliateStore.validateReferralCode(code));
    };
    validateFn(refCode).then(function (check) {
      if (!check.valid) {
        ixToast('Mã giới thiệu không hợp lệ', 'warning');
        return;
      }
      submitRegistration(refCode, refLocked);
    });
    return;
  }

  submitRegistration(refCode, refLocked);
});

function submitRegistration(refCode, refLocked) {
  try {
    var draft = collectRegistrationDraft();
    IfluxAuth.register({
      display_name: draft.display_name,
      phone: draft.phone,
      email: draft.email,
      password: draft.password,
      referral_code: draft.referral_code,
      referral_locked: draft.referral_locked,
      registration_mode: draft.registration_mode
    }).then(function () {
      IfluxAuth.clearPendingVerification();
      ixToast('Đăng ký thành công!', 'success');
      setTimeout(function () { IfluxAuth.redirectAfterAuth(); }, 400);
    }).catch(function (e) {
      if (e.code === 'VERIFY_EMAIL') {
        IfluxAuth.goToVerifyOtpPage({
          email: e.email,
          message: e.message,
          verificationMode: e.verificationMode,
          demoCode: e.demoCode,
          pendingProfile: e.pendingProfile,
          registrationDraft: draft
        });
        return;
      }
      if (e.field) {
        var fieldMap = {
          email: draft.registration_mode === 'phone' ? 'reg-email-optional' : 'reg-email',
          phone: draft.registration_mode === 'phone' ? 'reg-phone-primary' : 'reg-phone'
        };
        showRegFieldError(fieldMap[e.field] || 'reg-email', e.message);
      } else if (e.message) {
        if (/email/i.test(e.message)) showRegFieldError(draft.registration_mode === 'phone' ? 'reg-email-optional' : 'reg-email', e.message);
        else if (/điện thoại|phone/i.test(e.message)) showRegFieldError(draft.registration_mode === 'phone' ? 'reg-phone-primary' : 'reg-phone', e.message);
      }
      ixToast(e.message, 'danger');
    });
  } catch (e) {
    if (e.code === 'VERIFY_EMAIL') {
      var draftErr = collectRegistrationDraft();
      IfluxAuth.goToVerifyOtpPage({
        email: e.email,
        message: e.message,
        verificationMode: e.verificationMode,
        demoCode: e.demoCode,
        pendingProfile: e.pendingProfile,
        registrationDraft: draftErr
      });
      return;
    }
    if (e.field) {
      var fieldMap2 = {
        email: getRegMode() === 'phone' ? 'reg-email-optional' : 'reg-email',
        phone: getRegMode() === 'phone' ? 'reg-phone-primary' : 'reg-phone'
      };
      showRegFieldError(fieldMap2[e.field] || 'reg-email', e.message);
    } else {
      ixToast(e.message, 'danger');
    }
  }
}

function providerLabel(p) {
  var map = { google: 'Google', apple: 'Apple', facebook: 'Facebook', zalo: 'Zalo' };
  return map[String(p || '').toLowerCase()] || p;
}

IfluxAuthSocial.initPage({
  onSuccess: function (provider) {
    ixToast('Đăng ký ' + providerLabel(provider) + ' thành công!', 'success');
    /* Redirect: IfluxAuthRedirectPolicy via SocialLoginUseCase (WP4) */
  },
  onError: function (provider, err) {
    ixToast(err.message || 'Đăng nhập thất bại.', 'danger');
  }
});
