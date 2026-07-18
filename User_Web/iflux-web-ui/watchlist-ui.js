/* Watchlist UI — trái tim, alert, toggle nhanh theo thư mục */
(function (global) {
  'use strict';

  var store = function () { return global.IfluxWatchlistStore; };

  function stockHref(ticker) {
    if (global.IfluxSeoUrl) return IfluxSeoUrl.stockHref(ticker);
    return '/co-phieu/' + encodeURIComponent(ticker);
  }

  function fmtPct(n) {
    if (n == null || isNaN(n)) return '—';
    return (n >= 0 ? '+' : '') + n.toFixed(2) + '%';
  }

  function dirClass(n) {
    if (n == null || n === 0) return '';
    return n > 0 ? 'is-up' : 'is-down';
  }

  function resolveFolderContext(options) {
    var st = store();
    if (!st) return { folderId: null, editable: true, inFolder: false };
    var folderId = options.folderId || st.DEFAULT_FOLDER_ID;
    var folder = st.getFolder(folderId);
    var editable = options.folderEditable != null
      ? options.folderEditable
      : !(folder && st.isSystemFolder(folder));
    var inFolder = options.inFolder != null
      ? options.inFolder
      : st.isInFolder(options.ticker || '', folderId);
    return { folderId: folderId, editable: editable, inFolder: inFolder, folder: folder };
  }

  function heartIconSvg(active) {
    if (active) {
      return (
        '<svg class="ifx-heart-icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">' +
          '<path fill="currentColor" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>' +
        '</svg>'
      );
    }
    return (
      '<svg class="ifx-heart-icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">' +
        '<path fill="none" stroke="currentColor" stroke-width="1.75" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>' +
      '</svg>'
    );
  }

  function alertButtonHtml(ticker) {
    if (global.IfluxAlertUI) return IfluxAlertUI.alertButtonHtml(ticker);
    return (
      '<button type="button" class="ifx-stock-row__alert" data-ifx-stock-alert="' + ticker + '" ' +
        'title="Đặt cảnh báo" aria-label="Cảnh báo"></button>'
    );
  }

  function heartButtonHtml(ticker, options) {
    options = options || {};
    var ctx = resolveFolderContext(Object.assign({ ticker: ticker }, options));
    var active = ctx.inFolder;
    var readonly = !ctx.editable;
    var title;
    if (readonly) {
      title = 'Thư mục hệ thống — không thể thêm / bỏ mã';
    } else if (active) {
      title = ctx.folderId === store().DEFAULT_FOLDER_ID
        ? 'Bỏ theo dõi ' + ticker
        : 'Bỏ ' + ticker + ' khỏi thư mục này';
    } else {
      title = ctx.folderId === store().DEFAULT_FOLDER_ID
        ? 'Thêm ' + ticker + ' vào Watchlist'
        : 'Thêm ' + ticker + ' vào thư mục này';
    }
    return (
      '<button type="button" class="ifx-stock-row__heart' +
        (active ? ' is-active' : '') +
        (readonly ? ' is-readonly' : '') +
        '" data-ifx-watchlist-heart="' + ticker + '" ' +
        'data-ifx-wl-folder-id="' + ctx.folderId + '" ' +
        'data-ifx-wl-editable="' + (ctx.editable ? '1' : '0') + '" ' +
        'title="' + title + '" aria-label="Watchlist">' +
        heartIconSvg(active) + '</button>'
    );
  }

  function stockRowHtml(s, options) {
    options = options || {};
    var T = global.IfluxBlockTemplates;
    var badgesHtml = global.IfluxAlertUI ? IfluxAlertUI.rankBadgesHtml(s.ticker) : '';
    var actions =
      alertButtonHtml(s.ticker) +
      heartButtonHtml(s.ticker, options);
    if (T) {
      return T.renderStockRowWrap(s, {
        href: options.href || stockHref(s.ticker),
        actionsHtml: actions,
        badgesHtml: badgesHtml,
        folderId: options.folderId
      });
    }
    var href = options.href || stockHref(s.ticker);
    var chg = s.change_pct;
    return (
      '<div class="ifx-stock-row-wrap ' + dirClass(chg) + '" data-ticker="' + s.ticker + '">' +
        '<a class="ifx-stock-row ' + dirClass(chg) + '" href="' + href + '" data-ticker="' + s.ticker + '">' +
          '<span class="ifx-stock-row__ticker">' + s.ticker + '</span>' +
          '<span class="ifx-stock-row__name">' + (s.name || '') + '</span>' +
          '<span class="ifx-stock-row__price">' + (s.price != null ? s.price : '—') + '</span>' +
          '<span class="ifx-stock-row__chg">' + fmtPct(chg) + '</span>' +
          '<span class="ifx-stock-row__vol">' + (s.volume || '—') + '</span>' +
        '</a>' +
        '<div class="ifx-stock-row__actions">' + actions + '</div>' +
        '<div class="ifx-stock-row__badges-row" data-ifx-stock-badges>' + badgesHtml + '</div>' +
      '</div>'
    );
  }

  function ensureModal() {
    var el = document.getElementById('ifxWatchlistModal');
    if (el) return el;
    el = document.createElement('div');
    el.className = 'ix-modal-overlay';
    el.id = 'ifxWatchlistModal';
    el.setAttribute('data-ifx-watchlist-modal', '1');
    el.innerHTML =
      '<div class="ix-modal-box ifx-wl-modal" style="max-width:420px">' +
        '<button type="button" class="ix-modal-close" data-ifx-wl-close><i class="ti ti-x"></i></button>' +
        '<div class="ix-modal-title">Lưu vào thư mục</div>' +
        '<div class="ix-modal-sub" data-ifx-wl-ticker-sub>Mã —</div>' +
        '<div class="ifx-wl-modal__folders" data-ifx-wl-folder-list></div>' +
        '<div class="ifx-wl-modal__create">' +
          '<label class="ix-label">Tạo thư mục mới</label>' +
          '<div class="ifx-wl-modal__create-row">' +
            '<input type="text" class="ix-input" placeholder="Tên thư mục..." data-ifx-wl-new-name />' +
            '<button type="button" class="ix-btn ix-btn-outline ix-btn-sm" data-ifx-wl-create>Tạo</button>' +
          '</div>' +
        '</div>' +
        '<div class="ifx-wl-modal__actions">' +
          '<button type="button" class="ix-btn ix-btn-outline" data-ifx-wl-remove hidden>Gỡ khỏi Watchlist</button>' +
          '<div style="flex:1"></div>' +
          '<button type="button" class="ix-btn ix-btn-outline" data-ifx-wl-close-btn>Huỷ</button>' +
          '<button type="button" class="ix-btn ix-btn-primary" data-ifx-wl-save>Lưu</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(el);

    el.addEventListener('click', function (e) {
      if (e.target === el) closeModal();
    });
    el.querySelectorAll('[data-ifx-wl-close], [data-ifx-wl-close-btn]').forEach(function (btn) {
      btn.addEventListener('click', closeModal);
    });
    el.querySelector('[data-ifx-wl-create]').addEventListener('click', onCreateFolder);
    el.querySelector('[data-ifx-wl-save]').addEventListener('click', onSave);
    el.querySelector('[data-ifx-wl-remove]').addEventListener('click', onRemove);
    el.querySelector('[data-ifx-wl-new-name]').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') onCreateFolder();
    });

    return el;
  }

  var modalTicker = null;

  function renderFolderChecks() {
    var modal = ensureModal();
    var list = modal.querySelector('[data-ifx-wl-folder-list]');
    var st = store();
    if (!st || !modalTicker) return;

    var membership = st.getMembership(modalTicker);
    var inWl = st.isInWatchlist(modalTicker);

    modal.querySelector('[data-ifx-wl-remove]').hidden = !inWl;

    list.innerHTML = st.getFolders().filter(function (f) {
      return !st.isSystemFolder(f);
    }).map(function (f) {
      var checked = membership.indexOf(f.id) >= 0;
      var isDefault = f.id === st.DEFAULT_FOLDER_ID;
      var disabled = isDefault ? ' disabled' : '';
      var checkedAttr = (isDefault || checked) ? ' checked' : '';
      return (
        '<label class="ifx-wl-modal__folder' + (isDefault ? ' is-locked' : '') + '">' +
          '<input type="checkbox" data-ifx-wl-folder="' + f.id + '"' + checkedAttr + disabled + ' />' +
          '<span class="ifx-wl-modal__folder-name">' + f.name + '</span>' +
          (isDefault ? '<span class="ifx-wl-modal__folder-tag">Mặc định</span>' : '') +
        '</label>'
      );
    }).join('');
  }

  function openModal(ticker) {
    var st = store();
    if (!st) return;
    modalTicker = ticker;
    var modal = ensureModal();
    var snap = global.IfluxMockMarket && IfluxMockMarket.getSnapshot();
    var name = ticker;
    if (snap && snap.entities && snap.entities.stocks && snap.entities.stocks[ticker]) {
      name = snap.entities.stocks[ticker].name || ticker;
    }
    modal.querySelector('[data-ifx-wl-ticker-sub]').textContent = ticker + ' · ' + name;
    modal.querySelector('[data-ifx-wl-new-name]').value = '';
    renderFolderChecks();
    modal.classList.add('open');
  }

  function closeModal() {
    var modal = document.getElementById('ifxWatchlistModal');
    if (modal) modal.classList.remove('open');
    modalTicker = null;
  }

  function onCreateFolder() {
    var st = store();
    var modal = ensureModal();
    var input = modal.querySelector('[data-ifx-wl-new-name]');
    try {
      var folder = st.createFolder(input.value);
      input.value = '';
      renderFolderChecks();
      var cb = modal.querySelector('[data-ifx-wl-folder="' + folder.id + '"]');
      if (cb) cb.checked = true;
      if (global.ixToast) ixToast('Đã tạo thư mục «' + folder.name + '»', 'success');
      if (global.IfluxWatchlistBlock) IfluxWatchlistBlock.refreshAll();
    } catch (e) {
      if (global.ixToast) ixToast(e.message, 'warning');
    }
  }

  function onSave() {
    var st = store();
    var modal = ensureModal();
    if (!modalTicker || !st) return;

    var ids = [st.DEFAULT_FOLDER_ID];
    modal.querySelectorAll('[data-ifx-wl-folder]:checked').forEach(function (cb) {
      var id = cb.getAttribute('data-ifx-wl-folder');
      if (ids.indexOf(id) < 0) ids.push(id);
    });

    st.setMembership(modalTicker, ids);
    closeModal();
    refreshHearts();
    dispatchChange();
    if (global.ixToast) ixToast('Đã lưu ' + modalTicker, 'success');
  }

  function onRemove() {
    var st = store();
    if (!modalTicker || !st) return;
    st.removeFromWatchlist(modalTicker);
    closeModal();
    refreshHearts();
    dispatchChange();
    if (global.ixToast) ixToast('Đã gỡ ' + modalTicker + ' khỏi Watchlist', 'info');
  }

  function dispatchChange() {
    document.dispatchEvent(new CustomEvent('iflux-watchlist-change'));
  }

  function updateHeartButton(btn) {
    var st = store();
    if (!st) return;
    var ticker = btn.getAttribute('data-ifx-watchlist-heart');
    var folderId = btn.getAttribute('data-ifx-wl-folder-id') || st.DEFAULT_FOLDER_ID;
    var editable = btn.getAttribute('data-ifx-wl-editable') !== '0';
    var folder = st.getFolder(folderId);
    if (folder && st.isSystemFolder(folder)) editable = false;
    var active = st.isInFolder(ticker, folderId);
    btn.classList.toggle('is-active', active);
    btn.classList.toggle('is-readonly', !editable);
    btn.innerHTML = heartIconSvg(active);
    if (!editable) {
      btn.title = 'Thư mục hệ thống — không thể thêm / bỏ mã';
    } else if (active) {
      btn.title = folderId === st.DEFAULT_FOLDER_ID
        ? 'Bỏ theo dõi ' + ticker
        : 'Bỏ ' + ticker + ' khỏi thư mục này';
    } else {
      btn.title = folderId === st.DEFAULT_FOLDER_ID
        ? 'Thêm ' + ticker + ' vào Watchlist'
        : 'Thêm ' + ticker + ' vào thư mục này';
    }
  }

  function storyHeartButtonHtml(storyId) {
    var st = store();
    var active = st && st.isGroupFollowed ? (st.isGroupFollowed('chu-de', storyId) || st.isGroupFollowed('story', storyId)) : false;
    return (
      '<button type="button" class="ifx-stock-row__heart ifx-com-story-heart' +
        (active ? ' is-active' : '') +
        '" data-ifx-watchlist-story-heart="' + storyId + '" ' +
        'title="' + (active ? 'Bỏ theo dõi — gỡ tab Watchlist' : 'Theo dõi — thêm tab Watchlist') + '" ' +
        'aria-label="Theo dõi chủ đề">' +
        heartIconSvg(active) +
      '</button>'
    );
  }

  function updateStoryHeartButton(btn) {
    var st = store();
    if (!st) return;
    var storyId = btn.getAttribute('data-ifx-watchlist-story-heart');
    var active = st.isGroupFollowed('chu-de', storyId) || st.isGroupFollowed('story', storyId);
    btn.classList.toggle('is-active', active);
    btn.innerHTML = heartIconSvg(active);
    btn.title = active
      ? 'Bỏ theo dõi — gỡ tab Watchlist'
      : 'Theo dõi — thêm tab Watchlist';
  }

  function refreshStoryHearts() {
    document.querySelectorAll('[data-ifx-watchlist-story-heart]').forEach(updateStoryHeartButton);
  }

  function onStoryHeartClick(e) {
    var btn = e.target.closest('[data-ifx-watchlist-story-heart]');
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();

    var st = store();
    if (!st) return;
    var storyId = btn.getAttribute('data-ifx-watchlist-story-heart');

    try {
      var followed = st.toggleGroupFollow('chu-de', storyId);
      if (global.ixToast) {
        ixToast(
          followed ? 'Đã thêm tab chủ đề vào Watchlist' : 'Đã gỡ tab chủ đề khỏi Watchlist',
          followed ? 'success' : 'info'
        );
      }
    } catch (err) {
      if (global.ixToast) ixToast(err.message, 'warning');
      return;
    }

    refreshStoryHearts();
    dispatchChange();
  }

  function onHeartPointer(e) {
    if (e.target.closest('[data-ifx-watchlist-story-heart]')) onStoryHeartClick(e);
    else onHeartClick(e);
  }

  function refreshHearts() {
    document.querySelectorAll('[data-ifx-watchlist-heart]').forEach(updateHeartButton);
    refreshStoryHearts();
  }

  function onHeartClick(e) {
    var btn = e.target.closest('[data-ifx-watchlist-heart]');
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();

    var st = store();
    if (!st) return;

    if (btn.classList.contains('is-readonly') || btn.getAttribute('data-ifx-wl-editable') === '0') {
      if (global.ixToast) ixToast('Thư mục hệ thống không thể thêm / bỏ mã', 'info');
      return;
    }

    var ticker = btn.getAttribute('data-ifx-watchlist-heart');
    var folderId = btn.getAttribute('data-ifx-wl-folder-id') || st.DEFAULT_FOLDER_ID;
    var inFolder = btn.classList.contains('is-active');

    try {
      if (inFolder) {
        st.removeFromFolder(ticker, folderId);
        if (global.ixToast) {
          ixToast(
            folderId === st.DEFAULT_FOLDER_ID
              ? 'Đã bỏ theo dõi ' + ticker
              : 'Đã bỏ ' + ticker + ' khỏi thư mục',
            'info'
          );
        }
      } else {
        st.addToFolder(ticker, folderId);
        if (global.ixToast) {
          ixToast(
            folderId === st.DEFAULT_FOLDER_ID
              ? 'Đã thêm ' + ticker + ' vào Watchlist'
              : 'Đã thêm ' + ticker + ' vào thư mục',
            'success'
          );
        }
      }
    } catch (err) {
      if (global.ixToast) ixToast(err.message, 'warning');
      return;
    }

    refreshHearts();
    dispatchChange();
  }

  function bindHearts(root) {
    var scope = root || document;
    if (!scope._ifxWlHeartBound) {
      scope.addEventListener('click', onHeartPointer);
      scope._ifxWlHeartBound = true;
    }
    refreshHearts();
    if (global.IfluxAlertUI) IfluxAlertUI.bindAlerts(scope);
  }

  global.IfluxWatchlistUI = {
    stockRowHtml: stockRowHtml,
    heartButtonHtml: heartButtonHtml,
    storyHeartButtonHtml: storyHeartButtonHtml,
    openModal: openModal,
    closeModal: closeModal,
    refreshHearts: refreshHearts,
    bindHearts: bindHearts,
    dispatchChange: dispatchChange
  };
})(window);
