/**
 * ADM-SYS-012 — Quản lý giao diện (Product Composition)
 * SoT: Page → App Shell → Section (vùng) → Widget.
 * Mỗi Page 1 row; 3 cột vùng App Shell tùy chỉnh được: Sidebar trái · Main · Sidebar phải.
 * Admin thêm/xoá/đổi kích thước Widget (lấy từ Core 4 tầng · Tầng 4) vào từng vùng.
 * Không hardcode widget — nguồn widget = PlatformLayersWidgets; lưu vào PageSettingsStore.
 */
(function (global) {
  'use strict';

  var REGIONS = ['sidebar', 'main', 'sidebar-right'];
  var SPANS = [12, 8, 6, 4, 3];

  var picker = { pageKey: null, region: null, selected: {} };

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function cat() { return global.PageSettingsCatalog; }
  function store() { return global.PageSettingsStore; }
  function lib() {
    if (global.WidgetLibraryCatalog && WidgetLibraryCatalog.allWidgetIdsInLibrary) {
      return global.WidgetLibraryCatalog;
    }
    if (global.PlatformLayersWidgets && PlatformLayersWidgets.installLibraryFacade) {
      return PlatformLayersWidgets.installLibraryFacade();
    }
    return null;
  }

  function toast(msg, type) {
    if (global.ixToast) global.ixToast(msg, type || 'success');
  }

  /** Lưu nháp composition — không Publish PagePublished. */
  function saveDraft(pageKey, announce) {
    if (!global.PageCompositionClient || !pageKey) return;
    var save = PageCompositionClient.saveDraft || PageCompositionClient.publishPage;
    save(pageKey).then(function (res) {
      if (res && res.ok) {
        if (announce) toast('Đã lưu nháp (page-composition) · chưa lên User Web', 'primary');
      } else if (announce) {
        toast('Lưu nháp thất bại', 'warning');
      }
      renderUpdated();
    });
  }

  /** Publish PagePublished — User Web SoT. */
  function publishLive(pageKey, announce) {
    if (!pageKey) return Promise.resolve({ ok: false });
    var run = global.IfluxPagePublishBridge && IfluxPagePublishBridge.publishPagePublished
      ? IfluxPagePublishBridge.publishPagePublished(pageKey)
      : (global.PageCompositionClient && PageCompositionClient.publishPagePublished
        ? PageCompositionClient.publishPagePublished(pageKey)
        : Promise.resolve({ ok: false, error: 'Thiếu bridge Publish' }));
    if (announce) toast('Đang publish PagePublished · ' + pageKey + '…', 'primary');
    return run.then(function (res) {
      if (res && res.ok) {
        if (announce !== false) {
          toast('Đã publish PagePublished · ' + pageKey + ' @v' + (res.version || '?'), 'success');
        }
      } else if (announce !== false) {
        toast('Publish thất bại · ' + ((res && res.error) || pageKey), 'danger');
      }
      renderUpdated();
      return res;
    });
  }

  function model() { return cat().buildModel(store().read()); }

  function pageByKey(key) {
    return cat().getPageByKey(model(), key);
  }

  function slotsInRegion(page, region) {
    return (page.layoutSlots || [])
      .filter(function (s) { return (s.section || 'main') === region; })
      .sort(function (a, b) { return a.position - b.position; });
  }

  function widgetSectionMap(page) {
    var map = {};
    (page.layoutSlots || []).forEach(function (s) { map[s.widgetId] = s.section || 'main'; });
    return map;
  }

  function tierBadge(tier) {
    if (tier === 'premium') return '<span class="ix-chip ix-chip-info">Premium</span>';
    if (tier === 'elite') return '<span class="ix-chip ix-chip-warning">Elite</span>';
    return '<span class="ix-chip">Free</span>';
  }

  /* ─────────────── Stats + updated ─────────────── */

  function renderStats() {
    var el = document.getElementById('lm-stats');
    if (!el) return;
    var pages = model();
    var regionCount = 0;
    var widgetCount = 0;
    pages.forEach(function (p) {
      var regions = cat().pageRegions(p.key);
      regionCount += regions.length;
      regions.forEach(function (r) {
        widgetCount += slotsInRegion(p, r).filter(function (s) { return s.enabled !== false; }).length;
      });
    });
    el.innerHTML =
      '<span class="ix-chip ix-chip-info">' + pages.length + ' trang</span>' +
      '<span class="ix-chip">' + regionCount + ' vùng App Shell</span>' +
      '<span class="ix-chip ix-chip-success">' + widgetCount + ' widget đang bật</span>' +
      '<span class="ix-chip">Nguồn: Tầng 4</span>';
  }

  function renderUpdated() {
    var el = document.getElementById('lm-updated');
    if (!el) return;
    var raw = store().read();
    el.textContent = raw.updatedAt
      ? 'Cập nhật lần cuối: ' + new Date(raw.updatedAt).toLocaleString('vi-VN')
      : 'Chưa lưu thay đổi — đang dùng cấu hình mặc định từ Product Architecture.';
  }

  /* ─────────────── Widget item trong 1 vùng ─────────────── */

  function widgetItem(page, slot) {
    var copy = lib().resolveWidgetCopy(slot.widgetId);
    var defaults = lib().widgetDefaults(slot.widgetId);
    var locked = !!slot.locked;
    var disabledAttr = slot.enabled === false ? '' : ' checked';

    var spanSel = '<select class="ix-input lm-input-sm" data-lm-span>' +
      SPANS.map(function (n) {
        return '<option value="' + n + '"' + (Number(slot.span) === n ? ' selected' : '') + '>' + n + '/12</option>';
      }).join('') + '</select>';

    var actions =
      '<button type="button" class="ix-btn ix-btn-ghost ix-btn-icon ix-btn-sm" data-lm-move="up" title="Lên trên"><i class="ti ti-chevron-up"></i></button>' +
      '<button type="button" class="ix-btn ix-btn-ghost ix-btn-icon ix-btn-sm" data-lm-move="down" title="Xuống dưới"><i class="ti ti-chevron-down"></i></button>' +
      (locked
        ? '<span class="ix-chip ix-chip-warning lm-lock" title="Widget mặc định của trang — không xoá được">Cố định</span>'
        : '<button type="button" class="ix-btn ix-btn-ghost ix-btn-icon ix-btn-sm lm-remove-btn" data-lm-remove title="Gỡ widget"><i class="ti ti-trash"></i></button>');

    return '<div class="lm-item' + (slot.enabled === false ? ' lm-item--off' : '') + '"' +
        ' data-lm-page="' + esc(page.key) + '"' +
        ' data-lm-widget="' + esc(slot.widgetId) + '"' +
        ' data-lm-region="' + esc(slot.section || 'main') + '"' +
        ' data-lm-added="' + (slot.added ? '1' : '0') + '">' +
      '<div class="lm-item__top">' +
        '<code class="lm-item__id">' + esc(slot.widgetId) + '</code>' +
        tierBadge(defaults.tier) +
        '<div class="lm-item__actions">' + actions + '</div>' +
      '</div>' +
      '<div class="lm-item__title">' + esc(copy.title) + '</div>' +
      '<div class="lm-item__ctrls">' +
        '<label class="lm-ctrl"><span>Kích thước</span>' + spanSel + '</label>' +
        '<label class="lm-ctrl lm-ctrl--toggle"><input type="checkbox" class="ix-checkbox" data-lm-enabled' + disabledAttr + ' /><span>Hiển thị</span></label>' +
      '</div>' +
      '</div>';
  }

  function regionCell(page, region) {
    if (!cat().hasRegion(page.key, region)) {
      return '<td class="lm-cell lm-cell--na"><span class="lm-na"><i class="ti ti-ban"></i> Không có vùng này</span></td>';
    }
    var slots = slotsInRegion(page, region);
    var items = slots.map(function (slot) { return widgetItem(page, slot); }).join('');
    return '<td class="lm-cell">' +
      '<div class="lm-stack">' + (items || '<div class="lm-empty">Chưa có widget</div>') + '</div>' +
      '<button type="button" class="ix-btn ix-btn-outline ix-btn-sm lm-add" data-lm-open-page="' + esc(page.key) + '" data-lm-open-region="' + esc(region) + '">' +
      '<i class="ti ti-plus"></i> Thêm widget</button>' +
      '</td>';
  }

  function pageRow(page) {
    var navChip = page.navVisible
      ? '<span class="ix-chip ix-chip-success" style="font-size:10px">Trên nav</span>'
      : '';
    var nameCell =
      '<td class="lm-pagecell">' +
        '<strong>' + esc(page.title) + '</strong> ' + navChip +
        '<div class="lm-page-path"><code>' + esc(page.path) + '</code></div>' +
        (page.userCustomizable ? '<div class="lm-page-note"><i class="ti ti-user-cog"></i> User được tùy chỉnh</div>' : '') +
        '<button type="button" class="ix-btn ix-btn-ghost ix-btn-sm lm-manifest-btn" data-lm-manifest="' + esc(page.key) + '" style="margin-top:8px"><i class="ti ti-code"></i> Manifest</button> ' +
        '<button type="button" class="ix-btn ix-btn-primary ix-btn-sm" data-lm-publish="' + esc(page.key) + '" style="margin-top:8px" title="Ghi PagePublished — User Web đọc từ đây"><i class="ti ti-rocket"></i> Publish</button>' +
      '</td>';
    return '<tr>' + nameCell +
      regionCell(page, 'sidebar') +
      regionCell(page, 'main') +
      regionCell(page, 'sidebar-right') +
      '</tr>';
  }

  function renderTable() {
    var root = document.getElementById('lm-table');
    if (!root) return;
    var rows = model().map(pageRow).join('');
    root.innerHTML =
      '<div class="ix-table-responsive">' +
      '<table class="ix-table lm-table"><thead><tr>' +
      '<th style="width:200px">Trang</th>' +
      '<th><i class="ti ti-layout-sidebar"></i> Sidebar trái</th>' +
      '<th><i class="ti ti-layout-distribute-horizontal"></i> Main content</th>' +
      '<th><i class="ti ti-layout-sidebar-right"></i> Sidebar phải</th>' +
      '</tr></thead><tbody>' + rows + '</tbody></table></div>';
  }

  /* ─────────────── Drawer chọn widget ─────────────── */

  function pickerSourceIds() {
    return lib().allWidgetIdsInLibrary();
  }

  function renderPicker() {
    var page = pageByKey(picker.pageKey);
    if (!page) return;
    var titleEl = document.getElementById('lm-picker-title');
    if (titleEl) {
      titleEl.textContent = 'Thêm widget · ' + page.title + ' · ' + cat().regionLabel(picker.region);
    }

    var tabsEl = document.getElementById('lm-picker-tabs');
    if (tabsEl) {
      tabsEl.innerHTML = '<span class="ix-chip ix-chip-primary">Tất cả Widget · Admin quyết định vị trí</span>';
    }

    var sourceIds = pickerSourceIds();
    var sourceSet = {};
    sourceIds.forEach(function (id) { sourceSet[id] = true; });
    var secMap = widgetSectionMap(page);
    var storeData = store().read();
    var libraryGroups = lib().buildLibrary(storeData);
    var widgets = [];
    libraryGroups.forEach(function (grp) {
      (grp.widgets || []).forEach(function (w) {
        if (sourceSet[w.id]) widgets.push(w);
      });
    });

    var bodyEl = document.getElementById('lm-picker-body');
    var html = widgets.length
      ? '<div class="lm-pick-group"><div class="lm-pick-group__head"><span class="lm-pick-group__title">Widget</span>' +
        '<span class="ix-chip">' + widgets.length + '</span></div>'
      : '';
    widgets.forEach(function (w) {
        var already = secMap[w.id];
        var checked = picker.selected[w.id] ? ' checked' : '';
        if (already) {
          html += '<div class="lm-pick-item lm-pick-item--used">' +
            '<div class="lm-pick-item__info"><code>' + esc(w.id) + '</code> ' + tierBadge(w.tier) +
            '<div class="lm-pick-item__title">' + esc(w.title) + '</div></div>' +
            '<span class="ix-chip ix-chip-outline">Đã dùng: ' + esc(cat().regionLabel(already)) + '</span>' +
            '</div>';
        } else {
          html += '<label class="lm-pick-item">' +
            '<input type="checkbox" class="ix-checkbox" data-lm-pick="' + esc(w.id) + '"' + checked + ' />' +
            '<div class="lm-pick-item__info"><code>' + esc(w.id) + '</code> ' + tierBadge(w.tier) +
            (w.planned ? ' <span class="ix-chip ix-chip-warning">Planned</span>' : '') +
            '<div class="lm-pick-item__title">' + esc(w.title) + '</div>' +
            '<div class="lm-pick-item__desc">' + esc(w.description) + '</div></div>' +
            '</label>';
        }
    });
    if (widgets.length) html += '</div>';

    if (bodyEl) {
      bodyEl.innerHTML = html || '<div class="lm-empty" style="padding:24px">Không có widget phù hợp trong Tầng 4 cho nguồn này.</div>';
    }
    renderPickerFooter();
  }

  function renderPickerFooter() {
    var n = Object.keys(picker.selected).filter(function (k) { return picker.selected[k]; }).length;
    var btn = document.getElementById('lm-picker-add');
    if (btn) {
      btn.disabled = n === 0;
      btn.innerHTML = '<i class="ti ti-plus"></i> Thêm ' + (n ? n + ' widget đã chọn' : 'widget');
    }
  }

  function openPicker(pageKey, region) {
    picker = { pageKey: pageKey, region: region, selected: {} };
    renderPicker();
    if (global.ixOpenOffcanvas) global.ixOpenOffcanvas('lm-picker');
  }

  function commitPicker() {
    var page = pageByKey(picker.pageKey);
    if (!page) return;
    var pk = picker.pageKey;
    var ids = Object.keys(picker.selected).filter(function (k) { return picker.selected[k]; });
    if (!ids.length) return;

    var existing = slotsInRegion(page, picker.region);
    var nextPos = existing.reduce(function (max, s) { return Math.max(max, s.position); }, -1) + 1;

    ids.forEach(function (wid) {
      store().saveLayoutSlot(picker.pageKey, wid, {
        section: picker.region,
        span: 12,
        position: nextPos++,
        enabled: true,
        removed: false,
        userCanOverride: false
      });
    });
    // Bật section để runtime manifest xuất vùng này.
    store().saveSection(picker.pageKey, picker.region, { visible: true });

    toast('Đã thêm ' + ids.length + ' widget vào ' + cat().regionLabel(picker.region) + ' · ' + page.title);
    if (global.ixCloseOffcanvas) global.ixCloseOffcanvas('lm-picker');
    render();
    saveDraft(pk, true);
  }

  /* ─────────────── Reorder / span / enable / remove ─────────────── */

  function reorder(pageKey, region, widgetId, dir) {
    var page = pageByKey(pageKey);
    var slots = slotsInRegion(page, region);
    var idx = -1;
    slots.forEach(function (s, i) { if (s.widgetId === widgetId) idx = i; });
    if (idx < 0) return;
    var swap = dir === 'up' ? idx - 1 : idx + 1;
    if (swap < 0 || swap >= slots.length) return;
    var a = slots[idx], b = slots[swap];
    // Gán lại vị trí tuần tự để chắc chắn có giá trị lưu.
    slots.forEach(function (s, i) {
      store().saveLayoutSlot(pageKey, s.widgetId, { position: i });
    });
    store().saveLayoutSlot(pageKey, a.widgetId, { position: swap });
    store().saveLayoutSlot(pageKey, b.widgetId, { position: idx });
    render();
    saveDraft(pageKey);
  }

  /* ─────────────── Manifest modal ─────────────── */

  function openManifest(pageKey) {
    var page = pageByKey(pageKey);
    if (!page || !global.PageRuntimeManifest) return;
    var man = global.PageRuntimeManifest.toRuntimeManifest(page);
    var pre = document.getElementById('lm-manifest-pre');
    var title = document.getElementById('lm-manifest-title');
    if (title) title.textContent = 'Page Manifest · ' + page.title;
    if (pre) pre.textContent = JSON.stringify(man, null, 2);
    if (global.ixOpenModal) global.ixOpenModal('lm-manifest-modal');
  }

  /* ─────────────── Render + bind ─────────────── */

  function render() {
    renderStats();
    renderUpdated();
    renderTable();
  }

  function bind() {
    document.body.addEventListener('click', function (e) {
      var openBtn = e.target.closest('[data-lm-open-page]');
      if (openBtn) {
        openPicker(openBtn.getAttribute('data-lm-open-page'), openBtn.getAttribute('data-lm-open-region'));
        return;
      }
      var manifestBtn = e.target.closest('[data-lm-manifest]');
      if (manifestBtn) {
        openManifest(manifestBtn.getAttribute('data-lm-manifest'));
        return;
      }
      if (e.target.closest('#lm-picker-add')) {
        commitPicker();
        return;
      }
      var moveBtn = e.target.closest('[data-lm-move]');
      if (moveBtn) {
        var mItem = moveBtn.closest('.lm-item');
        if (mItem) {
          reorder(mItem.getAttribute('data-lm-page'), mItem.getAttribute('data-lm-region'),
            mItem.getAttribute('data-lm-widget'), moveBtn.getAttribute('data-lm-move'));
        }
        return;
      }
      var rmBtn = e.target.closest('[data-lm-remove]');
      if (rmBtn) {
        var rItem = rmBtn.closest('.lm-item');
        if (rItem) {
          var pk = rItem.getAttribute('data-lm-page');
          var wid = rItem.getAttribute('data-lm-widget');
          var added = rItem.getAttribute('data-lm-added') === '1';
          if (added) store().purgeLayoutSlot(pk, wid);
          else store().removeLayoutSlot(pk, wid);
          toast('Đã gỡ widget ' + wid, 'primary');
          render();
          saveDraft(pk, true);
        }
        return;
      }
      if (e.target.closest('[data-lm-publish]')) {
        var pubBtn = e.target.closest('[data-lm-publish]');
        publishLive(pubBtn.getAttribute('data-lm-publish'), true);
        return;
      }
      if (e.target.closest('#lm-publish-all')) {
        var pages = model();
        var chain = Promise.resolve({ ok: true });
        pages.forEach(function (p) {
          chain = chain.then(function () { return publishLive(p.key, false); });
        });
        toast('Đang publish toàn bộ trang…', 'primary');
        chain.then(function () {
          toast('Đã publish PagePublished toàn bộ trang', 'success');
          renderUpdated();
        });
        return;
      }
      if (e.target.closest('#lm-copy-manifest')) {
        var pre = document.getElementById('lm-manifest-pre');
        if (pre && navigator.clipboard) {
          navigator.clipboard.writeText(pre.textContent).then(function () {
            toast('Đã sao chép Page Manifest');
          });
        }
        return;
      }
      if (e.target.closest('#lm-reset')) {
        if (global.confirm && !global.confirm('Khôi phục toàn bộ về cấu hình mặc định (Product Architecture)?')) return;
        store().resetAll();
        toast('Đã khôi phục cấu hình mặc định', 'primary');
        render();
        if (global.PageCompositionClient && PageCompositionClient.saveAllDrafts) {
          PageCompositionClient.saveAllDrafts().then(function () { renderUpdated(); });
        }
      }
    });

    document.body.addEventListener('change', function (e) {
      var t = e.target;
      if (t.hasAttribute && t.hasAttribute('data-lm-pick')) {
        picker.selected[t.getAttribute('data-lm-pick')] = t.checked;
        renderPickerFooter();
        return;
      }
      if (t.hasAttribute && t.hasAttribute('data-lm-span')) {
        var sItem = t.closest('.lm-item');
        if (sItem) {
          var spPage = sItem.getAttribute('data-lm-page');
          store().saveLayoutSlot(spPage, sItem.getAttribute('data-lm-widget'), { span: Number(t.value) });
          renderStats();
          renderUpdated();
          saveDraft(spPage);
        }
        return;
      }
      if (t.hasAttribute && t.hasAttribute('data-lm-enabled')) {
        var eItem = t.closest('.lm-item');
        if (eItem) {
          var enPage = eItem.getAttribute('data-lm-page');
          store().saveLayoutSlot(enPage, eItem.getAttribute('data-lm-widget'), { enabled: t.checked });
          render();
          saveDraft(enPage);
        }
      }
    });
  }

  function init() {
    bind();
    render();
  }

  global.LayoutManagerPage = { init: init };
})(window);
