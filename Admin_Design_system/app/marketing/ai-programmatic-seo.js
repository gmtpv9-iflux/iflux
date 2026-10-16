/* AI Programmatic SEO — Admin: Thống kê + Instruction (Owner 2026-10-16) */
(function () {
  'use strict';

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function toast(msg, type) {
    if (typeof window.ixToast === 'function') window.ixToast(msg, type || 'info');
  }
  function apiBase() {
    return (window.IfluxAdminAuth && IfluxAdminAuth.apiBase) ? IfluxAdminAuth.apiBase() : '/api';
  }
  function authHeaders() {
    var h = { 'Content-Type': 'application/json', Accept: 'application/json' };
    var token = null;
    if (window.IfluxAdminAuth && IfluxAdminAuth.getSession) {
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

  function setTab(tab) {
    document.querySelectorAll('[data-aips-tab]').forEach(function (btn) {
      btn.classList.toggle('active', btn.getAttribute('data-aips-tab') === tab);
    });
    document.querySelectorAll('[data-aips-panel]').forEach(function (panel) {
      panel.classList.toggle('active', panel.getAttribute('data-aips-panel') === tab);
    });
  }

  function statCard(label, value) {
    return '<div class="aips-stat-card"><div class="aips-stat-card__label">' + esc(label) + '</div><div class="aips-stat-card__value">' + esc(value) + '</div></div>';
  }

  function loadStats() {
    return request('/admin/news-ai/stats').then(function (s) {
      var el = document.getElementById('aips-stats');
      if (!el) return;
      var byStatus = s.by_status || {};
      el.innerHTML =
        statCard('Tổng job AI', s.total_jobs) +
        statCard('Bài đã tự xuất bản', s.articles_published) +
        statCard('Chờ duyệt', byStatus.needs_review || 0) +
        statCard('Lỗi', byStatus.failed || 0) +
        statCard('Tổng token', s.total_tokens) +
        statCard('Token input', s.total_input_tokens) +
        statCard('Token output', s.total_output_tokens) +
        statCard('Chi phí ước tính (USD)', s.cost_pricing_configured ? ('$' + s.estimated_cost_usd.toFixed(4)) : 'Chưa nhập giá');

      var tb = document.getElementById('aips-model-tbody');
      if (tb) {
        var rows = Object.keys(s.by_model || {}).map(function (model) {
          var m = s.by_model[model];
          return '<tr><td>' + esc(model) + '</td><td>' + esc(m.jobs) + '</td><td>' + esc(m.input_tokens) + '</td><td>' + esc(m.output_tokens) + '</td></tr>';
        });
        tb.innerHTML = rows.join('') || '<tr><td colspan="4" class="ix-caption">Chưa có job nào chạy</td></tr>';
      }
    }).catch(function (e) { toast(e.message || 'Lỗi tải thống kê', 'danger'); });
  }

  function loadConfig() {
    return request('/admin/news-ai/config').then(function (cfg) {
      document.getElementById('aips-auto-publish').checked = !!cfg.auto_publish;
      document.getElementById('aips-model').value = cfg.model || '';
      document.getElementById('aips-price-in').value = cfg.price_per_1k_input_usd || 0;
      document.getElementById('aips-price-out').value = cfg.price_per_1k_output_usd || 0;
    }).catch(function (e) { toast(e.message || 'Lỗi tải cấu hình', 'danger'); });
  }

  function saveConfig() {
    var body = {
      auto_publish: document.getElementById('aips-auto-publish').checked,
      model: document.getElementById('aips-model').value.trim() || null,
      price_per_1k_input_usd: Number(document.getElementById('aips-price-in').value) || 0,
      price_per_1k_output_usd: Number(document.getElementById('aips-price-out').value) || 0
    };
    request('/admin/news-ai/config', { method: 'PATCH', body: body }).then(function () {
      toast('Đã lưu cấu hình', 'success');
      loadStats();
    }).catch(function (e) { toast(e.message || 'Lỗi lưu cấu hình', 'danger'); });
  }

  function updateCount() {
    var ta = document.getElementById('aips-prompt-body');
    var count = document.getElementById('aips-prompt-count');
    if (ta && count) count.textContent = ta.value.length + ' ký tự';
  }

  function loadInstruction() {
    return request('/admin/news-ai/instruction').then(function (p) {
      document.getElementById('aips-prompt-body').value = p.body || '';
      document.getElementById('aips-prompt-updated').textContent = p.updated_at ? ('Cập nhật lần cuối: ' + new Date(p.updated_at).toLocaleString('vi-VN')) : '';
      updateCount();
    }).catch(function (e) { toast(e.message || 'Lỗi tải instruction', 'danger'); });
  }

  function saveInstruction() {
    var body = document.getElementById('aips-prompt-body').value;
    request('/admin/news-ai/instruction', { method: 'PATCH', body: { body: body } }).then(function (p) {
      toast('Đã lưu instruction', 'success');
      document.getElementById('aips-prompt-updated').textContent = p.updated_at ? ('Cập nhật lần cuối: ' + new Date(p.updated_at).toLocaleString('vi-VN')) : '';
    }).catch(function (e) { toast(e.message || 'Lỗi lưu instruction', 'danger'); });
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('[data-aips-tab]').forEach(function (btn) {
      btn.addEventListener('click', function () { setTab(btn.getAttribute('data-aips-tab')); });
    });
    var saveConfigBtn = document.getElementById('aips-config-save');
    if (saveConfigBtn) saveConfigBtn.addEventListener('click', saveConfig);
    var saveInstructionBtn = document.getElementById('aips-prompt-save');
    if (saveInstructionBtn) saveInstructionBtn.addEventListener('click', saveInstruction);
    var ta = document.getElementById('aips-prompt-body');
    if (ta) ta.addEventListener('input', updateCount);

    loadStats();
    loadConfig();
    loadInstruction();
  });
})();
