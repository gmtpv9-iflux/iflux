/* Owner: tab-privacy (#tab-privacy) — một entry bind DOM · privacy store · notification prefs API */
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

  function notifTypeRowHtml(t) {
    var on = t.enabled !== false;
    return '<div class="ifx-privacy-row ifx-notif-pref-row">' +
      '<div class="ifx-privacy-row__main">' +
        '<div class="ifx-privacy-row__label">' + esc(t.name) + '</div>' +
      '</div>' +
      '<label class="ix-switch ifx-privacy-switch">' +
        '<input type="checkbox" data-ifx-notif-type="' + esc(t.type_code) + '"' + (on ? ' checked' : '') + ' />' +
        '<span class="ix-switch-slider"></span>' +
      '</label>' +
    '</div>';
  }

  function renderNotificationToggles() {
    var wrap = document.getElementById('ifx-notification-settings');
    if (!wrap) return;
    if (!global.IfluxNotificationPreferenceStore) {
      wrap.innerHTML = '<p class="ifx-notif-pref-intro">Đang tải danh sách thông báo…</p>';
      return;
    }
    var groups = IfluxNotificationPreferenceStore.getGroups();
    if (!groups.length) {
      wrap.innerHTML = '<p class="ifx-notif-pref-intro">Đang tải danh sách thông báo…</p>';
      return;
    }
    var body = groups.map(function (g) {
      var typesHtml = (g.types || []).map(notifTypeRowHtml).join('');
      return '<div class="ix-menu-header">' + esc(g.label) + '</div>' + typesHtml;
    }).join('');
    wrap.innerHTML = '<div class="ix-menu ifx-notif-pref-menu">' + body + '</div>';
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
      '<div class="ifx-privacy-section ifx-privacy-section--divider">' +
        '<div class="ifx-privacy-section__title">Tin nhắn</div>' +
        '<p class="ifx-privacy-section__hint">' +
          'Tin nhắn vẫn mở nếu đã kết bạn, theo dõi lẫn nhau, hoặc có liên hệ affiliate (3 cấp).' +
        '</p>' +
        msgFields.map(rowHtml).join('') +
      '</div>';
  }

  function collectNotifSettings() {
    var out = {};
    document.querySelectorAll('[data-ifx-notif-type]').forEach(function (input) {
      out[input.getAttribute('data-ifx-notif-type')] = input.checked;
    });
    return out;
  }

  function loadNotificationPreferences() {
    if (!global.IfluxNotificationPreferenceStore || !global.IfluxApiClient || !IfluxApiClient.getNotificationPreferences) {
      return Promise.resolve();
    }
    var token = global.IfluxAuth && IfluxAuth.getToken ? IfluxAuth.getToken() : null;
    if (!token || token.indexOf('mock_jwt_') === 0) return Promise.resolve();
    return IfluxApiClient.getNotificationPreferences(token).then(function (res) {
      var body = (res && res.data) || res || {};
      IfluxNotificationPreferenceStore.setCache(body);
    }).catch(function () { /* offline */ });
  }

  function collectSettings() {
    var out = {};
    document.querySelectorAll('[data-ifx-privacy-key]').forEach(function (input) {
      out[input.getAttribute('data-ifx-privacy-key')] = input.checked;
    });
    return out;
  }

  function savePrivacySettings() {
    var uid = userId();
    if (!uid || !global.IfluxProfilePrivacyStore) return;
    var token = global.IfluxAuth && IfluxAuth.getToken ? IfluxAuth.getToken() : null;
    var notifMap = collectNotifSettings();
    var saveNotif = Promise.resolve();
    if (token && token.indexOf('mock_jwt_') !== 0 && global.IfluxApiClient && IfluxApiClient.patchNotificationPreferences) {
      var items = global.IfluxNotificationPreferenceStore.itemsForPatch(notifMap);
      if (items.length) {
        saveNotif = IfluxApiClient.patchNotificationPreferences(token, { items: items }).then(function (res) {
          var body = (res && res.data) || res || {};
          IfluxNotificationPreferenceStore.setCache(body);
        }).catch(function () { /* offline */ });
      }
    }
    IfluxProfilePrivacyStore.save(uid, collectSettings());
    saveNotif.finally(function () {
      if (global.ixToast) ixToast('Đã lưu quyền riêng tư', 'success');
    });
  }

  function bindSave() {
    document.querySelectorAll('[data-ifx-save-privacy]').forEach(function (btn) {
      btn.addEventListener('click', savePrivacySettings);
    });
  }

  function init() {
    renderAlwaysLists();
    loadNotificationPreferences().finally(function () {
      renderToggles();
      renderNotificationToggles();
      bindSave();
    });
  }

  global.IfluxProfilePrivacyPage = {
    init: init,
    renderToggles: renderToggles,
    renderNotificationToggles: renderNotificationToggles
  };
})(window);
