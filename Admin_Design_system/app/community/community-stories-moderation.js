/* ADM-COM-001 — Kiểm duyệt chủ đề / story posts (community.stories) */
(function (global) {
  'use strict';

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function canPerm(key) {
    return !!(global.IfluxAdminRbac && IfluxAdminRbac.hasPermission && IfluxAdminRbac.hasPermission(key));
  }

  function apiBase() {
    if (global.IfluxAdminAuth && IfluxAdminAuth.apiBase) return IfluxAdminAuth.apiBase();
    return '/api';
  }

  function authHeaders() {
    var h = { Accept: 'application/json', 'Content-Type': 'application/json' };
    var token = null;
    if (global.IfluxAdminAuth && IfluxAdminAuth.getSession) {
      var s = IfluxAdminAuth.getSession();
      if (s && s.token) token = s.token;
    }
    if (token) h.Authorization = 'Bearer ' + token;
    return h;
  }

  function request(path, opts) {
    opts = opts || {};
    return fetch(apiBase() + path, {
      method: opts.method || 'GET',
      headers: authHeaders(),
      body: opts.body ? JSON.stringify(opts.body) : undefined,
      cache: 'no-store'
    }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (data) {
        if (!res.ok) {
          var m = data && data.error;
          if (m && typeof m === 'object') m = m.message || JSON.stringify(m);
          throw new Error(m || ('HTTP ' + res.status));
        }
        return (data && data.data) || data || {};
      });
    });
  }

  function statusChip(st) {
    var map = {
      draft: { t: 'Nháp', c: 'ix-chip-secondary' },
      pending: { t: 'Chờ duyệt', c: 'ix-chip-warning' },
      published: { t: 'Xuất bản', c: 'ix-chip-success' },
      published_rss: { t: 'RSS', c: 'ix-chip-info' },
      scheduled: { t: 'Lên lịch', c: 'ix-chip-info' }
    };
    var m = map[st] || { t: st || '—', c: 'ix-chip-secondary' };
    return '<span class="ix-chip ' + m.c + '">' + esc(m.t) + '</span>';
  }

  function toast(msg, type) {
    if (global.ixToast) ixToast(msg, type || 'success');
  }

  function load() {
    var status = (document.getElementById('story-filter-status') || {}).value || '';
    var q = (document.getElementById('story-filter-q') || {}).value || '';
    var path = '/community/admin/stories/posts?limit=100';
    if (status) path += '&status=' + encodeURIComponent(status);
    if (q) path += '&q=' + encodeURIComponent(q);
    var tbody = document.getElementById('story-mod-tbody');
    if (tbody) tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--ix-text-muted)">Đang tải…</td></tr>';
    request(path).then(function (data) {
      var list = data.posts || [];
      var count = document.getElementById('story-mod-count');
      if (count) count.textContent = String(list.length);
      if (!tbody) return;
      if (!list.length) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--ix-text-muted)">Không có bài</td></tr>';
        return;
      }
      tbody.innerHTML = list.map(function (p) {
        var d = p.display || {};
        var flags = [];
        if (d.featured) flags.push('Nổi bật');
        if (d.pin || d.sticky) flags.push('Ghim');
        if (d.locked) flags.push('Khóa');
        var actions = '';
        if (canPerm('community.stories.publish') && p.status !== 'published' && p.status !== 'published_rss') {
          actions += '<button type="button" class="ix-btn ix-btn-icon" data-story-act="publish" data-id="' + esc(p.id) + '" title="Đăng bài"><i class="ti ti-send" style="font-size:14px"></i></button>';
        }
        if (canPerm('community.stories.feature_post')) {
          actions += '<button type="button" class="ix-btn ix-btn-icon" data-story-act="feature" data-id="' + esc(p.id) + '" title="Đưa nổi bật"><i class="ti ti-star" style="font-size:14px"></i></button>';
        }
        if (canPerm('community.stories.pin_post')) {
          actions += '<button type="button" class="ix-btn ix-btn-icon" data-story-act="pin" data-id="' + esc(p.id) + '" title="Ghim bài"><i class="ti ti-pin" style="font-size:14px"></i></button>';
        }
        if (canPerm('community.stories.lock_post')) {
          actions += '<button type="button" class="ix-btn ix-btn-icon" data-story-act="lock" data-id="' + esc(p.id) + '" title="Khóa bài"><i class="ti ti-lock" style="font-size:14px"></i></button>';
        }
        if (canPerm('community.stories.edit')) {
          actions += '<button type="button" class="ix-btn ix-btn-icon" data-story-act="edit" data-id="' + esc(p.id) + '" title="Sửa tiêu đề"><i class="ti ti-edit" style="font-size:14px"></i></button>';
        }
        if (canPerm('community.stories.delete')) {
          actions += '<button type="button" class="ix-btn ix-btn-icon" data-story-act="delete" data-id="' + esc(p.id) + '" title="Xóa"><i class="ti ti-trash" style="font-size:14px"></i></button>';
        }
        return '<tr>' +
          '<td><strong>' + esc(p.title || '—') + '</strong>' +
            (flags.length ? '<div class="ix-caption">' + esc(flags.join(' · ')) + '</div>' : '') +
          '</td>' +
          '<td class="ix-caption">' + esc((p.author && (p.author.display_name || p.author.name)) || p.chu_de_name || '—') + '</td>' +
          '<td>' + statusChip(p.status) + '</td>' +
          '<td class="ix-caption">' + esc(String(p.updated_at || p.published_at || '').slice(0, 16).replace('T', ' ')) + '</td>' +
          '<td><div style="display:flex;gap:4px;flex-wrap:wrap">' + actions + '</div></td>' +
          '</tr>';
      }).join('');
    }).catch(function (err) {
      if (tbody) tbody.innerHTML = '<tr><td colspan="5" style="color:var(--ix-danger)">' + esc(err.message) + '</td></tr>';
    });
  }

  function runAct(act, id) {
    if (act === 'edit') {
      var title = prompt('Tiêu đề mới:');
      if (title == null || !String(title).trim()) return;
      request('/community/admin/stories/posts/' + encodeURIComponent(id), {
        method: 'PATCH',
        body: { title: String(title).trim() }
      }).then(function () {
        toast('Đã sửa');
        load();
      }).catch(function (e) { toast(e.message, 'danger'); });
      return;
    }
    if (act === 'delete') {
      if (!confirm('Xóa bài này? Không hoàn tác.')) return;
      request('/community/admin/stories/posts/' + encodeURIComponent(id), { method: 'DELETE' })
        .then(function () { toast('Đã xóa'); load(); })
        .catch(function (e) { toast(e.message, 'danger'); });
      return;
    }
    var path = '/community/admin/stories/posts/' + encodeURIComponent(id) + '/' + act;
    request(path, { method: 'POST', body: {} })
      .then(function () { toast('Đã cập nhật'); load(); })
      .catch(function (e) { toast(e.message, 'danger'); });
  }

  function boot() {
    var root = document.getElementById('adm-page-root');
    if (!root) return;
    document.getElementById('adm-page-title') && (document.getElementById('adm-page-title').textContent = 'Kiểm duyệt chủ đề');
    document.getElementById('adm-page-intro') && (document.getElementById('adm-page-intro').textContent =
      'Duyệt / đăng / nổi bật / ghim / khóa bài gắn chủ đề — quyền community.stories.*');
    root.innerHTML =
      '<div class="ix-card">' +
        '<div class="ix-table-toolbar">' +
          '<div class="ix-table-search"><i class="ti ti-search"></i>' +
            '<input type="text" id="story-filter-q" placeholder="Tìm tiêu đề…" /></div>' +
          '<div class="ix-table-actions" style="display:flex;gap:8px;align-items:center">' +
            '<select class="ix-select ix-select-sm" id="story-filter-status">' +
              '<option value="">Tất cả trạng thái</option>' +
              '<option value="pending">Chờ duyệt</option>' +
              '<option value="draft">Nháp</option>' +
              '<option value="published">Xuất bản</option>' +
            '</select>' +
            '<button type="button" class="ix-btn ix-btn-outline ix-btn-sm" id="story-mod-reload"><i class="ti ti-refresh"></i> Tải lại</button>' +
            '<span class="ix-caption">Số bài: <strong id="story-mod-count">—</strong></span>' +
          '</div>' +
        '</div>' +
        '<div class="ix-table-responsive"><table class="ix-table">' +
          '<thead><tr><th>Bài / Story</th><th>Tác giả / Chủ đề</th><th>Trạng thái</th><th>Cập nhật</th><th>Thao tác</th></tr></thead>' +
          '<tbody id="story-mod-tbody"></tbody>' +
        '</table></div>' +
      '</div>';

    document.getElementById('story-mod-reload').addEventListener('click', load);
    document.getElementById('story-filter-status').addEventListener('change', load);
    document.getElementById('story-filter-q').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') load();
    });
    root.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-story-act]');
      if (!btn) return;
      runAct(btn.getAttribute('data-story-act'), btn.getAttribute('data-id'));
    });
    load();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})(window);
