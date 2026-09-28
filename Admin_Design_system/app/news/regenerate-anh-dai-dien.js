/* Regenerate ảnh đại diện — bảng thông tin đọc, nguồn dữ liệu duy nhất:
 * backend/src/modules/media/cover-image-profiles.js (qua GET /admin/media/cover-profiles) */
(function () {
  'use strict';

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function apiBase() {
    if (window.IfluxAdminAuth && IfluxAdminAuth.apiBase) return IfluxAdminAuth.apiBase();
    return '/api';
  }

  function authHeaders() {
    var h = { Accept: 'application/json' };
    var token = null;
    if (window.IfluxAdminAuth && IfluxAdminAuth.getSession) {
      var s = IfluxAdminAuth.getSession();
      if (s && s.token) token = s.token;
    }
    if (token) h.Authorization = 'Bearer ' + token;
    else h['X-Admin-Key'] = localStorage.getItem('iflux_admin_api_key') || 'iflux-admin-local-dev';
    return h;
  }

  function request(path, opts) {
    opts = opts || {};
    var headers = authHeaders();
    var init = { method: opts.method || 'GET', headers: headers };
    if (opts.body != null) {
      headers['Content-Type'] = 'application/json';
      init.body = JSON.stringify(opts.body);
    }
    return fetch(apiBase() + path, init).then(function (res) {
      return res.text().then(function (text) {
        var data = {};
        if (text) {
          try { data = JSON.parse(text); } catch (e) { data = {}; }
        }
        if (!res.ok) throw new Error((data.error && data.error.message) || data.message || ('HTTP ' + res.status));
        return (data && data.data) || data || {};
      });
    });
  }

  var FORMAT_LABEL = { webp: 'WebP', jpeg: 'JPEG' };

  function renderRow(p) {
    return (
      '<tr>' +
        '<td><code>' + esc(p.key) + '</code></td>' +
        '<td>' + esc(p.label) + '</td>' +
        '<td>' + esc(p.width) + '&times;' + esc(p.height) + 'px</td>' +
        '<td>' + esc(FORMAT_LABEL[p.format] || p.format) + ' (q' + esc(p.quality) + ')</td>' +
        '<td style="color:var(--ix-text-muted)">' + esc(p.description) + '</td>' +
      '</tr>'
    );
  }

  function load() {
    var tbody = document.getElementById('rgp-tbody');
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:28px;color:var(--ix-text-muted);font-size:13px">Đang tải…</td></tr>';
    request('/admin/media/cover-profiles')
      .then(function (data) {
        var profiles = (data && data.profiles) || [];
        document.getElementById('rgp-count').textContent = profiles.length;
        tbody.innerHTML = profiles.length
          ? profiles.map(renderRow).join('')
          : '<tr><td colspan="5" style="text-align:center;padding:28px;color:var(--ix-text-muted);font-size:13px">Chưa có trường hợp nào</td></tr>';
      })
      .catch(function (err) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:28px;color:var(--ix-chip-danger,#e5484d);font-size:13px">Lỗi tải dữ liệu: ' + esc(err.message) + '</td></tr>';
      });
  }

  /* Quét & tạo bù — gọi lặp POST /admin/media/cover-profiles/backfill tới khi processed=0
     hoặc bị bấm Dừng. Mỗi lần gọi xử lý tối đa 20 bài (giới hạn phía server để 1 request
     không chạy quá lâu); vòng lặp ở đây tự gọi lại cho tới khi hết việc. */
  var runState = { stopping: false, running: false, totalUpdated: 0, totalSkipped: 0, totalFailed: 0, totalProcessed: 0 };

  function renderRunStatus(text, tone) {
    var el = document.getElementById('rgp-run-status');
    var color = tone === 'danger' ? 'var(--ix-chip-danger,#e5484d)' : (tone === 'success' ? 'var(--ix-success,#2dd4bf)' : 'var(--ix-text-muted)');
    el.innerHTML = '<div style="font-size:13px;color:' + color + '">' + text + '</div>';
  }

  function runStep() {
    if (runState.stopping) {
      renderRunStatus(
        'Đã dừng — đã xử lý ' + runState.totalProcessed + ' bài (' + runState.totalUpdated + ' tạo bù thành công, ' +
          runState.totalSkipped + ' bỏ qua, ' + runState.totalFailed + ' lỗi).'
      );
      return finishRun();
    }
    renderRunStatus(
      'Đang chạy… đã xử lý ' + runState.totalProcessed + ' bài (' + runState.totalUpdated + ' thành công, ' +
        runState.totalSkipped + ' bỏ qua, ' + runState.totalFailed + ' lỗi).'
    );
    request('/admin/media/cover-profiles/backfill', { method: 'POST', body: { limit: 20 } })
      .then(function (r) {
        runState.totalProcessed += r.processed || 0;
        runState.totalUpdated += r.updated || 0;
        runState.totalSkipped += r.skippedNoAsset || 0;
        runState.totalFailed += r.failed || 0;
        if (!r.processed || !r.hasMore) {
          renderRunStatus(
            'Xong — đã xử lý ' + runState.totalProcessed + ' bài (' + runState.totalUpdated + ' tạo bù thành công, ' +
              runState.totalSkipped + ' bỏ qua vì không tìm thấy ảnh gốc, ' + runState.totalFailed + ' lỗi).' +
              (runState.totalProcessed === 0 ? ' Mọi bài viết đều đã đủ 5 bản.' : ''),
            runState.totalFailed ? 'danger' : 'success'
          );
          return finishRun();
        }
        runStep();
      })
      .catch(function (err) {
        renderRunStatus('Lỗi: ' + esc(err.message) + ' (đã xử lý ' + runState.totalProcessed + ' bài trước khi lỗi).', 'danger');
        finishRun();
      });
  }

  /* .ix-btn đặt display: inline-flex không kèm guard [hidden] — thuộc tính hidden bị
     class ghi đè (element vẫn hiện). Ẩn/hiện bằng style.display trực tiếp cho chắc. */
  function setStopVisible(visible) {
    document.getElementById('rgp-stop').style.display = visible ? '' : 'none';
  }

  function finishRun() {
    runState.running = false;
    document.getElementById('rgp-run').disabled = false;
    setStopVisible(false);
  }

  document.addEventListener('DOMContentLoaded', function () {
    load();
    var reload = document.getElementById('rgp-reload');
    if (reload) reload.addEventListener('click', load);

    var run = document.getElementById('rgp-run');
    var stop = document.getElementById('rgp-stop');
    if (run) {
      run.addEventListener('click', function () {
        if (runState.running) return;
        runState = { stopping: false, running: true, totalUpdated: 0, totalSkipped: 0, totalFailed: 0, totalProcessed: 0 };
        run.disabled = true;
        setStopVisible(true);
        runStep();
      });
    }
    if (stop) {
      stop.addEventListener('click', function () { runState.stopping = true; });
    }
  });
})();
