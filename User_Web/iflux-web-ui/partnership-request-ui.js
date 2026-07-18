/* iFlux — Modal "Liên hệ hợp tác" (gửi yêu cầu hợp tác + Cloudflare Turnstile) */
(function (global) {
  'use strict';

  var SITE_KEY = '0x4AAAAAADz4fhsXKizSR6fp';
  var API_URL = '/api/partnership-requests';
  var TURNSTILE_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

  var TYPES = [
    ['', 'Chọn hình thức hợp tác'],
    ['media', 'Hợp tác truyền thông'],
    ['content', 'Hợp tác nội dung'],
    ['business', 'Hợp tác kinh doanh'],
    ['investment', 'Đầu tư'],
    ['other', 'Khác']
  ];

  var overlay = null;
  var widgetId = null;
  var turnstileReady = false;
  var turnstileLoading = false;

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function toast(msg, type) {
    if (typeof global.ixToast === 'function') global.ixToast(msg, type || 'success');
  }

  function prefill() {
    var u = (global.IfluxAuth && IfluxAuth.getUser && IfluxAuth.getUser()) || null;
    if (!u) return { first: '', last: '', email: '', phone: '' };
    var tokens = String(u.display_name || '').trim().split(/\s+/).filter(Boolean);
    var first = tokens.length ? tokens[0] : '';
    var last = tokens.length > 1 ? tokens.slice(1).join(' ') : '';
    return { first: first, last: last, email: u.email || '', phone: u.phone || '' };
  }

  function optionsHtml() {
    return TYPES.map(function (t) {
      return '<option value="' + esc(t[0]) + '"' + (t[0] === '' ? ' selected' : '') + '>' + esc(t[1]) + '</option>';
    }).join('');
  }

  function buildModal() {
    if (overlay) return overlay;
    var pf = prefill();
    overlay = document.createElement('div');
    overlay.className = 'ix-modal-overlay ifx-partner-modal';
    overlay.setAttribute('data-ifx-modal', '');
    overlay.style.display = 'none';
    overlay.innerHTML =
      '<div class="ix-modal-box" style="max-width:560px;width:100%">' +
        '<button type="button" class="ix-modal-close" data-ifx-partner-close aria-label="Đóng"><i class="ti ti-x"></i></button>' +
        '<div class="ix-modal-title">Liên hệ hợp tác</div>' +
        '<div class="ix-modal-sub">Gửi thông tin để đội ngũ iFlux liên hệ về cơ hội hợp tác cùng bạn.</div>' +
        '<form data-ifx-partner-form novalidate style="margin-top:var(--ifx-space-16)">' +
          '<div class="ix-form-row">' +
            '<div class="ix-form-group"><label class="ix-label">Họ <span style="color:var(--ix-danger)">*</span></label>' +
              '<input type="text" class="ix-input" name="first_name" autocomplete="given-name" value="' + esc(pf.first) + '" required /></div>' +
            '<div class="ix-form-group"><label class="ix-label">Tên</label>' +
              '<input type="text" class="ix-input" name="last_name" autocomplete="family-name" value="' + esc(pf.last) + '" /></div>' +
          '</div>' +
          '<div class="ix-form-row">' +
            '<div class="ix-form-group"><label class="ix-label">Email <span style="color:var(--ix-danger)">*</span></label>' +
              '<input type="email" class="ix-input" name="email" autocomplete="email" value="' + esc(pf.email) + '" required /></div>' +
            '<div class="ix-form-group"><label class="ix-label">Số điện thoại <span style="color:var(--ix-danger)">*</span></label>' +
              '<input type="text" class="ix-input" name="phone" autocomplete="tel" value="' + esc(pf.phone) + '" required /></div>' +
          '</div>' +
          '<div class="ix-form-group"><label class="ix-label">Hình thức hợp tác <span style="color:var(--ix-danger)">*</span></label>' +
            '<select class="ix-select" name="partnership_type" required>' + optionsHtml() + '</select></div>' +
          '<div class="ix-form-group"><label class="ix-label">Nội dung hợp tác</label>' +
            '<textarea class="ix-input" name="message" rows="3" placeholder="Mô tả ngắn gọn mong muốn hợp tác…" style="resize:vertical"></textarea></div>' +
          '<div class="ix-form-group"><div data-ifx-turnstile></div></div>' +
          '<div data-ifx-partner-error class="ix-alert ix-alert-danger" style="margin-bottom:var(--ifx-space-12);display:none"></div>' +
          '<div style="display:flex;gap:var(--ifx-space-12);margin-top:var(--ifx-space-8)">' +
            '<button type="button" class="ix-btn ix-btn-ghost" data-ifx-partner-close>Huỷ</button>' +
            '<button type="submit" class="ix-btn ix-btn-primary" style="flex:1" data-ifx-partner-submit><i class="ti ti-send"></i> Gửi yêu cầu</button>' +
          '</div>' +
        '</form>' +
        '<div data-ifx-partner-success hidden style="text-align:center;padding:var(--ifx-space-24) var(--ifx-space-8)">' +
          '<div style="font-size:var(--ifx-font-size-32);color:var(--ix-success)"><i class="ti ti-circle-check"></i></div>' +
          '<div class="ix-modal-title" style="margin-top:var(--ifx-space-8)">Đã gửi yêu cầu!</div>' +
          '<div class="ix-modal-sub">Cảm ơn bạn. Đội ngũ iFlux sẽ liên hệ lại trong thời gian sớm nhất.</div>' +
          '<button type="button" class="ix-btn ix-btn-primary" data-ifx-partner-close style="margin-top:var(--ifx-space-16)">Đóng</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(overlay);

    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) close();
      if (e.target.closest && e.target.closest('[data-ifx-partner-close]')) close();
    });
    var form = overlay.querySelector('[data-ifx-partner-form]');
    form.addEventListener('submit', onSubmit);
    return overlay;
  }

  function loadTurnstile() {
    if (turnstileReady && global.turnstile) return Promise.resolve();
    return new Promise(function (resolve, reject) {
      if (document.querySelector('script[data-ifx-turnstile-src]')) {
        var check = setInterval(function () {
          if (global.turnstile) { clearInterval(check); turnstileReady = true; resolve(); }
        }, 100);
        setTimeout(function () { clearInterval(check); resolve(); }, 8000);
        return;
      }
      var sc = document.createElement('script');
      sc.src = TURNSTILE_SRC;
      sc.async = true;
      sc.defer = true;
      sc.setAttribute('data-ifx-turnstile-src', '');
      sc.onload = function () { turnstileReady = true; resolve(); };
      sc.onerror = function () { reject(new Error('turnstile-load-failed')); };
      document.head.appendChild(sc);
    });
  }

  function renderTurnstile() {
    var box = overlay && overlay.querySelector('[data-ifx-turnstile]');
    if (!box || !global.turnstile) return;
    if (widgetId != null) {
      try { global.turnstile.reset(widgetId); } catch (e) { /* ignore */ }
      return;
    }
    try {
      widgetId = global.turnstile.render(box, {
        sitekey: SITE_KEY,
        theme: 'auto'
      });
    } catch (e) { /* ignore */ }
  }

  function showError(msg) {
    var el = overlay && overlay.querySelector('[data-ifx-partner-error]');
    if (!el) return;
    if (!msg) { el.style.display = 'none'; el.textContent = ''; return; }
    el.style.display = 'flex';
    el.textContent = msg;
  }

  function setBusy(busy) {
    var btn = overlay && overlay.querySelector('[data-ifx-partner-submit]');
    if (!btn) return;
    btn.disabled = busy;
    btn.innerHTML = busy
      ? '<i class="ti ti-loader-2"></i> Đang gửi…'
      : '<i class="ti ti-send"></i> Gửi yêu cầu';
  }

  function onSubmit(e) {
    e.preventDefault();
    showError('');
    var form = overlay.querySelector('[data-ifx-partner-form]');
    var data = {
      first_name: form.first_name.value.trim(),
      last_name: form.last_name.value.trim(),
      email: form.email.value.trim(),
      phone: form.phone.value.trim(),
      partnership_type: form.partnership_type.value,
      message: form.message.value.trim()
    };

    if (!data.first_name) return showError('Vui lòng nhập họ.');
    if (!data.email || data.email.indexOf('@') < 0) return showError('Email không hợp lệ.');
    if (!data.phone || data.phone.length < 6) return showError('Vui lòng nhập số điện thoại.');
    if (!data.partnership_type) return showError('Vui lòng chọn hình thức hợp tác.');

    var token = '';
    if (global.turnstile && widgetId != null) {
      try { token = global.turnstile.getResponse(widgetId) || ''; } catch (err) { token = ''; }
    }
    if (!token) return showError('Vui lòng hoàn tất xác minh chống spam bên dưới.');
    data.turnstile_token = token;

    setBusy(true);
    fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (body) {
        if (!res.ok) throw new Error(body.error || body.message || ('HTTP ' + res.status));
        return body;
      });
    }).then(function () {
      showSuccess();
      toast('Đã gửi yêu cầu hợp tác', 'success');
    }).catch(function (err) {
      setBusy(false);
      if (global.turnstile && widgetId != null) { try { global.turnstile.reset(widgetId); } catch (e2) {} }
      showError((err && err.message) || 'Gửi yêu cầu thất bại. Vui lòng thử lại.');
    });
  }

  function showSuccess() {
    var form = overlay.querySelector('[data-ifx-partner-form]');
    var ok = overlay.querySelector('[data-ifx-partner-success]');
    if (form) form.hidden = true;
    if (ok) ok.hidden = false;
  }

  function open() {
    buildModal();
    var form = overlay.querySelector('[data-ifx-partner-form]');
    var ok = overlay.querySelector('[data-ifx-partner-success]');
    if (form) form.hidden = false;
    if (ok) ok.hidden = true;
    showError('');
    setBusy(false);
    overlay.style.display = 'flex';
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';

    if (turnstileLoading) return;
    turnstileLoading = true;
    loadTurnstile().then(function () {
      renderTurnstile();
    }).catch(function () {
      showError('Không tải được công cụ xác minh. Kiểm tra kết nối rồi thử lại.');
    }).finally(function () {
      turnstileLoading = false;
    });
  }

  function close() {
    if (!overlay) return;
    overlay.style.display = 'none';
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  global.IfluxPartnershipRequest = { open: open, close: close };
})(window);
