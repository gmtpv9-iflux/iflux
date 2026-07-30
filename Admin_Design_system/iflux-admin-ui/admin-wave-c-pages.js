/* Wave C — AI + Notifications admin pages */
(function (global) {
  'use strict';

  function canPerm(key) {
    return !!(global.IfluxAdminRbac && IfluxAdminRbac.hasPermission && IfluxAdminRbac.hasPermission(key));
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function toast(msg, type) {
    if (typeof global.ixToast === 'function') global.ixToast(msg, type || 'info');
  }

  function apiBase() {
    if (global.IfluxAdminAuth && IfluxAdminAuth.apiBase) return IfluxAdminAuth.apiBase();
    return '/api';
  }

  function authHeaders() {
    var h = { 'Content-Type': 'application/json', Accept: 'application/json' };
    var token = null;
    if (global.IfluxAdminAuth && IfluxAdminAuth.getSession) {
      var s = IfluxAdminAuth.getSession();
      if (s && s.token) token = s.token;
    }
    if (token) h.Authorization = 'Bearer ' + token;
    else h['X-Admin-Key'] = 'iflux-admin-local-dev';
    return h;
  }

  function request(path, options) {
    options = options || {};
    return fetch(apiBase() + path, {
      method: options.method || 'GET',
      headers: Object.assign(authHeaders(), options.headers || {}),
      body: options.body != null ? JSON.stringify(options.body) : undefined
    }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (data) {
        if (!res.ok) throw new Error(((data.error || {}).message) || data.message || ('HTTP ' + res.status));
        return (data && data.data) ? data.data : data;
      });
    });
  }

  function setCount(id, n) {
    var el = document.getElementById(id);
    if (el) el.textContent = String(n);
  }

  function initPrompts() {
    var items = [];
    function render() {
      var tb = document.getElementById('adm-ai-prompt-tbody');
      setCount('adm-ai-prompt-count', items.length);
      if (!tb) return;
      tb.innerHTML = items.map(function (r) {
        var actions = '';
        if (canPerm('ai.prompts.edit')) {
          actions += '<button type="button" class="ix-btn ix-btn-icon" data-prompt-edit="' + esc(r.id) + '" title="Sửa"><i class="ti ti-pencil"></i></button> ';
        }
        if (canPerm('ai.prompts.delete')) {
          actions += '<button type="button" class="ix-btn ix-btn-icon" data-prompt-del="' + esc(r.id) + '" title="Xóa"><i class="ti ti-trash"></i></button>';
        }
        return '<tr><td><strong>' + esc(r.name) + '</strong><div class="ix-caption">' + esc(r.code) + '</div></td>' +
          '<td>' + esc(r.status) + '</td><td class="ix-caption">' + esc((r.body || '').slice(0, 80)) + '</td><td>' + actions + '</td></tr>';
      }).join('') || '<tr><td colspan="4" class="ix-caption">Chưa có prompt</td></tr>';
    }
    function load() {
      return request('/admin/ai/prompts').then(function (d) {
        items = d.prompts || [];
        render();
      }).catch(function (e) { toast(e.message || 'Lỗi', 'danger'); });
    }
    var addBtn = document.getElementById('btn-adm-ai-prompt-add');
    if (addBtn) {
      addBtn.addEventListener('click', function () {
        var code = prompt('Mã prompt:');
        if (!code) return;
        var name = prompt('Tên prompt:', code);
        if (!name) return;
        request('/admin/ai/prompts', { method: 'POST', body: { code: code, name: name, body: '' } })
          .then(function () { toast('Đã thêm', 'success'); return load(); })
          .catch(function (e) { toast(e.message || 'Lỗi', 'danger'); });
      });
    }
    document.addEventListener('click', function (e) {
      var edit = e.target.closest('[data-prompt-edit]');
      if (edit) {
        var id = edit.getAttribute('data-prompt-edit');
        var name = prompt('Tên mới:');
        if (!name) return;
        request('/admin/ai/prompts/' + encodeURIComponent(id), { method: 'PATCH', body: { name: name } })
          .then(function () { toast('Đã lưu', 'success'); return load(); })
          .catch(function (err) { toast(err.message || 'Lỗi', 'danger'); });
      }
      var del = e.target.closest('[data-prompt-del]');
      if (del) {
        if (!confirm('Xóa prompt này?')) return;
        request('/admin/ai/prompts/' + encodeURIComponent(del.getAttribute('data-prompt-del')), { method: 'DELETE' })
          .then(function () { toast('Đã xóa', 'success'); return load(); })
          .catch(function (err) { toast(err.message || 'Lỗi', 'danger'); });
      }
    });
    load();
  }

  function initLogs() {
    request('/admin/ai/logs').then(function (d) {
      var items = d.logs || [];
      setCount('adm-ai-log-count', items.length);
      var tb = document.getElementById('adm-ai-log-tbody');
      if (!tb) return;
      tb.innerHTML = items.map(function (r) {
        return '<tr><td>' + esc(r.level) + '</td><td>' + esc(r.message) + '</td><td class="ix-caption">' +
          esc(r.created_at ? new Date(r.created_at).toLocaleString('vi-VN') : '—') + '</td></tr>';
      }).join('') || '<tr><td colspan="3" class="ix-caption">Chưa có log</td></tr>';
    }).catch(function (e) { toast(e.message || 'Lỗi', 'danger'); });
  }

  function initCost() {
    request('/admin/ai/cost').then(function (d) {
      var items = d.rows || [];
      setCount('adm-ai-cost-count', items.length);
      var tb = document.getElementById('adm-ai-cost-tbody');
      if (!tb) return;
      tb.innerHTML = items.map(function (r) {
        return '<tr><td>' + esc(r.provider) + '</td><td>' + esc(r.model) + '</td><td>' + esc(r.tokens) +
          '</td><td>' + esc(r.cost_usd) + '</td></tr>';
      }).join('') || '<tr><td colspan="4" class="ix-caption">Chưa có chi phí</td></tr>';
    }).catch(function (e) { toast(e.message || 'Lỗi', 'danger'); });
  }

  function initQuality() {
    var items = [];
    function render() {
      setCount('adm-ai-qual-count', items.length);
      var tb = document.getElementById('adm-ai-qual-tbody');
      if (!tb) return;
      tb.innerHTML = items.map(function (r) {
        var actions = canPerm('ai.quality.edit')
          ? '<button type="button" class="ix-btn ix-btn-outline ix-btn-sm" data-qual-edit="' + esc(r.id) + '">Sửa điểm</button>'
          : '';
        return '<tr><td>' + esc(r.label) + '</td><td>' + esc(r.score) + '</td><td class="ix-caption">' +
          esc(r.note) + '</td><td>' + actions + '</td></tr>';
      }).join('') || '<tr><td colspan="4" class="ix-caption">Chưa có chỉ số</td></tr>';
    }
    function load() {
      return request('/admin/ai/quality').then(function (d) {
        items = d.items || [];
        render();
      }).catch(function (e) { toast(e.message || 'Lỗi', 'danger'); });
    }
    document.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-qual-edit]');
      if (!btn) return;
      var score = prompt('Điểm mới (0-100):');
      if (score == null || score === '') return;
      request('/admin/ai/quality/' + encodeURIComponent(btn.getAttribute('data-qual-edit')), {
        method: 'PATCH', body: { score: Number(score) }
      }).then(function () { toast('Đã lưu', 'success'); return load(); })
        .catch(function (err) { toast(err.message || 'Lỗi', 'danger'); });
    });
    load();
  }

  function initChannel(channel, permBase, ids) {
    var items = [];
    var path = '/admin/notifications/' + channel;
    function render() {
      setCount(ids.count, items.length);
      var tb = document.getElementById(ids.tbody);
      if (!tb) return;
      tb.innerHTML = items.map(function (r) {
        var actions = '';
        if (canPerm(permBase + '.edit')) {
          actions += '<button type="button" class="ix-btn ix-btn-icon" data-camp-edit="' + esc(r.id) + '" title="Sửa"><i class="ti ti-pencil"></i></button> ';
        }
        if (canPerm(permBase + '.publish') && r.status !== 'published') {
          actions += '<button type="button" class="ix-btn ix-btn-outline ix-btn-sm" data-camp-pub="' + esc(r.id) + '">Publish</button>';
        }
        return '<tr><td><strong>' + esc(r.title) + '</strong><div class="ix-caption">' + esc(r.code) + '</div></td>' +
          '<td>' + esc(r.status) + '</td><td>' + actions + '</td></tr>';
      }).join('') || '<tr><td colspan="3" class="ix-caption">Chưa có chiến dịch</td></tr>';
    }
    function load() {
      return request(path).then(function (d) {
        items = d.items || [];
        render();
      }).catch(function (e) { toast(e.message || 'Lỗi', 'danger'); });
    }
    var addBtn = document.getElementById(ids.add);
    if (addBtn) {
      addBtn.addEventListener('click', function () {
        var code = prompt('Mã chiến dịch:');
        if (!code) return;
        var title = prompt('Tiêu đề:', code);
        if (!title) return;
        request(path, { method: 'POST', body: { code: code, title: title, body: '' } })
          .then(function () { toast('Đã thêm', 'success'); return load(); })
          .catch(function (e) { toast(e.message || 'Lỗi', 'danger'); });
      });
    }
    document.addEventListener('click', function (e) {
      var edit = e.target.closest('[data-camp-edit]');
      if (edit) {
        var title = prompt('Tiêu đề mới:');
        if (!title) return;
        request(path + '/' + encodeURIComponent(edit.getAttribute('data-camp-edit')), {
          method: 'PATCH', body: { title: title }
        }).then(function () { toast('Đã lưu', 'success'); return load(); })
          .catch(function (err) { toast(err.message || 'Lỗi', 'danger'); });
      }
      var pub = e.target.closest('[data-camp-pub]');
      if (pub) {
        request(path + '/' + encodeURIComponent(pub.getAttribute('data-camp-pub')) + '/publish', {
          method: 'POST', body: {}
        }).then(function () { toast('Đã publish', 'success'); return load(); })
          .catch(function (err) { toast(err.message || 'Lỗi', 'danger'); });
      }
    });
    load();
  }

  function initHistory() {
    request('/admin/notifications/history').then(function (d) {
      var items = d.items || [];
      setCount('adm-notif-hist-count', items.length);
      var tb = document.getElementById('adm-notif-hist-tbody');
      if (!tb) return;
      tb.innerHTML = items.map(function (r) {
        return '<tr><td>' + esc(r.channel) + '</td><td>' + esc(r.title) + '</td><td>' + esc(r.status) +
          '</td><td class="ix-caption">' + esc(r.sent_at ? new Date(r.sent_at).toLocaleString('vi-VN') : '—') + '</td></tr>';
      }).join('') || '<tr><td colspan="4" class="ix-caption">Chưa có lịch sử</td></tr>';
    }).catch(function (e) { toast(e.message || 'Lỗi', 'danger'); });
  }

  function initTemplates() {
    var items = [];
    function render() {
      setCount('adm-notif-tpl-count', items.length);
      var tb = document.getElementById('adm-notif-tpl-tbody');
      if (!tb) return;
      tb.innerHTML = items.map(function (r) {
        var actions = canPerm('notifications.templates.edit')
          ? '<button type="button" class="ix-btn ix-btn-outline ix-btn-sm" data-tpl-edit="' + esc(r.id) + '">Sửa</button>'
          : '';
        return '<tr><td><strong>' + esc(r.name) + '</strong><div class="ix-caption">' + esc(r.code) + '</div></td>' +
          '<td>' + esc(r.channel) + '</td><td>' + actions + '</td></tr>';
      }).join('') || '<tr><td colspan="3" class="ix-caption">Chưa có mẫu</td></tr>';
    }
    function load() {
      return request('/admin/notifications/templates').then(function (d) {
        items = d.items || [];
        render();
      }).catch(function (e) { toast(e.message || 'Lỗi', 'danger'); });
    }
    document.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-tpl-edit]');
      if (!btn) return;
      var name = prompt('Tên mẫu mới:');
      if (!name) return;
      request('/admin/notifications/templates/' + encodeURIComponent(btn.getAttribute('data-tpl-edit')), {
        method: 'PATCH', body: { name: name }
      }).then(function () { toast('Đã lưu', 'success'); return load(); })
        .catch(function (err) { toast(err.message || 'Lỗi', 'danger'); });
    });
    load();
  }

  global.AdmWaveC = {
    initPrompts: initPrompts,
    initLogs: initLogs,
    initCost: initCost,
    initQuality: initQuality,
    initPush: function () {
      initChannel('push', 'notifications.push', {
        count: 'adm-notif-count', tbody: 'adm-notif-tbody', add: 'btn-adm-notif-add'
      });
    },
    initInApp: function () {
      initChannel('in-app', 'notifications.in_app', {
        count: 'adm-notif-count', tbody: 'adm-notif-tbody', add: 'btn-adm-notif-add'
      });
    },
    initEmail: function () {
      initChannel('email', 'notifications.email', {
        count: 'adm-notif-count', tbody: 'adm-notif-tbody', add: 'btn-adm-notif-add'
      });
    },
    initHistory: initHistory,
    initTemplates: initTemplates
  };
})(window);
