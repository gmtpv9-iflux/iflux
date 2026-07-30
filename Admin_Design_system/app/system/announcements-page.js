/* ADM-SYS-003 — Thiết lập mẫu thông báo · Platform API (Phase C) */
(function (global) {
  'use strict';

  var state = { group: '', q: '', expanded: {}, tagGroup: '', types: [], previewTimers: {} };

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function tagDisplayKey(v) {
    return v.legacy_tag || v.label || v.key;
  }

  function aggregateMergeTags() {
    var byKey = {};
    state.types.forEach(function (t) {
      (t.variables || []).forEach(function (v) {
        var tagKey = tagDisplayKey(v);
        if (byKey[tagKey]) return;
        byKey[tagKey] = {
          key: tagKey,
          label: v.label || v.key || tagKey,
          example: v.example || '',
          group: t.group || 'Khác'
        };
      });
    });
    return Object.keys(byKey).sort().map(function (k) { return byKey[k]; });
  }

  function toast(msg, type) {
    if (global.ixToast) ixToast(msg, type || 'success');
  }

  function apiBase() {
    if (global.IfluxAdminAuth && IfluxAdminAuth.apiBase) return IfluxAdminAuth.apiBase();
    return '/api';
  }

  function authHeaders() {
    var h = { 'Content-Type': 'application/json', Accept: 'application/json' };
    var token = null;
    if (global.IfluxAdminAuth && IfluxAdminAuth.getSession) {
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

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { toast('Đã copy: ' + text, 'info'); }).catch(function () {});
      return;
    }
    toast('Copy thủ công: ' + text, 'info');
  }

  function listGroups() {
    var seen = {};
    var groups = [];
    state.types.forEach(function (t) {
      if (t.group && !seen[t.group]) { seen[t.group] = true; groups.push(t.group); }
    });
    return groups;
  }

  function filteredTypes() {
    return state.types.filter(function (t) {
      if (state.group && t.group !== state.group) return false;
      if (state.q) {
        var hay = (t.code + ' ' + t.adminCode + ' ' + t.name + ' ' + caseDisplayTitle(t) + ' ' + t.group + ' ' + t.description).toLowerCase();
        if (hay.indexOf(state.q) < 0) return false;
      }
      return true;
    });
  }

  function renderTagPanel() {
    var wrap = document.getElementById('ann-tags-root');
    if (!wrap) return;

    var allTags = aggregateMergeTags();
    var tags = allTags.filter(function (t) {
      return !state.tagGroup || t.group === state.tagGroup;
    });
    var groups = [];
    var seen = {};
    allTags.forEach(function (t) {
      if (!seen[t.group]) { seen[t.group] = true; groups.push(t.group); }
    });

    wrap.innerHTML =
      '<div class="ann-tags-head">' +
        '<div><strong style="font-size:14px">Thẻ merge toàn hệ thống</strong>' +
        '<div style="font-size:12px;color:var(--ix-text-muted);margin-top:4px;line-height:1.45">' +
          '<strong style="color:var(--ix-primary)">' + allTags.length + ' thẻ</strong> aggregate từ <code>variables[]</code> API (Platform Contract).' +
        '</div></div>' +
        '<select class="ix-input" id="ann-tag-group-filter">' +
          '<option value="">Tất cả nhóm (' + allTags.length + ')</option>' +
          groups.map(function (g) { return '<option value="' + esc(g) + '"' + (state.tagGroup === g ? ' selected' : '') + '>' + esc(g) + '</option>'; }).join('') +
        '</select>' +
      '</div>' +
      '<div class="ann-tag-grid">' +
        tags.map(function (t) {
          return '<button type="button" class="ann-tag-chip" data-ann-copy-tag="' + esc(t.key) + '" title="' + esc(t.label) + '">' +
            '<code>{' + esc(t.key) + '}</code>' +
            '<span>' + esc(t.label) + '</span>' +
            (t.example ? '<em>VD: ' + esc(t.example) + '</em>' : '') +
          '</button>';
        }).join('') +
      '</div>';
  }

  function caseDisplayTitle(t) {
    return String((t && t.name) || '').trim() || '—';
  }

  function renderCases() {
    var wrap = document.getElementById('ann-cases-root');
    if (!wrap) return;

    var items = filteredTypes();
    var countEl = document.getElementById('ann-case-count');
    if (countEl) countEl.textContent = items.length + ' / ' + state.types.length;

    if (!items.length) {
      wrap.innerHTML = '<div class="ix-card"><div class="ix-card-body" style="text-align:center;padding:40px;color:var(--ix-text-muted)">Không có trường hợp phù hợp bộ lọc.</div></div>';
      return;
    }

    wrap.innerHTML = items.map(function (t) {
      var tpl = t.template || {};
      var open = !!state.expanded[t.code];
      var tagChips = (t.variables || []).map(function (v) {
        var k = tagDisplayKey(v);
        return '<button type="button" class="ix-chip ann-mini-tag" data-ann-copy-tag="' + esc(k) + '" style="cursor:pointer;font-size:10px">{' + esc(k) + '}</button>';
      }).join('');

      return '<div class="ix-card ann-case" data-case="' + esc(t.code) + '">' +
        '<button type="button" class="ann-case__head" data-ann-toggle="' + esc(t.code) + '">' +
          '<div class="ann-case__icon"><i class="ti ' + esc(t.icon) + '"></i></div>' +
          '<div class="ann-case__meta">' +
            '<div class="ann-case__title"><code style="font-size:11px;margin-right:8px">' + esc(t.adminCode) + '</code>' + esc(caseDisplayTitle(t)) + '</div>' +
            '<div class="ann-case__sub">' + esc(t.group) + ' · ' + esc(t.channel) + '</div>' +
            '<div class="ann-case__trigger">' + esc(t.description) + '</div>' +
          '</div>' +
          '<div class="ann-case__badges">' +
            (tpl.isCustom ? '<span class="ix-chip ix-chip-warning">Đã chỉnh</span>' : '<span class="ix-chip">Mặc định</span>') +
            '<span class="ix-chip ix-chip-info">' + (t.variables || []).length + ' thẻ</span>' +
            '<i class="ti ti-chevron-' + (open ? 'up' : 'down') + '"></i>' +
          '</div>' +
        '</button>' +
        (open ? '<div class="ann-case__body">' +
          '<div class="ann-case__tags-label">Biến canonical (metadata) · hiển thị legacy:</div>' +
          '<div class="ann-case__tags">' + tagChips + '</div>' +
          '<div class="ann-form-grid">' +
            '<div class="ix-form-group ann-form-full"><label class="ix-label">Tên mẫu thông báo</label>' +
              '<input class="ix-input" data-ann-field="name" data-ann-code="' + esc(t.code) + '" value="' + esc(t.name || '') + '" /></div>' +
            '<div class="ix-form-group"><label class="ix-label">Tiêu đề mẫu</label>' +
              '<input class="ix-input" data-ann-field="title" data-ann-code="' + esc(t.code) + '" value="' + esc(tpl.title || '') + '" /></div>' +
            '<div class="ix-form-group ann-form-full"><label class="ix-label">Nội dung mẫu</label>' +
              '<textarea class="ix-input" rows="3" data-ann-field="body" data-ann-code="' + esc(t.code) + '">' + esc(tpl.body || '') + '</textarea></div>' +
          '</div>' +
          '<div class="ann-preview">' +
            '<div class="ann-preview__label"><i class="ti ti-eye"></i> Xem trước (server renderer · không gửi)</div>' +
            '<div class="ann-preview__box">' +
              '<div class="ann-preview__title" data-ann-preview-title="' + esc(t.code) + '">…</div>' +
              '<div class="ann-preview__msg" data-ann-preview-msg="' + esc(t.code) + '">…</div>' +
            '</div>' +
          '</div>' +
          '<div class="ann-case__actions">' +
            '<button type="button" class="ix-btn ix-btn-primary ix-btn-sm" data-ann-save="' + esc(t.code) + '"><i class="ti ti-device-floppy"></i> Lưu mẫu</button>' +
            '<button type="button" class="ix-btn ix-btn-outline ix-btn-sm" data-ann-reset="' + esc(t.code) + '"><i class="ti ti-refresh"></i> Khôi phục mặc định</button>' +
          '</div>' +
        '</div>' : '') +
      '</div>';
    }).join('');

    items.forEach(function (t) {
      if (state.expanded[t.code]) schedulePreview(t.code);
    });
  }

  function findType(code) {
    return state.types.find(function (t) { return t.code === code; });
  }

  function schedulePreview(code) {
    if (state.previewTimers[code]) clearTimeout(state.previewTimers[code]);
    state.previewTimers[code] = setTimeout(function () { runPreview(code); }, 280);
  }

  function runPreview(code) {
    var titleEl = document.querySelector('[data-ann-field="title"][data-ann-code="' + code + '"]');
    var bodyEl = document.querySelector('[data-ann-field="body"][data-ann-code="' + code + '"]');
    var pTitle = document.querySelector('[data-ann-preview-title="' + code + '"]');
    var pMsg = document.querySelector('[data-ann-preview-msg="' + code + '"]');
    if (!titleEl || !bodyEl || !pTitle || !pMsg) return;

    request('/admin/notifications/types/' + encodeURIComponent(code) + '/template/preview', {
      method: 'POST',
      body: { title: titleEl.value, body: bodyEl.value }
    }).then(function (data) {
      var preview = data.preview || {};
      pTitle.textContent = preview.title || '';
      pMsg.textContent = preview.body || '';
    }).catch(function () {
      pTitle.textContent = '—';
      pMsg.textContent = 'Không render được xem trước';
    });
  }

  function renderGroupFilter() {
    var sel = document.getElementById('ann-group-filter');
    if (!sel) return;
    var groups = listGroups();
    sel.innerHTML = '<option value="">Tất cả nhóm (' + state.types.length + ')</option>' +
      groups.map(function (g) {
        return '<option value="' + esc(g) + '"' + (state.group === g ? ' selected' : '') + '>' + esc(g) + '</option>';
      }).join('');
  }

  function updateTagTotal() {
    var tagEl = document.getElementById('ann-tag-total');
    if (tagEl) tagEl.textContent = String(aggregateMergeTags().length);
  }

  function render() {
    renderTagPanel();
    renderGroupFilter();
    renderCases();
    updateTagTotal();
  }

  function loadTypes() {
    return request('/admin/notifications/types').then(function (data) {
      state.types = data.items || [];
      render();
    });
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
        var code = toggle.getAttribute('data-ann-toggle');
        state.expanded[code] = !state.expanded[code];
        renderCases();
        return;
      }
      var saveBtn = e.target.closest('[data-ann-save]');
      if (saveBtn) {
        var saveCode = saveBtn.getAttribute('data-ann-save');
        var nEl = document.querySelector('[data-ann-field="name"][data-ann-code="' + saveCode + '"]');
        var tEl = document.querySelector('[data-ann-field="title"][data-ann-code="' + saveCode + '"]');
        var mEl = document.querySelector('[data-ann-field="body"][data-ann-code="' + saveCode + '"]');
        var typeObj = findType(saveCode);
        var version = typeObj && typeObj.template ? typeObj.template.version : undefined;
        var nameVal = nEl ? String(nEl.value || '').trim() : '';
        var chain = Promise.resolve();
        if (nameVal) {
          chain = request('/admin/notifications/types/' + encodeURIComponent(saveCode), {
            method: 'PATCH',
            body: { name: nameVal }
          });
        }
        chain.then(function () {
          return request('/admin/notifications/types/' + encodeURIComponent(saveCode) + '/template', {
            method: 'PATCH',
            body: { title: tEl ? tEl.value : '', body: mEl ? mEl.value : '', version: version }
          });
        }).then(function () {
          toast('Đã lưu mẫu · ' + saveCode);
          return loadTypes();
        }).catch(function (err) { toast(err.message || 'Lỗi lưu', 'danger'); });
        return;
      }
      var resetBtn = e.target.closest('[data-ann-reset]');
      if (resetBtn) {
        var resetCode = resetBtn.getAttribute('data-ann-reset');
        request('/admin/notifications/types/' + encodeURIComponent(resetCode) + '/template/restore', {
          method: 'POST'
        }).then(function () {
          toast('Đã khôi phục mặc định', 'info');
          return loadTypes();
        }).catch(function (err) { toast(err.message || 'Lỗi', 'danger'); });
      }
    });
    document.getElementById('ann-cases-root').addEventListener('input', function (e) {
      var el = e.target.closest('[data-ann-field]');
      if (!el) return;
      schedulePreview(el.getAttribute('data-ann-code'));
    });
    document.getElementById('ann-reset-all').addEventListener('click', function () {
      if (!confirm('Khôi phục tất cả mẫu về mặc định (seed)?')) return;
      var chain = Promise.resolve();
      state.types.forEach(function (t) {
        chain = chain.then(function () {
          return request('/admin/notifications/types/' + encodeURIComponent(t.code) + '/template/restore', { method: 'POST' });
        });
      });
      chain.then(function () {
        toast('Đã khôi phục toàn bộ mẫu', 'info');
        return loadTypes();
      }).catch(function (err) { toast(err.message || 'Lỗi', 'danger'); });
    });
  }

  function init() {
    bind();
    loadTypes().catch(function (err) {
      toast(err.message || 'Không tải danh sách mẫu', 'danger');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(window);
