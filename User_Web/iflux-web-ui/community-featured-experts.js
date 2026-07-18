/* Cộng đồng — Chuyên gia nổi bật (tổng like bài viết) */
(function (global) {
  'use strict';

  function store() { return global.IfluxCommunityStore; }
  function profiles() { return global.IfluxProfileUsersStore; }

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function initials(name) {
    var parts = String(name || '').trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    return String(name || 'E').trim().slice(0, 2).toUpperCase();
  }

  function profileHref(userId) {
    if (global.IfluxProfileLinks && IfluxProfileLinks.profileHref) {
      return IfluxProfileLinks.profileHref(userId, { base: '../account/' });
    }
    return '../account/profile.html?user=' + encodeURIComponent(userId);
  }

  function resolveUser(row) {
    if (profiles() && profiles().getPublic) {
      var u = profiles().getPublic(row.userId);
      if (u) {
        return {
          displayName: u.display_name || row.displayName,
          tierLabel: u.tier_label || row.tierLabel || 'Elite'
        };
      }
    }
    return { displayName: row.displayName, tierLabel: row.tierLabel || 'Elite' };
  }

  function rowsHtml(rows) {
    if (!rows.length) {
      return '<div class="ifx-com-side-empty">Chưa có dữ liệu chuyên gia.</div>';
    }
    return rows.map(function (row, idx) {
      var u = resolveUser(row);
      return (
        '<div class="ifx-com-expert-row">' +
          '<span class="ifx-com-expert-row__rank">#' + (idx + 1) + '</span>' +
          '<a class="ifx-com-expert-row__user" href="' + esc(profileHref(row.userId)) + '">' +
            '<span class="ix-avatar-sm ifx-com-expert-row__avatar">' + esc(initials(u.displayName)) + '</span>' +
            '<span class="ifx-com-expert-row__meta">' +
              '<strong>' + esc(u.displayName) + '</strong>' +
              '<small>' + row.postCount + ' bài · ' + esc(u.tierLabel) + '</small>' +
            '</span>' +
          '</a>' +
          '<span class="ifx-com-expert-row__likes"><i class="ti ti-heart"></i> ' + row.totalLikes + '</span>' +
        '</div>'
      );
    }).join('');
  }

  function render(container) {
    if (!container) return;
    if (!store()) {
      container.innerHTML = '<div class="ifx-wl-empty">Thiếu community-store.js</div>';
      return;
    }
    var rows = store().getTopExpertsByLikes(5);
    container.innerHTML =
      '<section class="ifx-com-experts-leaders" aria-label="Chuyên gia nổi bật">' +
        '<div class="ifx-com-list-head">' +
          '<h2 class="ifx-com-list-title"><i class="ti ti-award"></i> Chuyên gia nổi bật</h2>' +
          '<span class="ifx-com-section-hint">Tổng lượt thích bài viết chuyên gia</span>' +
        '</div>' +
        '<div class="ifx-com-expert-list">' + rowsHtml(rows) + '</div>' +
      '</section>';
  }

  function mount(container) {
    if (!container) return;
    render(container);
  }

  global.IfluxCommunityFeaturedExperts = { mount: mount, render: render };
})(window);
