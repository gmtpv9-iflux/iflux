/**
 * Foundation — Follow Action (Theo dõi thực thể → Watchlist)
 * Owner: Design System Foundation (Admin SoT) · catalog id: ix-follow
 *
 * Icon: Tabler bookmark (ti-bookmark) — phân biệt với ti-heart = Thích (Interaction).
 * Logic toggle Watchlist GIỮ NGUYÊN — chỉ đổi biểu tượng / nhãn Foundation.
 * Alias IfluxHeartAction giữ tương thích call-site cũ (không nhân bản logic).
 */
(function (global) {
  'use strict';
  if (global.IfluxFollowAction || global.IfluxHeartAction) return;

  function store() {
    return global.IfluxWatchlistStore;
  }

  /* Tabler ti-bookmark — cùng path stroke/fill; class giữ ifx-heart__icon để CSS consumer không gãy. */
  function iconSvg(active) {
    if (active) {
      return (
        '<svg class="ifx-heart__icon ifx-follow__icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">' +
          '<path fill="currentColor" stroke="none" d="M18 7v14l-6-4-6 4V7a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4z"/>' +
        '</svg>'
      );
    }
    return (
      '<svg class="ifx-heart__icon ifx-follow__icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">' +
        '<path fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" d="M18 7v14l-6-4-6 4V7a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4z"/>' +
      '</svg>'
    );
  }

  function resolveTickerContext(options) {
    options = options || {};
    var st = store();
    if (!st) {
      return { folderId: null, editable: true, active: false };
    }
    var folderId = options.folderId || st.DEFAULT_FOLDER_ID;
    var folder = st.getFolder(folderId);
    var editable = options.folderEditable != null
      ? options.folderEditable
      : !(folder && st.isSystemFolder(folder));
    var active = options.inFolder != null
      ? options.inFolder
      : st.isInFolder(options.id || options.ticker || '', folderId);
    return { folderId: folderId, editable: editable, active: active, folder: folder };
  }

  function isStoryActive(storyId) {
    var st = store();
    if (!st || !st.isGroupFollowed) return false;
    return st.isGroupFollowed('chu-de', storyId) || st.isGroupFollowed('story', storyId);
  }

  /**
   * @param {{ kind:'ticker'|'story', id:string, folderId?:string, folderEditable?:boolean, inFolder?:boolean, className?:string }} opts
   */
  function buttonHtml(opts) {
    opts = opts || {};
    var kind = opts.kind || 'ticker';
    var id = String(opts.id || opts.ticker || opts.storyId || '');
    if (!id) return '';

    if (kind === 'story') {
      var storyActive = isStoryActive(id);
      return (
        '<button type="button" class="ifx-follow ifx-heart ifx-heart--story' +
          (opts.className ? ' ' + opts.className : '') +
          (storyActive ? ' is-active' : '') +
          '" data-ifx-follow="1" data-ifx-heart="1" data-ifx-heart-kind="story" data-ifx-heart-id="' + id + '" ' +
          'title="' + (storyActive ? 'Bỏ theo dõi — gỡ tab Theo dõi' : 'Theo dõi — thêm tab Theo dõi') + '" ' +
          'aria-label="Theo dõi chủ đề">' +
          iconSvg(storyActive) +
        '</button>'
      );
    }

    var ctx = resolveTickerContext({
      id: id,
      ticker: id,
      folderId: opts.folderId,
      folderEditable: opts.folderEditable,
      inFolder: opts.inFolder
    });
    var title;
    var st = store();
    if (!ctx.editable) {
      title = 'Thư mục hệ thống — không thể thêm / bỏ mã';
    } else if (ctx.active) {
      title = st && ctx.folderId === st.DEFAULT_FOLDER_ID
        ? 'Bỏ theo dõi ' + id
        : 'Bỏ ' + id + ' khỏi thư mục này';
    } else {
      title = st && ctx.folderId === st.DEFAULT_FOLDER_ID
        ? 'Thêm ' + id + ' vào danh sách theo dõi'
        : 'Thêm ' + id + ' vào thư mục này';
    }
    return (
      '<button type="button" class="ifx-follow ifx-heart ifx-heart--ticker' +
        (opts.className ? ' ' + opts.className : '') +
        (ctx.active ? ' is-active' : '') +
        (ctx.editable ? '' : ' is-readonly') +
        '" data-ifx-follow="1" data-ifx-heart="1" data-ifx-heart-kind="ticker" data-ifx-heart-id="' + id + '" ' +
        'data-ifx-heart-folder="' + (ctx.folderId || '') + '" ' +
        'data-ifx-heart-editable="' + (ctx.editable ? '1' : '0') + '" ' +
        'title="' + title + '" aria-label="Theo dõi">' +
        iconSvg(ctx.active) +
      '</button>'
    );
  }

  function heartButtonHtml(ticker, options) {
    options = options || {};
    return buttonHtml({
      kind: 'ticker',
      id: ticker,
      folderId: options.folderId,
      folderEditable: options.folderEditable,
      inFolder: options.inFolder
    });
  }

  function storyHeartButtonHtml(storyId) {
    return buttonHtml({ kind: 'story', id: storyId, className: 'ifx-com-story-heart' });
  }

  function dispatchChange() {
    document.dispatchEvent(new CustomEvent('iflux-watchlist-change'));
    document.dispatchEvent(new CustomEvent('iflux-heart-change'));
  }

  function updateTickerButton(btn) {
    var st = store();
    if (!st) return;
    var id = btn.getAttribute('data-ifx-heart-id');
    var folderId = btn.getAttribute('data-ifx-heart-folder') || st.DEFAULT_FOLDER_ID;
    var editable = btn.getAttribute('data-ifx-heart-editable') !== '0';
    var folder = st.getFolder(folderId);
    if (folder && st.isSystemFolder(folder)) editable = false;
    var active = st.isInFolder(id, folderId);
    btn.classList.toggle('is-active', active);
    btn.classList.toggle('is-readonly', !editable);
    btn.setAttribute('data-ifx-heart-editable', editable ? '1' : '0');
    btn.innerHTML = iconSvg(active);
    if (!editable) {
      btn.title = 'Thư mục hệ thống — không thể thêm / bỏ mã';
    } else if (active) {
      btn.title = folderId === st.DEFAULT_FOLDER_ID
        ? 'Bỏ theo dõi ' + id
        : 'Bỏ ' + id + ' khỏi thư mục này';
    } else {
      btn.title = folderId === st.DEFAULT_FOLDER_ID
        ? 'Thêm ' + id + ' vào danh sách theo dõi'
        : 'Thêm ' + id + ' vào thư mục này';
    }
  }

  function updateStoryButton(btn) {
    var st = store();
    if (!st) return;
    var id = btn.getAttribute('data-ifx-heart-id');
    var active = isStoryActive(id);
    btn.classList.toggle('is-active', active);
    btn.innerHTML = iconSvg(active);
    btn.title = active
      ? 'Bỏ theo dõi — gỡ tab Theo dõi'
      : 'Theo dõi — thêm tab Theo dõi';
  }

  function refresh(root) {
    var scope = root || document;
    scope.querySelectorAll('[data-ifx-heart][data-ifx-heart-kind="ticker"]').forEach(updateTickerButton);
    scope.querySelectorAll('[data-ifx-heart][data-ifx-heart-kind="story"]').forEach(updateStoryButton);
  }

  function onStoryClick(btn) {
    var st = store();
    if (!st) return;
    var storyId = btn.getAttribute('data-ifx-heart-id');
    try {
      var followed = st.toggleGroupFollow('chu-de', storyId);
      if (global.ixToast) {
        ixToast(
          followed ? 'Đã thêm tab chủ đề vào danh sách theo dõi' : 'Đã gỡ tab chủ đề khỏi danh sách theo dõi',
          followed ? 'success' : 'info'
        );
      }
    } catch (err) {
      if (global.ixToast) ixToast(err.message, 'warning');
      return;
    }
    refresh();
    dispatchChange();
  }

  function onTickerClick(btn) {
    var st = store();
    if (!st) return;
    if (btn.classList.contains('is-readonly') || btn.getAttribute('data-ifx-heart-editable') === '0') {
      if (global.ixToast) ixToast('Thư mục hệ thống không thể thêm / bỏ mã', 'info');
      return;
    }
    var ticker = btn.getAttribute('data-ifx-heart-id');
    var folderId = btn.getAttribute('data-ifx-heart-folder') || st.DEFAULT_FOLDER_ID;
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
              ? 'Đã thêm ' + ticker + ' vào danh sách theo dõi'
              : 'Đã thêm ' + ticker + ' vào thư mục',
            'success'
          );
        }
      }
    } catch (err) {
      if (global.ixToast) ixToast(err.message, 'warning');
      return;
    }
    refresh();
    dispatchChange();
  }

  function onPointer(e) {
    var btn = e.target.closest && e.target.closest('[data-ifx-heart]');
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
    var kind = btn.getAttribute('data-ifx-heart-kind');
    if (kind === 'story') onStoryClick(btn);
    else onTickerClick(btn);
  }

  function bind(root) {
    var scope = root || document;
    if (!scope._ifxHeartBound) {
      scope.addEventListener('click', onPointer);
      scope._ifxHeartBound = true;
    }
    refresh(scope);
  }

  var api = {
    iconSvg: iconSvg,
    buttonHtml: buttonHtml,
    heartButtonHtml: heartButtonHtml,
    storyHeartButtonHtml: storyHeartButtonHtml,
    followButtonHtml: heartButtonHtml,
    storyFollowButtonHtml: storyHeartButtonHtml,
    bind: bind,
    refresh: refresh,
    bindHearts: bind,
    refreshHearts: refresh,
    bindFollow: bind,
    refreshFollow: refresh
  };
  global.IfluxFollowAction = api;
  /* Alias cũ — call-site Watchlist/Community chưa đổi tên vẫn dùng chung 1 logic. */
  global.IfluxHeartAction = api;
})(typeof window !== 'undefined' ? window : this);
