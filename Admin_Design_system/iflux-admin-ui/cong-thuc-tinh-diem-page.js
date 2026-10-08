/* ADM-TOPIC-002 — Công thức tính điểm (topic_scoring_config) — Owner 2026-10, Phase 6.
 * Bảng tra cứu + chỉnh sửa trực tiếp — Owner: "tôi sẽ đọc để biết đã logic thế nào, sau này cần
 * điều chỉnh cũng dễ". Không có thuật toán ở đây — chỉ đọc/ghi config qua API, giải thích tay. */
(function (global) {
  'use strict';

  var EXPLAIN = {
    topic_formation: {
      title: 'Hình thành & xoá Chủ đề',
      desc: 'confirm_usage_count: hashtag phải được dùng (số bài viết, toàn thời gian) đạt ngưỡng này mới "chính thức" là 1 Chủ đề (hiện trong gợi ý khi viết bài). inactive_delete_days: Chủ đề không được nhắc tới (không có bài mới) trong N ngày thì xoá thật khỏi hệ thống — Câu chuyện đã ánh xạ từ Chủ đề đó cũng xoá theo.'
    },
    engagement_weights: {
      title: 'Trọng số Điểm tương tác (Engagement)',
      desc: 'Engagement = like×like + dislike×dislike + comment×comment + share×share. Dùng cho mọi bảng xếp hạng (Thịnh hành, Mới nổi, Admin Dashboard).'
    },
    representative_stock: {
      title: 'Cổ phiếu đại diện',
      desc: 'cumulative_weight_min: tỷ trọng cộng dồn tối thiểu (0.8 = 80%) để 1 mã CP được tính là "đại diện" cho Chủ đề — xếp theo tỷ trọng giảm dần, cộng dồn tới khi đạt ngưỡng. Mã có tỷ trọng cao nhất = Leader. Chốt CỐ ĐỊNH 1 lần khi Chủ đề đạt ngưỡng confirm_usage_count, không tính lại.'
    },
    hot_eligibility: {
      title: 'Điều kiện đủ — Top chủ đề mới nổi (theo từng kỳ Ngày/Tuần/Tháng)',
      desc: 'Mỗi kỳ có 3 ngưỡng: engagement_floor (Điểm tương tác tối thiểu trong kỳ), user_floor (Số user tương tác duy nhất tối thiểu), recent_floor (Điểm tương tác tối thiểu trong cửa sổ gần nhất — recent_window_days ngày). Chủ đề phải đạt ĐỒNG THỜI cả 3 mới được xếp vào "Top chủ đề mới nổi". Ngoài ra còn 1 điều kiện cứng KHÔNG ở đây: Net Reaction (Like−Dislike) trong kỳ phải ≥ 0.'
    },
    hot_score_weights: {
      title: 'Trọng số Hot Score — Top chủ đề mới nổi',
      desc: 'Hot Score = (velocity×Velocity + growth×Growth) × (1 + net_reaction_bonus×NetReactionChuẩnHoá). Velocity = tốc độ tương tác gần nhất (percentile rank trong nhóm đủ điều kiện). Growth = % tăng trưởng so kỳ trước (percentile rank). net_reaction_bonus = hệ số thưởng cho Chủ đề được khen nhiều hơn chê (Like−Dislike).'
    },
    story_lifecycle_thresholds: {
      title: 'Vòng đời Câu chuyện (5 trạng thái)',
      desc: 'window_days: số ngày tính Điểm tương tác trung bình để xếp hạng percentile. sustain_days: số ngày phải duy trì ở nhóm Top trước khi chuyển "Đang nổi" → "Đang thịnh hành". archive_sustain_days: số ngày duy trì "Đang hạ nhiệt" trước khi "Lưu trữ". top_percentile: tỷ lệ Top (0.8 = Top 20%) được coi là đang nổi/thịnh hành. Tính trên Điểm tương tác của Chủ đề đã ánh xạ vào Câu chuyện. Admin có thể ghi đè (lifecycle-override) — thắng tự động đánh giá.'
    }
  };

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function toast(msg, type) {
    if (typeof global.ixToast === 'function') global.ixToast(msg, type || 'primary');
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
    if (!token) {
      try {
        var raw = localStorage.getItem('iflux_admin_session') || sessionStorage.getItem('iflux_admin_session');
        if (raw) {
          var obj = JSON.parse(raw);
          if (obj && obj.token) token = obj.token;
        }
      } catch (e) { /* ignore */ }
    }
    if (token) h.Authorization = 'Bearer ' + token;
    var key = 'iflux-admin-local-dev';
    try {
      var stored = localStorage.getItem('iflux_admin_api_key');
      if (stored) key = stored;
    } catch (e2) { /* ignore */ }
    h['X-Admin-Key'] = key;
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
        if (!res.ok) {
          var err = data.error;
          var msg = (err && err.message) || data.message || data.error || ('HTTP ' + res.status);
          throw new Error(typeof msg === 'string' ? msg : 'Request failed');
        }
        return data.data != null ? data.data : data;
      });
    });
  }

  function cardHtml(row) {
    var meta = EXPLAIN[row.key] || { title: row.key, desc: '' };
    return (
      '<div class="ix-card ix-mb-16" data-cfg-key="' + esc(row.key) + '">' +
        '<div class="ix-card-header"><div class="ix-card-title">' + esc(meta.title) + ' <span class="ix-caption">(' + esc(row.key) + ')</span></div></div>' +
        '<div class="ix-card-body">' +
          (meta.desc ? '<p style="font-size:13px;color:var(--ix-text-muted);margin:0 0 12px">' + esc(meta.desc) + '</p>' : '') +
          '<textarea class="ix-input" rows="6" style="font-family:monospace;font-size:12px" data-cfg-value>' + esc(JSON.stringify(row.value, null, 2)) + '</textarea>' +
          '<div style="margin-top:10px;display:flex;align-items:center;gap:10px">' +
            '<button type="button" class="ix-btn ix-btn-primary ix-btn-sm" data-cfg-save>Lưu</button>' +
            '<span class="ix-caption" data-cfg-updated>Cập nhật lần cuối: ' + esc(row.updated_at ? new Date(row.updated_at).toLocaleString('vi-VN') : '—') + '</span>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  function render(rows) {
    var box = document.getElementById('adm-cong-thuc-list');
    if (!box) return;
    if (!rows.length) {
      box.innerHTML = '<p class="ix-caption">Chưa có cấu hình nào.</p>';
      return;
    }
    box.innerHTML = rows.map(cardHtml).join('');
    box.querySelectorAll('[data-cfg-save]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var card = btn.closest('[data-cfg-key]');
        var key = card.getAttribute('data-cfg-key');
        var textarea = card.querySelector('[data-cfg-value]');
        var value;
        try {
          value = JSON.parse(textarea.value);
        } catch (e) {
          toast('JSON không hợp lệ: ' + e.message, 'danger');
          return;
        }
        btn.disabled = true;
        request('/community/topics/scoring-config/' + encodeURIComponent(key), {
          method: 'PUT',
          body: { value: value }
        }).then(function (row) {
          toast('Đã lưu ' + key, 'success');
          var updatedEl = card.querySelector('[data-cfg-updated]');
          if (updatedEl) updatedEl.textContent = 'Cập nhật lần cuối: ' + new Date(row.updated_at).toLocaleString('vi-VN');
        }).catch(function (err) {
          toast(err.message || 'Lưu thất bại', 'danger');
        }).then(function () {
          btn.disabled = false;
        });
      });
    });
  }

  function reload() {
    var box = document.getElementById('adm-cong-thuc-list');
    if (box) box.innerHTML = '<p class="ix-caption">Đang tải…</p>';
    request('/community/topics/scoring-config').then(function (data) {
      render(data.items || []);
    }).catch(function (err) {
      if (box) box.innerHTML = '<p style="color:var(--ix-danger)">' + esc(err.message || 'Không tải được') + '</p>';
    });
  }

  function init() {
    reload();
  }

  global.AdmCongThucTinhDiem = { init: init };
})(window);
