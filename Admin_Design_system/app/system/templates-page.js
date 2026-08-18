/**
 * ADM-SYS-012 — Templates page (dạng danh sách giống Thư viện Widget).
 * Mỗi template = 1 hàng 2 cột: trái = Định danh + Đầu vào + Trường hợp hiển thị
 * + Đặc tả + Thông tin kỹ thuật; phải = preview demo (bấm Xem).
 *
 * Quy tắc chỉnh sửa Template (2 mode):
 *  - View Mode (mặc định): toàn bộ dữ liệu read-only, không dirty state.
 *  - Edit Mode (bấm Sửa): sửa trên WORKING COPY (state.draft), preview realtime
 *    theo working copy nhưng KHÔNG ghi Store. Chỉ bấm Lưu mới persist (saveEdit
 *    transaction 1 lần). Bấm Hủy vứt working copy — khôi phục snapshot trước Edit.
 *  - Thông tin kỹ thuật luôn read-only (metadata audit, không chỉnh sửa).
 */
(function (global) {
  'use strict';

  var state = {
    q: '',
    editingId: null,
    draft: null,
    previewIds: {},
    runtimeTab: {},
    runtimeMode: {}
  };

  function cat() { return global.TemplatesCatalog; }
  function store() { return global.TemplatesStore; }
  function preview() { return global.TemplatesPreview; }
  function toast(msg, type) { if (global.ixToast) ixToast(msg, type || 'success'); }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function matches(t) {
    if (state.q) {
      var hay = (t.id + ' ' + store().getName(t) + ' ' + store().getDescription(t) + ' ' +
        t.inputs.slice(2).map(function (i) { return i.label; }).join(' ') + ' ' +
        store().getCases(t).join(' ') + ' ' + store().getSpec(t)).toLowerCase();
      if (hay.indexOf(state.q) < 0) return false;
    }
    return true;
  }

  /* ---------- Working copy (transaction: Sửa → sửa draft → Lưu/Hủy) ---------- */

  function buildDraft(t) {
    return {
      id: t.id,
      name: store().getName(t),
      description: store().getDescription(t),
      demo: store().getDemo(t).slice(),
      headers: t.headers ? store().getHeaders(t) : null,
      casesText: store().getCases(t).join('\n'),
      spec: store().getSpec(t)
    };
  }

  function isDraft(id) { return state.editingId === id && state.draft && state.draft.id === id; }

  function previewArgs(t) {
    if (isDraft(t.id)) {
      return {
        demo: state.draft.demo,
        overrides: state.draft.headers ? { headers: state.draft.headers } : null
      };
    }
    return { demo: store().getDemo(t), overrides: null };
  }

  function renderStats() {
    var el = document.getElementById('tpl-stats');
    if (!el || !cat()) return;
    var s = cat().stats();
    el.innerHTML = '<span class="ix-chip ix-chip-info">' + s.templates + ' mẫu giao diện</span>';
  }

  /* ---------- Blocks ---------- */

  function identityBlock(t) {
    var d = state.draft;
    return '<div class="tpl-col">' +
      '<div class="tpl-col__label">Định danh Template <span class="tpl-col__hint">(không phải dữ liệu mẫu)</span></div>' +
      '<label class="tpl-input-line__label" style="margin-bottom:4px">Tên Template</label>' +
      '<input type="text" class="ix-input tpl-demo" data-tpl-draft="name" value="' + esc(d.name) + '" />' +
      '<label class="tpl-input-line__label" style="margin:8px 0 4px">Mô tả Template</label>' +
      '<textarea class="ix-input tpl-spec-edit" rows="2" data-tpl-draft="description">' + esc(d.description) + '</textarea>' +
    '</div>';
  }

  function inputsBlock(t, isEditing) {
    var demo = isEditing ? state.draft.demo : store().getDemo(t);
    var lines = t.inputs.slice(2).map(function (inp, bodyIdx) {
      var idx = bodyIdx + 2;
      var val = demo[idx] || '';
      var control = isEditing
        ? '<input type="text" class="ix-input tpl-demo" data-tpl-draft-demo="' + idx + '" value="' + esc(val) + '" placeholder="dữ liệu demo (ngăn cách bằng | )" />'
        : '<span class="tpl-demo-ro">' + esc(val || '—') + '</span>';
      return '<div class="tpl-input-line">' +
        '<span class="tpl-input-line__label"><i class="ti ti-point-filled tpl-line__dot"></i>' + esc(inp.label) + '</span>' +
        control +
      '</div>';
    }).join('');
    return '<div class="tpl-col">' +
      '<div class="tpl-col__label">Dữ liệu mẫu <span class="tpl-col__hint">(contract dữ liệu template cần — ví dụ mẫu, ngăn bằng dấu | )</span></div>' +
      lines +
    '</div>';
  }

  function headersBlock(t, isEditing) {
    if (!t.headers) return '';
    var h = isEditing ? state.draft.headers : store().getHeaders(t);
    function line(label, side, val) {
      var control = isEditing
        ? '<input type="text" class="ix-input tpl-demo" data-tpl-draft="header-' + side + '" value="' + esc(val) + '" />'
        : '<span class="tpl-demo-ro">' + esc(val || '—') + '</span>';
      return '<div class="tpl-input-line">' +
        '<span class="tpl-input-line__label"><i class="ti ti-point-filled tpl-line__dot"></i> ' + label + '</span>' +
        control +
      '</div>';
    }
    return '<div class="tpl-col">' +
      '<div class="tpl-col__label">Nhãn cột <span class="tpl-col__hint">(content — chỉnh được, không thuộc Design Token)</span></div>' +
      line('Nhãn cột trái', 'left', h.left) +
      line('Nhãn cột phải', 'right', h.right) +
    '</div>';
  }

  function casesBlock(t, isEditing) {
    if (isEditing) {
      return '<div class="tpl-col">' +
        '<div class="tpl-col__label">Các trường hợp hiển thị <span class="tpl-col__hint">(yếu tố gom code — mỗi dòng 1 trường hợp)</span></div>' +
        '<textarea class="ix-input tpl-spec-edit" rows="3" data-tpl-draft="cases">' + esc(state.draft.casesText) + '</textarea>' +
      '</div>';
    }
    var rows = store().getCases(t).map(function (c) {
      return '<div class="tpl-line"><i class="ti ti-layout-2 tpl-line__dot"></i>' + esc(c) + '</div>';
    }).join('') || '<div class="tpl-line">—</div>';
    return '<div class="tpl-col">' +
      '<div class="tpl-col__label">Các trường hợp hiển thị <span class="tpl-col__hint">(yếu tố gom code)</span></div>' +
      rows +
    '</div>';
  }

  function specBlock(t, isEditing) {
    if (isEditing) {
      return '<div class="tpl-col">' +
        '<div class="tpl-col__label">Đặc tả hiển thị</div>' +
        '<textarea class="ix-input tpl-spec-edit" rows="4" data-tpl-draft="spec">' + esc(state.draft.spec) + '</textarea>' +
      '</div>';
    }
    var spec = store().getSpec(t);
    return '<div class="tpl-col">' +
      '<div class="tpl-col__label">Đặc tả hiển thị</div>' +
      '<div class="tpl-spec-text">' + esc(spec || '—') + '</div>' +
    '</div>';
  }

  function resourceList(arr) {
    if (!arr || !arr.length) return '<span class="tpl-line" style="color:var(--ix-text-muted)">Chưa khai báo</span>';
    return arr.map(function (f) {
      return '<div class="tpl-line"><i class="ti ti-file-code tpl-line__dot"></i><code>' + esc(f) + '</code></div>';
    }).join('');
  }

  function techGroup(label, arr) {
    return '<div class="tpl-line" style="margin-top:6px"><span class="tpl-input-line__label" style="flex:0 0 120px">' + esc(label) + '</span></div>' +
      resourceList(arr);
  }

  function webImpl() { return global.TemplateWebImplementations; }

  function webStatus(templateId) {
    return webImpl() && webImpl().status ? webImpl().status(templateId) : 'draft';
  }

  function runtimeTabOf(id) {
    return state.runtimeTab[id] || 'web';
  }

  function runtimeModeOf(id) {
    return state.runtimeMode[id] || 'preview';
  }

  function statusChip(templateId) {
    var st = webStatus(templateId);
    if (st === 'ready') {
      return '<span class="ix-chip ix-chip-success">Web · Ready</span>';
    }
    return '<span class="ix-chip ix-chip-warning">Web · Draft</span>';
  }

  /* Runtime Implement — Admin chỉ xem Ready/Draft + module (Developer đăng ký). */
  function runtimeImplementPanel(t) {
    var tab = runtimeTabOf(t.id);
    if (tab !== 'web') {
      return '<p class="tpl-pv-hint">Runtime này chưa mở Implementation trong giai đoạn Web-first.<br/>Chỉ xem trạng thái — không nhập path module.</p>';
    }
    var row = webImpl() && webImpl().impl ? webImpl().impl(t.id) : null;
    var st = webStatus(t.id);
    return '<div class="tpl-pv-live">' +
      '<div class="tpl-line"><span class="tpl-input-line__label" style="flex:0 0 140px">Trạng thái</span>' +
        (st === 'ready'
          ? '<span class="ix-chip ix-chip-success">Ready</span>'
          : '<span class="ix-chip ix-chip-warning">Draft</span>') +
      '</div>' +
      '<div class="tpl-line"><span class="tpl-input-line__label" style="flex:0 0 140px">Runtime</span><code>web</code></div>' +
      '<div class="tpl-line"><span class="tpl-input-line__label" style="flex:0 0 140px">Entry (Build)</span><code>' +
        esc(row && row.module ? row.module : '— chưa đăng ký') + '</code></div>' +
      '<p class="tpl-col__hint" style="margin-top:10px">Admin chỉ xem. Developer/Build đăng ký Implementation — không nhập path trên UI này.</p>' +
    '</div>';
  }

  function runtimeToolbar(t) {
    var tab = runtimeTabOf(t.id);
    var mode = runtimeModeOf(t.id);
    return '<div class="tpl-rt-bar">' +
      '<div class="tpl-rt-tabs">' +
        '<button type="button" class="ix-btn ix-btn-sm ' + (tab === 'web' ? 'ix-btn-primary' : 'ix-btn-outline') + '" data-tpl-rt-tab="web" data-tpl-id="' + esc(t.id) + '">Web</button>' +
        '<button type="button" class="ix-btn ix-btn-sm ix-btn-outline" disabled title="Chưa mở">Mobile</button>' +
      '</div>' +
      '<div class="tpl-rt-modes">' +
        '<button type="button" class="ix-btn ix-btn-sm ' + (mode === 'preview' ? 'ix-btn-primary' : 'ix-btn-outline') + '" data-tpl-rt-mode="preview" data-tpl-id="' + esc(t.id) + '">Preview</button>' +
        '<button type="button" class="ix-btn ix-btn-sm ' + (mode === 'implement' ? 'ix-btn-primary' : 'ix-btn-outline') + '" data-tpl-rt-mode="implement" data-tpl-id="' + esc(t.id) + '">Runtime Implement</button>' +
      '</div>' +
    '</div>';
  }

  /* Luôn read-only — metadata audit, không chỉnh sửa kể cả Edit Mode. */
  function techBlock(t) {
    var res = t.resources || {};
    var previewType = (t.preview && t.preview.type) || '—';
    return '<div class="tpl-col tpl-col--tech">' +
      '<div class="tpl-col__label">Thông tin kỹ thuật <span class="tpl-col__hint">(General · metadata audit · luôn read-only)</span></div>' +
      '<div class="tpl-line"><span class="tpl-input-line__label" style="flex:0 0 120px">Renderer</span><code>' + esc(t.render || '—') + '</code></div>' +
      '<div class="tpl-line"><span class="tpl-input-line__label" style="flex:0 0 120px">Preview Widget</span><code>' + esc(previewType) + '</code></div>' +
      techGroup('Component', res.component) +
      techGroup('CSS', res.css) +
      techGroup('JS', res.js) +
      techGroup('Library', res.library) +
    '</div>';
  }

  function renderRow(t) {
    var isEditing = isDraft(t.id);
    var name = isEditing ? state.draft.name : store().getName(t);
    var desc = isEditing ? state.draft.description : store().getDescription(t);
    var actions = isEditing
      ? '<button type="button" class="ix-btn ix-btn-success ix-btn-sm" data-tpl-save="' + esc(t.id) + '"><i class="ti ti-device-floppy"></i> Lưu</button>' +
        '<button type="button" class="ix-btn ix-btn-outline ix-btn-sm" data-tpl-cancel="' + esc(t.id) + '">Hủy</button>'
      : '<button type="button" class="ix-btn ix-btn-outline ix-btn-sm" data-tpl-edit="' + esc(t.id) + '"><i class="ti ti-pencil"></i> Sửa</button>' +
        '<button type="button" class="ix-btn ix-btn-primary ix-btn-sm" data-tpl-view="' + esc(t.id) + '"><i class="ti ti-eye"></i> Xem</button>';

    return '<div class="tpl-row ix-card" data-tpl-row="' + esc(t.id) + '">' +
      '<div class="tpl-row__left">' +
        '<div class="tpl-row__head">' +
          '<div class="tpl-row__meta">' +
            '<code class="tpl-row__id">' + esc(t.id) + '</code>' +
            statusChip(t.id) +
          '</div>' +
          '<div class="tpl-row__actions">' + actions + '</div>' +
        '</div>' +
        '<div class="tpl-col__label">General</div>' +
        (isEditing
          ? identityBlock(t)
          : '<h3 class="ix-card-title tpl-row__title">' + esc(name) + '</h3>' +
            (desc ? '<p class="ix-card-subtitle tpl-row__desc">' + esc(desc) + '</p>' : '')) +
        inputsBlock(t, isEditing) +
        headersBlock(t, isEditing) +
        casesBlock(t, isEditing) +
        specBlock(t, isEditing) +
        techBlock(t) +
      '</div>' +
      '<div class="tpl-row__right">' +
        runtimeToolbar(t) +
        '<div data-tpl-preview="' + esc(t.id) + '"></div>' +
      '</div>' +
    '</div>';
  }

  function paintRightPanel(t) {
    var mount = document.querySelector('[data-tpl-preview="' + t.id + '"]');
    if (!mount) return;
    var mode = runtimeModeOf(t.id);
    if (mode === 'implement') {
      mount.innerHTML = runtimeImplementPanel(t);
      return;
    }
    if (!preview()) return;
    if (state.previewIds[t.id]) {
      var a = previewArgs(t);
      preview().render(mount, t, a.demo, a.overrides);
    } else if (preview().empty) {
      preview().empty(mount);
    } else {
      mount.innerHTML = '<p class="tpl-pv-hint">Bấm <strong>Xem</strong> để Preview Runtime Web.</p>';
    }
  }

  function renderRoot() {
    var root = document.getElementById('tpl-root');
    if (!root || !cat()) return;
    var items = cat().all().filter(matches);
    if (!items.length) {
      root.innerHTML = '<div class="ix-card"><div class="ix-card-body" style="text-align:center;padding:32px;color:var(--ix-text-muted)">Không có mẫu giao diện khớp tìm kiếm.</div></div>';
      return;
    }
    root.innerHTML = items.map(renderRow).join('');
    items.forEach(function (t) { paintRightPanel(t); });
    var stamp = document.getElementById('tpl-updated');
    if (stamp) {
      var u = store().read().updatedAt;
      stamp.textContent = u
        ? 'Lưu cục bộ lần cuối: ' + new Date(u).toLocaleString('vi-VN')
        : 'Chưa chỉnh sửa — đang dùng dữ liệu demo và đặc tả mặc định.';
    }
  }

  function render() { renderStats(); renderRoot(); }

  function viewTemplate(id) {
    var t = cat().byId(id);
    state.previewIds[id] = true;
    state.runtimeMode[id] = 'preview';
    var row = document.querySelector('[data-tpl-row="' + id + '"]');
    if (row) row.classList.add('is-previewing');
    if (t) paintRightPanel(t);
    else renderRoot();
  }

  function refreshPreviewIfShown(id) {
    if (!state.previewIds[id] && runtimeModeOf(id) !== 'implement') return;
    var t = cat().byId(id);
    if (t) paintRightPanel(t);
  }

  function saveDraft(id) {
    if (!isDraft(id)) return;
    var d = state.draft;
    var demoMap = {};
    d.demo.forEach(function (v, idx) { if (idx >= 2) demoMap[idx] = v; });
    var cases = d.casesText.split('\n')
      .map(function (s) { return s.trim(); })
      .filter(function (s) { return s !== ''; });
    store().saveEdit(id, {
      name: d.name,
      description: d.description,
      demo: demoMap,
      headers: d.headers,
      cases: cases,
      spec: d.spec
    });
    state.editingId = null;
    state.draft = null;
    renderRoot();
    toast('Đã lưu Template.');
  }

  function cancelDraft() {
    state.editingId = null;
    state.draft = null;
    renderRoot(); // Store chưa từng bị ghi trong Edit → render lại = khôi phục snapshot
  }

  function bind() {
    var search = document.getElementById('tpl-search');
    if (search) search.addEventListener('input', function () { state.q = search.value.trim().toLowerCase(); renderRoot(); });

    var root = document.getElementById('tpl-root');
    if (!root) return;

    root.addEventListener('click', function (e) {
      var rtTab = e.target.closest('[data-tpl-rt-tab]');
      if (rtTab) {
        var tid = rtTab.getAttribute('data-tpl-id');
        state.runtimeTab[tid] = rtTab.getAttribute('data-tpl-rt-tab') || 'web';
        renderRoot();
        return;
      }
      var rtMode = e.target.closest('[data-tpl-rt-mode]');
      if (rtMode) {
        var mid = rtMode.getAttribute('data-tpl-id');
        var mode = rtMode.getAttribute('data-tpl-rt-mode') || 'preview';
        state.runtimeMode[mid] = mode;
        if (mode === 'preview') state.previewIds[mid] = true;
        renderRoot();
        return;
      }
      var view = e.target.closest('[data-tpl-view]');
      if (view) { viewTemplate(view.getAttribute('data-tpl-view')); return; }
      var edit = e.target.closest('[data-tpl-edit]');
      if (edit) {
        var eid = edit.getAttribute('data-tpl-edit');
        var t = cat().byId(eid);
        if (!t) return;
        state.editingId = eid;
        state.draft = buildDraft(t);
        renderRoot();
        return;
      }
      var save = e.target.closest('[data-tpl-save]');
      if (save) { saveDraft(save.getAttribute('data-tpl-save')); return; }
      var cancel = e.target.closest('[data-tpl-cancel]');
      if (cancel) { cancelDraft(); return; }
    });

    /* Edit Mode: mọi thay đổi chỉ ghi vào working copy; preview realtime; KHÔNG ghi Store. */
    root.addEventListener('input', function (e) {
      if (!state.draft) return;
      var el = e.target;
      if (!el.getAttribute) return;
      var demoIdx = el.getAttribute('data-tpl-draft-demo');
      if (demoIdx != null) {
        state.draft.demo[Number(demoIdx)] = el.value;
        refreshPreviewIfShown(state.draft.id);
        return;
      }
      var field = el.getAttribute('data-tpl-draft');
      if (!field) return;
      if (field === 'name') state.draft.name = el.value;
      else if (field === 'description') state.draft.description = el.value;
      else if (field === 'spec') state.draft.spec = el.value;
      else if (field === 'cases') state.draft.casesText = el.value;
      else if (field === 'header-left' && state.draft.headers) {
        state.draft.headers.left = el.value;
        refreshPreviewIfShown(state.draft.id);
      } else if (field === 'header-right' && state.draft.headers) {
        state.draft.headers.right = el.value;
        refreshPreviewIfShown(state.draft.id);
      }
    });

    var reset = document.getElementById('tpl-reset');
    if (reset) reset.addEventListener('click', function () {
      if (!window.confirm('Khôi phục toàn bộ định danh, dữ liệu mẫu và đặc tả về mặc định?')) return;
      store().resetAll();
      state.editingId = null;
      state.draft = null;
      state.previewIds = {};
      render();
      toast('Đã khôi phục mặc định.');
    });
  }

  function init() { if (!cat()) return; bind(); render(); }

  global.TemplatesPage = { init: init, render: render };
})(window);
