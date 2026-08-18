/*
 * BR-11 — Nguồn Market data | Đồng bộ cấu trúc cổ phiếu | Lịch sử đồng bộ
 * Import ≠ Apply: Import chỉ phân loại; Conflict Review → Reject/Apply mới ghi Master.
 * Matrix columns: provider_columns từ API (data_sources), không hardcode nhãn provider trên HTML.
 */
(function (global) {
  'use strict';

  var pageMode = 'registry';
  var items = [];
  var registryCodes = [];
  var providerColumns = [];
  var detailCode = null;
  var searchTimer = null;
  var lastImportIds = [];
  var conflictRows = [];

  var ROUTE_BY_MODE = {
    registry: 'data-sources',
    structure: 'market-stock-schema',
    history: 'market-sync-history'
  };

  function canPerm(key) {
    return !!(global.IfluxAdminRbac && IfluxAdminRbac.hasPermission && IfluxAdminRbac.hasPermission(key));
  }

  /** Cho phép edit khi đã đăng nhập; chỉ khóa sau khi RBAC load xong và thiếu quyền. */
  function canEditSources() {
    if (!adminToken()) return false;
    if (!global.IfluxAdminRbac || !IfluxAdminRbac.isLoaded || !IfluxAdminRbac.isLoaded()) return true;
    return canPerm('data.sources.edit');
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function toast(msg, type) {
    if (typeof global.ixToast === 'function') global.ixToast(msg, type || 'info');
  }

  function apiBase() {
    if (global.IfluxAdminAuth && IfluxAdminAuth.apiBase) return IfluxAdminAuth.apiBase();
    return '/api';
  }

  function adminToken() {
    if (global.IfluxAdminAuth && IfluxAdminAuth.getSession) {
      var s = IfluxAdminAuth.getSession();
      if (s && s.token) return s.token;
    }
    try {
      var raw = localStorage.getItem('iflux_admin_session') || sessionStorage.getItem('iflux_admin_session');
      if (raw) {
        var obj = JSON.parse(raw);
        if (obj && obj.token) return obj.token;
      }
    } catch (e) { /* ignore */ }
    return null;
  }

  function authHeaders() {
    var h = { Accept: 'application/json' };
    var token = adminToken();
    if (token) h.Authorization = 'Bearer ' + token;
    return h;
  }

  function unwrap(data) {
    if (data && data.data) return data.data;
    return data || {};
  }

  function errMessage(data, status) {
    var err = data && data.error;
    if (typeof err === 'string' && err) return err;
    if (err && err.message) return err.message;
    if (data && data.message) return data.message;
    return 'HTTP ' + status;
  }

  function request(path, options) {
    options = options || {};
    var headers = Object.assign(authHeaders(), options.headers || {});
    if (options.body != null) headers['Content-Type'] = 'application/json';
    return fetch(apiBase() + path, {
      method: options.method || 'GET',
      headers: headers,
      body: options.body != null ? JSON.stringify(options.body) : undefined
    }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (data) {
        if (!res.ok) throw new Error(errMessage(data, res.status));
        return unwrap(data);
      });
    });
  }

  function fmtDate(iso) {
    if (!iso) return '—';
    try { return new Date(iso).toLocaleString('vi-VN'); } catch (e) { return iso; }
  }

  function statusChip(status) {
    var st = String(status || '').toLowerCase();
    if (st === 'success' || st === 'connected' || st === 'active') return '<span class="ix-chip ix-chip-success">' + esc(status) + '</span>';
    if (st === 'protected' || st === 'partial') return '<span class="ix-chip ix-chip-warning">' + esc(status) + '</span>';
    if (st === 'degraded') return '<span class="ix-chip ix-chip-warning">Suy giảm</span>';
    if (st === 'failed' || st === 'disabled') return '<span class="ix-chip ix-chip-danger">' + esc(status) + '</span>';
    return '<span class="ix-chip">' + esc(status || '—') + '</span>';
  }

  function openConflictOffcanvas() {
    var el = document.getElementById('offcanvas-mdm-conflict');
    var ov = document.getElementById('offcanvas-mdm-conflict-overlay');
    if (el) el.classList.add('open');
    if (ov) ov.classList.add('open');
  }

  function closeConflictOffcanvas() {
    var el = document.getElementById('offcanvas-mdm-conflict');
    var ov = document.getElementById('offcanvas-mdm-conflict-overlay');
    if (el) el.classList.remove('open');
    if (ov) ov.classList.remove('open');
  }

  function renderRegistry() {
    var tb = document.getElementById('adm-src-tbody');
    var count = document.getElementById('adm-src-count');
    if (count) count.textContent = String(items.length);
    if (!tb) return;
    if (!items.length) {
      tb.innerHTML = '<tr><td colspan="7" class="ix-caption" style="text-align:center;padding:28px">Chưa có nguồn — kiểm tra đăng nhập / quyền data.sources.view.</td></tr>';
      return;
    }
    tb.innerHTML = items.map(function (s) {
      return '<tr>' +
        '<td><strong>' + esc(s.name) + '</strong><div class="ix-caption"><code>' + esc(s.code) + '</code></div></td>' +
        '<td>' + esc(s.provider || s.name) + '</td>' +
        '<td>' + esc(s.source_type || s.type || '—') + '</td>' +
        '<td>' + statusChip(s.status) + '</td>' +
        '<td class="ix-caption">' + esc(fmtDate(s.last_import_at)) + '</td>' +
        '<td class="ix-caption">' + esc(fmtDate(s.last_success_at)) + '</td>' +
        '<td><button type="button" class="ix-btn ix-btn-outline ix-btn-sm" data-src-detail="' + esc(s.code) + '">Chi tiết</button></td>' +
      '</tr>';
    }).join('');
  }

  function showSourceDetail(code) {
    var item = items.filter(function (x) { return x.code === code; })[0];
    var panel = document.getElementById('adm-mdm-source-detail');
    var title = document.getElementById('adm-mdm-detail-title');
    var body = document.getElementById('adm-mdm-detail-body');
    var stageWrap = document.getElementById('adm-mdm-staging-wrap');
    if (!item || !panel || !body) return;
    detailCode = code;
    if (title) title.textContent = (item.name || '') + ' (' + code + ')';
    var exposed = item.exposed_fields || [];
    var exposedText = exposed.length
      ? exposed.map(function (f) {
          return (f.iflux_field || '') + ' ← ' + (f.native_field || '');
        }).join(' · ')
      : 'Không expose field Master (runtime / chưa wire)';
    body.innerHTML =
      '<div class="ix-caption">Trạng thái: ' + statusChip(item.status) +
      ' · Loại: ' + esc(item.source_type || item.type) + '</div>' +
      (item.description
        ? '<div class="ix-caption" style="margin-top:8px">' + esc(item.description) + '</div>'
        : '') +
      '<div class="ix-caption" style="margin-top:8px">Field expose: ' + esc(exposedText) + '</div>';
    panel.hidden = false;
    /* Staging chỉ cần khi adapter đọc payload CSV (SSI / FiinPro). */
    var needsStaging = !!(item.source_type && String(item.source_type).toLowerCase().indexOf('csv') >= 0) ||
      code === 'ssi_market_feed' || code === 'fiinpro_eod';
    if (stageWrap) stageWrap.hidden = !needsStaging;
    if (needsStaging) {
      request('/admin/market/mdm/sources/' + encodeURIComponent(code) + '/staging')
        .then(function (data) {
          var it = data.item;
          var ta = document.getElementById('adm-mdm-staging-payload');
          var meta = document.getElementById('adm-mdm-staging-meta');
          if (ta) ta.value = (it && it.payload_text) || '';
          if (meta) meta.textContent = it && it.updated_at ? ('Cập nhật: ' + fmtDate(it.updated_at)) : 'Chưa có staging';
        })
        .catch(function () { /* ignore */ });
    }
  }

  function hideSourceDetail() {
    detailCode = null;
    var panel = document.getElementById('adm-mdm-source-detail');
    if (panel) panel.hidden = true;
  }

  function navTrail(routeKey) {
    var reg = global.IfluxAdminNavRegistry;
    if (reg && reg.trailFor) return reg.trailFor(routeKey);
    return [{ label: 'Admin', href: '/admin/tong-quan' }];
  }

  function fillPageChrome() {
    var routeKey = ROUTE_BY_MODE[pageMode];
    if (!routeKey) return;
    var trail = navTrail(routeKey);
    var titleEl = document.getElementById('adm-page-title');
    var bcEl = document.getElementById('adm-page-bc');
    var last = trail[trail.length - 1];
    if (titleEl && last) titleEl.textContent = last.label || '';
    if (bcEl) {
      bcEl.textContent = '';
      trail.forEach(function (crumb, idx) {
        if (idx > 0) {
          var sep = document.createElement('i');
          sep.className = 'ti ti-chevron-right';
          sep.style.fontSize = '12px';
          bcEl.appendChild(sep);
        }
        if (crumb.href && idx < trail.length - 1) {
          var a = document.createElement('a');
          a.href = crumb.href;
          a.textContent = crumb.label;
          bcEl.appendChild(a);
        } else {
          var span = document.createElement('span');
          span.textContent = crumb.label;
          bcEl.appendChild(span);
        }
      });
    }
    if (document.title && last && last.label) {
      document.title = last.label + ' · iFlux Admin';
    }
  }

  function appendTh(tr, text) {
    var th = document.createElement('th');
    th.textContent = text;
    tr.appendChild(th);
  }

  function appendTd(tr, className) {
    var td = document.createElement('td');
    if (className) td.className = className;
    tr.appendChild(td);
    return td;
  }

  /* 1 field = 1 <tr>; mỗi provider 1 ô. Không gắn .ix-caption lên <td>. */
  function renderConfigInto(opts) {
    opts = opts || {};
    var rows = opts.rows || [];
    var columns = opts.columns;
    var entity = opts.entity || 'stock';
    if (columns && columns.length) providerColumns = columns;
    var thead = document.getElementById(opts.theadId || 'adm-mdm-config-thead');
    var tb = document.getElementById(opts.tbodyId || 'adm-mdm-config-tbody');
    if (!tb) return;

    var cols = providerColumns.slice();
    if (!cols.length && rows && rows[0] && rows[0].providers) {
      cols = Object.keys(rows[0].providers).map(function (code) {
        return { code: code, label: code };
      });
    }

    if (thead) {
      thead.textContent = '';
      appendTh(thead, 'Trường iFlux');
      cols.forEach(function (col) {
        appendTh(thead, col.label || col.code);
      });
      appendTh(thead, 'Nguồn hiện tại');
    }

    tb.textContent = '';
    var colCount = cols.length + 2;
    if (!rows || !rows.length) {
      var emptyTr = document.createElement('tr');
      var emptyTd = appendTd(emptyTr);
      emptyTd.colSpan = colCount || 2;
      emptyTd.style.textAlign = 'center';
      emptyTd.style.padding = '20px';
      emptyTd.textContent = 'Chưa có cấu hình field.';
      tb.appendChild(emptyTr);
      return;
    }

    var editable = canEditSources();
    rows.forEach(function (r) {
      var tr = document.createElement('tr');
      var fieldTd = appendTd(tr);
      var strong = document.createElement('strong');
      strong.textContent = r.field_label || r.field_key;
      fieldTd.appendChild(strong);
      var keyDiv = document.createElement('div');
      keyDiv.className = 'ix-caption';
      var keyCode = document.createElement('code');
      keyCode.textContent = r.field_key;
      keyDiv.appendChild(keyCode);
      fieldTd.appendChild(keyDiv);

      var providers = r.providers || {};
      cols.forEach(function (col) {
        var cell = appendTd(tr);
        var native = providers[col.code];
        if (native) {
          var codeEl = document.createElement('code');
          codeEl.textContent = String(native);
          cell.appendChild(codeEl);
        } else {
          cell.textContent = '—';
        }
      });

      var sourceTd = appendTd(tr);
      var selectable = Array.isArray(r.selectable_sources) ? r.selectable_sources.slice() : [];
      if (!selectable.length) {
        sourceTd.textContent = '—';
      } else if (editable) {
        var sel = document.createElement('select');
        sel.className = 'ix-select';
        sel.setAttribute('data-fa-field', r.field_key);
        sel.setAttribute('data-fa-entity', r.entity || entity);
        sel.setAttribute('data-fa-kind', 'source');
        if (!r.current_source || selectable.indexOf(r.current_source) < 0) {
          var opt0 = document.createElement('option');
          opt0.value = '';
          opt0.textContent = 'Chưa gán';
          opt0.selected = true;
          sel.appendChild(opt0);
        }
        selectable.forEach(function (c) {
          var opt = document.createElement('option');
          opt.value = c;
          opt.textContent = c;
          if (r.current_source === c) opt.selected = true;
          sel.appendChild(opt);
        });
        sourceTd.appendChild(sel);
      } else {
        sourceTd.textContent = r.current_source || '—';
      }

      tb.appendChild(tr);
    });
  }

  function renderConfig(rows, columns) {
    renderConfigInto({
      rows: rows,
      columns: columns,
      entity: 'stock',
      theadId: 'adm-mdm-config-thead',
      tbodyId: 'adm-mdm-config-tbody'
    });
  }

  function renderPriceConfig(rows, columns) {
    renderConfigInto({
      rows: rows,
      columns: columns,
      entity: 'stock_price',
      theadId: 'adm-mdm-price-config-thead',
      tbodyId: 'adm-mdm-price-config-tbody'
    });
  }

  function renderConflictReview(rows) {
    conflictRows = rows || [];
    var tb = document.getElementById('adm-mdm-conflict-review-tbody');
    if (!tb) return;
    if (!conflictRows.length) {
      tb.innerHTML = '<tr><td colspan="7" class="ix-caption" style="text-align:center;padding:20px">' +
        'Không có xung đột dữ liệu giữa nguồn và Master trong lần Import này.</td></tr>';
      return;
    }
    tb.innerHTML = conflictRows.map(function (r) {
      return '<tr>' +
        '<td><input type="checkbox" class="mdm-conflict-check" value="' + esc(r.id) + '" /></td>' +
        '<td><strong>' + esc(r.entity_key) + '</strong></td>' +
        '<td>' + esc(r.field_key) + '</td>' +
        '<td class="ix-caption">' + esc(r.current_value != null ? r.current_value : '—') + '</td>' +
        '<td class="ix-caption"><strong>' + esc(r.incoming_value != null ? r.incoming_value : '—') + '</strong></td>' +
        '<td><code>' + esc(r.source_code) + '</code></td>' +
        '<td class="ix-caption">Chờ duyệt</td>' +
      '</tr>';
    }).join('');
  }

  function conflictsQueryForImport() {
    var qs = 'import_ids=' + encodeURIComponent((lastImportIds || []).join(','));
    return '/admin/market/mdm/conflicts?' + qs;
  }

  function renderImports(rows) {
    var tb = document.getElementById('adm-mdm-import-tbody');
    if (!tb) return;
    if (!rows || !rows.length) {
      tb.innerHTML = '<tr><td colspan="10" class="ix-caption" style="text-align:center;padding:20px">Chưa có lần Apply hoàn tất.</td></tr>';
      return;
    }
    tb.innerHTML = rows.slice(0, 40).map(function (r) {
      var cs = r.change_set_count != null ? r.change_set_count : 0;
      var csCell = cs
        ? ('<button type="button" class="ix-btn ix-btn-outline ix-btn-sm" data-mdm-changeset="' + esc(r.id) + '">' + esc(cs) + ' — Xem</button>')
        : '0';
      var shortId = 'IMP-' + String(r.id).slice(0, 8).toUpperCase();
      return '<tr>' +
        '<td class="ix-caption"><code>' + esc(shortId) + '</code></td>' +
        '<td><code>' + esc(r.source_code) + '</code></td>' +
        '<td>' + statusChip(r.status) + '</td>' +
        '<td>' + esc(r.new_count) + '</td>' +
        '<td>' + esc(r.updated_count != null ? r.updated_count : r.filled_count) + '</td>' +
        '<td>' + esc(r.unchanged_count) + '</td>' +
        '<td>' + esc(r.missing_count) + '</td>' +
        '<td>' + esc(r.conflict_count) + '</td>' +
        '<td>' + csCell + '</td>' +
        '<td class="ix-caption">' + esc(fmtDate(r.finished_at || r.started_at)) + '</td>' +
      '</tr>';
    }).join('');
  }

  function renderAudit(rows) {
    var tb = document.getElementById('adm-mdm-audit-tbody');
    if (!tb) return;
    if (!rows || !rows.length) {
      tb.innerHTML = '<tr><td colspan="10" class="ix-caption" style="text-align:center;padding:20px">Chưa có audit (sau Apply).</td></tr>';
      return;
    }
    tb.innerHTML = rows.slice(0, 80).map(function (r) {
      return '<tr>' +
        '<td class="ix-caption">' + esc(fmtDate(r.created_at)) + '</td>' +
        '<td class="ix-caption">' + esc(r.actor || r.admin_id || '—') + '</td>' +
        '<td>' + esc(r.entity) + '</td>' +
        '<td><strong>' + esc(r.entity_key) + '</strong></td>' +
        '<td>' + esc(r.field_key) + '</td>' +
        '<td class="ix-caption">' + esc(r.from_value != null ? r.from_value : '—') + '</td>' +
        '<td class="ix-caption">' + esc(r.to_value != null ? r.to_value : '—') + '</td>' +
        '<td><code>' + esc(r.source_code) + '</code></td>' +
        '<td class="ix-caption">' + esc(r.why || '—') + '</td>' +
        '<td>' + esc(r.result || '—') + '</td>' +
      '</tr>';
    }).join('');
  }

  function openChangeSet(importId) {
    var title = document.getElementById('adm-mdm-cs-title');
    var tb = document.getElementById('adm-mdm-cs-tbody');
    if (title) title.textContent = 'Change Set · ' + String(importId).slice(0, 8);
    if (tb) tb.innerHTML = '<tr><td colspan="7" class="ix-caption">Đang tải…</td></tr>';
    if (typeof global.ixOpenOffcanvas === 'function') global.ixOpenOffcanvas('offcanvas-mdm-changeset');
    else {
      var el = document.getElementById('offcanvas-mdm-changeset');
      if (el) el.classList.add('open');
    }
    request('/admin/market/mdm/imports/' + encodeURIComponent(importId) + '/change-set')
      .then(function (data) {
        var rows = data.items || [];
        if (!tb) return;
        if (!rows.length) {
          tb.innerHTML = '<tr><td colspan="7" class="ix-caption">Change Set trống.</td></tr>';
          return;
        }
        tb.innerHTML = rows.map(function (r) {
          return '<tr>' +
            '<td><strong>' + esc(r.entity_key) + '</strong></td>' +
            '<td>' + esc(r.field_key) + '</td>' +
            '<td class="ix-caption">' + esc(r.current_value != null ? r.current_value : '—') + '</td>' +
            '<td class="ix-caption">' + esc(r.incoming_value != null ? r.incoming_value : '—') + '</td>' +
            '<td><code>' + esc(r.source_code) + '</code></td>' +
            '<td>' + esc(r.change_class || r.class || '—') + '</td>' +
            '<td>' + esc(r.result || '—') + '</td>' +
          '</tr>';
        }).join('');
      })
      .catch(function (err) {
        if (tb) tb.innerHTML = '<tr><td colspan="7" class="ix-caption">' + esc(err.message) + '</td></tr>';
      });
  }

  function runImport() {
    var el = document.getElementById('adm-mdm-sync-result');
    if (el) {
      el.style.display = 'block';
      el.textContent = 'Đang Import theo Field Authority…';
    }
    request('/admin/market/mdm/imports/sync-all', { method: 'POST', body: {} })
      .then(function (out) {
        lastImportIds = out.import_ids || [];
        (out.imports || []).forEach(function (x) {
          if (x && x.import_id && lastImportIds.indexOf(x.import_id) < 0) lastImportIds.push(x.import_id);
        });
        var s = out.summary || {};
        if (el) {
          el.textContent =
            'Import xong. Xung đột cần duyệt: ' + (s.conflict_count || 0) +
            ' · Mã mới (auto): ' + (s.new_count || 0) +
            ' · Sources OK: ' + (s.ok_sources || 0);
        }
        return request(conflictsQueryForImport()).then(function (data) {
          var items = data.items || [];
          renderConflictReview(items);
          openConflictOffcanvas();
          if (items.length) toast('Có ' + items.length + ' xung đột cần duyệt', 'warning');
          else toast('Import xong — không có xung đột cần duyệt', 'success');
          loadPage();
        });
      })
      .catch(function (err) {
        if (el) el.textContent = 'Lỗi: ' + (err.message || 'Import thất bại');
        toast(err.message || 'Import thất bại', 'danger');
      });
  }

  function rejectSelected() {
    var ids = Array.prototype.map.call(
      document.querySelectorAll('.mdm-conflict-check:checked'),
      function (el) { return el.value; }
    );
    if (!ids.length) {
      toast('Chọn ít nhất một dòng để Reject', 'warning');
      return;
    }
    request('/admin/market/mdm/conflicts/reject-batch', { method: 'POST', body: { ids: ids } })
      .then(function () {
        toast('Đã Reject ' + ids.length + ' dòng', 'success');
        return request(conflictsQueryForImport()).then(function (data) {
          renderConflictReview(data.items || []);
        });
      })
      .catch(function (err) { toast(err.message || 'Reject thất bại', 'danger'); });
  }

  function applyImport() {
    if (!lastImportIds.length) {
      toast('Chưa có Import session — bấm Import trước', 'warning');
      return;
    }
    request('/admin/market/mdm/imports/apply', {
      method: 'POST',
      body: { import_ids: lastImportIds }
    })
      .then(function (out) {
        toast('Apply thành công · ' + (out.applied || 0) + ' thay đổi → Market Master', 'success');
        closeConflictOffcanvas();
        lastImportIds = [];
        loadPage();
      })
      .catch(function (err) { toast(err.message || 'Apply thất bại', 'danger'); });
  }

  function loadPage() {
    if (!adminToken()) {
      if (pageMode === 'registry') {
        items = [];
        var tb = document.getElementById('adm-src-tbody');
        if (tb) {
          tb.innerHTML = '<tr><td colspan="7" class="ix-caption" style="text-align:center;padding:28px">Cần đăng nhập Admin để tải nguồn.</td></tr>';
        }
      }
      if (pageMode === 'structure') {
        renderConfig([]);
        var tb2 = document.getElementById('adm-mdm-config-tbody');
        if (tb2 && tb2.firstChild && tb2.firstChild.firstChild) {
          tb2.firstChild.firstChild.textContent = 'Cần đăng nhập Admin để tải Field Authority.';
        }
      }
      return Promise.resolve();
    }
    if (pageMode === 'registry') {
      return request('/admin/market/mdm/sources').then(function (data) {
        items = data.sources || [];
        registryCodes = items.map(function (s) { return s.code; }).filter(Boolean);
        renderRegistry();
      }).catch(function (err) {
        items = [];
        var tb = document.getElementById('adm-src-tbody');
        if (tb) {
          tb.innerHTML = '<tr><td colspan="7" class="ix-caption" style="text-align:center;padding:28px">' +
            esc(err && err.message ? err.message : 'Không tải được nguồn') + '</td></tr>';
        }
        if (err && err.message) toast(err.message, 'danger');
      });
    }
    if (pageMode === 'structure') {
      renderConfig([]);
      var tbLoad = document.getElementById('adm-mdm-config-tbody');
      if (tbLoad && tbLoad.firstChild && tbLoad.firstChild.firstChild) {
        tbLoad.firstChild.firstChild.textContent = 'Đang tải…';
      }
      return Promise.all([
        request('/admin/market/mdm/sources'),
        request('/admin/market/mdm/field-authority')
      ]).then(function (parts) {
        items = (parts[0] && parts[0].sources) || [];
        registryCodes = items.map(function (s) { return s.code; }).filter(Boolean);
        var matrix = parts[1] || {};
        var cfg = matrix.config;
        if (!cfg && Array.isArray(matrix)) cfg = matrix;
        var cols = matrix.provider_columns;
        if (!cols || !cols.length) {
          // Fallback: chỉ kênh đang kết nối (không hiện idle/failed như DNSE).
          cols = items
            .filter(function (s) {
              var st = String(s.status || '').toLowerCase();
              return st === 'connected' || st === 'success';
            })
            .map(function (s) {
              return { code: s.code, label: s.name || s.code };
            });
        }
        renderConfig(cfg || [], cols);
        renderPriceConfig(matrix.config_stock_price || [], cols);
      }).catch(function (err) {
        renderConfig([]);
        renderPriceConfig([]);
        var tb = document.getElementById('adm-mdm-config-tbody');
        if (tb && tb.firstChild && tb.firstChild.firstChild) {
          tb.firstChild.firstChild.textContent =
            err && err.message ? err.message : 'Không tải được Field Authority';
        }
        if (err && err.message) toast(err.message, 'danger');
      });
    }
    if (pageMode === 'history') {
      return Promise.all([
        request('/admin/market/mdm/imports?completed=1').catch(function () { return { items: [] }; }),
        request('/admin/market/mdm/audit').catch(function () { return { items: [] }; })
      ]).then(function (parts) {
        renderImports((parts[0] && parts[0].items) || []);
        renderAudit((parts[1] && parts[1].items) || []);
      });
    }
    return Promise.resolve();
  }

  function bindEvents() {
    var refresh = document.getElementById('btn-adm-mdm-refresh');
    if (refresh) refresh.addEventListener('click', loadPage);
    var syncBtn = document.getElementById('btn-adm-mdm-sync');
    if (syncBtn) syncBtn.addEventListener('click', runImport);
    var closeDetail = document.getElementById('btn-adm-mdm-detail-close');
    if (closeDetail) closeDetail.addEventListener('click', hideSourceDetail);
    var saveStaging = document.getElementById('btn-adm-mdm-staging-save');
    if (saveStaging) {
      saveStaging.addEventListener('click', function () {
        if (!detailCode) return;
        var ta = document.getElementById('adm-mdm-staging-payload');
        request('/admin/market/mdm/sources/' + encodeURIComponent(detailCode) + '/staging', {
          method: 'PUT',
          body: { payload_text: (ta && ta.value) || '' }
        }).then(function () {
          toast('Đã lưu staging', 'success');
          showSourceDetail(detailCode);
        }).catch(function (e) { toast(e.message || 'Lỗi staging', 'danger'); });
      });
    }

    var closeConflict = document.getElementById('btn-mdm-conflict-close');
    if (closeConflict) closeConflict.addEventListener('click', closeConflictOffcanvas);
    var ov = document.getElementById('offcanvas-mdm-conflict-overlay');
    if (ov) ov.addEventListener('click', closeConflictOffcanvas);
    var rej = document.getElementById('btn-mdm-reject-selected');
    if (rej) rej.addEventListener('click', rejectSelected);
    var app = document.getElementById('btn-mdm-apply-import');
    if (app) app.addEventListener('click', applyImport);
    var checkAll = document.getElementById('mdm-conflict-check-all');
    if (checkAll) {
      checkAll.addEventListener('change', function () {
        Array.prototype.forEach.call(document.querySelectorAll('.mdm-conflict-check'), function (el) {
          el.checked = checkAll.checked;
        });
      });
    }

    document.addEventListener('change', function (e) {
      var sel = e.target && e.target.closest ? e.target.closest('[data-fa-field]') : null;
      if (!sel) return;
      var field = sel.getAttribute('data-fa-field');
      var kind = sel.getAttribute('data-fa-kind');
      var entity = sel.getAttribute('data-fa-entity') || 'stock';
      var body = { entity: entity, field_key: field };
      if (kind !== 'source' || !sel.value) return;
      body.source_code = sel.value;
      body.trust_level = 'trusted';
      request('/admin/market/mdm/field-authority', { method: 'PUT', body: body })
        .then(function () {
          toast('Đã cập nhật Field Authority', 'success');
          loadPage();
        })
        .catch(function (err) {
          toast(err.message || 'Cập nhật thất bại', 'danger');
          loadPage();
        });
    });

    document.addEventListener('click', function (e) {
      var d = e.target.closest('[data-src-detail]');
      if (d) { showSourceDetail(d.getAttribute('data-src-detail')); return; }
      var cs = e.target.closest('[data-mdm-changeset]');
      if (cs) { openChangeSet(cs.getAttribute('data-mdm-changeset')); }
    });

    var search = document.getElementById('adm-src-search');
    if (search) {
      search.addEventListener('input', function () {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(function () {
          var q = (search.value || '').trim().toLowerCase();
          if (!q) { renderRegistry(); return; }
          var filtered = items.filter(function (s) {
            return String(s.name || '').toLowerCase().indexOf(q) >= 0 ||
              String(s.code || '').toLowerCase().indexOf(q) >= 0;
          });
          var keep = items;
          items = filtered;
          renderRegistry();
          items = keep;
        }, 200);
      });
    }
  }

  function init(mode) {
    pageMode = mode || 'registry';
    fillPageChrome();
    bindEvents();
    loadPage();
    /* Chờ session/RBAC sẵn sàng rồi tải lại (pretty URL + auth async). */
    var tries = 0;
    var timer = setInterval(function () {
      tries += 1;
      var ready = !!adminToken() && (!!global.IfluxAdminRbac || tries > 20);
      if (ready || tries > 40) {
        clearInterval(timer);
        fillPageChrome();
        loadPage();
      }
    }, 100);
  }

  global.AdmDataSources = { init: init, refresh: loadPage };
})(window);
