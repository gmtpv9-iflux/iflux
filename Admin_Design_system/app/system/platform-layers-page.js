/* ADM-SYS-007 — Platform 4-layer admin UI */
(function (global) {
  'use strict';

  var state = { tab: 'display', q: '', editing: null, creating: false, dnseLoaded: false };

  function adminToken() {
    var auth = global.IfluxAdminAuth;
    if (!auth || !auth.getSession) return null;
    var s = auth.getSession();
    return s && s.token ? s.token : null;
  }

  function apiBase() {
    var loc = global.location || {};
    if (loc.origin && loc.origin !== 'null') return loc.origin + '/api';
    return '/api';
  }

  function fetchDnseStatus() {
    var token = adminToken();
    if (!token) return Promise.resolve(null);
    return fetch(apiBase() + '/admin/dnse/status', {
      headers: { Authorization: 'Bearer ' + token, Accept: 'application/json' }
    }).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; });
  }

  function connectionChip(status) {
    if (status === 'connected') return 'ix-chip-success';
    if (status === 'auth_failed') return 'ix-chip-danger';
    if (status === 'missing_secret') return 'ix-chip-warning';
    return 'ix-chip';
  }

  function connectionLabel(status) {
    if (status === 'connected') return 'Đã kết nối';
    if (status === 'auth_failed') return 'Sai api_secret';
    if (status === 'missing_secret') return 'Thiếu api_secret';
    return 'Chưa probe';
  }

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function catalog() { return global.PlatformLayersCatalog; }
  function resolver() { return global.PlatformLayersResolver; }

  function switchTab(tab) {
    state.tab = tab;
    document.querySelectorAll('.pl-tab').forEach(function (btn) {
      btn.classList.toggle('active', btn.getAttribute('data-pl-tab') === tab);
    });
    document.querySelectorAll('.pl-panel').forEach(function (p) {
      p.hidden = p.id !== 'pl-panel-' + tab;
    });
    if (tab === 'raw' && !state.dnseLoaded) {
      loadDnseStatus(false).then(function () { render(); });
      return;
    }
    render();
  }

  function wlib() { return global.PlatformLayersWidgets; }

  function widgetMatches(w) {
    if (state.q) {
      var hay = (w.id + ' ' + w.title + ' ' + w.description + ' ' +
        (w.outputs || []).map(function (o) { return (o.symbol || '') + ' ' + o.name + ' ' + (o.formulaSpec || ''); }).join(' ')).toLowerCase();
      if (hay.indexOf(state.q) < 0) return false;
    }
    return true;
  }

  function renderDisplayLayer() {
    var wrap = document.getElementById('pl-display-root');
    if (!wrap || !wlib()) return;
    if (state.creating) {
      wrap.innerHTML = renderWidgetCreate();
      renderCardPreview(wrap.querySelector('[data-l4="__new__"]'));
      return;
    }
    var widgets = wlib().getDefinitions().filter(widgetMatches);
    if (!widgets.length) {
      wrap.innerHTML = '<div class="ix-card"><div class="ix-card-body" style="text-align:center;padding:40px;color:var(--ix-text-muted)">Không có widget phù hợp bộ lọc.</div></div>';
      return;
    }
    wrap.innerHTML = widgets.map(renderWidgetCard).join('');
    var editingCard = wrap.querySelector('[data-l4] [data-l4-preview]');
    if (editingCard) renderCardPreview(editingCard.closest('[data-l4]'));

    var stamp = document.getElementById('pl-l4-updated');
    if (stamp) {
      var u = wlib().updatedAt();
      stamp.textContent = u ? 'Đã sửa cục bộ · lần cuối ' + new Date(u).toLocaleString('vi-VN') : '';
    }
  }

  function blockLabel(id) {
    var Cat = global.EntitlementCatalog;
    if (Cat && Cat.getBlockLabel) return Cat.getBlockLabel(id);
    return id;
  }

  function srcBadge(source) {
    var lbl = wlib().SOURCE_LABELS[source] || source;
    var cls = source === 'L1' ? 'ix-chip-warning' : (source === 'L3' ? 'ix-chip-primary' : 'ix-chip-info');
    return '<span class="ix-chip ' + cls + '" style="font-size:10px">' + esc(lbl) + '</span>';
  }

  /* Badge nguồn cấp cho Tầng 1/2/3 (EXT/L1/L2/L3) + ref. */
  function layerSrcBadge(source, ref) {
    var C = catalog();
    var lbl = (C && C.LAYER_SRC_LABELS && C.LAYER_SRC_LABELS[source]) || source || '';
    var cls = source === 'L3' ? 'ix-chip-primary' : (source === 'L2' ? 'ix-chip-info' : 'ix-chip-warning');
    return '<span class="ix-chip ' + cls + '" style="font-size:10px">' + esc(lbl) + '</span>' +
      (ref ? ' <code style="font-size:10px">' + esc(ref) + '</code>' : '');
  }

  function ioInRows(io) {
    var inp = (io && io.inp) || [];
    if (!inp.length) return '<tr><td colspan="4" class="l4-muted">— (không tham số)</td></tr>';
    return inp.map(function (x) {
      return '<tr><td><code>' + esc(x.sym) + '</code></td><td>' + esc(x.name) + '</td>' +
        '<td><span class="ix-chip" style="font-size:10px">' + esc(x.type) + '</span></td>' +
        '<td>' + layerSrcBadge(x.source, x.ref) + '</td></tr>';
    }).join('');
  }

  function ioOutRows(io) {
    var out = (io && io.out) || [];
    if (!out.length) return '<tr><td colspan="3" class="l4-muted">—</td></tr>';
    return out.map(function (x) {
      return '<tr><td><code>' + esc(x.sym) + '</code></td><td>' + esc(x.name) + '</td>' +
        '<td><span class="ix-chip" style="font-size:10px">' + esc(x.type) + '</span></td></tr>';
    }).join('');
  }

  /* Khối đồng nhất: Đầu vào → Xử lý → Đầu ra (dùng cho Tầng 1/2/3). */
  function ioBlock(io, extraProcessHtml) {
    return '<div class="l4-sec"><div class="l4-label"><i class="ti ti-arrow-bar-down"></i> Dữ liệu đầu vào</div>' +
        '<table class="ix-table l4-table"><thead><tr><th>Ký hiệu</th><th>Tên dữ liệu</th><th>Kiểu</th><th>Nguồn</th></tr></thead><tbody>' + ioInRows(io) + '</tbody></table></div>' +
      '<div class="l4-sec"><div class="l4-label"><i class="ti ti-math-function"></i> Xử lý</div>' +
        '<div class="l4-spec">' + esc((io && io.spec) || '—') + '</div>' + (extraProcessHtml || '') + '</div>' +
      '<div class="l4-sec"><div class="l4-label"><i class="ti ti-arrow-bar-up"></i> Dữ liệu đầu ra</div>' +
        '<table class="ix-table l4-table"><thead><tr><th>Ký hiệu</th><th>Tên dữ liệu</th><th>Kiểu</th></tr></thead><tbody>' + ioOutRows(io) + '</tbody></table></div>';
  }

  function renderWidgetCard(w) {
    var editing = state.editing === w.id;
    return '<div class="ix-card l4-card" data-l4="' + esc(w.id) + '">' +
      (editing ? renderWidgetEdit(w) : renderWidgetView(w)) +
    '</div>';
  }

  function sourceKey(source) {
    if (source && source.kind === 'calculated') return 'calculated';
    if (source && source.kind === 'system') return source.layer || 'L2';
    return 'legacy';
  }

  function outSrcBadge(source) {
    var key = sourceKey(source);
    var lbl = key === 'calculated' ? 'Tính toán' :
      (key === 'L1' ? 'Tầng 1' : (key === 'L2' ? 'Tầng 2' : (key === 'L3' ? 'Tầng 3' : 'Chưa chuẩn hóa')));
    var cls = key === 'calculated' ? '' :
      (key === 'L3' ? ' ix-chip-primary' : (key === 'L2' ? ' ix-chip-info' : (key === 'L1' ? ' ix-chip-warning' : ' ix-chip-danger')));
    return '<span class="ix-chip' + cls + '" style="font-size:10px">' + esc(lbl) + '</span>';
  }

  function formulaRows(outputs) {
    var calculated = (outputs || []).filter(function (out) {
      return out.source && out.source.kind === 'calculated';
    });
    if (!calculated.length) return '<div class="l4-muted">— Không có Công thức; toàn bộ output lấy từ hệ thống.</div>';
    return '<ul class="l4-formula-list">' + calculated.map(function (out) {
      if (out.formulaSpec) return '<li><span class="l4-formula__rhs">' + esc(out.formulaSpec) + '</span></li>';
      return '<li><span class="l4-formula__lhs">' + esc(out.name) + '</span>' +
        '<span class="l4-formula__eq">=</span><span class="l4-formula__rhs">Chưa khai báo</span></li>';
    }).join('') + '</ul>';
  }

  function renderWidgetView(w) {
    var compat = wlib().compatibleTemplates(w);
    var tplOk = compat.indexOf(w.templateRef) >= 0;

    var outRows = (w.outputs || []).map(function (o) {
      return '<tr><td>' + esc(o.name) + '</td>' +
        '<td><span class="ix-chip" style="font-size:10px">' + esc(o.type) + '</span></td>' +
        '<td>' + outSrcBadge(o.source) + '</td>' +
        '<td>' + (o.demo ? '<code>' + esc(o.demo) + '</code>' : '<span class="l4-muted">—</span>') + '</td></tr>';
    }).join('');

    return '<div class="l4-head">' +
        '<div class="l4-head__meta"><span class="l4-section-tag">Widget</span></div>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
          '<button type="button" class="ix-btn ix-btn-outline ix-btn-sm" data-l4-edit="' + esc(w.id) + '"><i class="ti ti-pencil"></i> Sửa</button>' +
          '<button type="button" class="ix-btn ix-btn-outline ix-btn-sm" data-l4-delete="' + esc(w.id) + '"><i class="ti ti-trash"></i> Xóa</button>' +
        '</div>' +
      '</div>' +
      '<div class="l4-widget-meta">' +
        '<div class="l4-field"><span class="l4-field__lb">Tiêu đề</span><span class="l4-field__val l4-title">' + esc(w.title) + '</span></div>' +
        '<div class="l4-field"><span class="l4-field__lb">Mã Widget</span><code class="l4-id">' + esc(w.id) + '</code></div>' +
        '<div class="l4-field"><span class="l4-field__lb">Biểu tượng</span><span class="l4-field__val">' + iconIdentityHtml(w.iconKey) + '</span></div>' +
        '<div class="l4-field"><span class="l4-field__lb">Mô tả</span><span class="l4-field__val l4-desc">' + esc(w.description) + '</span></div>' +
        '<div class="l4-field l4-field--row"><span class="l4-field__lb"><i class="ti ti-template"></i> Template hiển thị</span>' +
          '<span class="ix-chip ' + (tplOk ? 'ix-chip-primary' : 'ix-chip-danger') + '">' + esc(wlib().templateName(w.templateRef)) + ' · ' + esc(w.templateRef) + '</span>' +
          (tplOk ? '' : '<span class="l4-warn"><i class="ti ti-alert-triangle"></i> Số đầu ra chưa đủ cho số slot của Template</span>') +
        '</div>' +
      '</div>' +
      '<div class="l4-sec"><div class="l4-label"><i class="ti ti-list"></i> Danh sách dữ liệu đầu ra</div>' +
        '<table class="ix-table l4-table"><thead><tr><th>Tên</th><th>Kiểu</th><th>Nguồn</th><th>Giá trị mẫu</th></tr></thead><tbody>' + outRows + '</tbody></table></div>' +
      '<div class="l4-sec"><div class="l4-label"><i class="ti ti-math-function"></i> Công thức</div>' +
        formulaRows(w.outputs) + '</div>';
  }

  function srcSelectOptions(selected) {
    var options = [
      { key: 'L1', label: 'Tầng 1' },
      { key: 'L2', label: 'Tầng 2' },
      { key: 'L3', label: 'Tầng 3' },
      { key: 'calculated', label: 'Tính toán' }
    ];
    if (selected === 'legacy') options.push({ key: 'legacy', label: 'Chưa chuẩn hóa' });
    return options.map(function (option) {
      var k = option.key;
      return '<option value="' + esc(k) + '"' + (k === selected ? ' selected' : '') + '>' + esc(option.label) + '</option>';
    }).join('');
  }

  function typeSelectOptions(selected) {
    var W = wlib();
    return (W.OUTPUT_TYPES || []).map(function (t) {
      return '<option value="' + esc(t) + '"' + (t === selected ? ' selected' : '') + '>' + esc(t) + '</option>';
    }).join('');
  }

  function iconSelectOptions(selected) {
    var cat = global.IfluxDsIconsCatalog;
    var groups = cat && cat.PAGE && Array.isArray(cat.PAGE.groups) ? cat.PAGE.groups : [];
    var html = '<option value=""' + (selected == null || selected === '' ? ' selected' : '') + '>Không dùng biểu tượng</option>';
    groups.forEach(function (group) {
      html += '<optgroup label="' + esc(group.title || 'Biểu tượng') + '">';
      (group.items || []).forEach(function (item) {
        html += '<option value="' + esc(item.slug) + '"' + (item.slug === selected ? ' selected' : '') + '>' +
          esc(item.name || item.slug) + ' · ' + esc(item.slug) + '</option>';
      });
      html += '</optgroup>';
    });
    return html;
  }

  function iconIdentityHtml(iconKey) {
    if (!iconKey) return '<span class="l4-muted">Không dùng biểu tượng</span>';
    return '<span class="ix-chip"><i class="ti ti-' + esc(iconKey) + '"></i> ' + esc(iconKey) + '</span>';
  }

  /* Widget sở hữu Output Contract. Template chỉ nhận output theo vị trí để trình bày. */
  function renderOutputEditRow(out, idx) {
    return '<tr class="l4-out-row" data-l4-out-idx="' + idx + '">' +
      '<td><input type="hidden" data-l4-out="symbol" value="' + esc(out.symbol || '') + '" />' +
        '<input class="ix-input" data-l4-out="name" title="Tên" value="' + esc(out.name || '') + '" placeholder="Tên output" /></td>' +
      '<td><select class="ix-input" data-l4-out="type" title="Kiểu">' + typeSelectOptions(out.type || 'text') + '</select></td>' +
      '<td><select class="ix-input" data-l4-out="source" title="Nguồn">' + srcSelectOptions(sourceKey(out.source)) + '</select></td>' +
      '<td><input class="ix-input" data-l4-out="demo" title="Giá trị mẫu" value="' + esc(out.demo || '') + '" placeholder="Giá trị mẫu" /></td>' +
    '</tr>';
  }

  function templateSelectOptions(selected, widget) {
    var compat = widget ? wlib().compatibleTemplates(widget) : [];
    return wlib().allTemplateIds().map(function (id) {
      var ok = !widget || compat.indexOf(id) >= 0;
      return '<option value="' + esc(id) + '"' + (id === selected ? ' selected' : '') + '>' +
        esc(wlib().templateName(id)) + ' · ' + esc(id) + (widget ? (ok ? ' ✓' : '') : '') + '</option>';
    }).join('');
  }

  function fillOutputsList(listEl, widgetId, outputs) {
    if (!listEl) return;
    var rows = (outputs && outputs.length ? outputs : [{
      symbol: 'output_1', name: '', type: 'text', source: { kind: 'system', layer: 'L2' }, demo: ''
    }]);
    listEl.innerHTML = rows.map(function (o, i) { return renderOutputEditRow(o, i); }).join('');
  }

  function syncFormFromTemplate(card, templateId, opts) {
    opts = opts || {};
    if (!card || !templateId || !wlib().outputsFromTemplate) return;
    var demoSlots = wlib().outputsFromTemplate(templateId);
    var creating = card.getAttribute('data-l4-creating') === '1';
    var outs;
    if (creating) {
      /* Widget chưa tồn tại: dùng scaffold trung tính để Widget mới khai báo output. */
      outs = demoSlots;
    } else {
      /*
       * Widget đã tồn tại — Đồng bộ Template:
       * 1) Gỡ output UI suy diễn (Tab đang chọn, Top N, …) — không thuộc Output Contract.
       * 2) Cắt output thừa ngoài số slot Template (code cũ / hardcode / sync append-only).
       * 3) Cập nhật demo theo vị trí; giữ symbol · tên · kiểu · nguồn của output còn lại.
       * 4) Append scaffold trung tính nếu Template có nhiều slot hơn Widget.
       */
      outs = collectOutputs(card);
      if (wlib().stripDerivedUiOutputs) outs = wlib().stripDerivedUiOutputs(outs);
      var synced = [];
      demoSlots.forEach(function (slot, idx) {
        if (outs[idx]) {
          outs[idx].demo = slot.demo;
          synced.push(outs[idx]);
        } else {
          synced.push(slot);
        }
      });
      outs = synced;
    }
    var list = card.querySelector('.l4-out-list');
    var wid = (card.getAttribute('data-l4') || 'new');
    fillOutputsList(list, wid, outs);
    renderFormulaEditor(card, outs);
    renderCardPreview(card);
  }

  function formulaEditorHtml(outputs) {
    var calculated = (outputs || []).filter(function (out) {
      return out.source && out.source.kind === 'calculated';
    });
    if (!calculated.length) return '<div class="l4-muted">— Không có output tính toán.</div>';
    return calculated.map(function (out) {
      return '<label class="l4-lb">' + esc(out.name || out.symbol) + '</label>' +
        '<textarea class="ix-input" rows="2" data-l4-formula="' + esc(out.symbol) + '" ' +
          'placeholder="Mô tả đầu vào, đầu ra và quan hệ nghiệp vụ">' + esc(out.formulaSpec || '') + '</textarea>';
    }).join('');
  }

  function renderFormulaEditor(card, outputs) {
    var mount = card && card.querySelector('[data-l4-formulas]');
    if (mount) mount.innerHTML = formulaEditorHtml(outputs || collectOutputs(card));
  }

  function renderCardPreview(card) {
    if (!card || !global.TemplatesCatalog || !global.TemplatesPreview) return;
    var mount = card.querySelector('[data-l4-preview]');
    var select = card.querySelector('[data-l4-f="template"]');
    if (!mount || !select) return;
    var template = global.TemplatesCatalog.byId(select.value);
    if (!template) return;
    var outputs = collectOutputs(card);
    var demo = ['', ''].concat(outputs.map(function (out) { return out.demo; }));
    global.TemplatesPreview.render(mount, template, demo, null);
    /* Bỏ header kỹ thuật của Template Preview (TMP-* · "Giao diện thật…") —
       cột Preview Tầng 4 chỉ hiện Widget thật (title/desc + body). */
    var techHead = mount.querySelector('.tpl-pv-head');
    if (techHead) techHead.remove();
    /* Head Preview = Tiêu đề + Mô tả của WIDGET (working copy) — không phải của Template.
       Chèn sau render bằng DS renderWgtHead; không sửa Template Preview renderer. */
    var T = global.IfluxBlockTemplates;
    var block = mount.querySelector('.tpl-pv-live .ifx-wgt-block');
    if (block && T && T.renderWgtHead) {
      function fv(f) { var el = card.querySelector('[data-l4-f="' + f + '"]'); return el ? el.value : ''; }
      var iconValue = fv('iconKey');
      block.insertAdjacentHTML('afterbegin', T.renderWgtHead(
        fv('title'),
        fv('description'),
        iconValue === '' ? null : iconValue
      ));
    }
  }

  function renderWidgetCreate() {
    var id = wlib().nextCustomId ? wlib().nextCustomId() : 'WGT-CUS-001';
    var defaultTpl = 'TMP-SUMMARY';
    var outs = wlib().outputsFromTemplate ? wlib().outputsFromTemplate(defaultTpl) : [];
    var outRows = outs.map(function (o, i) { return renderOutputEditRow(o, i); }).join('');

    return '<div class="ix-card l4-card" data-l4="__new__" data-l4-creating="1">' +
      '<div class="l4-head">' +
        '<div class="l4-head__meta"><span class="l4-section-tag">Widget · Thêm mới</span></div>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
          '<button type="button" class="ix-btn ix-btn-success ix-btn-sm" data-l4-create="1"><i class="ti ti-check"></i> Tạo Widget</button>' +
          '<button type="button" class="ix-btn ix-btn-outline ix-btn-sm" data-l4-cancel="1">Hủy</button>' +
        '</div>' +
      '</div>' +
      '<div class="l4-edit l4-authoring">' +
        '<div class="l4-authoring__config">' +
          '<label class="l4-lb">Tiêu đề</label><input class="ix-input" data-l4-f="title" value="" placeholder="Tiêu đề widget" />' +
          '<label class="l4-lb">Biểu tượng</label><select class="ix-input" data-l4-f="iconKey">' + iconSelectOptions(null) + '</select>' +
          '<label class="l4-lb">Mã Widget</label><input class="ix-input l4-readonly" data-l4-f="id" value="' + esc(id) + '" readonly />' +
          '<label class="l4-lb">Mô tả Widget</label><textarea class="ix-input" rows="2" data-l4-f="description" placeholder="Mô tả ngắn"></textarea>' +
          '<label class="l4-lb"><i class="ti ti-template"></i> Template hiển thị</label><select class="ix-input" data-l4-f="template" data-l4-template-before="' + defaultTpl + '">' + templateSelectOptions(defaultTpl, null) + '</select>' +
          '<div class="l4-divider"></div>' +
          '<label class="l4-lb"><i class="ti ti-list"></i> Dữ liệu đầu ra <span class="l4-hint">(Widget sở hữu Output Contract; Template chỉ trình bày theo vị trí)</span></label>' +
          '<div class="l4-out-scroll"><table class="ix-table l4-table"><thead><tr><th>Tên</th><th>Kiểu</th><th>Nguồn</th><th>Giá trị mẫu</th></tr></thead>' +
            '<tbody class="l4-out-list" data-l4-widget-id="' + esc(id) + '">' + outRows + '</tbody></table></div>' +
          '<div class="l4-divider"></div>' +
          '<label class="l4-lb"><i class="ti ti-math-function"></i> Công thức</label>' +
          '<div data-l4-formulas>' + formulaEditorHtml(outs) + '</div>' +
        '</div>' +
        '<div class="l4-authoring__preview">' +
          '<label class="l4-lb"><i class="ti ti-eye"></i> Preview</label>' +
          '<div class="l4-preview-frame" data-l4-preview></div>' +
        '</div>' +
      '</div></div>';
  }

  function renderWidgetEdit(w) {
    var outputs = w.outputs && w.outputs.length ? w.outputs : [];
    var outRows = outputs.map(function (o, i) { return renderOutputEditRow(o, i); }).join('');

    return '<div class="l4-head">' +
        '<div class="l4-head__meta"><span class="l4-section-tag">Widget · Đang sửa</span></div>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
          '<button type="button" class="ix-btn ix-btn-success ix-btn-sm" data-l4-apply="' + esc(w.id) + '"><i class="ti ti-check"></i> Áp dụng</button>' +
          '<button type="button" class="ix-btn ix-btn-outline ix-btn-sm" data-l4-cancel="1">Hủy</button>' +
        '</div>' +
      '</div>' +
      '<div class="l4-edit l4-authoring">' +
        '<div class="l4-authoring__config">' +
          '<label class="l4-lb">Tiêu đề</label><input class="ix-input" data-l4-f="title" value="' + esc(w.title) + '" />' +
          '<label class="l4-lb">Biểu tượng</label><select class="ix-input" data-l4-f="iconKey">' + iconSelectOptions(w.iconKey) + '</select>' +
          '<label class="l4-lb">Mã Widget</label><input class="ix-input l4-readonly" data-l4-f="id" value="' + esc(w.id) + '" readonly />' +
          '<label class="l4-lb">Mô tả Widget</label><textarea class="ix-input" rows="2" data-l4-f="description">' + esc(w.description) + '</textarea>' +
          '<label class="l4-lb"><i class="ti ti-template"></i> Template hiển thị</label>' +
          '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">' +
            '<select class="ix-input" data-l4-f="template" data-l4-template-before="' + esc(w.templateRef) + '" style="flex:1;min-width:220px">' + templateSelectOptions(w.templateRef, w) + '</select>' +
            '<button type="button" class="ix-btn ix-btn-outline ix-btn-sm" data-l4-sync-tpl="' + esc(w.id) + '" title="Đồng bộ theo Template: cập nhật demo theo vị trí; gỡ Tab/Top N và output thừa ngoài số slot; giữ symbol · tên · kiểu · nguồn của output còn lại"><i class="ti ti-refresh"></i> Đồng bộ Template</button>' +
          '</div>' +
          '<div class="l4-divider"></div>' +
          '<label class="l4-lb"><i class="ti ti-list"></i> Dữ liệu đầu ra <span class="l4-hint">(Widget sở hữu Output Contract; Template chỉ trình bày theo vị trí)</span></label>' +
          '<div class="l4-out-scroll"><table class="ix-table l4-table"><thead><tr><th>Tên</th><th>Kiểu</th><th>Nguồn</th><th>Giá trị mẫu</th></tr></thead>' +
            '<tbody class="l4-out-list" data-l4-widget-id="' + esc(w.id) + '">' + outRows + '</tbody></table></div>' +
          '<div class="l4-divider"></div>' +
          '<label class="l4-lb"><i class="ti ti-math-function"></i> Công thức</label>' +
          '<div data-l4-formulas>' + formulaEditorHtml(outputs) + '</div>' +
        '</div>' +
        '<div class="l4-authoring__preview">' +
          '<label class="l4-lb"><i class="ti ti-eye"></i> Preview</label>' +
          '<div class="l4-preview-frame" data-l4-preview></div>' +
        '</div>' +
    '</div>';
  }

  function collectOutputs(card) {
    var formulas = {};
    Array.prototype.slice.call(card.querySelectorAll('[data-l4-formula]')).forEach(function (field) {
      formulas[field.getAttribute('data-l4-formula')] = field.value;
    });
    return Array.prototype.slice.call(card.querySelectorAll('.l4-out-row')).map(function (row) {
      function v(field) {
        var el = row.querySelector('[data-l4-out="' + field + '"]');
        return el ? el.value.trim() : '';
      }
      var sourceValue = v('source') || 'L2';
      var symbol = v('symbol');
      var out = {
        symbol: symbol,
        name: v('name'),
        type: v('type') || 'text',
        source: sourceValue === 'calculated'
          ? { kind: 'calculated' }
          : (sourceValue === 'legacy' ? { kind: 'legacy' } : { kind: 'system', layer: sourceValue }),
        demo: v('demo')
      };
      if (sourceValue === 'calculated') out.formulaSpec = formulas[symbol] || '';
      return out;
    }).filter(function (o) { return o.symbol || o.name; });
  }

  function collectDefinition(card, existing) {
    function val(f) { var el = card.querySelector('[data-l4-f="' + f + '"]'); return el ? el.value : ''; }
    var metadata = JSON.parse(JSON.stringify(existing && existing.metadata || {}));
    var outputs = collectOutputs(card);
    var templateRef = val('template');
    delete metadata.legacySchema;
    delete metadata.migrationError;
    /* Legacy business-role mapping đã bị loại khỏi contract Template ↔ Widget. */
    delete metadata.templateRoles;
    return {
      schemaVersion: 2,
      id: val('id').trim(),
      iconKey: val('iconKey') === '' ? null : val('iconKey'),
      title: val('title').trim(),
      description: val('description'),
      templateRef: templateRef,
      outputs: outputs,
      capabilities: JSON.parse(JSON.stringify(existing && existing.capabilities || {})),
      metadata: metadata
    };
  }

  function applyWidgetEdit(id) {
    var card = document.querySelector('[data-l4="' + id + '"]');
    if (!card) return;
    try {
      var definition = collectDefinition(card, wlib().getDefinition(id));
      wlib().saveDefinition(id, definition);
      state.editing = null;
      renderDisplayLayer();
      if (global.ixToast) ixToast('Đã lưu Widget ' + id, 'success');
    } catch (err) {
      if (global.ixToast) ixToast((err && err.message) || 'Không lưu được Widget', 'danger');
    }
  }

  function applyWidgetCreate() {
    var card = document.querySelector('[data-l4="__new__"]');
    if (!card || !wlib().createWidget) return;
    function val(f) { var el = card.querySelector('[data-l4-f="' + f + '"]'); return el ? el.value : ''; }
    var id = val('id').trim();
    var title = val('title').trim();
    if (!title) {
      if (global.ixToast) ixToast('Nhập tiêu đề widget', 'warning');
      return;
    }
    try {
      var definition = collectDefinition(card, null);
      definition.id = id;
      definition.title = title;
      var created = wlib().createWidget(definition);
      state.creating = false;
      state.editing = null;
      renderDisplayLayer();
      if (global.ixToast) ixToast('Đã tạo widget ' + (created && created.id ? created.id : id), 'success');
    } catch (err) {
      if (global.ixToast) ixToast((err && err.message) || 'Không tạo được widget', 'danger');
    }
  }

  function deleteWidgetById(id) {
    if (!wlib().deleteWidget) return;
    var msg = 'Xóa widget ' + id + ' khỏi danh sách? Widget sẽ biến mất khỏi Cài đặt Trang và Phân quyền sử dụng.';
    if (global.confirm && !global.confirm(msg)) return;
    wlib().deleteWidget(id);
    if (state.editing === id) state.editing = null;
    state.creating = false;
    renderDisplayLayer();
    if (global.ixToast) ixToast('Đã xóa widget ' + id, 'success');
  }

  function renderAlgorithmLayer() {
    var wrap = document.getElementById('pl-algorithm-root');
    if (!wrap || !catalog()) return;
    var cfg = catalog().getAdminConfig();

    wrap.innerHTML = catalog().ALGORITHMS.map(function (alg) {
      var adminFields = (alg.adminKeys || []).map(function (k) {
        return '<div class="pl-admin-field"><label class="ix-label">' + esc(k) + '</label>' +
          '<input class="ix-input" type="number" data-pl-admin-key="' + esc(k) + '" value="' + esc(cfg[k]) + '" /></div>';
      }).join('');
      var adminHtml = adminFields
        ? '<div class="pl-alg-label" style="margin-top:8px"><i class="ti ti-settings"></i> Thiết lập Admin (tham số)</div>' + adminFields
        : '';
      var serves = (alg.outputs || []).map(function (o) {
        return '<span class="ix-chip ix-chip-primary" style="font-size:10px" title="' + esc(o) + '">' + esc(blockLabel(o)) + '</span>';
      }).join('');

      return '<div class="ix-card l4-card ix-mb-16">' +
        '<div class="l4-head"><div class="l4-head__meta"><code class="l4-id">' + esc(alg.id) + '</code><strong class="l4-title">' + esc(alg.label) + '</strong></div>' +
          '<span class="ix-chip" style="font-size:10px">Nhóm: ' + esc(alg.group) + '</span></div>' +
        ioBlock(alg.io, adminHtml) +
        '<div class="l4-sec"><div class="l4-label"><i class="ti ti-layout-dashboard"></i> Phục vụ Widget / Block (Tầng 4)</div>' +
          '<div class="pl-tags">' + (serves || '<span class="l4-muted">—</span>') + '</div></div>' +
      '</div>';
    }).join('');
  }

  function renderNormalizedLayer() {
    var wrap = document.getElementById('pl-normalized-root');
    if (!wrap || !catalog() || !resolver()) return;

    var byGroup = {};
    catalog().NORMALIZED.forEach(function (e) {
      if (!byGroup[e.group]) byGroup[e.group] = [];
      byGroup[e.group].push(e);
    });

    wrap.innerHTML = Object.keys(byGroup).sort().map(function (group) {
      return '<section class="pl-group ix-mb-24"><h3 class="pl-group__title">' + esc(group) + '</h3>' +
        byGroup[group].map(function (entity) {
          var resolved = resolver().resolveNormalizedEntity(entity.id);
          var demo = (resolved.fields || []).map(function (fld) {
            return '<tr><td style="width:200px"><code>' + esc(fld.key) + '</code>' +
              (fld.label ? '<div style="font-size:11px;color:var(--ix-text-muted)">' + esc(fld.label) + '</div>' : '') +
              '</td><td><pre class="pl-val">' + esc(fld.display) + '</pre></td></tr>';
          }).join('');
          return '<div class="ix-card l4-card ix-mb-12">' +
            '<div class="l4-head"><div class="l4-head__meta"><code class="l4-id">' + esc(entity.id) + '</code><strong class="l4-title">' + esc(entity.label) + '</strong></div></div>' +
            ioBlock(entity.io) +
            (demo ? '<div class="l4-sec"><div class="l4-label"><i class="ti ti-flask"></i> Giá trị demo (sandbox)</div>' +
              '<table class="ix-table l4-table"><tbody>' + demo + '</tbody></table></div>' : '') +
          '</div>';
        }).join('') +
      '</section>';
    }).join('');
  }

  function renderRawLayer() {
    var wrap = document.getElementById('pl-raw-root');
    if (!wrap || !catalog() || !resolver()) return;

    var live = global.PlatformLayersDnseLive;
    var coverageHtml = '';
    if (live && live.catalog) {
      var reqs = live.catalog.coreRequirements || [];
      var gaps = live.catalog.gaps || [];
      coverageHtml =
        '<div class="ix-card ix-mb-16">' +
          '<div class="ix-card-header"><div class="ix-card-title">Đánh giá Tầng I Core · DNSE</div>' +
          '<span class="ix-chip ' + connectionChip(live.connection) + '">' + esc(connectionLabel(live.connection)) + '</span></div>' +
          '<div class="ix-card-body">' +
            '<div class="pl-alg-label"><i class="ti ti-check"></i> Yêu cầu Core — đủ nguồn DNSE</div>' +
            '<div class="pl-tags ix-mb-12">' + reqs.map(function (r) {
              return '<span class="ix-chip ix-chip-success" title="' + esc((r.sources || []).join(', ')) + '">' + esc(r.label) + '</span>';
            }).join('') + '</div>' +
            '<div class="pl-alg-label"><i class="ti ti-alert-triangle"></i> Khoảng trống / việc tiếp theo</div>' +
            '<div class="pl-tags">' + gaps.map(function (g) {
              var cls = g.severity === 'blocker' ? 'ix-chip-danger' : 'ix-chip-warning';
              return '<span class="ix-chip ' + cls + '" title="' + esc(g.note || '') + '">' + esc(g.label) + '</span>';
            }).join('') + '</div>' +
          '</div></div>';
    }

    wrap.innerHTML = coverageHtml + catalog().RAW_SOURCES.map(function (src) {
      var resolved = resolver().resolveRawSource(src.id);
      var conn = (live && live.connection) || src.status || 'pending';
      var demo = (resolved.fields || []).map(function (fld) {
        return '<tr><td style="width:200px"><code>' + esc(fld.key) + '</code>' +
          (fld.label ? '<div style="font-size:11px;color:var(--ix-text-muted)">' + esc(fld.label) + '</div>' : '') +
          '</td><td><pre class="pl-val">' + esc(fld.display) + '</pre></td></tr>';
      }).join('');
      return '<div class="ix-card l4-card ix-mb-16">' +
        '<div class="l4-head"><div class="l4-head__meta"><code class="l4-id">' + esc(src.id) + '</code><strong class="l4-title">' + esc(src.provider) + ' · ' + esc(src.channel) + '</strong></div>' +
          '<span class="ix-chip ' + connectionChip(conn) + '">' + esc(connectionLabel(conn)) + '</span></div>' +
        '<p class="l4-desc">' + esc(src.protocol) + ' · ' + esc(src.endpoint || src.transport || '') +
          (src.coreRelevant ? ' · Core' : '') + '</p>' +
        ioBlock(src.io) +
        (demo ? '<div class="l4-sec"><div class="l4-label"><i class="ti ti-flask"></i> Giá trị demo / probe live</div>' +
          '<table class="ix-table l4-table"><tbody>' + demo + '</tbody></table></div>' : '') +
      '</div>';
    }).join('');
  }

  function renderStats() {
    var el = document.getElementById('pl-stats');
    if (!el || !catalog()) return;
    var widgetCount = wlib() ? (wlib().widgetIds ? wlib().widgetIds().length : wlib().WIDGETS.length) : 0;
    el.innerHTML =
      '<span class="ix-chip ix-chip-primary">' + widgetCount + ' widget (Tầng 4)</span>' +
      '<span class="ix-chip">' + catalog().ALGORITHMS.length + ' bài toán</span>' +
      '<span class="ix-chip">' + catalog().NORMALIZED.length + ' entity chuẩn hóa</span>' +
      '<span class="ix-chip">' + catalog().RAW_SOURCES.length + ' nguồn thô DNSE</span>' +
      (global.PlatformLayersDnseLive
        ? '<span class="ix-chip ' + connectionChip(global.PlatformLayersDnseLive.connection) + '">DNSE · ' + esc(connectionLabel(global.PlatformLayersDnseLive.connection)) + '</span>'
        : '<span class="ix-chip ix-chip-warning">DNSE · chưa probe</span>');
  }

  function render() {
    renderStats();
    if (state.tab === 'display') {
      renderDisplayLayer();
    } else if (state.tab === 'algorithm') {
      renderAlgorithmLayer();
    } else if (state.tab === 'normalized') {
      renderNormalizedLayer();
    } else if (state.tab === 'raw') {
      renderRawLayer();
    }
  }

  function saveAdminConfig() {
    if (!catalog()) return;
    var cfg = catalog().getAdminConfig();
    document.querySelectorAll('[data-pl-admin-key]').forEach(function (inp) {
      var k = inp.getAttribute('data-pl-admin-key');
      cfg[k] = Number(inp.value);
    });
    catalog().saveAdminConfig(cfg);
    if (global.ixToast) ixToast('Đã lưu thiết lập Admin (tầng giải thuật)', 'success');
    render();
  }

  function bind() {
    document.querySelectorAll('.pl-tab').forEach(function (btn) {
      btn.addEventListener('click', function () {
        switchTab(btn.getAttribute('data-pl-tab'));
      });
    });

    var search = document.getElementById('pl-display-search');
    if (search) {
      search.addEventListener('input', function () {
        state.q = search.value.trim().toLowerCase();
        renderDisplayLayer();
      });
    }

    document.getElementById('pl-display-root').addEventListener('click', function (e) {
      var editBtn = e.target.closest('[data-l4-edit]');
      if (editBtn) { state.creating = false; state.editing = editBtn.getAttribute('data-l4-edit'); renderDisplayLayer(); return; }
      var applyBtn = e.target.closest('[data-l4-apply]');
      if (applyBtn) { applyWidgetEdit(applyBtn.getAttribute('data-l4-apply')); return; }
      var createBtn = e.target.closest('[data-l4-create]');
      if (createBtn) { applyWidgetCreate(); return; }
      var syncTplBtn = e.target.closest('[data-l4-sync-tpl]');
      if (syncTplBtn) {
        var cardSync = syncTplBtn.closest('[data-l4]');
        var tplEl = cardSync && cardSync.querySelector('[data-l4-f="template"]');
        if (cardSync && tplEl) {
          syncFormFromTemplate(cardSync, tplEl.value, { fillMeta: false });
          tplEl.setAttribute('data-l4-template-before', tplEl.value);
          if (global.ixToast) ixToast('Đã đồng bộ Template: cập nhật demo, gỡ field thừa / Tab·Top N; giữ symbol · tên · kiểu · nguồn của output còn lại', 'info');
        }
        return;
      }
      var delBtn = e.target.closest('[data-l4-delete]');
      if (delBtn) { deleteWidgetById(delBtn.getAttribute('data-l4-delete')); return; }
      var cancelBtn = e.target.closest('[data-l4-cancel]');
      if (cancelBtn) { state.editing = null; state.creating = false; renderDisplayLayer(); return; }
      /* Không có thêm/xóa dòng output: Output Contract do Template sở hữu, Admin chỉ cấu hình dữ liệu. */
    });

    document.getElementById('pl-display-root').addEventListener('change', function (e) {
      var tplSel = e.target.closest('[data-l4-f="template"]');
      if (tplSel) {
        var cardTpl = tplSel.closest('[data-l4]');
        if (cardTpl) {
          var previous = tplSel.getAttribute('data-l4-template-before') || '';
          if (previous && previous !== tplSel.value &&
              global.confirm && !global.confirm('Đổi Template sẽ thay schema và Demo Data trong bản nháp hiện tại. Tiếp tục?')) {
            tplSel.value = previous;
            return;
          }
          syncFormFromTemplate(cardTpl, tplSel.value, {});
          tplSel.setAttribute('data-l4-template-before', tplSel.value);
          if (global.ixToast) ixToast('Đã đồng bộ Template: cập nhật demo, gỡ field thừa / Tab·Top N; giữ symbol · tên · kiểu · nguồn của output còn lại', 'info');
        }
        return;
      }
      var iconSelect = e.target.closest('[data-l4-f="iconKey"]');
      if (iconSelect) {
        renderCardPreview(iconSelect.closest('[data-l4]'));
        return;
      }
      var sourceSelect = e.target.closest('[data-l4-out="source"]');
      var outputField = e.target.closest('[data-l4-out]');
      var changedCard = e.target.closest('[data-l4]');
      if (sourceSelect && changedCard) renderFormulaEditor(changedCard);
      if (outputField && changedCard) renderCardPreview(changedCard);
    });

    document.getElementById('pl-display-root').addEventListener('input', function (e) {
      var isDemo = e.target.closest('[data-l4-out="demo"]');
      var isHead = e.target.closest('[data-l4-f="title"], [data-l4-f="description"]');
      if (!isDemo && !isHead) return;
      renderCardPreview(e.target.closest('[data-l4]'));
    });

    var addBtn = document.getElementById('pl-btn-add-widget');
    if (addBtn) {
      addBtn.addEventListener('click', function () {
        state.creating = true;
        state.editing = null;
        renderDisplayLayer();
      });
    }

    var refreshBtn = document.getElementById('pl-btn-refresh');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', function () {
        loadDnseStatus(true).then(function () {
          render();
          if (global.ixToast) ixToast('Đã làm mới DNSE / snapshot', 'success');
        });
      });
    }

    var saveBtn = document.getElementById('pl-btn-save-admin');
    if (saveBtn) saveBtn.addEventListener('click', saveAdminConfig);

    var resetBtn = document.getElementById('pl-btn-reset-l4');
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        if (!global.confirm || global.confirm('Khôi phục toàn bộ widget về mặc định (xóa chỉnh sửa cục bộ và widget mới)?')) {
          wlib().resetAll();
          state.editing = null;
          state.creating = false;
          renderDisplayLayer();
          if (global.ixToast) ixToast('Đã khôi phục widget về mặc định', 'success');
        }
      });
    }
  }

  function loadDnseStatus(force) {
    if (state.dnseLoaded && !force) return Promise.resolve(global.PlatformLayersDnseLive);
    return fetchDnseStatus().then(function (data) {
      if (data) {
        global.PlatformLayersDnseLive = data;
        state.dnseLoaded = true;
      }
      return data;
    });
  }

  function init() {
    bind();
    var hash = String(location.hash || '').replace(/^#/, '');
    var startTab = 'display';
    if (hash === 'layer-4' || hash === 'display' || hash === 'widgets') startTab = 'display';
    else if (hash === 'layer-3' || hash === 'algorithm') startTab = 'algorithm';
    else if (hash === 'layer-2' || hash === 'normalized') startTab = 'normalized';
    else if (hash === 'layer-1' || hash === 'raw') startTab = 'raw';
    loadDnseStatus(false).then(function () {
      switchTab(startTab);
    });
  }

  global.PlatformLayersPage = { init: init, render: render };
})(window);
