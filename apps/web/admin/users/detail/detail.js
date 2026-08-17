/**
 * Staging 2 — Module Quản lý người dùng: chi tiết
 *
 * Sửa được đúng ba trường mà API cho phép: tên hiển thị, điện thoại, trạng thái
 * tài khoản. Phần còn lại chỉ đọc vì chưa có năng lực nào sở hữu việc sửa chúng.
 */
(function (global) {
  'use strict';

  /* Giá trị auth_provider lưu ở DB là mã kỹ thuật — không đưa thẳng lên UI. */
  var PROVIDER_LABEL = { email: 'Email', google: 'Google' };

  var userId = new URLSearchParams(global.location.search).get('id');
  var els = {};

  /* Ghép tay thay vì toLocaleString: locale vi-VN trả giờ trước ngày
     ("10:00 30/05/2026"), ngược cách đọc thông thường. */
  function formatDateTime(value) {
    if (!value) return '—';
    var d = new Date(value);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
      ' ' + d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  }

  function formatPhone(value) {
    if (!value) return '';
    var digits = String(value);
    if (digits.indexOf('84') === 0 && digits.length === 11) return '0' + digits.slice(2);
    return digits;
  }

  function fail(message) {
    els.meta.textContent = '';
    els.error.textContent = message;
    els.error.hidden = false;
    els.card.hidden = true;
  }

  function fill(user) {
    els.title.textContent = user.displayName || user.email;
    els.meta.textContent = 'Mã người dùng: ' + user.id;

    els.name.value = user.displayName || '';
    els.phone.value = formatPhone(user.phone);
    els.status.value = user.accountStatus;

    els.email.textContent = user.email;
    els.verified.textContent = user.emailVerifiedAt ? formatDateTime(user.emailVerifiedAt) : 'Chưa xác thực';
    els.provider.textContent = PROVIDER_LABEL[user.authProvider] || user.authProvider;
    els.created.textContent = formatDateTime(user.createdAt);
    els.updated.textContent = formatDateTime(user.updatedAt);
    els.bio.textContent = user.bio || '—';

    els.card.hidden = false;
  }

  function load() {
    global.IfluxAdminApi.request('GET', '/admin/users/' + encodeURIComponent(userId)).then(function (res) {
      if (res.status === 403) return fail('Tài khoản của bạn không có quyền xem người dùng.');
      if (res.status === 404) return fail('Không tìm thấy người dùng này.');
      if (!res.ok || !res.data || !res.data.user) return fail('Không tải được thông tin người dùng.');
      fill(res.data.user);
    }).catch(function () {
      fail('Không tải được thông tin người dùng.');
    });
  }

  function save() {
    els.save.disabled = true;
    els.note.textContent = 'Đang lưu…';

    var patch = {
      displayName: els.name.value.trim(),
      phone: els.phone.value.trim(),
      accountStatus: els.status.value
    };

    global.IfluxAdminApi.request('PATCH', '/admin/users/' + encodeURIComponent(userId), patch)
      .then(function (res) {
        els.save.disabled = false;
        if (res.ok && res.data && res.data.user) {
          fill(res.data.user);
          els.note.textContent = 'Đã lưu lúc ' + new Date().toLocaleTimeString('vi-VN');
          return;
        }
        els.note.textContent = (res.data && res.data.error) || 'Lưu thất bại.';
      })
      .catch(function () {
        els.save.disabled = false;
        els.note.textContent = 'Lưu thất bại.';
      });
  }

  function init() {
    els = {
      title: document.getElementById('detail-title'),
      meta: document.getElementById('detail-meta'),
      error: document.getElementById('detail-error'),
      card: document.getElementById('detail-card'),
      name: document.getElementById('detail-name'),
      phone: document.getElementById('detail-phone'),
      status: document.getElementById('detail-status'),
      email: document.getElementById('detail-email'),
      verified: document.getElementById('detail-verified'),
      provider: document.getElementById('detail-provider'),
      created: document.getElementById('detail-created'),
      updated: document.getElementById('detail-updated'),
      bio: document.getElementById('detail-bio'),
      save: document.getElementById('detail-save'),
      note: document.getElementById('detail-note')
    };

    if (!userId) {
      fail('Thiếu mã người dùng trong đường dẫn.');
      return;
    }

    els.save.addEventListener('click', save);
    load();
  }

  init();
})(typeof window !== 'undefined' ? window : globalThis);
