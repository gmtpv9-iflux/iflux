/* Cộng đồng — Thành viên tích cực (Tích cực − Tiêu cực) */
(function (global) {
  'use strict';

  function stockSt() { return global.IfluxStockStore; }
  function profiles() { return global.IfluxProfileUsersStore; }

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function initials(name) {
    var parts = String(name || '').trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    return String(name || 'U').trim().slice(0, 2).toUpperCase();
  }

  function profileHref(userId) {
    if (global.IfluxProfileLinks && IfluxProfileLinks.profileHref) {
      return IfluxProfileLinks.profileHref(userId, { base: '../account/' });
    }
    return '../account/profile.html?user=' + encodeURIComponent(userId);
  }

  function resolveName(row) {
    if (profiles() && profiles().getPublic) {
      var u = profiles().getPublic(row.userId);
      if (u && u.display_name) return u.display_name;
    }
    return row.userName || 'Thành viên';
  }

  function rowsHtml(rows) {
    if (!rows.length) {
      return '<div class="ifx-com-side-empty">Chưa có dữ liệu tương tác.</div>';
    }
    return rows.map(function (row, idx) {
      var name = resolveName(row);
      var scoreCls = row.score > 0 ? 'is-up' : row.score < 0 ? 'is-down' : '';
      return (
        '<div class="ifx-com-active-row">' +
          '<span class="ifx-com-active-row__rank">#' + (idx + 1) + '</span>' +
          '<a class="ifx-com-active-row__user" href="' + esc(profileHref(row.userId)) + '">' +
            '<span class="ix-avatar-sm ifx-com-active-row__avatar">' + esc(initials(name)) + '</span>' +
            '<strong>' + esc(name) + '</strong>' +
          '</a>' +
          '<span class="ifx-com-active-row__score ' + scoreCls + '">' +
            '<span class="ifx-com-active-row__pos" title="Tích cực">+' + row.positive + '</span>' +
            '<span class="ifx-com-active-row__sep">/</span>' +
            '<span class="ifx-com-active-row__neg" title="Tiêu cực">−' + row.negative + '</span>' +
          '</span>' +
        '</div>'
      );
    }).join('');
  }

  function render(container) {
    if (!container) return;
    var rows = stockSt() ? stockSt().listTopMembersBySentiment(5) : [];
    container.innerHTML =
      '<section class="ifx-com-active-members" aria-label="Thành viên tích cực">' +
        '<div class="ifx-com-active-members__head">' +
          '<h2 class="ifx-com-active-members__title"><i class="ti ti-mood-smile"></i> Thành viên tích cực</h2>' +
        '</div>' +
        '<p class="ifx-com-active-members__desc">Xếp hạng theo hiệu số Tích cực − Tiêu cực trên bình luận CP.</p>' +
        '<div class="ifx-com-active-list">' + rowsHtml(rows) + '</div>' +
      '</section>';
  }

  function mount(container) {
    if (!container) return;
    render(container);
    if (container._ifxActiveBound) return;
    container._ifxActiveBound = true;
    document.addEventListener('iflux-stock-comments-change', function () {
      render(container);
    });
  }

  global.IfluxCommunityActiveMembers = { mount: mount, render: render };
})(window);
