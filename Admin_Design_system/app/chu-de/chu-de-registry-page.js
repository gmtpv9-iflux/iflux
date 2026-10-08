/* ADM-TOPIC-001 — Danh sách Chủ đề (Topic, API community/topics) — Owner 2026-10, Phase 6 cuối
 * ngày: Topic không còn lifecycle 5-trạng-thái (chuyển sang Story) — chỉ 2 trạng thái: đang
 * tích lũy (usage_count < ngưỡng) / đã chính thức (confirmed). Bỏ hẳn modal "Đổi trạng thái". */
(function (global) {
  'use strict';

  var Store = global.IfluxChuDeRegistryStore;
  var mappingTopicId = null;

  function canPerm(key) {
    return !!(global.IfluxAdminRbac && IfluxAdminRbac.hasPermission && IfluxAdminRbac.hasPermission(key));
  }

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function toast(msg, type) {
    if (typeof global.ixToast === 'function') global.ixToast(msg, type || 'primary');
  }

  function sentimentChip(label) {
    if (label === 'positive') return '<span class="ix-chip ix-chip-success">Tích cực</span>';
    if (label === 'negative') return '<span class="ix-chip ix-chip-danger">Tiêu cực</span>';
    if (label === 'neutral') return '<span class="ix-chip ix-chip-secondary">Trung lập</span>';
    return '<span class="ix-chip ix-chip-secondary">Chưa đủ dữ liệu</span>';
  }

  function confirmedChip(t) {
    if (t.confirmed) return '<span class="ix-chip ix-chip-success">Đã chính thức</span>';
    return '<span class="ix-chip ix-chip-secondary">Đang tích lũy (' + t.usageCount + '/100)</span>';
  }

  function stocksCell(t) {
    var rep = t.representativeStocks || {};
    var stocks = rep.stocks || [];
    if (!stocks.length) return '<span class="ix-caption">—</span>';
    return stocks.slice(0, 5).map(function (s) {
      return '<span class="ix-chip ix-chip-sm" style="margin:0 2px 2px 0">' + esc(s.ticker) + (s.ticker === rep.leader ? ' 👑' : '') + '</span>';
    }).join('');
  }

  function getFilters() {
    return {
      keyword: ((document.getElementById('adm-str-reg-search') || {}).value || '').trim().toLowerCase(),
      confirmed: (document.getElementById('adm-str-reg-status') || {}).value || ''
    };
  }

  function getRange() {
    return (document.getElementById('adm-str-reg-range') || {}).value || 'week';
  }

  function renderTable() {
    if (!Store) return;
    var tbody = document.getElementById('adm-str-reg-tbody');
    if (!tbody) return;
    var list = Store.listTopics(getFilters());
    if (!list.length) {
      tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:32px;color:var(--ix-text-muted);font-size:13px">Chưa có Chủ đề (hoặc không khớp bộ lọc).</td></tr>';
      return;
    }
    tbody.innerHTML = list.map(function (t) {
      var s = t.stats;
      return '<tr>' +
        '<td><span style="font-weight:600;color:var(--ix-text-primary)">#' + esc(t.name) + '</span>' +
          '<div style="font-size:11px;color:var(--ix-text-muted);margin-top:2px">' + esc(t.slug) + '</div></td>' +
        '<td>' + confirmedChip(t) + '</td>' +
        '<td>' + stocksCell(t) + '</td>' +
        '<td style="font-size:12px">' + s.likes + ' / <span style="color:var(--ix-danger)">' + s.dislikes + '</span></td>' +
        '<td>' + s.comments + '</td>' +
        '<td>' + s.shares + '</td>' +
        '<td style="font-weight:600">' + s.engagement.toFixed(1) + '</td>' +
        '<td>' + sentimentChip(t.authorSentimentLabel) + '<div style="font-size:11px;color:var(--ix-text-muted)">' + (s.sentimentPos + s.sentimentNeg) + ' bài khai báo</div></td>' +
        '<td>' + (t.mappedStoryId
          ? '<a href="/admin/cau-chuyen/chi-tiet?id=' + encodeURIComponent(t.mappedStoryId) + '" class="ix-chip ix-chip-success" style="text-decoration:none">Đã ánh xạ</a>'
          : (!t.confirmed
            ? '<span class="ix-chip ix-chip-secondary" title="Chỉ ánh xạ Chủ đề đã chính thức">Chưa đủ 100 lần</span>'
            : (canPerm('stories.registry.edit')
              ? '<button type="button" class="ix-btn ix-btn-icon" data-str-reg-map="' + esc(t.id) + '" title="Ánh xạ sang Câu chuyện"><i class="ti ti-books" style="font-size:14px"></i></button>'
              : '<span class="ix-chip ix-chip-secondary">Chưa</span>'))) + '</td>' +
      '</tr>';
    }).join('');
  }

  function openMapModal(topicId) {
    mappingTopicId = topicId;
    var t = Store.getTopic(topicId);
    if (!t) return;
    document.getElementById('adm-topic-map-name').textContent = '#' + t.name;
    document.getElementById('adm-topic-map-story-id').value = '';
    var box = document.getElementById('adm-topic-map-stocks');
    var rep = t.representativeStocks || {};
    if (!rep.stocks || !rep.stocks.length) {
      box.innerHTML = '<span class="ix-caption">Chưa có mã cổ phiếu nào được nhắc đến trong Chủ đề này.</span>';
    } else {
      box.innerHTML = '<div class="ix-caption ix-mb-8">Mã cổ phiếu đại diện (đã chốt lúc Chủ đề chính thức, tỷ trọng cộng dồn ≥80%, Leader = ' + esc(rep.leader || '—') + '):</div>' +
        rep.stocks.map(function (s) {
          return '<span class="ix-chip ix-chip-primary" style="margin:0 4px 4px 0">' + esc(s.ticker) + ' (' + Math.round(s.weight * 100) + '%)</span>';
        }).join('');
    }
    if (typeof global.ixOpenModal === 'function') global.ixOpenModal('modal-topic-map');
  }

  function submitMap() {
    if (!mappingTopicId) return;
    var storyId = (document.getElementById('adm-topic-map-story-id').value || '').trim();
    var payload = storyId ? { story_id: storyId } : {};
    Store.mapToStory(mappingTopicId, payload).then(function () {
      if (typeof global.ixCloseModal === 'function') global.ixCloseModal('modal-topic-map');
      renderTable();
      toast('Đã ánh xạ Chủ đề sang Câu chuyện', 'success');
    }).catch(function (err) {
      toast(err.message || 'Ánh xạ thất bại', 'danger');
    });
  }

  function bindEvents() {
    ['adm-str-reg-status', 'adm-str-reg-range'].forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('change', function () {
        if (id === 'adm-str-reg-range') {
          reload();
        } else {
          renderTable();
        }
      });
    });
    var search = document.getElementById('adm-str-reg-search');
    if (search) search.addEventListener('input', renderTable);

    var mapSubmit = document.getElementById('btn-topic-map-submit');
    if (mapSubmit) mapSubmit.addEventListener('click', submitMap);

    document.addEventListener('click', function (e) {
      var mapBtn = e.target.closest('[data-str-reg-map]');
      if (mapBtn) { e.preventDefault(); openMapModal(mapBtn.getAttribute('data-str-reg-map')); }
    });
  }

  function reload() {
    var tbody = document.getElementById('adm-str-reg-tbody');
    if (tbody) tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:24px;color:var(--ix-text-muted)">Đang tải từ database…</td></tr>';
    Store.loadFromApi(getRange()).then(renderTable).catch(function (err) {
      if (tbody) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:24px;color:var(--ix-danger)">' +
          esc(err.message || 'Không tải được Chủ đề') + '</td></tr>';
      }
      toast(err.message || 'Không tải được Chủ đề từ API', 'danger');
    });
  }

  function init() {
    if (!Store) { toast('Thiếu IfluxChuDeRegistryStore', 'danger'); return; }
    bindEvents();
    reload();
  }

  global.AdmChuDeRegistry = { init: init, refresh: renderTable };
  global.AdmStoryRegistry = global.AdmChuDeRegistry;
})(window);
