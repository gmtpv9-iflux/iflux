/* ADM-STR-002 — Chủ đề Detail / Edit */
(function (global) {
  'use strict';

  var Store = global.IfluxChuDeRegistryStore;
  var storyId = '';

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function toast(msg, type) {
    if (typeof global.ixToast === 'function') global.ixToast(msg, type || 'primary');
  }

  function fmtDate(iso) {
    if (!iso) return '—';
    try { return new Date(iso).toLocaleString('vi-VN'); } catch (e) { return iso; }
  }

  function parseId() {
    return new URLSearchParams(global.location.search).get('id') || '';
  }

  function chip(meta, value) {
    if (!meta || !meta[value]) return esc(value);
    var m = meta[value];
    return '<span class="ix-chip ix-chip-' + m.color + '">' + esc(m.label) + '</span>';
  }

  function renderNotFound() {
    var root = document.getElementById('adm-str-detail-root');
    if (!root) return;
    root.innerHTML = '<div class="ix-card" style="padding:32px;text-align:center"><p>Không tìm thấy chủ đề.</p><a href="/admin/cong-dong/danh-sach-chu-de" class="ix-btn ix-btn-primary ix-btn-sm">Về danh sách chủ đề</a></div>';
  }

  function renderHistory(items) {
    if (!items.length) return '<p style="font-size:13px;color:var(--ix-text-muted);margin:0">Chưa có lịch sử.</p>';
    return '<ul class="adm-str-history">' + items.map(function (h) {
      return '<li><span class="adm-str-history__time">' + esc(fmtDate(h.at)) + '</span> ' +
        '<strong>' + esc(h.actor) + '</strong> — ' + esc(h.detail) + '</li>';
    }).join('') + '</ul>';
  }

  function renderMappingPreview(storyId) {
    var stocks = Store.listMappings(storyId, 'stock').slice(0, 8);
    var sectors = Store.listMappings(storyId, 'sector').slice(0, 4);
    var stockHtml = stocks.length
      ? stocks.map(function (m) { return '<span class="ix-chip ix-chip-sm">' + esc(m.entityLabel) + '</span>'; }).join(' ')
      : '<span style="color:var(--ix-text-muted);font-size:12px">Chưa ánh xạ mã</span>';
    var sectorHtml = sectors.length
      ? sectors.map(function (m) { return esc(m.entityLabel); }).join(', ')
      : '—';
    return (
      '<div style="display:grid;gap:12px;font-size:13px">' +
        '<div><span style="color:var(--ix-text-muted)">Cổ phiếu</span><div style="margin-top:6px;display:flex;flex-wrap:wrap;gap:4px">' + stockHtml + '</div></div>' +
        '<div><span style="color:var(--ix-text-muted)">Ngành</span><div style="margin-top:4px">' + sectorHtml + '</div></div>' +
        '<a href="/admin/chu-de/mapping?id=' + encodeURIComponent(storyId) + '" class="ix-btn ix-btn-outline ix-btn-sm"><i class="ti ti-route"></i> Quản lý ánh xạ</a>' +
      '</div>'
    );
  }

  function render(story) {
    var root = document.getElementById('adm-str-detail-root');
    if (!root) return;
    var a = story.analytics || {};
    var history = Store.listHistory(story.id).slice(0, 8);
    document.title = story.name + ' · Chủ đề · iFlux Admin';

    root.innerHTML =
      '<div class="ix-breadcrumb ix-mb-24"><a href="/admin/cong-dong/danh-sach-chu-de">Danh sách chủ đề</a><i class="ti ti-chevron-right" style="font-size:12px"></i><span>' + esc(story.name) + '</span></div>' +
      '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:20px">' +
        '<div><h1 class="ix-page-title" style="margin:0">' + esc(story.name) + '</h1>' +
        '<p style="font-size:13px;color:var(--ix-text-muted);margin:6px 0 0">' + esc(story.slug) + '</p></div>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
          chip(Store.LIFECYCLE_META, story.lifecycle) +
          chip(Store.STATUS_META, story.status) +
        '</div>' +
      '</div>' +
      '<div class="adm-str-detail-grid">' +
        '<div class="ix-card adm-str-detail-card">' +
          '<h3 class="adm-str-section-title">Thông tin cơ bản</h3>' +
          '<div class="ix-form-group"><label class="ix-label">Tên chủ đề</label><input class="ix-input" id="adm-str-d-name" value="' + esc(story.name) + '" /></div>' +
          '<div class="ix-form-group"><label class="ix-label">Mô tả</label><textarea class="ix-input" id="adm-str-d-desc" rows="4">' + esc(story.description) + '</textarea></div>' +
          '<div class="ix-form-group"><label class="ix-label">Trạng thái</label><select class="ix-select" id="adm-str-d-status">' +
            Object.keys(Store.STATUS_META).map(function (k) {
              return '<option value="' + k + '"' + (story.status === k ? ' selected' : '') + '>' + esc(Store.STATUS_META[k].label) + '</option>';
            }).join('') +
          '</select></div>' +
          '<button type="button" class="ix-btn ix-btn-primary ix-btn-sm" id="btn-str-d-save"><i class="ti ti-device-floppy"></i> Lưu thay đổi</button>' +
        '</div>' +
        '<div class="ix-card adm-str-detail-card">' +
          '<h3 class="adm-str-section-title">Vòng đời</h3>' +
          '<p style="font-size:13px;color:var(--ix-text-muted);margin:0 0 12px">Hiện tại: ' + chip(Store.LIFECYCLE_META, story.lifecycle) + '</p>' +
          '<div class="adm-str-lifecycle-row">' +
            Store.LIFECYCLE_ORDER.map(function (k) {
              var active = story.lifecycle === k ? ' is-active' : '';
              return '<button type="button" class="adm-str-lifecycle-btn' + active + '" data-str-lifecycle="' + k + '">' + esc(Store.LIFECYCLE_META[k].label) + '</button>';
            }).join('') +
          '</div>' +
        '</div>' +
        '<div class="ix-card adm-str-detail-card">' +
          '<h3 class="adm-str-section-title">Ánh xạ (preview)</h3>' +
          renderMappingPreview(story.id) +
        '</div>' +
        '<div class="ix-card adm-str-detail-card">' +
          '<h3 class="adm-str-section-title">Chỉ số vận hành</h3>' +
          '<div class="adm-str-metrics">' +
            '<div class="adm-str-metric"><span>Lượt xem</span><strong>' + (a.views || 0).toLocaleString('vi-VN') + '</strong></div>' +
            '<div class="adm-str-metric"><span>Bình luận</span><strong>' + (a.commentsCount || 0).toLocaleString('vi-VN') + '</strong></div>' +
            '<div class="adm-str-metric"><span>Yêu thích</span><strong>' + (a.favoritesCount || 0).toLocaleString('vi-VN') + '</strong></div>' +
            '<div class="adm-str-metric"><span>Số bài viết</span><strong>' + (a.postsCount || 0).toLocaleString('vi-VN') + '</strong></div>' +
          '</div>' +
          '<a href="analytics.html" class="ix-btn ix-btn-outline ix-btn-sm" style="margin-top:12px"><i class="ti ti-chart-line"></i> Xem phân tích</a>' +
        '</div>' +
        '<div class="ix-card adm-str-detail-card adm-str-detail-card--wide">' +
          '<h3 class="adm-str-section-title">Lịch sử thay đổi</h3>' +
          renderHistory(history) +
        '</div>' +
      '</div>';

    document.getElementById('btn-str-d-save').addEventListener('click', function () {
      Store.upsertStory({
        id: story.id,
        name: document.getElementById('adm-str-d-name').value,
        description: document.getElementById('adm-str-d-desc').value,
        status: document.getElementById('adm-str-d-status').value,
        lifecycle: story.lifecycle
      }).then(function () {
        toast('Đã lưu chủ đề', 'success');
        return Store.loadFromApi ? Store.loadFromApi() : null;
      }).then(function () {
        render(Store.getStory(story.id));
      }).catch(function (err) {
        toast((err && err.message) || 'Lưu thất bại', 'danger');
      });
    });

    root.querySelectorAll('[data-str-lifecycle]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var lc = btn.getAttribute('data-str-lifecycle');
        Store.setLifecycle(story.id, lc);
        toast('Đã cập nhật vòng đời', 'success');
        render(Store.getStory(story.id));
      });
    });
  }

  function init() {
    if (!Store) return;
    function boot() {
      storyId = parseId();
      if (!storyId) {
        var list = Store.listStories();
        if (list.length) {
          global.location.replace('detail.html?id=' + encodeURIComponent(list[0].id));
          return;
        }
        renderNotFound();
        return;
      }
      var story = Store.getStory(storyId);
      if (!story) { renderNotFound(); return; }
      render(story);
    }
    if (Store.loadFromApi) Store.loadFromApi().then(boot).catch(boot);
    else boot();
  }

  global.AdmChuDeDetail = { init: init };
  global.AdmStoryDetail = global.AdmChuDeDetail;
})(window);
