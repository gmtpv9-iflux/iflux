/* ADM-STR-003 — Chủ đề Mapping */
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

  function parseId() {
    return new URLSearchParams(global.location.search).get('id') || '';
  }

  function entitySections() {
    return [
      { type: 'stock', title: 'Cổ phiếu', icon: 'ti-building-bank', placeholder: 'VD: HPG, VCB' },
      { type: 'sector', title: 'Ngành', icon: 'ti-chart-dots-3', placeholder: 'VD: Thép, Ngân hàng' },
      { type: 'ecosystem', title: 'Hệ sinh thái', icon: 'ti-hierarchy-2', placeholder: 'VD: Họ HPG' },
      { type: 'story', title: 'Story liên quan', icon: 'ti-book-2', placeholder: 'VD: Nghị quyết NN' },
      { type: 'theme', title: 'Chủ đề macro', icon: 'ti-palette', placeholder: 'VD: Government Spending' }
    ];
  }

  function renderSection(storyId, section) {
    var items = Store.listMappings(storyId, section.type);
    var rows = items.length ? items.map(function (m) {
      return '<span class="adm-str-map-chip">' +
        esc(m.entityLabel) +
        '<button type="button" class="adm-str-map-chip__x" data-str-map-del="' + esc(m.id) + '" title="Xóa">&times;</button>' +
      '</span>';
    }).join('') : '<span style="font-size:12px;color:var(--ix-text-muted)">Chưa có ánh xạ</span>';

    return (
      '<div class="ix-card adm-str-map-section" data-str-map-type="' + section.type + '">' +
        '<div class="adm-str-map-section__head">' +
          '<h3><i class="ti ' + section.icon + '"></i> ' + esc(section.title) + ' <span class="ix-chip ix-chip-sm">' + items.length + '</span></h3>' +
          '<button type="button" class="ix-btn ix-btn-outline ix-btn-sm" data-str-map-add="' + section.type + '"><i class="ti ti-plus"></i> Thêm</button>' +
        '</div>' +
        '<div class="adm-str-map-section__body">' + rows + '</div>' +
      '</div>'
    );
  }

  function render() {
    var root = document.getElementById('adm-str-map-root');
    var story = Store.getStory(storyId);
    if (!root || !story) return;

    document.getElementById('adm-str-map-title').textContent = 'Story: ' + story.name;
    root.innerHTML = entitySections().map(function (s) {
      return renderSection(storyId, s);
    }).join('');

    root.querySelectorAll('[data-str-map-add]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        openAddModal(btn.getAttribute('data-str-map-add'));
      });
    });
    root.querySelectorAll('[data-str-map-del]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        Store.removeMapping(btn.getAttribute('data-str-map-del'));
        render();
        toast('Đã xóa ánh xạ', 'success');
      });
    });
  }

  function openAddModal(entityType) {
    document.getElementById('adm-str-map-entity-type').value = entityType;
    document.getElementById('adm-str-map-entity-id').value = '';
    document.getElementById('adm-str-map-entity-label').value = '';
    document.getElementById('adm-str-map-weight').value = '0.7';
    var titles = { stock: 'Thêm cổ phiếu', sector: 'Thêm ngành', ecosystem: 'Thêm HST', story: 'Thêm story liên quan', theme: 'Thêm chủ đề' };
    document.getElementById('adm-str-map-modal-title').textContent = titles[entityType] || 'Thêm ánh xạ';
    if (typeof global.ixOpenModal === 'function') global.ixOpenModal('modal-str-map-add');
  }

  function saveMapping() {
    var entityType = document.getElementById('adm-str-map-entity-type').value;
    var entityId = (document.getElementById('adm-str-map-entity-id').value || '').trim();
    var entityLabel = (document.getElementById('adm-str-map-entity-label').value || '').trim() || entityId;
    var weight = parseFloat(document.getElementById('adm-str-map-weight').value) || 0.7;
    if (!entityId) { toast('Nhập mã / tên entity', 'danger'); return; }
    var row = Store.addMapping({
      storyId: storyId,
      entityType: entityType,
      entityId: entityId,
      entityLabel: entityLabel,
      weight: weight
    });
    if (!row) { toast('Ánh xạ đã tồn tại', 'warning'); return; }
    if (typeof global.ixCloseModal === 'function') global.ixCloseModal('modal-str-map-add');
    render();
    toast('Đã thêm ánh xạ', 'success');
  }

  function fillStorySelect() {
    var sel = document.getElementById('adm-str-map-story-select');
    if (!sel) return;
    var stories = Store.listStories();
    sel.innerHTML = stories.map(function (s) {
      return '<option value="' + esc(s.id) + '"' + (s.id === storyId ? ' selected' : '') + '>' + esc(s.name) + '</option>';
    }).join('');
    sel.addEventListener('change', function () {
      if (global.IfluxAdminAppShell && global.IfluxAdminAppShell.navigate) global.IfluxAdminAppShell.navigate('mapping.html?id=' + encodeURIComponent(sel.value));
      else global.location.href = 'mapping.html?id=' + encodeURIComponent(sel.value);
    });
  }

  function init() {
    if (!Store) return;
    function boot() {
      storyId = parseId();
      if (!storyId) {
        var first = Store.listStories()[0];
        if (first) {
          global.location.replace('mapping.html?id=' + encodeURIComponent(first.id));
          return;
        }
      }
      fillStorySelect();
      render();
      var saveBtn = document.getElementById('btn-str-map-save');
      if (saveBtn && !saveBtn._bound) {
        saveBtn._bound = true;
        saveBtn.addEventListener('click', saveMapping);
      }
    }
    if (Store.loadFromApi) Store.loadFromApi().then(boot).catch(boot);
    else boot();
  }

  global.AdmChuDeMapping = { init: init };
  global.AdmStoryMapping = global.AdmChuDeMapping;
})(window);
