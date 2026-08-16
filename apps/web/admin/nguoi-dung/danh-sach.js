/**
 * Staging 2 — Module Quản lý người dùng: danh sách
 *
 * Lọc và phân trang chạy ở server (GET /api/admin/users), trang chỉ giữ trạng
 * thái truy vấn hiện tại và vẽ lại. Không có kho dữ liệu phía trình duyệt.
 */
(function (global) {
  'use strict';

  var PAGE_SIZE = 20;
  var SEARCH_DELAY = 300;

  var STATUS = {
    active: { label: 'Hoạt động', chip: 'ifx-chip--success' },
    suspended: { label: 'Tạm khóa', chip: 'ifx-chip--warning' }
  };

  var state = { q: '', status: '', page: 1, total: 0 };
  var searchTimer = null;
  var els = {};

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function formatDate(value) {
    if (!value) return '—';
    var d = new Date(value);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  /** Số lưu dạng 84xxxxxxxxx — hiện lại theo cách người Việt đọc: 0xxx xxx xxx. */
  function formatPhone(value) {
    if (!value) return '—';
    var digits = String(value);
    if (digits.indexOf('84') === 0 && digits.length === 11) digits = '0' + digits.slice(2);
    if (digits.length !== 10) return digits;
    return digits.slice(0, 4) + ' ' + digits.slice(4, 7) + ' ' + digits.slice(7);
  }

  function query() {
    var parts = ['page=' + state.page, 'pageSize=' + PAGE_SIZE];
    if (state.q) parts.push('q=' + encodeURIComponent(state.q));
    if (state.status) parts.push('status=' + state.status);
    return '?' + parts.join('&');
  }

  function notice(text) {
    var row = el('tr');
    var cell = el('td', 'ifx-table__notice', text);
    cell.colSpan = 5;
    row.appendChild(cell);
    els.rows.replaceChildren(row);
  }

  function identityCell(user) {
    var cell = el('td');
    var link = el('a', 'ifx-users-identity__name', user.displayName || '(chưa đặt tên)');
    link.href = '/admin/nguoi-dung/chi-tiet?id=' + encodeURIComponent(user.id);
    cell.appendChild(link);
    cell.appendChild(el('div', 'ifx-users-identity__email', user.email));
    return cell;
  }

  function statusCell(user) {
    var meta = STATUS[user.accountStatus] || { label: user.accountStatus, chip: 'ifx-chip--outline' };
    var cell = el('td');
    cell.appendChild(el('span', 'ifx-chip ' + meta.chip, meta.label));
    return cell;
  }

  function renderRows(users) {
    if (!users.length) {
      notice(state.q || state.status ? 'Không có người dùng nào khớp bộ lọc.' : 'Chưa có người dùng nào.');
      return;
    }
    var rows = users.map(function (user) {
      var row = el('tr');
      row.appendChild(identityCell(user));
      row.appendChild(el('td', 'ifx-users-cell--tight', formatPhone(user.phone)));
      row.appendChild(statusCell(user));
      row.appendChild(el('td', 'ifx-users-cell--tight', user.emailVerifiedAt ? formatDate(user.emailVerifiedAt) : 'Chưa'));
      row.appendChild(el('td', 'ifx-users-cell--tight', formatDate(user.createdAt)));
      return row;
    });
    els.rows.replaceChildren.apply(els.rows, rows);
  }

  function renderFoot() {
    var pages = Math.max(1, Math.ceil(state.total / PAGE_SIZE));
    els.count.textContent = state.total + ' người dùng';
    els.page.textContent = 'Trang ' + state.page + '/' + pages;
    els.prev.disabled = state.page <= 1;
    els.next.disabled = state.page >= pages;
  }

  function load() {
    notice('Đang tải…');
    global.IfluxAdminApi.request('GET', '/admin/users' + query()).then(function (res) {
      if (res.status === 403) {
        notice('Tài khoản của bạn không có quyền xem danh sách người dùng.');
        state.total = 0;
        renderFoot();
        return;
      }
      if (!res.ok || !res.data) {
        notice('Không tải được danh sách.');
        return;
      }
      state.total = res.data.total;
      renderRows(res.data.users || []);
      renderFoot();
    }).catch(function () {
      notice('Không tải được danh sách.');
    });
  }

  function reload() {
    state.page = 1;
    load();
  }

  function exportCsv() {
    els.export.disabled = true;
    global.IfluxAdminApi.download('/admin/users/export' + query(), 'nguoi-dung.csv')
      .then(function (res) {
        if (!res.ok) {
          els.export.textContent = res.status === 403 ? 'Không có quyền xuất' : 'Xuất thất bại';
          return;
        }
        els.export.disabled = false;
      })
      .catch(function () {
        els.export.textContent = 'Xuất thất bại';
      });
  }

  function init() {
    els = {
      search: document.getElementById('users-search'),
      status: document.getElementById('users-status'),
      export: document.getElementById('users-export'),
      rows: document.getElementById('users-rows'),
      count: document.getElementById('users-count'),
      page: document.getElementById('users-page'),
      prev: document.getElementById('users-prev'),
      next: document.getElementById('users-next')
    };

    els.search.addEventListener('input', function () {
      clearTimeout(searchTimer);
      state.q = els.search.value.trim();
      searchTimer = setTimeout(reload, SEARCH_DELAY);
    });

    els.status.addEventListener('change', function () {
      state.status = els.status.value;
      reload();
    });

    els.prev.addEventListener('click', function () {
      if (state.page > 1) { state.page -= 1; load(); }
    });

    els.next.addEventListener('click', function () {
      state.page += 1;
      load();
    });

    els.export.addEventListener('click', exportCsv);

    load();
  }

  init();
})(typeof window !== 'undefined' ? window : globalThis);
