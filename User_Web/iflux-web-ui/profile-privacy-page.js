/* Tab Quyền riêng tư — cài đặt hiển thị hồ sơ công khai */
(function (global) {
  'use strict';

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function userId() {
    var u = global.IfluxAuth && IfluxAuth.getUser();
    return u && u.id ? u.id : null;
  }

  function renderAlwaysLists() {
    var priv = document.getElementById('ifx-privacy-always-private');
    var pub = document.getElementById('ifx-privacy-always-public');
    if (!global.IfluxProfilePrivacyStore) return;
    var S = IfluxProfilePrivacyStore;
    if (priv) {
      priv.innerHTML = S.ALWAYS_PRIVATE.map(function (t) {
        return '<li><i class="ti ti-lock" style="color:var(--ix-text-muted);font-size:14px"></i> ' + esc(t) + '</li>';
      }).join('');
    }
    if (pub) {
      pub.innerHTML = S.ALWAYS_PUBLIC.map(function (t) {
        return '<li><i class="ti ti-eye" style="color:var(--ix-accent);font-size:14px"></i> ' + esc(t) + '</li>';
      }).join('');
    }
  }

  function renderToggles() {
    var wrap = document.getElementById('ifx-privacy-settings');
    if (!wrap || !global.IfluxProfilePrivacyStore) return;
    var uid = userId();
    if (!uid) return;

    var settings = IfluxProfilePrivacyStore.get(uid);
    var fields = IfluxProfilePrivacyStore.TOGGLE_FIELDS;
    var profileFields = fields.filter(function (f) { return f.group !== 'messaging'; });
    var msgFields = fields.filter(function (f) { return f.group === 'messaging'; });

    function rowHtml(f) {
      var on = !!settings[f.key];
      return '<div class="ifx-privacy-row">' +
        '<div class="ifx-privacy-row__main">' +
          '<div class="ifx-privacy-row__label">' + esc(f.label) + '</div>' +
          '<div class="ifx-privacy-row__hint">' + esc(f.hint) + '</div>' +
        '</div>' +
        '<label class="ix-switch ifx-privacy-switch">' +
          '<input type="checkbox" data-ifx-privacy-key="' + esc(f.key) + '"' + (on ? ' checked' : '') + ' />' +
          '<span class="ix-switch-slider"></span>' +
        '</label>' +
      '</div>';
    }

    wrap.innerHTML =
      '<div class="ifx-privacy-section">' +
        '<div class="ifx-privacy-section__title">Hiển thị hồ sơ</div>' +
        profileFields.map(rowHtml).join('') +
      '</div>' +
      '<div class="ifx-privacy-section" style="margin-top:20px;padding-top:16px;border-top:1px solid var(--ix-border)">' +
        '<div class="ifx-privacy-section__title">Tin nhắn</div>' +
        '<p style="font-size:12px;color:var(--ix-text-muted);margin:0 0 12px;line-height:1.5">' +
          'Tin nhắn vẫn mở nếu đã kết bạn, theo dõi lẫn nhau, hoặc có liên hệ affiliate (3 cấp).' +
        '</p>' +
        msgFields.map(rowHtml).join('') +
      '</div>';
  }

  function collectSettings() {
    var out = {};
    document.querySelectorAll('[data-ifx-privacy-key]').forEach(function (input) {
      out[input.getAttribute('data-ifx-privacy-key')] = input.checked;
    });
    return out;
  }

  function bindSave() {
    var btn = document.getElementById('btn-save-privacy');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var uid = userId();
      if (!uid || !global.IfluxProfilePrivacyStore) return;
      IfluxProfilePrivacyStore.save(uid, collectSettings());
      if (global.ixToast) ixToast('Đã lưu quyền riêng tư hồ sơ', 'success');
    });
  }

  function init() {
    renderAlwaysLists();
    renderToggles();
    bindSave();
  }

  global.IfluxProfilePrivacyPage = { init: init, renderToggles: renderToggles };
})(window);
