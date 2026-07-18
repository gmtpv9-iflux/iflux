/* Admin page kit — chỉ dùng class iflux-admin-ui (SoT), không hardcode màu */
(function (global) {
  'use strict';

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function toast(msg, type) {
    if (typeof global.ixToast === 'function') global.ixToast(msg, type || 'primary');
  }

  function chipHtml(text, variant) {
    return '<span class="ix-chip ix-chip-' + esc(variant || 'primary') + '">' + esc(text) + '</span>';
  }

  function renderStats(stats) {
    if (!stats || !stats.length) return '';
    return (
      '<div class="ix-grid ix-grid-4 ix-mb-24">' +
        stats.map(function (s) {
          return (
            '<div class="ix-stat-card-h">' +
              '<div class="ix-stat-info">' +
                '<div class="ix-stat-label">' + esc(s.label) + '</div>' +
                '<div class="ix-stat-value">' + esc(s.value) + '</div>' +
                (s.sub ? '<div class="ix-stat-sub">' + esc(s.sub) + '</div>' : '') +
              '</div>' +
              '<div class="ix-stat-icon ' + esc(s.iconCls || 'accent') + '"><i class="' + esc(s.icon || 'ti ti-chart-bar') + '"></i></div>' +
            '</div>'
          );
        }).join('') +
      '</div>'
    );
  }

  function renderFilters(filters) {
    if (!filters || !filters.length) return '';
    return (
      '<div class="ix-filter-bar">' +
        '<div class="ix-filter-bar-title">Bộ lọc</div>' +
        '<div class="ix-filter-row">' +
          filters.map(function (f) {
            if (f.type === 'search') {
              return (
                '<div class="ix-filter-field ix-filter-field--grow">' +
                  '<label class="ix-label">' + esc(f.label) + '</label>' +
                  '<input type="search" class="ix-input" id="' + esc(f.id) + '" placeholder="' + esc(f.placeholder || '') + '" />' +
                '</div>'
              );
            }
            if (f.type === 'date') {
              return (
                '<div class="ix-filter-field">' +
                  '<label class="ix-label">' + esc(f.label) + '</label>' +
                  '<input type="date" class="ix-input" id="' + esc(f.id) + '" />' +
                '</div>'
              );
            }
            return (
              '<div class="ix-filter-field">' +
                '<label class="ix-label">' + esc(f.label) + '</label>' +
                '<select class="ix-input" id="' + esc(f.id) + '">' +
                  (f.options || []).map(function (o) {
                    return '<option value="' + esc(o.value) + '">' + esc(o.label) + '</option>';
                  }).join('') +
                '</select>' +
              '</div>'
            );
          }).join('') +
          '<div class="ix-filter-actions">' +
            '<button type="button" class="ix-btn ix-btn-primary" data-adm-filter-apply><i class="ti ti-filter"></i> Lọc</button>' +
            '<button type="button" class="ix-btn ix-btn-outline" data-adm-filter-reset>Đặt lại</button>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  function cellValue(row, col) {
    var v = row[col.key];
    if (col.chipMap && col.chipMap[v]) {
      var m = col.chipMap[v];
      return chipHtml(m.text || v, m.variant);
    }
    if (col.mono) return '<span style="font-family:var(--ifx-font-mono)">' + esc(v) + '</span>';
    return esc(v);
  }

  function renderTable(cfg) {
    var cols = cfg.columns || [];
    var rows = cfg.rows || [];
    var headActions = cfg.headActions || '';
    return (
      '<div class="ix-card">' +
        renderFilters(cfg.filters) +
        '<div class="ix-card-header">' +
          '<div class="ix-card-title">' + esc(cfg.tableTitle || 'Danh sách') + '</div>' +
          (headActions ? '<div class="ix-card-actions">' + headActions + '</div>' : '') +
        '</div>' +
        '<div class="ix-table-wrap">' +
          '<table class="ix-table" id="adm-page-table">' +
            '<thead><tr>' +
              cols.map(function (c) { return '<th>' + esc(c.label) + '</th>'; }).join('') +
              (cfg.rowActions ? '<th></th>' : '') +
            '</tr></thead>' +
            '<tbody id="adm-page-tbody">' +
              (rows.length
                ? rows.map(function (row) {
                  return '<tr>' +
                    cols.map(function (c) { return '<td>' + cellValue(row, c) + '</td>'; }).join('') +
                    (cfg.rowActions
                      ? '<td><div class="ix-btn-group">' + cfg.rowActions(row) + '</div></td>'
                      : '') +
                  '</tr>';
                }).join('')
                : '<tr><td colspan="' + (cols.length + (cfg.rowActions ? 1 : 0)) + '" style="text-align:center;padding:32px;color:var(--ix-text-muted);font-size:13px">Chưa có dữ liệu.</td></tr>') +
            '</tbody>' +
          '</table>' +
        '</div>' +
      '</div>'
    );
  }

  function renderSections(sections) {
    return (
      '<div class="ix-grid ix-grid-2">' +
        (sections || []).map(function (sec) {
          return (
            '<div class="ix-card">' +
              '<div class="ix-card-header"><div class="ix-card-title">' + esc(sec.title) + '</div></div>' +
              '<div class="ix-card-body">' +
                '<ul class="ix-detail-list">' +
                  (sec.items || []).map(function (it) {
                    return '<li><span class="ix-detail-label">' + esc(it.label) + '</span><span class="ix-detail-val">' + esc(it.value) + '</span></li>';
                  }).join('') +
                '</ul>' +
              '</div>' +
            '</div>'
          );
        }).join('') +
      '</div>'
    );
  }

  function renderForm(cfg) {
    return (
      '<div class="ix-card">' +
        '<div class="ix-card-header"><div class="ix-card-title">' + esc(cfg.formTitle || 'Cấu hình') + '</div></div>' +
        '<div class="ix-card-body">' +
          (cfg.fields || []).map(function (f) {
            if (f.type === 'toggle') {
              return (
                '<div class="ix-form-group">' +
                  '<label class="ix-label">' + esc(f.label) + '</label>' +
                  '<label class="ix-switch"><input type="checkbox"' + (f.checked ? ' checked' : '') + ' /><span class="ix-switch-slider"></span></label>' +
                  (f.hint ? '<p style="font-size:12px;color:var(--ix-text-muted);margin:8px 0 0">' + esc(f.hint) + '</p>' : '') +
                '</div>'
              );
            }
            if (f.type === 'textarea') {
              return (
                '<div class="ix-form-group">' +
                  '<label class="ix-label">' + esc(f.label) + '</label>' +
                  '<textarea class="ix-textarea" rows="' + (f.rows || 3) + '" placeholder="' + esc(f.placeholder || '') + '">' + esc(f.value || '') + '</textarea>' +
                '</div>'
              );
            }
            return (
              '<div class="ix-form-group">' +
                '<label class="ix-label">' + esc(f.label) + '</label>' +
                '<input type="' + esc(f.inputType || 'text') + '" class="ix-input" value="' + esc(f.value || '') + '" placeholder="' + esc(f.placeholder || '') + '" />' +
                (f.hint ? '<p style="font-size:12px;color:var(--ix-text-muted);margin:8px 0 0">' + esc(f.hint) + '</p>' : '') +
              '</div>'
            );
          }).join('') +
          '<div style="display:flex;gap:12px;margin-top:8px">' +
            '<button type="button" class="ix-btn ix-btn-primary" data-adm-form-save><i class="ti ti-device-floppy"></i> Lưu</button>' +
            (cfg.secondaryAction ? cfg.secondaryAction : '') +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  function mount(cfg) {
    var root = document.getElementById('adm-page-root');
    if (!root || !cfg) return;

    var titleEl = document.getElementById('adm-page-title');
    var bcEl = document.getElementById('adm-page-bc');
    var introEl = document.getElementById('adm-page-intro');
    if (titleEl) titleEl.textContent = cfg.title || cfg.code;
    if (bcEl) {
      bcEl.innerHTML = '<a href="../../hub.html">Admin</a><i class="ti ti-chevron-right"></i><span>' + esc(cfg.code) + '</span>';
    }
    if (introEl) introEl.textContent = cfg.intro || '';

    var html = renderStats(cfg.stats);
    if (cfg.layout === 'form') html += renderForm(cfg);
    else if (cfg.layout === 'sections') html += renderSections(cfg.sections);
    else html += renderTable(cfg);
    root.innerHTML = html;

    root.querySelectorAll('[data-adm-filter-apply]').forEach(function (btn) {
      btn.addEventListener('click', function () { toast('Đã áp dụng bộ lọc (demo)', 'primary'); });
    });
    root.querySelectorAll('[data-adm-filter-reset]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        root.querySelectorAll('.ix-input').forEach(function (inp) {
          if (inp.type === 'search' || inp.type === 'text') inp.value = '';
          if (inp.tagName === 'SELECT') inp.selectedIndex = 0;
        });
      });
    });
    root.querySelectorAll('[data-adm-form-save]').forEach(function (btn) {
      btn.addEventListener('click', function () { toast('Đã lưu (demo)', 'success'); });
    });
    root.querySelectorAll('[data-adm-row-action]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        toast(btn.getAttribute('data-adm-row-action') || 'Thao tác', 'primary');
      });
    });
  }

  global.AdminPageKit = { mount: mount, esc: esc, chipHtml: chipHtml };
})(window);
