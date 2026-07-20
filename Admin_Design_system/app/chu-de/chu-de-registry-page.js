/* ADM-STR-001 — Danh mục Chủ đề (API content_chu_de) */
(function (global) {
  'use strict';

  var Store = global.IfluxChuDeRegistryStore;
  var editingId = null;

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

  function chip(meta, value) {
    if (!meta || !meta[value]) return esc(value);
    var m = meta[value];
    return '<span class="ix-chip ix-chip-' + m.color + '">' + esc(m.label) + '</span>';
  }

  function getFilters() {
    return {
      keyword: ((document.getElementById('adm-str-reg-search') || {}).value || '').trim().toLowerCase(),
      lifecycle: (document.getElementById('adm-str-reg-lifecycle') || {}).value || '',
      status: (document.getElementById('adm-str-reg-status') || {}).value || ''
    };
  }

  function renderTable() {
    if (!Store) return;
    var tbody = document.getElementById('adm-str-reg-tbody');
    if (!tbody) return;
    var list = Store.listStories(getFilters());
    if (!list.length) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:32px;color:var(--ix-text-muted);font-size:13px">Chưa có chủ đề (hoặc không khớp bộ lọc).</td></tr>';
      return;
    }
    tbody.innerHTML = list.map(function (s) {
      var stockN = Store.countStocks(s.id) || s.mapping_count || 0;
      return '<tr>' +
        '<td><a href="/admin/chu-de/detail?id=' + encodeURIComponent(s.id) + '" style="font-weight:600;color:var(--ix-text-primary);text-decoration:none">' + esc(s.name) + '</a>' +
          '<div style="font-size:11px;color:var(--ix-text-muted);margin-top:2px">' + esc(s.slug) + '</div></td>' +
        '<td>' + chip(Store.LIFECYCLE_META, s.lifecycle) + '</td>' +
        '<td>' + chip(Store.STATUS_META, s.status) + '</td>' +
        '<td>' + stockN + '</td>' +
        '<td>' + esc(s.createdBy) + '</td>' +
        '<td style="font-size:12px;color:var(--ix-text-muted)">' + esc(fmtDate(s.updatedAt)) + '</td>' +
        '<td><div style="display:flex;gap:4px;flex-wrap:wrap">' +
          '<a href="/admin/chu-de/detail?id=' + encodeURIComponent(s.id) + '" class="ix-btn ix-btn-icon" title="Chi tiết"><i class="ti ti-file-description" style="font-size:14px"></i></a>' +
          '<a href="/admin/chu-de/mapping?id=' + encodeURIComponent(s.id) + '" class="ix-btn ix-btn-icon" title="Ánh xạ"><i class="ti ti-route" style="font-size:14px"></i></a>' +
          '<button type="button" class="ix-btn ix-btn-icon" data-str-reg-edit="' + esc(s.id) + '" title="Sửa"><i class="ti ti-edit" style="font-size:14px"></i></button>' +
          '<button type="button" class="ix-btn ix-btn-icon" data-str-reg-archive="' + esc(s.id) + '" title="Lưu trữ"><i class="ti ti-archive" style="font-size:14px"></i></button>' +
        '</div></td>' +
      '</tr>';
    }).join('');
  }

  function fillLifecycleSelect(el, selected, withAll) {
    if (!el || !Store) return;
    var html = withAll ? '<option value="">Tất cả</option>' : '';
    html += Store.LIFECYCLE_ORDER.map(function (k) {
      var m = Store.LIFECYCLE_META[k];
      return '<option value="' + k + '"' + (selected === k ? ' selected' : '') + '>' + esc(m.label) + '</option>';
    }).join('');
    el.innerHTML = html;
    if (withAll && (selected == null || selected === '')) el.value = '';
  }

  function openForm(id) {
    editingId = id || null;
    var s = id ? Store.getStory(id) : null;
    document.getElementById('adm-str-reg-form-title').textContent = s ? 'Sửa chủ đề' : 'Tạo chủ đề mới';
    document.getElementById('adm-str-reg-name').value = s ? s.name : '';
    document.getElementById('adm-str-reg-desc').value = s ? s.description : '';
    fillLifecycleSelect(document.getElementById('adm-str-reg-form-lifecycle'), s ? s.lifecycle : 'emerging', false);
    document.getElementById('adm-str-reg-form-status').value = s ? s.status : 'new';
    if (typeof global.ixOpenModal === 'function') global.ixOpenModal('modal-str-reg-form');
  }

  function saveForm() {
    var name = (document.getElementById('adm-str-reg-name').value || '').trim();
    if (!name) { toast('Tên chủ đề là bắt buộc', 'danger'); return; }
    Store.upsertStory({
      id: editingId || undefined,
      name: name,
      description: (document.getElementById('adm-str-reg-desc').value || '').trim(),
      lifecycle: document.getElementById('adm-str-reg-form-lifecycle').value,
      status: document.getElementById('adm-str-reg-form-status').value
    }).then(function () {
      if (typeof global.ixCloseModal === 'function') global.ixCloseModal('modal-str-reg-form');
      renderTable();
      toast('Đã lưu chủ đề vào database', 'success');
    }).catch(function (err) {
      toast(err.message || 'Lưu thất bại', 'danger');
    });
  }

  function openMerge() {
    toast('Gộp chủ đề trên DB sẽ bổ sung ở bước sau — dùng tạo/sửa trực tiếp.', 'warning');
  }

  function doMerge() { /* reserved */ }

  function bindEvents() {
    var addBtn = document.getElementById('btn-str-reg-add');
    if (addBtn) addBtn.addEventListener('click', function () { openForm(null); });
    var saveBtn = document.getElementById('btn-str-reg-save');
    if (saveBtn) saveBtn.addEventListener('click', saveForm);
    var mergeBtn = document.getElementById('btn-str-reg-merge');
    if (mergeBtn) mergeBtn.addEventListener('click', openMerge);
    var mergeConfirm = document.getElementById('btn-str-merge-confirm');
    if (mergeConfirm) mergeConfirm.addEventListener('click', doMerge);
    ['adm-str-reg-lifecycle', 'adm-str-reg-status'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener('change', renderTable);
    });
    var search = document.getElementById('adm-str-reg-search');
    if (search) search.addEventListener('input', renderTable);
    document.addEventListener('click', function (e) {
      var edit = e.target.closest('[data-str-reg-edit]');
      if (edit) { e.preventDefault(); openForm(edit.getAttribute('data-str-reg-edit')); return; }
      var arch = e.target.closest('[data-str-reg-archive]');
      if (arch) {
        e.preventDefault();
        if (!confirm('Lưu trữ chủ đề này?')) return;
        Store.archiveStory(arch.getAttribute('data-str-reg-archive')).then(function () {
          renderTable();
          toast('Đã lưu trữ', 'success');
        }).catch(function (err) {
          toast(err.message || 'Lưu trữ thất bại', 'danger');
        });
      }
    });
  }

  function init() {
    if (!Store) { toast('Thiếu IfluxChuDeRegistryStore', 'danger'); return; }
    fillLifecycleSelect(document.getElementById('adm-str-reg-lifecycle'), '', true);
    bindEvents();
    var tbody = document.getElementById('adm-str-reg-tbody');
    if (tbody) tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--ix-text-muted)">Đang tải từ database…</td></tr>';
    function done() {
      /* Reset filter về Tất cả rồi vẽ — tránh state filter stale làm list rỗng */
      var life = document.getElementById('adm-str-reg-lifecycle');
      var st = document.getElementById('adm-str-reg-status');
      if (life) life.value = '';
      if (st) st.value = '';
      renderTable();
    }
    Store.loadFromApi().then(done).catch(function (err) {
      if (tbody) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--ix-danger)">' +
          esc(err.message || 'Không tải được chủ đề') + '</td></tr>';
      }
      toast(err.message || 'Không tải được chủ đề từ API', 'danger');
    });
  }

  global.AdmChuDeRegistry = { init: init, refresh: renderTable };
  global.AdmStoryRegistry = global.AdmChuDeRegistry;
})(window);
