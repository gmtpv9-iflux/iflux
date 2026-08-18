/* Link tới hồ sơ user — avatar / tên */
(function (global) {
  'use strict';

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function isLinkableUserId(userId) {
    if (!userId) return false;
    var id = String(userId).trim();
    if (!id || id === 'usr' || id === 'usr_local' || id === 'anon' || id === 'anonymous') return false;
    return true;
  }

  function profileHref(userId, opts) {
    opts = opts || {};
    if (!isLinkableUserId(userId)) return '#';
    var base = opts.base != null ? opts.base : '../account/';
    return base + 'profile.html?user=' + encodeURIComponent(userId);
  }

  function touchUser(userId, userName) {
    if (global.IfluxProfileUsersStore && userId) {
      IfluxProfileUsersStore.ensureMinimal(userId, userName);
    }
  }

  function nameLink(userId, name, className, opts) {
    className = className || 'ifx-profile-link';
    name = name || 'Thành viên';
    if (!isLinkableUserId(userId)) return '<span class="' + esc(className) + '">' + esc(name) + '</span>';
    touchUser(userId, name);
    return '<a href="' + esc(profileHref(userId, opts)) + '" class="' + esc(className) + ' ifx-profile-link"' +
      (opts.itemprop ? ' itemprop="' + esc(opts.itemprop) + '"' : '') +
      '>' + esc(name) + '</a>';
  }

  function avatarLink(userId, label, className, opts) {
    className = className || 'ifx-profile-link-avatar';
    label = label || 'U';
    if (!isLinkableUserId(userId)) return '<span class="' + esc(className) + '">' + esc(label) + '</span>';
    touchUser(userId, label);
    return '<a href="' + esc(profileHref(userId, opts)) + '" class="' + esc(className) + ' ifx-profile-link-avatar" title="Xem hồ sơ">' + esc(label) + '</a>';
  }

  global.IfluxProfileLinks = {
    href: profileHref,
    profileHref: profileHref,
    nameLink: nameLink,
    avatarLink: avatarLink,
    touchUser: touchUser,
    isLinkableUserId: isLinkableUserId
  };
})(window);
