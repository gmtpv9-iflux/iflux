/* Block Watchlist — thư mục cuộn ngang, + New, chỉnh sửa (kéo / xóa) */
(function (global) {
  'use strict';

  var dragFolderId = null;
  var editMode = false;

  function store() { return global.IfluxWatchlistStore; }
  function ui() { return global.IfluxWatchlistUI; }

  function getBlock(el) {
    return el.closest('[data-ifx-wl-block]');
  }

  function getActiveFolderId(block) {
    return block.getAttribute('data-active-folder') || store().DEFAULT_FOLDER_ID;
  }

  function setActiveFolderId(block, id) {
    block.setAttribute('data-active-folder', id);
  }

  function stockHref(ticker) {
    ticker = String(ticker || '').toUpperCase();
    if (global.IfluxSeoUrl) return IfluxSeoUrl.stockHref(ticker);
    return '/co-phieu/' + encodeURIComponent(ticker);
  }

  function renderFolderBar(block) {
    var st = store();
    if (!st) return;
    var scroll = block.querySelector('[data-ifx-wl-folder-scroll]');
    if (!scroll) return;

    var activeId = getActiveFolderId(block);
    var folders = st.getFolders();

    if (!folders.some(function (f) { return f.id === activeId; })) {
      activeId = st.DEFAULT_FOLDER_ID;
      setActiveFolderId(block, activeId);
    }

    var pills = folders.map(function (f) {
      var isActive = f.id === activeId;
      var btnClass = isActive ? 'ix-btn ix-btn-primary ix-btn-sm' : 'ix-btn ix-btn-outline ix-btn-sm';
      var isDefault = f.id === st.DEFAULT_FOLDER_ID;
      var drag = (editMode && !isDefault) ? ' draggable="true" data-ifx-wl-drag="' + f.id + '"' : '';
      var del = (editMode && !isDefault)
        ? '<button type="button" class="ifx-wl-folder-del" data-ifx-wl-delete="' + f.id + '" title="Xóa thư mục"><i class="ti ti-x"></i></button>'
        : '';
      var icon = folderIcon(f, isDefault);
      return (
        '<div class="ifx-wl-folder-pill' + (isActive ? ' is-active' : '') + '" data-ifx-wl-pill="' + f.id + '">' +
          del +
          '<button type="button" class="' + btnClass + '" data-ifx-wl-select="' + f.id + '"' + drag + '>' +
            '<i class="ti ' + icon + '"></i> ' + f.name +
          '</button>' +
        '</div>'
      );
    }).join('');

    scroll.innerHTML = '<div class="ifx-wl-folder-pills">' + pills + '</div>';

    var editBtn = block.querySelector('[data-ifx-wl-edit]');
    if (editBtn) {
      editBtn.classList.toggle('is-active', editMode);
      editBtn.innerHTML = editMode
        ? '<i class="ti ti-check"></i>'
        : '<i class="ti ti-pencil"></i>';
      editBtn.title = editMode ? 'Xong' : 'Sửa danh mục';
    }

    block.classList.toggle('is-folder-edit', editMode);
    updateAlertsBtn(block);
    bindBlockEvents(block);
  }

  function updateAlertsBtn(block) {
    var btn = block.querySelector('[data-ifx-wl-alerts]');
    if (!btn) return;
    var st = global.IfluxAlertStore;
    var n = st ? st.countTriggered() : 0;
    btn.classList.toggle('has-alerts', n > 0);
    var badge = btn.querySelector('[data-ifx-wl-alerts-count]');
    if (badge) {
      badge.textContent = n > 9 ? '9+' : String(n);
      badge.hidden = !n;
    }
  }

  function refreshAlertBadges() {
    document.querySelectorAll('[data-ifx-wl-block]').forEach(updateAlertsBtn);
  }

  function renderStockList(block) {
    var list = block.querySelector('[data-ifx-wl-stock-list]');
    if (!list) return;

    var st = store();
    if (!st) {
      list.innerHTML = '<div class="ifx-wl-empty">Watchlist chưa sẵn sàng</div>';
      return;
    }
    var uiMod = ui();
    var activeId = getActiveFolderId(block);
    var folder = st.getFolder(activeId);
    var folderEditable = !(folder && st.isSystemFolder(folder));
    var tickers = st.getFolderTickers(activeId);
    var snap = global.IfluxMockMarket && IfluxMockMarket.getSnapshot();
    var stocks = snap && snap.entities ? snap.entities.stocks : {};
    if (!tickers.length) {
      list.innerHTML = '<div class="ifx-wl-empty">Chưa có mã trong thư mục này</div>';
      return;
    }

    list.innerHTML = tickers.map(function (t) {
      var s = stocks[t];
      if (!s || !uiMod) return '';
      var href = stockHref(t);
      return uiMod.stockRowHtml(s, {
        href: href,
        folderId: activeId,
        folderEditable: folderEditable,
        inFolder: st.isInFolder(t, activeId)
      });
    }).join('');

    if (uiMod) uiMod.refreshHearts();
    if (global.IfluxAlertUI) IfluxAlertUI.refreshAlertButtons();
  }

  function renderBlock(block) {
    renderFolderBar(block);
    renderStockList(block);
  }

  function bindBlockEvents(block) {
    if (block._ifxWlBound) return;
    block._ifxWlBound = true;

    block.addEventListener('click', function (e) {
      var st = store();

      var selectBtn = e.target.closest('[data-ifx-wl-select]');
      if (selectBtn && block.contains(selectBtn) && !editMode) {
        setActiveFolderId(block, selectBtn.getAttribute('data-ifx-wl-select'));
        renderBlock(block);
        return;
      }

      var delBtn = e.target.closest('[data-ifx-wl-delete]');
      if (delBtn && block.contains(delBtn) && editMode) {
        e.stopPropagation();
        var id = delBtn.getAttribute('data-ifx-wl-delete');
        var f = st.getFolder(id);
        if (!f || !confirm('Xóa thư mục «' + f.name + '»?')) return;
        st.deleteFolder(id);
        setActiveFolderId(block, st.DEFAULT_FOLDER_ID);
        refreshAll();
        if (global.ixToast) ixToast('Đã xóa thư mục', 'success');
        return;
      }

      if (e.target.closest('[data-ifx-wl-new-folder]') && block.contains(e.target)) {
        openNewFolderPrompt(block);
        return;
      }

      if (e.target.closest('[data-ifx-wl-alerts]') && block.contains(e.target)) {
        if (global.IfluxAlertPage && IfluxAlertPage.openListModal) {
          IfluxAlertPage.openListModal();
        }
        return;
      }

      if (e.target.closest('[data-ifx-wl-edit]') && block.contains(e.target)) {
        editMode = !editMode;
        refreshAll();
        return;
      }
    });

    block.addEventListener('dragstart', function (e) {
      if (!editMode) return;
      var btn = e.target.closest('[data-ifx-wl-drag]');
      if (!btn || !block.contains(btn)) return;
      dragFolderId = btn.getAttribute('data-ifx-wl-drag');
      e.dataTransfer.effectAllowed = 'move';
      var pill = btn.closest('.ifx-wl-folder-pill');
      if (pill) pill.classList.add('is-dragging');
    });

    block.addEventListener('dragend', function () {
      dragFolderId = null;
      block.querySelectorAll('.ifx-wl-folder-pill').forEach(function (p) {
        p.classList.remove('is-dragging', 'is-drop-target');
      });
    });

    block.addEventListener('dragover', function (e) {
      if (!editMode || !dragFolderId) return;
      var pill = e.target.closest('[data-ifx-wl-pill]');
      if (!pill || !block.contains(pill)) return;
      var id = pill.getAttribute('data-ifx-wl-pill');
      if (id === store().DEFAULT_FOLDER_ID || id === dragFolderId) return;
      e.preventDefault();
      pill.classList.add('is-drop-target');
    });

    block.addEventListener('dragleave', function (e) {
      var pill = e.target.closest('[data-ifx-wl-pill]');
      if (pill && block.contains(pill)) pill.classList.remove('is-drop-target');
    });

    block.addEventListener('drop', function (e) {
      if (!editMode || !dragFolderId) return;
      var pill = e.target.closest('[data-ifx-wl-pill]');
      if (!pill || !block.contains(pill)) return;
      e.preventDefault();
      pill.classList.remove('is-drop-target');
      var id = pill.getAttribute('data-ifx-wl-pill');
      if (id === store().DEFAULT_FOLDER_ID || id === dragFolderId) return;

      var folders = store().getFolders();
      var fromIdx = -1;
      var toIdx = -1;
      folders.forEach(function (f, i) {
        if (f.id === dragFolderId) fromIdx = i;
        if (f.id === id) toIdx = i;
      });
      if (fromIdx < 0 || toIdx < 0) return;
      var ids = folders.map(function (f) { return f.id; });
      ids.splice(fromIdx, 1);
      ids.splice(toIdx, 0, dragFolderId);
      store().reorderFolders(ids);
      refreshAll();
    });
  }

  function folderIcon(f, isDefault) {
    if (isDefault) return 'ti-star';
    if (f.source === 'sector') return 'ti-building-factory-2';
    if (f.source === 'family') return 'ti-users-group';
    if (f.source === 'story' || f.source === 'chu-de') return 'ti-book-2';
    return 'ti-folder';
  }

  function ensureNewFolderModal() {
    var el = document.getElementById('ifxWlNewFolderModal');
    if (el) return el;
    el = document.createElement('div');
    el.className = 'ix-modal-overlay';
    el.id = 'ifxWlNewFolderModal';
    el.innerHTML =
      '<div class="ix-modal-box ifx-wl-new-modal" style="max-width:440px">' +
        '<button type="button" class="ix-modal-close" data-ifx-wl-new-close><i class="ti ti-x"></i></button>' +
        '<div class="ix-modal-title" data-ifx-wl-new-title>Thêm thư mục</div>' +
        '<div class="ix-modal-sub" data-ifx-wl-new-sub>Chọn loại thư mục</div>' +
        '<div class="ifx-wl-new-types" data-ifx-wl-new-types></div>' +
        '<div class="ifx-wl-new-picker" data-ifx-wl-new-picker hidden></div>' +
        '<div class="ifx-wl-new-custom" data-ifx-wl-new-custom hidden>' +
          '<label class="ix-label">Tên thư mục</label>' +
          '<input type="text" class="ix-input" placeholder="Nhập tên..." data-ifx-wl-new-name />' +
        '</div>' +
        '<div class="ifx-wl-new-actions">' +
          '<button type="button" class="ix-btn ix-btn-outline" data-ifx-wl-new-back hidden>Quay lại</button>' +
          '<div style="flex:1"></div>' +
          '<button type="button" class="ix-btn ix-btn-outline" data-ifx-wl-new-close-btn>Huỷ</button>' +
          '<button type="button" class="ix-btn ix-btn-primary" data-ifx-wl-new-confirm hidden>Tạo</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(el);

    el.addEventListener('click', function (e) {
      if (e.target === el) closeNewFolderModal();
    });
    el.querySelectorAll('[data-ifx-wl-new-close], [data-ifx-wl-new-close-btn]').forEach(function (btn) {
      btn.addEventListener('click', closeNewFolderModal);
    });
    el.querySelector('[data-ifx-wl-new-back]').addEventListener('click', function () {
      showNewFolderTypes(el);
    });
    el.querySelector('[data-ifx-wl-new-confirm]').addEventListener('click', onConfirmNewFolder);
    el.querySelector('[data-ifx-wl-new-name]').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') onConfirmNewFolder();
    });

    return el;
  }

  var newFolderCtx = { block: null, step: 'types', source: null };

  function closeNewFolderModal() {
    var el = document.getElementById('ifxWlNewFolderModal');
    if (el) el.classList.remove('open');
    newFolderCtx = { block: null, step: 'types', source: null };
  }

  function showNewFolderTypes(modal) {
    newFolderCtx.step = 'types';
    newFolderCtx.source = null;
    modal.querySelector('[data-ifx-wl-new-title]').textContent = 'Thêm thư mục';
    modal.querySelector('[data-ifx-wl-new-sub]').textContent = 'Chọn loại thư mục';
    modal.querySelector('[data-ifx-wl-new-types]').hidden = false;
    modal.querySelector('[data-ifx-wl-new-picker]').hidden = true;
    modal.querySelector('[data-ifx-wl-new-custom]').hidden = true;
    modal.querySelector('[data-ifx-wl-new-back]').hidden = true;
    modal.querySelector('[data-ifx-wl-new-confirm]').hidden = true;
    modal.querySelector('[data-ifx-wl-new-name]').value = '';

    modal.querySelector('[data-ifx-wl-new-types]').innerHTML =
      '<button type="button" class="ifx-wl-new-type" data-ifx-wl-new-kind="custom">' +
        '<i class="ti ti-pencil"></i><span><strong>Tên tùy ý</strong><small>Đặt tên thư mục của bạn</small></span>' +
      '</button>' +
      '<button type="button" class="ifx-wl-new-type" data-ifx-wl-new-kind="sector">' +
        '<i class="ti ti-building-factory-2"></i><span><strong>Ngành</strong><small>Toàn bộ CP trong ngành</small></span>' +
      '</button>' +
      '<button type="button" class="ifx-wl-new-type" data-ifx-wl-new-kind="family">' +
        '<i class="ti ti-users-group"></i><span><strong>Họ cổ phiếu</strong><small>Ví dụ: Họ VIN, Họ HPG…</small></span>' +
      '</button>' +
      '<button type="button" class="ifx-wl-new-type" data-ifx-wl-new-kind="chu-de">' +
        '<i class="ti ti-book-2"></i><span><strong>Chủ đề</strong><small>CP thuộc chủ đề đầu tư</small></span>' +
      '</button>';

    modal.querySelectorAll('[data-ifx-wl-new-kind]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var kind = btn.getAttribute('data-ifx-wl-new-kind');
        if (kind === 'custom') showNewFolderCustom(modal);
        else showNewFolderPicker(modal, kind);
      });
    });
  }

  function showNewFolderCustom(modal) {
    newFolderCtx.step = 'custom';
    newFolderCtx.source = null;
    modal.querySelector('[data-ifx-wl-new-title]').textContent = 'Thư mục tùy chỉnh';
    modal.querySelector('[data-ifx-wl-new-sub]').textContent = 'Nhập tên thư mục mới';
    modal.querySelector('[data-ifx-wl-new-types]').hidden = true;
    modal.querySelector('[data-ifx-wl-new-picker]').hidden = true;
    modal.querySelector('[data-ifx-wl-new-custom]').hidden = false;
    modal.querySelector('[data-ifx-wl-new-back]').hidden = false;
    modal.querySelector('[data-ifx-wl-new-confirm]').hidden = false;
    modal.querySelector('[data-ifx-wl-new-name]').focus();
  }

  function showNewFolderPicker(modal, source) {
    var tax = global.IfluxWatchlistTaxonomy;
    if (!tax) return;
    newFolderCtx.step = 'pick';
    newFolderCtx.source = source;
    var label = tax.sourceLabel(source);
    modal.querySelector('[data-ifx-wl-new-title]').textContent = 'Theo ' + label;
    modal.querySelector('[data-ifx-wl-new-sub]').textContent = 'Chọn nhóm — thư mục sẽ chứa toàn bộ CP trong nhóm';
    modal.querySelector('[data-ifx-wl-new-types]').hidden = true;
    modal.querySelector('[data-ifx-wl-new-custom]').hidden = true;
    modal.querySelector('[data-ifx-wl-new-picker]').hidden = false;
    modal.querySelector('[data-ifx-wl-new-back]').hidden = false;
    modal.querySelector('[data-ifx-wl-new-confirm]').hidden = true;

    var groups = tax.getGroups(source);
    var st = store();
    var existing = st.getFolders();
    modal.querySelector('[data-ifx-wl-new-picker]').innerHTML = groups.map(function (g) {
      var tickers = tax.getGroupTickers(source, g.id);
      var taken = existing.some(function (f) {
        return f.source === source && String(f.sourceId) === String(g.id);
      });
      return (
        '<button type="button" class="ifx-wl-new-pick' + (taken ? ' is-disabled' : '') + '" ' +
          'data-ifx-wl-pick-source="' + source + '" data-ifx-wl-pick-id="' + g.id + '" ' +
          (taken ? 'disabled' : '') + '>' +
          '<span class="ifx-wl-new-pick__name">' + g.name + '</span>' +
          '<span class="ifx-wl-new-pick__meta">' + tickers.length + ' mã' + (taken ? ' · đã thêm' : '') + '</span>' +
        '</button>'
      );
    }).join('');

    modal.querySelectorAll('[data-ifx-wl-pick-source]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (btn.disabled) return;
        createSmartFromPick(
          newFolderCtx.block,
          btn.getAttribute('data-ifx-wl-pick-source'),
          btn.getAttribute('data-ifx-wl-pick-id')
        );
        closeNewFolderModal();
      });
    });
  }

  function createSmartFromPick(block, source, sourceId) {
    try {
      var folder = store().createSmartFolder(source, sourceId);
      if (block) setActiveFolderId(block, folder.id);
      refreshAll();
      if (global.ixToast) ixToast('Đã tạo «' + folder.name + '»', 'success');
    } catch (e) {
      if (global.ixToast) ixToast(e.message, 'warning');
    }
  }

  function onConfirmNewFolder() {
    if (newFolderCtx.step !== 'custom') return;
    var name = document.querySelector('[data-ifx-wl-new-name]').value;
    if (!name || !name.trim()) {
      if (global.ixToast) ixToast('Nhập tên thư mục', 'warning');
      return;
    }
    try {
      var folder = store().createFolder(name);
      if (newFolderCtx.block) setActiveFolderId(newFolderCtx.block, folder.id);
      closeNewFolderModal();
      refreshAll();
      if (global.ixToast) ixToast('Đã tạo «' + folder.name + '»', 'success');
    } catch (e) {
      if (global.ixToast) ixToast(e.message, 'warning');
    }
  }

  function openNewFolderPrompt(block) {
    var modal = ensureNewFolderModal();
    newFolderCtx.block = block;
    showNewFolderTypes(modal);
    modal.classList.add('open');
  }

  function blockTemplate() {
    return (
      '<div class="ifx-wl-block__bar">' +
        '<div class="ifx-wl-block__scroll" data-ifx-wl-folder-scroll></div>' +
        '<div class="ifx-wl-block__fixed">' +
          '<button type="button" class="ix-btn ix-btn-outline ix-btn-sm ifx-wl-alerts-btn" data-ifx-wl-alerts title="Cảnh báo" aria-label="Cảnh báo">' +
            '<i class="ti ti-bell"></i>' +
            '<span class="ifx-wl-alerts-badge" data-ifx-wl-alerts-count hidden></span>' +
          '</button>' +
          '<button type="button" class="ix-btn ix-btn-outline ix-btn-sm ifx-wl-new-btn" data-ifx-wl-new-folder title="Thêm thư mục" aria-label="Thêm thư mục">' +
            '<i class="ti ti-plus"></i>' +
          '</button>' +
          '<button type="button" class="ix-btn ix-btn-outline ix-btn-sm ifx-wl-edit-btn" data-ifx-wl-edit title="Sửa danh mục">' +
            '<i class="ti ti-pencil"></i>' +
          '</button>' +
        '</div>' +
      '</div>' +
      '<div class="ifx-wl-block__list" data-ifx-wl-stock-list></div>'
    );
  }

  function ensureToolbarButtons(block) {
    var fixed = block.querySelector('.ifx-wl-block__fixed');
    if (!fixed || fixed.querySelector('[data-ifx-wl-alerts]')) return;
    var tpl = document.createElement('div');
    tpl.innerHTML = blockTemplate();
    var srcFixed = tpl.querySelector('.ifx-wl-block__fixed');
    if (!srcFixed) return;
    var alertsBtn = srcFixed.querySelector('[data-ifx-wl-alerts]');
    if (alertsBtn) fixed.insertBefore(alertsBtn, fixed.firstChild);
  }

  function mount(container) {
    if (!container) return null;
    var st = store();
    if (!st) {
      container.innerHTML = '<div class="ifx-wl-empty">Watchlist chưa sẵn sàng</div>';
      return container;
    }
    var block = container;
    if (!block.hasAttribute('data-ifx-wl-block')) {
      block.setAttribute('data-ifx-wl-block', '1');
    }
    if (!block.getAttribute('data-active-folder')) {
      block.setAttribute('data-active-folder', store().DEFAULT_FOLDER_ID);
    }
    if (!block.querySelector('[data-ifx-wl-stock-list]')) {
      block.innerHTML = blockTemplate();
    } else {
      ensureToolbarButtons(block);
    }
    bindBlockEvents(block);
    renderBlock(block);
    return block;
  }

  function refreshAll() {
    document.querySelectorAll('[data-ifx-wl-block]').forEach(renderBlock);
  }

  function initPage(container) {
    mount(container);
    document.addEventListener('iflux-watchlist-change', refreshAll);
  }

  global.IfluxWatchlistBlock = {
    mount: mount,
    refreshAll: refreshAll,
    render: renderBlock,
    blockTemplate: blockTemplate,
    initPage: initPage,
    refreshAlertBadges: refreshAlertBadges
  };

  document.addEventListener('iflux-watchlist-change', function () {
    refreshAll();
  });
})(window);
