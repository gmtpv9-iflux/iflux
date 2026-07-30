/**
 * Watchlist UI — modal thư mục + stock row (alert).
 * Follow Action (Foundation) — Owner: IfluxFollowAction / IfluxHeartAction alias.
 * Chỉ đổi icon; logic Watchlist không thuộc file này.
 */
(function (global) {
  'use strict';

  var store = function () { return global.IfluxWatchlistStore; };
  var heart = function () { return global.IfluxHeartAction; };

  function stockHref(ticker) {
    var c = global.IfluxSeoUrl
      ? IfluxSeoUrl.stockHref(ticker)
      : '/co-phieu/' + encodeURIComponent(ticker);
    return global.IfluxHref ? IfluxHref.forCanonical(c) : c;
  }

  function fmtPct(n) {
    if (n == null || isNaN(n)) return '—';
    return (n >= 0 ? '+' : '') + n.toFixed(2) + '%';
  }

  function dirClass(n) {
    if (n == null || n === 0) return '';
    return n > 0 ? 'is-up' : 'is-down';
  }

  function alertButtonHtml(ticker) {
    if (global.IfluxAlertUI) return IfluxAlertUI.alertButtonHtml(ticker);
    return (
      '<button type="button" class="ifx-stock-row__alert" data-ifx-stock-alert="' + ticker + '" ' +
        'title="Đặt cảnh báo" aria-label="Cảnh báo"></button>'
    );
  }

  function heartSlotHtml(ticker, options) {
    var h = heart();
    if (!h || !h.heartButtonHtml) return '';
    return h.heartButtonHtml(ticker, options);
  }

  function stockRowHtml(s, options) {
    options = options || {};
    var T = global.IfluxBlockTemplates;
    var badgesHtml = global.IfluxAlertUI ? IfluxAlertUI.rankBadgesHtml(s.ticker) : '';
    var actions =
      alertButtonHtml(s.ticker) +
      heartSlotHtml(s.ticker, options);
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
          '<button type="button" class="ix-btn ix-btn-outline" data-ifx-wl-remove hidden>Gỡ khỏi danh sách theo dõi</button>' +
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
    if (heart() && heart().refresh) heart().refresh();
    dispatchChange();
    if (global.ixToast) ixToast('Đã lưu ' + modalTicker, 'success');
  }

  function onRemove() {
    var st = store();
    if (!modalTicker || !st) return;
    st.removeFromWatchlist(modalTicker);
    closeModal();
    if (heart() && heart().refresh) heart().refresh();
    dispatchChange();
    if (global.ixToast) ixToast('Đã gỡ ' + modalTicker + ' khỏi danh sách theo dõi', 'info');
  }

  function dispatchChange() {
    document.dispatchEvent(new CustomEvent('iflux-watchlist-change'));
  }

  /** Bind alert trên stock row — Heart do IfluxHeartAction.bind */
  function bindRowActions(root) {
    var scope = root || document;
    if (global.IfluxAlertUI) IfluxAlertUI.bindAlerts(scope);
    if (heart() && heart().bind) heart().bind(scope);
  }

  global.IfluxWatchlistUI = {
    stockRowHtml: stockRowHtml,
    openModal: openModal,
    closeModal: closeModal,
    bindRowActions: bindRowActions,
    dispatchChange: dispatchChange
  };
})(window);
