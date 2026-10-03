/* Tab Hoạt động gần đây — render ix-act-timeline */
(function (global) {
  'use strict';

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function fmtTime(iso) {
    if (!iso) return '';
    try {
      var d = new Date(iso);
      var diff = Date.now() - d.getTime();
      if (diff < 60000) return 'Vừa xong';
      if (diff < 3600000) return Math.floor(diff / 60000) + ' phút trước';
      if (diff < 86400000) return Math.floor(diff / 3600000) + ' giờ trước';
      if (diff < 86400000 * 7) return Math.floor(diff / 86400000) + ' ngày trước';
      return d.toLocaleString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    } catch (e) {
      return '';
    }
  }

  function iconClass(cls) {
    return cls === 'success' ? 'success'
      : cls === 'warning' ? 'warning'
      : cls === 'danger' ? 'danger'
      : cls === 'info' ? 'info'
      : 'accent';
  }

  function render() {
    var wrap = document.getElementById('ifx-profile-activity');
    if (!wrap || !global.IfluxProfileActivityStore) return;

    var user = global.IfluxAuth && IfluxAuth.getUser();
    if (!user) return;

    var items = IfluxProfileActivityStore.listForUser(user.id, { limit: 50 });
    if (!items.length) {
      wrap.innerHTML = '<div class="ifx-profile-empty"><i class="ti ti-history-off"></i><p>Chưa có hoạt động hệ thống nào ghi nhận.</p></div>';
      return;
    }

    /* Chỉ tiêu đề hoạt động + thời gian tương đối, xếp dọc — bỏ icon-dot (chiếm chỗ, không cần
       thiết) và mô tả phụ (owner yêu cầu 2026-10-03). */
    wrap.innerHTML = '<ul class="ix-act-timeline">' + items.map(function (item) {
      return '<li class="ix-act-item" style="display:flex;flex-direction:column;gap:2px">' +
        '<div class="ix-act-title">' + esc(item.title) + '</div>' +
        '<div class="ix-act-time" style="margin-top:0">' + esc(fmtTime(item.at)) + '</div>' +
      '</li>';
    }).join('') + '</ul>';
  }

  function init() {
    render();
    document.addEventListener('iflux-profile-activity-change', render);
    document.addEventListener('iflux-orders-changed', render);
    document.querySelectorAll('[data-ix-profile-tab="tab-activity"]').forEach(function (btn) {
      btn.addEventListener('click', function () { setTimeout(render, 0); });
    });
  }

  global.IfluxProfileActivityPage = { init: init, render: render };
})(window);
