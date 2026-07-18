/* Avatar hồ sơ — upload & hiển thị */
(function (global) {
  'use strict';

  function initials(name) {
    var parts = String(name || '').trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    return String(name || 'U').trim().slice(0, 2).toUpperCase();
  }

  function renderInto(el, profile) {
    if (!el || !profile) return;
    var url = profile.avatar_url;
    el.classList.remove('ifx-has-avatar-img');
    el.innerHTML = '';
    if (url) {
      el.classList.add('ifx-has-avatar-img');
      var img = document.createElement('img');
      img.src = url;
      img.alt = profile.display_name || 'Avatar';
      img.className = 'ifx-profile-avatar-img';
      el.appendChild(img);
    } else {
      el.textContent = profile.initials || initials(profile.display_name);
    }
  }

  function profileData(user) {
    return Object.assign({}, user, { initials: initials(user.display_name) });
  }

  function applyAll(user) {
    if (!user) return;
    var p = profileData(user);
    var hero = document.getElementById('ifx-profile-avatar');
    var account = document.getElementById('ifx-account-avatar-preview');
    if (hero) renderInto(hero, p);
    if (account) renderInto(account, p);

    var topIni = document.querySelector('[data-ifx-user-initials]');
    if (topIni) {
      if (p.avatar_url) {
        topIni.innerHTML = '';
        var img = document.createElement('img');
        img.src = p.avatar_url;
        img.alt = '';
        img.className = 'ifx-topnav-avatar-img';
        topIni.appendChild(img);
      } else {
        topIni.textContent = p.initials;
      }
    }
  }

  function syncPublic(user) {
    if (!user || !global.IfluxProfileUsersStore) return;
    IfluxProfileUsersStore.savePublic({
      id: user.id,
      display_name: user.display_name,
      username: user.username,
      role: user.role,
      tier_label: user.tier_label,
      bio: user.bio,
      joined_at: user.joined_at,
      country: user.country,
      avatar_url: user.avatar_url || '',
      stats: user.stats
    });
  }

  function saveAvatarDataUrl(dataUrl) {
    var user = global.IfluxAuth && IfluxAuth.getUser();
    if (!user) return null;
    var updated = IfluxAuth.updateUser({ avatar_url: dataUrl });
    syncPublic(updated);
    applyAll(updated);
    return updated;
  }

  function bindUpload() {
    var input = document.getElementById('ifx-avatar-input');
    var btn = document.getElementById('btn-change-avatar');
    if (!input || !btn) return;
    if (btn.dataset.ifxAvatarBound === '1') return;
    btn.dataset.ifxAvatarBound = '1';

    btn.addEventListener('click', function () {
      input.click();
    });

    input.addEventListener('change', function () {
      var file = input.files && input.files[0];
      if (!file) return;
      if (!file.type || file.type.indexOf('image/') !== 0) {
        if (global.ixToast) ixToast('Vui lòng chọn file ảnh', 'warning');
        input.value = '';
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        if (global.ixToast) ixToast('Ảnh tối đa 2MB', 'warning');
        input.value = '';
        return;
      }
      var reader = new FileReader();
      reader.onload = function () {
        saveAvatarDataUrl(reader.result);
        if (global.ixToast) ixToast('Đã cập nhật ảnh đại diện', 'success');
        input.value = '';
      };
      reader.readAsDataURL(file);
    });
  }

  function initOwn() {
    var user = global.IfluxAuth && IfluxAuth.getUser();
    if (!user) return;
    applyAll(user);
    bindUpload();
  }

  function initPublic(profile) {
    if (!profile) return;
    var p = Object.assign({}, profile, {
      initials: global.IfluxProfileUsersStore
        ? IfluxProfileUsersStore.initials(profile.display_name)
        : initials(profile.display_name)
    });
    var hero = document.getElementById('ifx-profile-avatar');
    if (hero) renderInto(hero, p);
  }

  global.IfluxProfileAvatar = {
    initOwn: initOwn,
    initPublic: initPublic,
    applyAll: applyAll,
    renderInto: renderInto,
    initials: initials
  };
})(window);
