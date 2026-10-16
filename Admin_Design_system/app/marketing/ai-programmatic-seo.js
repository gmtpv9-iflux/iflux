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

  function todayKey() {
    try { return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }); }
    catch (e) { return new Date().toISOString().slice(0, 10); }
  }

  var chartInstance = null;
  function renderChart(daily) {
    var el = document.getElementById('aips-chart');
    if (!el || typeof window.ApexCharts === 'undefined') return;
    if (chartInstance) { chartInstance.destroy(); chartInstance = null; }
    var labels = daily.map(function (d) { return d.date; });
    var tokens = daily.map(function (d) { return d.input_tokens + d.output_tokens; });
    var published = daily.map(function (d) { return d.published; });
    chartInstance = new ApexCharts(el, {
      chart: { height: 300, background: 'transparent', toolbar: { show: false }, fontFamily: "'Be Vietnam Pro', sans-serif" },
      theme: { mode: document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark' },
      series: [
        { name: 'Token/ngày', type: 'column', data: tokens },
        { name: 'Bài xuất bản', type: 'line', data: published }
      ],
      xaxis: { categories: labels, labels: { rotate: -45 } },
      yaxis: [
        { title: { text: 'Token' }, seriesName: 'Token/ngày' },
        { title: { text: 'Bài xuất bản' }, seriesName: 'Bài xuất bản', opposite: true }
      ],
      stroke: { width: [0, 3], curve: 'smooth' },
      dataLabels: { enabled: false },
      tooltip: { theme: 'dark', shared: true }
    });
    chartInstance.render();
  }

  function loadStats() {
    return request('/news/admin/news-ai/stats').then(function (s) {
      var byStatus = s.by_status || {};
      var daily = s.daily || [];
      var today = daily.filter(function (d) { return d.date === todayKey(); })[0] || { input_tokens: 0, output_tokens: 0 };

      var statusIcon = document.getElementById('aips-kpi-status-icon');
      var statusVal = document.getElementById('aips-kpi-status');
      if (statusVal) statusVal.textContent = s.ai_enabled ? 'Đang hoạt động' : 'Tạm dừng';
      if (statusIcon) statusIcon.className = 'ix-stat-icon ' + (s.ai_enabled ? 'success' : 'danger');

      var publishedEl = document.getElementById('aips-kpi-published');
      if (publishedEl) publishedEl.textContent = s.articles_published;

      var budgetEl = document.getElementById('aips-kpi-budget');
      if (budgetEl) {
        var todayTokens = today.input_tokens + today.output_tokens;
        var budgetTxt = s.daily_token_budget > 0 ? s.daily_token_budget.toLocaleString('vi-VN') : 'Không giới hạn';
        budgetEl.textContent = todayTokens.toLocaleString('vi-VN') + ' / ' + budgetTxt;
      }

      var reviewEl = document.getElementById('aips-kpi-review');
      if (reviewEl) reviewEl.textContent = byStatus.needs_review || 0;

      var tb = document.getElementById('aips-model-tbody');
      if (tb) {
        var rows = Object.keys(s.by_model || {}).map(function (model) {
          var m = s.by_model[model];
          return '<tr><td>' + esc(model) + '</td><td>' + esc(m.jobs) + '</td><td>' + esc(m.input_tokens) + '</td><td>' + esc(m.output_tokens) + '</td></tr>';
        });
        tb.innerHTML = rows.join('') || '<tr><td colspan="4" class="ix-caption">Chưa có job nào chạy</td></tr>';
      }

      var dtb = document.getElementById('aips-daily-tbody');
      if (dtb) {
        var drows = daily.slice().reverse().map(function (d) {
          return '<tr><td>' + esc(d.date) + '</td><td>' + esc(d.jobs) + '</td><td>' + esc(d.published) + '</td><td>' + esc(d.input_tokens) + '</td><td>' + esc(d.output_tokens) + '</td></tr>';
        });
        dtb.innerHTML = drows.join('') || '<tr><td colspan="5" class="ix-caption">Chưa có dữ liệu trong ' + (s.daily_window_days || 30) + ' ngày gần nhất</td></tr>';
      }

      renderChart(daily);
    }).catch(function (e) { toast(e.message || 'Lỗi tải thống kê', 'danger'); });
  }

  function loadModels() {
    var select = document.getElementById('aips-model');
    if (!select) return Promise.resolve();
    return request('/news/admin/news-ai/models').then(function (d) {
      (d.models || []).forEach(function (id) {
        var opt = document.createElement('option');
        opt.value = id; opt.textContent = id;
        select.appendChild(opt);
      });
    }).catch(function (e) {
      toast('Không tải được danh sách model từ OpenAI (' + (e.message || 'lỗi') + ') — vẫn giữ mặc định hệ thống', 'warning');
    });
  }

  function loadConfig() {
    return request('/news/admin/news-ai/config').then(function (cfg) {
      document.getElementById('aips-enabled').checked = !!cfg.enabled;
      document.getElementById('aips-auto-publish').checked = !!cfg.auto_publish;
      if (cfg.model) document.getElementById('aips-model').value = cfg.model;
      document.getElementById('aips-daily-budget').value = cfg.daily_token_budget || 0;
    }).catch(function (e) { toast(e.message || 'Lỗi tải cấu hình', 'danger'); });
  }

  function saveConfig() {
    var body = {
      enabled: document.getElementById('aips-enabled').checked,
      auto_publish: document.getElementById('aips-auto-publish').checked,
      model: document.getElementById('aips-model').value.trim() || null,
      daily_token_budget: Math.round(Number(document.getElementById('aips-daily-budget').value)) || 0
    };
    request('/news/admin/news-ai/config', { method: 'PATCH', body: body }).then(function () {
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
    return request('/news/admin/news-ai/instruction').then(function (p) {
      document.getElementById('aips-prompt-body').value = p.body || '';
      document.getElementById('aips-prompt-updated').textContent = p.updated_at ? ('Cập nhật lần cuối: ' + new Date(p.updated_at).toLocaleString('vi-VN')) : '';
      updateCount();
    }).catch(function (e) { toast(e.message || 'Lỗi tải instruction', 'danger'); });
  }

  function saveInstruction() {
    var body = document.getElementById('aips-prompt-body').value;
    request('/news/admin/news-ai/instruction', { method: 'PATCH', body: { body: body } }).then(function (p) {
      toast('Đã lưu instruction', 'success');
      document.getElementById('aips-prompt-updated').textContent = p.updated_at ? ('Cập nhật lần cuối: ' + new Date(p.updated_at).toLocaleString('vi-VN')) : '';
    }).catch(function (e) { toast(e.message || 'Lỗi lưu instruction', 'danger'); });
  }

  var STATUS_CHIP = {
    published: 'ix-chip-success', needs_review: 'ix-chip-warning', failed: 'ix-chip-danger',
    queued: 'ix-chip-info', running: 'ix-chip-info'
  };
  var STATUS_LABEL = {
    published: 'Đã xuất bản', needs_review: 'Chờ duyệt', failed: 'Lỗi', queued: 'Đang chờ', running: 'Đang xử lý'
  };

  function retryJob(id) {
    request('/news/admin/ai/jobs/' + encodeURIComponent(id) + '/retry', { method: 'POST' }).then(function () {
      toast('Đã đưa job vào hàng chờ xử lý lại', 'success');
      loadHistory();
    }).catch(function (e) { toast(e.message || 'Lỗi thử lại', 'danger'); });
  }

  function loadHistory() {
    var tb = document.getElementById('aips-history-tbody');
    if (!tb) return Promise.resolve();
    return request('/news/admin/ai/jobs').then(function (d) {
      var jobs = d.jobs || [];
      tb.innerHTML = jobs.map(function (j) {
        var chip = STATUS_CHIP[j.status] || 'ix-chip';
        var label = STATUS_LABEL[j.status] || j.status;
        var reason = j.last_error || (j.review_reasons || []).join(', ') || '—';
        var actionBtn = j.status === 'failed'
          ? '<button type="button" class="ix-btn ix-btn-outline ix-btn-sm" data-aips-retry="' + esc(j.id) + '">Thử lại</button>'
          : j.status === 'needs_review'
            ? '<a class="ix-btn ix-btn-primary ix-btn-sm" href="/Admin_Design_system/app/news/content/edit.html?job=' + esc(j.id) + '">Xem &amp; Duyệt</a>'
            : '';
        return '<tr><td>' + esc(new Date(j.created_at).toLocaleString('vi-VN')) + '</td><td>' + esc(j.post_title || j.source_post_id) + '</td><td>' + esc(j.model || '—') + '</td>' +
          '<td><span class="ix-chip ' + chip + '">' + esc(label) + '</span></td><td>' + esc(reason) + '</td><td>' + actionBtn + '</td></tr>';
      }).join('') || '<tr><td colspan="6" class="ix-caption">Chưa có job nào</td></tr>';
      tb.querySelectorAll('[data-aips-retry]').forEach(function (btn) {
        btn.addEventListener('click', function () { retryJob(btn.getAttribute('data-aips-retry')); });
      });
    }).catch(function (e) { toast(e.message || 'Lỗi tải lịch sử', 'danger'); });
  }

  function boot() {
    document.querySelectorAll('[data-aips-tab]').forEach(function (btn) {
      btn.addEventListener('click', function () { setTab(btn.getAttribute('data-aips-tab')); });
    });
    var saveConfigBtn = document.getElementById('aips-config-save');
    if (saveConfigBtn) saveConfigBtn.addEventListener('click', saveConfig);
    var saveInstructionBtn = document.getElementById('aips-prompt-save');
    if (saveInstructionBtn) saveInstructionBtn.addEventListener('click', saveInstruction);
    var ta = document.getElementById('aips-prompt-body');
    if (ta) ta.addEventListener('input', updateCount);
    var historyRefreshBtn = document.getElementById('aips-history-refresh');
    if (historyRefreshBtn) historyRefreshBtn.addEventListener('click', loadHistory);

    loadStats();
    loadModels().then(loadConfig);
    loadInstruction();
    loadHistory();
  }

  /* Admin dùng soft-nav (eval lại page script mỗi lần chuyển trang qua menu, không tạo
     <script> tag mới) — DOMContentLoaded chỉ fire 1 lần duy nhất trong đời document (lúc
     tải trang đầu), nên vào trang này qua menu (không F5) thì listener không bao giờ chạy
     nếu chỉ dùng addEventListener thuần (đã từng gặp, xem commit 971da51 — 5 trang app/news). */
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
