/* ADM-SYS-011 — Cài đặt Trang */
(function (global) {
  'use strict';

  var state = {
    tab: 'sitemap',
    pageKey: 'dashboard',
    q: ''
  };

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function catalog() { return global.PageSettingsCatalog; }
  function store() { return global.PageSettingsStore; }

  function toast(msg, type) {
    if (global.ixToast) global.ixToast(msg, type || 'success');
  }

  function model() {
    return catalog().buildModel(store().read());
  }

  function currentPage() {
    return catalog().getPageByKey(model(), state.pageKey) || model()[0];
  }

  function setTab(tab) {
    state.tab = tab;
    document.querySelectorAll('[data-ps-tab]').forEach(function (btn) {
      btn.classList.toggle('active', btn.getAttribute('data-ps-tab') === tab);
    });
    document.querySelectorAll('[data-ps-panel]').forEach(function (panel) {
      panel.classList.toggle('active', panel.getAttribute('data-ps-panel') === tab);
    });
    render();
  }

  function renderStats() {
    var el = document.getElementById('ps-stats');
    if (!el) return;
    var s = catalog().stats(model());
    el.innerHTML =
      '<span class="ix-chip ix-chip-info">' + s.pages + ' trang</span>' +
      '<span class="ix-chip">' + s.experience + ' Experience</span>' +
      '<span class="ix-chip">' + s.knowledge + ' Knowledge (entity)</span>' +
      '<span class="ix-chip">' + s.platform + ' Platform</span>' +
      '<span class="ix-chip ix-chip-warning">' + s.widgets + ' Widget Tầng 4</span>';
  }

  function renderUpdated() {
    var el = document.getElementById('ps-updated');
    if (!el) return;
    var raw = store().read();
    el.textContent = raw.updatedAt
      ? 'Cập nhật lần cuối: ' + new Date(raw.updatedAt).toLocaleString('vi-VN')
      : 'Chưa lưu thay đổi — đang dùng cấu hình mặc định từ Product Architecture.';
  }

  function renderPagePicker(selectId) {
    var sel = document.getElementById(selectId);
    if (!sel) return;
    var html = '';
    model().forEach(function (p) {
      html += '<option value="' + esc(p.key) + '"' + (state.pageKey === p.key ? ' selected' : '') + '>' +
        esc(p.title) + ' (' + esc(p.key) + ')</option>';
    });
    sel.innerHTML = html;
  }

  function statusChip(status) {
    if (status === 'active') return '<span class="ix-chip ix-chip-success">Hoạt động</span>';
    if (status === 'draft') return '<span class="ix-chip ix-chip-warning">Nháp</span>';
    return '<span class="ix-chip">' + esc(status) + '</span>';
  }

  function renderSitemap() {
    var root = document.getElementById('ps-sitemap');
    if (!root) return;
    var all = catalog().buildSitemap(store().read());
    var pages = all.filter(function (p) {
      if (p.layerHeader || p.groupHead) return !state.q;
      if (!state.q) return true;
      var hay = [p.id, p.key, p.title, p.slug, p.path, p.description].join(' ').toLowerCase();
      return hay.indexOf(state.q) >= 0;
    });

    var rows = pages.map(function (p) {
      if (p.layerHeader) {
        return '<tr><td colspan="8" style="padding:0">' +
          '<div style="display:flex;align-items:baseline;gap:10px;padding:14px 12px 6px;border-top:2px solid var(--ix-accent);background:rgba(255,255,255,.02)">' +
          '<strong style="font-size:13px;letter-spacing:.06em;color:var(--ix-accent)">' + esc(p.label) + '</strong>' +
          '<span style="font-size:11px;color:var(--ix-text-muted)">' + esc(p.desc) + '</span>' +
          '</div></td></tr>';
      }
      if (p.groupHead) {
        return '<tr><td colspan="8" style="padding:8px 12px 4px 22px;background:rgba(255,255,255,.008)">' +
          '<span style="display:inline-flex;align-items:center;gap:8px">' +
          '<i class="ti ' + esc(p.icon || 'ti-folder') + '" style="color:var(--ix-text-secondary)"></i>' +
          '<strong style="font-size:12px;color:var(--ix-text-secondary)">' + esc(p.title) + '</strong>' +
          '<span style="font-size:11px;color:var(--ix-text-muted)">' + esc(p.desc || '') + '</span>' +
          '</span></td></tr>';
      }
      var isChild = p.level === 1;
      var nameCell = isChild
        ? '<span style="display:inline-flex;align-items:center;gap:6px;padding-left:22px;color:var(--ix-text-secondary)">' +
          '<i class="ti ti-corner-down-right" style="font-size:13px;color:var(--ix-text-muted)"></i>' + esc(p.title) +
          (p.dynamic ? ' <span class="ix-chip" style="font-size:10px;padding:1px 6px">template</span>' : '') + '</span>'
        : '<strong>' + esc(p.title) + '</strong>' +
          (p.childCount ? ' <span class="ix-chip ix-chip-info" style="font-size:10px;padding:1px 6px">' + p.childCount + ' trang con</span>' : '') +
          (p.description ? '<div style="font-size:11px;color:var(--ix-text-muted);margin-top:2px">' + esc(p.description) + '</div>' : '');

      var actionCell = isChild
        ? ''
        : '<button type="button" class="ix-btn ix-btn-outline ix-btn-sm" data-ps-open="' + esc(p.key) + '"><i class="ti ti-settings"></i></button>';

      return '<tr data-ps-page="' + esc(p.key) + '"' + (isChild ? ' style="background:rgba(255,255,255,.015)"' : '') + '>' +
        '<td><code style="font-size:11px;color:' + (isChild ? 'var(--ix-text-muted)' : 'var(--ix-accent)') + '">' + esc(p.id) + '</code></td>' +
        '<td>' + nameCell + '</td>' +
        '<td><code style="font-size:11px">' + esc(p.key) + '</code></td>' +
        '<td style="font-size:12px;color:var(--ix-text-secondary)">' + esc(p.path) + '</td>' +
        '<td style="text-align:center">' + (p.navVisible ? '<i class="ti ti-eye" style="color:var(--ix-accent)"></i>' : '—') + '</td>' +
        '<td>' + statusChip(p.status) + '</td>' +
        '<td style="text-align:center">' + (isChild ? '—' : (p.widgetIds ? p.widgetIds.length : 0)) + '</td>' +
        '<td>' + actionCell + '</td>' +
        '</tr>';
    }).join('');

    root.innerHTML =
      '<div class="ix-table-responsive">' +
      '<table class="ix-table">' +
      '<thead><tr>' +
      '<th>ID</th><th>Tên trang</th><th>Key</th><th>Đường dẫn</th><th>Nav</th><th>Trạng thái</th>' +
      '<th>Widget</th><th></th>' +
      '</tr></thead><tbody>' + (rows || '<tr><td colspan="8" style="text-align:center;color:var(--ix-text-muted)">Không có trang</td></tr>') + '</tbody></table></div>';
  }

  function renderLayout() {
    var root = document.getElementById('ps-layout');
    if (!root) return;
    var page = currentPage();
    if (!page) { root.innerHTML = ''; return; }

    var sections = (page.sections || []).map(function (sec) {
      var disabled = sec.locked ? ' disabled' : '';
      return '<div class="ps-section-row">' +
        '<div class="ps-section-row__main">' +
        '<div class="ps-section-row__title">' + esc(sec.label) + '</div>' +
        '<div class="ps-section-row__meta"><code>' + esc(sec.key) + '</code> · ' + esc(sec.kind) +
        (sec.layout ? ' · <span>' + esc(sec.layout) + '</span>' : '') + '</div>' +
        '</div>' +
        '<label class="ps-toggle"><input type="checkbox" class="ix-checkbox" data-ps-sec-visible="' + esc(sec.key) + '"' +
        (sec.visible ? ' checked' : '') + disabled + ' /><span>Hiển thị</span></label>' +
        '</div>';
    }).join('');

    var slots = (page.layoutSlots || []).slice().sort(function (a, b) { return a.position - b.position; });
    var grid = slots.map(function (slot) {
      var copy = catalog().widgetRow(page, slot.widgetId, 'layout');
      return '<div class="ps-grid-slot" style="grid-column:span ' + Math.min(12, Math.max(1, slot.span)) + '">' +
        '<div class="ps-grid-slot__id">' + esc(slot.widgetId) + '</div>' +
        '<div class="ps-grid-slot__title">' + esc(copy.title) + '</div>' +
        '<div class="ps-grid-slot__meta">pos ' + slot.position + ' · span ' + slot.span +
        (slot.enabled ? '' : ' · <em>tắt</em>') + '</div></div>';
    }).join('');

    root.innerHTML =
      '<div class="ix-card" style="margin-bottom:16px">' +
      '<div class="ix-card-header"><h3 class="ix-card-title">App Shell — ' + esc(page.title) + '</h3></div>' +
      '<div class="ix-card-body">' + sections + '</div></div>' +
      '<div class="ix-card" style="margin-bottom:16px">' +
      '<div class="ix-card-header"><h3 class="ix-card-title">Preview bố cục 12 cột</h3></div>' +
      '<div class="ix-card-body"><div class="ps-grid-preview">' + (grid || '<p class="ps-empty">Chưa có slot widget.</p>') + '</div></div></div>' +
      renderRuntimeManifestCard(page);
  }

  function renderRuntimeManifestCard(page) {
    var man = global.PageRuntimeManifest && PageRuntimeManifest.toRuntimeManifest
      ? PageRuntimeManifest.toRuntimeManifest(page)
      : null;
    if (!man) return '';
    var json = JSON.stringify(man, null, 2);
    return (
      '<div class="ix-card">' +
        '<div class="ix-card-header"><h3 class="ix-card-title">Page Manifest (Lazy Runtime)</h3></div>' +
        '<div class="ix-card-body">' +
          '<p class="ps-hint">JSON mô tả Page → Section → Widget + <code>lazyModule</code>. User Web runtime đọc manifest này — không chứa implementation.</p>' +
          '<pre class="ps-manifest-json" id="ps-runtime-manifest" style="max-height:320px;overflow:auto;font-size:11px;padding:12px;background:var(--ix-bg-input);border-radius:var(--ix-radius);border:1px solid var(--ix-border)">' + esc(json) + '</pre>' +
          '<div style="margin-top:10px;text-align:right">' +
            '<button type="button" class="ix-btn ix-btn-outline ix-btn-sm" id="ps-copy-manifest"><i class="ti ti-copy"></i> Sao chép manifest</button>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  var WIDGET_TABLE_HEAD =
    '<th>Widget</th><th>Tên</th><th>Trang deploy</th><th>Block</th><th>Section</th>' +
    '<th>Pos</th><th>Span</th><th>Bật</th><th>User override</th>';

  function widgetTableOverrideCell(page, wid, row) {
    if (!page.userCustomizable) {
      return '<td style="text-align:center"><span class="ps-cell-dead" title="Trang không cho user tùy chỉnh">' +
        '<input type="checkbox" class="ix-checkbox" disabled aria-label="Không áp dụng" /></span></td>';
    }
    return '<td style="text-align:center">' +
      '<input type="checkbox" class="ix-checkbox" data-ps-override="' + esc(wid) + '"' +
      (row.userCanOverride ? ' checked' : '') + ' /></td>';
  }

  function widgetTableRows(page) {
    var ids = page.widgetIds || [];
    var regions = catalog().pageRegions(page.key);
    return ids.map(function (wid) {
      var row = catalog().widgetRow(page, wid);
      var pagesLabel = row.pages.map(function (k) {
        var pg = catalog().getPageByKey(model(), k);
        return pg ? pg.title : k;
      }).join(', ');
      var blocks = (row.blocks || []).length
        ? row.blocks.map(function (b) { return '<code style="font-size:10px">' + esc(b) + '</code>'; }).join(' ')
        : '—';
      var curSection = (row.slot && row.slot.section) || regions[0] || 'main';

      return '<tr data-ps-widget="' + esc(wid) + '">' +
        '<td><code style="font-size:11px;color:var(--ix-accent)">' + esc(wid) + '</code></td>' +
        '<td><strong>' + esc(row.title) + '</strong><div style="font-size:11px;color:var(--ix-text-muted);margin-top:2px">' + esc(row.description) + '</div></td>' +
        '<td style="font-size:12px">' + esc(pagesLabel) + '</td>' +
        '<td>' + blocks + '</td>' +
        '<td style="text-align:center">' +
        '<select class="ix-input ps-input-sm" data-ps-section="' + esc(wid) + '">' +
        regions.map(function (rk) {
          return '<option value="' + esc(rk) + '"' + (curSection === rk ? ' selected' : '') + '>' +
            esc(catalog().regionLabel(rk)) + '</option>';
        }).join('') + '</select></td>' +
        '<td style="text-align:center"><input type="number" min="0" max="99" class="ix-input ps-input-sm" data-ps-pos="' + esc(wid) + '" value="' + row.position + '" /></td>' +
        '<td style="text-align:center">' +
        '<select class="ix-input ps-input-sm" data-ps-span="' + esc(wid) + '">' +
        [12, 8, 6, 4, 3].map(function (n) {
          return '<option value="' + n + '"' + (row.span === n ? ' selected' : '') + '>' + n + '/12</option>';
        }).join('') + '</select></td>' +
        '<td style="text-align:center"><input type="checkbox" class="ix-checkbox" data-ps-enabled="' + esc(wid) + '"' + (row.enabled ? ' checked' : '') + ' /></td>' +
        widgetTableOverrideCell(page, wid, row) +
        '</tr>';
    }).join('');
  }

  function renderWidgetTable(rootId, page, hintHtml, emptyLabel, saveBtnId, saveLabel) {
    var root = document.getElementById(rootId);
    if (!root) return;
    var rows = widgetTableRows(page);
    root.innerHTML =
      hintHtml +
      '<div class="ix-table-responsive"><table class="ix-table"><thead><tr>' +
      WIDGET_TABLE_HEAD +
      '</tr></thead><tbody>' + (rows || '<tr><td colspan="9" style="text-align:center;color:var(--ix-text-muted)">' + esc(emptyLabel) + '</td></tr>') + '</tbody></table></div>' +
      '<div style="margin-top:12px;text-align:right">' +
      '<button type="button" class="ix-btn ix-btn-primary ix-btn-sm" id="' + saveBtnId + '"><i class="ti ti-device-floppy"></i> ' + esc(saveLabel) + '</button>' +
      '</div>';
  }

  function renderWidgets() {
    var page = currentPage();
    renderWidgetTable(
      'ps-widgets',
      page,
      '<p class="ps-hint">Danh mục được đồng bộ trực tiếp từ <strong>Kiến trúc 4 tầng · Tầng 4</strong>. Mỗi Widget mới tự xuất hiện tại đây với trạng thái mặc định tắt. Admin thiết lập Section · Pos · Span · Bật; User chỉ override được trên <strong>Nhà của tôi</strong>.</p>',
      'Tầng 4 chưa có Widget',
      'ps-save-widgets',
      'Lưu cấu hình Widget'
    );
  }

  function render() {
    renderStats();
    renderUpdated();
    renderPagePicker('ps-page-layout');
    renderPagePicker('ps-page-widgets');
    if (state.tab === 'sitemap') renderSitemap();
    if (state.tab === 'layout') renderLayout();
    if (state.tab === 'widgets') renderWidgets();
  }

  function persistWidgetsFromDom() {
    var page = currentPage();
    persistLayoutSlotsFromDom('ps-widgets');
    toast('Đã lưu cấu hình Widget cho ' + page.title);
    if (global.PageCompositionClient && PageCompositionClient.saveDraft) {
      PageCompositionClient.saveDraft(page.key).then(function (res) {
        if (res && res.ok) toast('Đã lưu nháp (page-composition) · chưa lên User Web', 'primary');
        else toast('Lưu nháp composition lỗi', 'warning');
      });
    }
    render();
  }

  function persistLayoutSlotsFromDom(scopeRootId) {
    var page = currentPage();
    var root = scopeRootId ? document.getElementById(scopeRootId) : document;
    if (!root) return;
    root.querySelectorAll('[data-ps-section]').forEach(function (sel) {
      var wid = sel.getAttribute('data-ps-section');
      store().saveLayoutSlot(page.key, wid, { section: sel.value });
    });
    root.querySelectorAll('[data-ps-pos]').forEach(function (inp) {
      var wid = inp.getAttribute('data-ps-pos');
      store().saveLayoutSlot(page.key, wid, { position: Number(inp.value) });
    });
    root.querySelectorAll('[data-ps-span]').forEach(function (sel) {
      var wid = sel.getAttribute('data-ps-span');
      store().saveLayoutSlot(page.key, wid, { span: Number(sel.value) });
    });
    root.querySelectorAll('[data-ps-enabled]').forEach(function (cb) {
      var wid = cb.getAttribute('data-ps-enabled');
      store().saveLayoutSlot(page.key, wid, { enabled: cb.checked });
    });
    root.querySelectorAll('[data-ps-override]').forEach(function (cb) {
      var wid = cb.getAttribute('data-ps-override');
      store().saveLayoutSlot(page.key, wid, { userCanOverride: cb.checked });
    });
  }

  /** Publish PagePublished cho trang đang chọn. */
  function publishCurrentPage() {
    var page = currentPage();
    if (!page) return;
    var run = global.IfluxPagePublishBridge && IfluxPagePublishBridge.publishPagePublished
      ? IfluxPagePublishBridge.publishPagePublished(page.key)
      : (global.PageCompositionClient && PageCompositionClient.publishPagePublished
        ? PageCompositionClient.publishPagePublished(page.key)
        : Promise.resolve({ ok: false, error: 'Thiếu bridge Publish' }));
    toast('Đang publish PagePublished · ' + page.key + '…', 'primary');
    run.then(function (res) {
      if (res && res.ok) {
        toast('Đã publish PagePublished · ' + page.title + ' @v' + (res.version || '?'), 'success');
      } else {
        toast('Publish thất bại: ' + ((res && res.error) || ''), 'danger');
      }
    });
  }

  /** Tắt tạm toàn bộ Widget Tầng 4 trên mọi trang + publish PagePublished rỗng (audit hardcode User Web). */
  function disableAllWidgets() {
    var pages = model();
    pages.forEach(function (page) {
      (page.widgetIds || []).forEach(function (wid) {
        store().saveLayoutSlot(page.key, wid, { enabled: false, locked: false });
      });
      (page.layoutSlots || []).forEach(function (slot) {
        if (!slot || !slot.widgetId) return;
        store().saveLayoutSlot(page.key, slot.widgetId, { enabled: false, locked: false });
      });
    });
    toast('Đã tắt toàn bộ Widget trên mọi trang · đang lưu nháp & publish…', 'primary');
    render();

    var saveRun = global.PageCompositionClient && PageCompositionClient.saveAllDrafts
      ? PageCompositionClient.saveAllDrafts()
      : Promise.resolve([]);

    saveRun.then(function () {
      var publishOne = global.IfluxPagePublishBridge && IfluxPagePublishBridge.publishPagePublished
        ? function (key) { return IfluxPagePublishBridge.publishPagePublished(key); }
        : null;
      if (!publishOne) {
        toast('Đã lưu nháp · thiếu bridge Publish — User Web chưa đổi', 'danger');
        return;
      }
      var keys = pages.map(function (p) { return p.key; });
      var chain = Promise.resolve({ ok: 0, fail: 0 });
      keys.forEach(function (key) {
        chain = chain.then(function (acc) {
          return publishOne(key).then(function (res) {
            if (res && res.ok) acc.ok += 1;
            else acc.fail += 1;
            return acc;
          });
        });
      });
      return chain.then(function (acc) {
        if (acc.fail) {
          toast('Publish xong ' + acc.ok + '/' + keys.length + ' trang · lỗi ' + acc.fail, 'danger');
        } else {
          toast('Đã publish PagePublished rỗng · ' + acc.ok + ' trang (User Web hết Widget composition)', 'success');
        }
      });
    });
  }

  function bind() {
    document.querySelectorAll('[data-ps-tab]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        setTab(btn.getAttribute('data-ps-tab'));
      });
    });

    var search = document.getElementById('ps-search');
    if (search) {
      search.addEventListener('input', function () {
        state.q = search.value.trim().toLowerCase();
        renderSitemap();
      });
    }

    ['ps-page-layout', 'ps-page-widgets'].forEach(function (id) {
      var sel = document.getElementById(id);
      if (!sel) return;
      sel.addEventListener('change', function () {
        state.pageKey = sel.value;
        render();
      });
    });

    document.body.addEventListener('click', function (e) {
      var open = e.target.closest('[data-ps-open]');
      if (open) {
        state.pageKey = open.getAttribute('data-ps-open');
        setTab('layout');
        return;
      }
      if (e.target.closest('#ps-copy-manifest')) {
        var pre = document.getElementById('ps-runtime-manifest');
        if (pre && navigator.clipboard) {
          navigator.clipboard.writeText(pre.textContent).then(function () {
            toast('Đã sao chép Page Manifest', 'success');
          });
        }
        return;
      }
      if (e.target.closest('#ps-save-widgets') || e.target.closest('#ps-save-shared')) {
        persistWidgetsFromDom();
        return;
      }
      if (e.target.closest('#ps-publish')) {
        publishCurrentPage();
        return;
      }
      if (e.target.closest('#ps-disable-all-widgets') || e.target.closest('#ps-disable-all-shared')) {
        disableAllWidgets();
        return;
      }
      if (e.target.closest('#ps-reset')) {
        store().resetAll();
        toast('Đã khôi phục cấu hình mặc định', 'primary');
        render();
      }
    });

    document.body.addEventListener('change', function (e) {
      var sec = e.target.getAttribute && e.target.getAttribute('data-ps-sec-visible');
      if (sec) {
        var page = currentPage();
        store().saveSection(page.key, sec, { visible: e.target.checked });
        toast('Đã cập nhật section ' + sec);
        renderLayout();
        renderUpdated();
      }
    });
  }

  function init() {
    bind();
    setTab('sitemap');
  }

  global.PageSettingsPage = {
    init: init,
    disableAllWidgets: disableAllWidgets,
    disableAllSharedWidgets: disableAllWidgets
  };
})(window);
