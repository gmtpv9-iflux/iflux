/* ADM-SYS-003 — Thiết lập mẫu thông báo: mẫu theo trường hợp */
(function (global) {
  'use strict';

  var state = { group: '', q: '', expanded: {}, tagGroup: '' };

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function cat() { return global.IfluxSystemNotificationCatalog; }
  function store() { return global.IfluxSystemNotificationTemplates; }

  function toast(msg, type) {
    if (global.ixToast) ixToast(msg, type || 'success');
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { toast('Đã copy: ' + text, 'info'); }).catch(function () {});
      return;
    }
    toast('Copy thủ công: ' + text, 'info');
  }

  function renderTagPanel() {
    var wrap = document.getElementById('ann-tags-root');
    if (!wrap || !cat()) return;

    var tags = cat().MERGE_TAGS.filter(function (t) {
      return !state.tagGroup || t.group === state.tagGroup;
    });

    var groups = [];
    var seen = {};
    cat().MERGE_TAGS.forEach(function (t) {
      if (!seen[t.group]) { seen[t.group] = true; groups.push(t.group); }
    });

    wrap.innerHTML =
      '<div class="ann-tags-head">' +
        '<div><strong style="font-size:14px">Thẻ merge toàn hệ thống</strong>' +
        '<div style="font-size:12px;color:var(--ix-text-muted);margin-top:4px;line-height:1.45"><strong style="color:var(--ix-primary)">' + cat().mergeTagCount + ' thẻ</strong> dạng <code>{Tên thẻ}</code> — click để copy, chèn vào mẫu bên trái.</div></div>' +
        '<select class="ix-input" id="ann-tag-group-filter">' +
          '<option value="">Tất cả nhóm (' + cat().mergeTagCount + ')</option>' +
          groups.map(function (g) { return '<option value="' + esc(g) + '"' + (state.tagGroup === g ? ' selected' : '') + '>' + esc(g) + '</option>'; }).join('') +
        '</select>' +
      '</div>' +
      '<div class="ann-tag-grid">' +
        tags.map(function (t) {
          return '<button type="button" class="ann-tag-chip" data-ann-copy-tag="' + esc(t.key) + '" title="' + esc(t.label) + '">' +
            '<code>{' + esc(t.key) + '}</code>' +
            '<span>' + esc(t.label) + '</span>' +
            '<em>VD: ' + esc(t.example) + '</em>' +
          '</button>';
        }).join('') +
      '</div>';
  }

  function renderCases() {
    var wrap = document.getElementById('ann-cases-root');
    if (!wrap || !cat() || !store()) return;

    var items = cat().CASES.filter(function (c) {
      if (state.group && c.group !== state.group) return false;
      if (state.q) {
        var hay = (c.id + ' ' + c.code + ' ' + c.name + ' ' + c.group + ' ' + c.trigger).toLowerCase();
        if (hay.indexOf(state.q) < 0) return false;
      }
      return true;
    });

    document.getElementById('ann-case-count').textContent = items.length + ' / ' + cat().caseCount;

    if (!items.length) {
      wrap.innerHTML = '<div class="ix-card"><div class="ix-card-body" style="text-align:center;padding:40px;color:var(--ix-text-muted)">Không có trường hợp phù hợp bộ lọc.</div></div>';
      return;
    }

    wrap.innerHTML = items.map(function (c) {
      var tpl = store().getTemplate(c.id);
      var preview = store().render(c.id, c.sampleVars || {});
      var open = !!state.expanded[c.id];
      var tagChips = (c.tags || []).map(function (k) {
        return '<button type="button" class="ix-chip ann-mini-tag" data-ann-copy-tag="' + esc(k) + '" style="cursor:pointer;font-size:10px">{' + esc(k) + '}</button>';
      }).join('');

      return '<div class="ix-card ann-case" data-case="' + esc(c.id) + '">' +
        '<button type="button" class="ann-case__head" data-ann-toggle="' + esc(c.id) + '">' +
          '<div class="ann-case__icon"><i class="ti ' + esc(c.icon) + '"></i></div>' +
          '<div class="ann-case__meta">' +
            '<div class="ann-case__title"><code style="font-size:11px;margin-right:8px">' + esc(c.code) + '</code>' + esc(c.name) + '</div>' +
            '<div class="ann-case__sub">' + esc(c.group) + ' · ' + esc(c.channel) + '</div>' +
            '<div class="ann-case__trigger">' + esc(c.trigger) + '</div>' +
          '</div>' +
          '<div class="ann-case__badges">' +
            (tpl.isCustom ? '<span class="ix-chip ix-chip-warning">Đã chỉnh</span>' : '<span class="ix-chip">Mặc định</span>') +
            '<span class="ix-chip ix-chip-info">' + (c.tags || []).length + ' thẻ</span>' +
            '<i class="ti ti-chevron-' + (open ? 'up' : 'down') + '"></i>' +
          '</div>' +
        '</button>' +
        (open ? '<div class="ann-case__body">' +
          '<div class="ann-case__tags-label">Thẻ áp dụng cho trường hợp này:</div>' +
          '<div class="ann-case__tags">' + tagChips + '</div>' +
          '<div class="ann-form-grid">' +
            '<div class="ix-form-group"><label class="ix-label">Mẫu tiêu đề</label>' +
              '<input class="ix-input" data-ann-field="title" data-ann-case="' + esc(c.id) + '" value="' + esc(tpl.title) + '" /></div>' +
            '<div class="ix-form-group ann-form-full"><label class="ix-label">Mẫu nội dung</label>' +
              '<textarea class="ix-input" rows="3" data-ann-field="message" data-ann-case="' + esc(c.id) + '">' + esc(tpl.message) + '</textarea></div>' +
          '</div>' +
          '<div class="ann-preview">' +
            '<div class="ann-preview__label"><i class="ti ti-eye"></i> Xem trước (dữ liệu demo)</div>' +
            '<div class="ann-preview__box">' +
              '<div class="ann-preview__title" data-ann-preview-title="' + esc(c.id) + '">' + esc(preview.title) + '</div>' +
              '<div class="ann-preview__msg" data-ann-preview-msg="' + esc(c.id) + '">' + esc(preview.message) + '</div>' +
            '</div>' +
          '</div>' +
          '<div class="ann-case__actions">' +
            '<button type="button" class="ix-btn ix-btn-primary ix-btn-sm" data-ann-save="' + esc(c.id) + '"><i class="ti ti-device-floppy"></i> Lưu mẫu</button>' +
            '<button type="button" class="ix-btn ix-btn-outline ix-btn-sm" data-ann-reset="' + esc(c.id) + '"><i class="ti ti-refresh"></i> Khôi phục mặc định</button>' +
          '</div>' +
        '</div>' : '') +
      '</div>';
    }).join('');
  }

  function updatePreview(caseId) {
    var c = cat().getCaseById(caseId);
    if (!c) return;
    var titleEl = document.querySelector('[data-ann-field="title"][data-ann-case="' + caseId + '"]');
    var msgEl = document.querySelector('[data-ann-field="message"][data-ann-case="' + caseId + '"]');
    var pTitle = document.querySelector('[data-ann-preview-title="' + caseId + '"]');
    var pMsg = document.querySelector('[data-ann-preview-msg="' + caseId + '"]');
    if (!titleEl || !msgEl || !pTitle || !pMsg) return;
    pTitle.textContent = store().applyTemplate(titleEl.value, c.sampleVars);
    pMsg.textContent = store().applyTemplate(msgEl.value, c.sampleVars);
  }

  function renderGroupFilter() {
    var sel = document.getElementById('ann-group-filter');
    if (!sel || !cat()) return;
    var groups = cat().listGroups();
    sel.innerHTML = '<option value="">Tất cả nhóm (' + cat().caseCount + ')</option>' +
      groups.map(function (g) {
        return '<option value="' + esc(g) + '"' + (state.group === g ? ' selected' : '') + '>' + esc(g) + '</option>';
      }).join('');
  }

  function render() {
    renderTagPanel();
    renderGroupFilter();
    renderCases();
  }

  function bind() {
    document.getElementById('ann-group-filter').addEventListener('change', function (e) {
      state.group = e.target.value;
      renderCases();
    });
    document.getElementById('ann-search').addEventListener('input', function (e) {
      state.q = String(e.target.value || '').toLowerCase().trim();
      renderCases();
    });
    document.getElementById('ann-tags-root').addEventListener('change', function (e) {
      if (e.target.id === 'ann-tag-group-filter') {
        state.tagGroup = e.target.value;
        renderTagPanel();
      }
    });
    document.getElementById('ann-tags-root').addEventListener('click', function (e) {
      var btn = e.target.closest('[data-ann-copy-tag]');
      if (!btn) return;
      copyText('{' + btn.getAttribute('data-ann-copy-tag') + '}');
    });
    document.getElementById('ann-cases-root').addEventListener('click', function (e) {
      var copyBtn = e.target.closest('[data-ann-copy-tag]');
      if (copyBtn) {
        copyText('{' + copyBtn.getAttribute('data-ann-copy-tag') + '}');
        return;
      }
      var toggle = e.target.closest('[data-ann-toggle]');
      if (toggle) {
        var id = toggle.getAttribute('data-ann-toggle');
        state.expanded[id] = !state.expanded[id];
        renderCases();
        return;
      }
      var saveBtn = e.target.closest('[data-ann-save]');
      if (saveBtn) {
        var caseId = saveBtn.getAttribute('data-ann-save');
        var tEl = document.querySelector('[data-ann-field="title"][data-ann-case="' + caseId + '"]');
        var mEl = document.querySelector('[data-ann-field="message"][data-ann-case="' + caseId + '"]');
        store().saveTemplate(caseId, tEl ? tEl.value : '', mEl ? mEl.value : '');
        toast('Đã lưu mẫu · ' + caseId);
        renderCases();
        return;
      }
      var resetBtn = e.target.closest('[data-ann-reset]');
      if (resetBtn) {
        store().resetTemplate(resetBtn.getAttribute('data-ann-reset'));
        toast('Đã khôi phục mặc định', 'info');
        renderCases();
      }
    });
    document.getElementById('ann-cases-root').addEventListener('input', function (e) {
      var el = e.target.closest('[data-ann-field]');
      if (!el) return;
      updatePreview(el.getAttribute('data-ann-case'));
    });
    document.getElementById('ann-reset-all').addEventListener('click', function () {
      if (!confirm('Khôi phục tất cả mẫu về mặc định?')) return;
      store().resetAll();
      toast('Đã khôi phục toàn bộ mẫu', 'info');
      render();
    });
  }

  function init() {
    if (!cat() || !store()) return;
    var tagEl = document.getElementById('ann-tag-total');
    if (tagEl) tagEl.textContent = String(cat().mergeTagCount);
    bind();
    render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(window);
