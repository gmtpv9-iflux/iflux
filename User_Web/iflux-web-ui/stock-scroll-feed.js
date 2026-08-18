/* Lazy scroll — render thêm khi cuộn tới cuối vùng feed */
(function (global) {
  'use strict';

  var DEFAULT_PAGE = 8;

  function mount(container, options) {
    if (!container || !options || typeof options.getItems !== 'function') return null;

    var pageSize = options.pageSize || DEFAULT_PAGE;
    var state = { shown: 0 };

    function items() {
      return options.getItems() || [];
    }

    function emptyHtml() {
      return options.emptyHtml || '<div class="ifx-stock-chat__empty">Không có nội dung.</div>';
    }

    function appendHtml(from, to) {
      var slice = items().slice(from, to);
      if (!slice.length) return;
      var html = slice.map(function (item, i) {
        return options.renderItem(item, from + i);
      }).join('');
      var sentinel = container.querySelector('[data-ifx-lazy-sentinel]');
      if (sentinel) sentinel.insertAdjacentHTML('beforebegin', html);
      else container.insertAdjacentHTML('beforeend', html);
    }

    function syncSentinel() {
      var sentinel = container.querySelector('[data-ifx-lazy-sentinel]');
      var all = items();
      if (!sentinel) {
        sentinel = document.createElement('div');
        sentinel.className = 'ifx-lazy-sentinel';
        sentinel.setAttribute('data-ifx-lazy-sentinel', '');
        container.appendChild(sentinel);
      }
      sentinel.hidden = state.shown >= all.length;
    }

    function bindRendered() {
      if (options.onRendered) options.onRendered(container);
    }

    function loadMore() {
      var all = items();
      if (state.shown >= all.length) return false;
      var prev = state.shown;
      state.shown = Math.min(state.shown + pageSize, all.length);
      appendHtml(prev, state.shown);
      syncSentinel();
      bindRendered();
      return true;
    }

    function reset() {
      var all = items();
      state.shown = Math.min(pageSize, all.length);
      if (!all.length) {
        container.innerHTML = emptyHtml();
        bindRendered();
        return;
      }
      container.innerHTML = all.slice(0, state.shown).map(function (item, i) {
        return options.renderItem(item, i);
      }).join('');
      syncSentinel();
      bindRendered();
    }

    function refresh() {
      var all = items();
      var keep = Math.max(state.shown, pageSize);
      state.shown = Math.min(keep, all.length);
      if (!all.length) {
        container.innerHTML = emptyHtml();
        bindRendered();
        return;
      }
      container.innerHTML = all.slice(0, state.shown).map(function (item, i) {
        return options.renderItem(item, i);
      }).join('');
      syncSentinel();
      bindRendered();
    }

    function onScroll() {
      if (state.shown >= items().length) return;
      var sentinel = container.querySelector('[data-ifx-lazy-sentinel]');
      if (!sentinel || sentinel.hidden) return;
      var cr = container.getBoundingClientRect();
      var sr = sentinel.getBoundingClientRect();
      if (sr.top <= cr.bottom + 48) loadMore();
    }

    container.addEventListener('scroll', onScroll, { passive: true });
    reset();

    return {
      reset: reset,
      refresh: refresh,
      loadMore: loadMore,
      destroy: function () {
        container.removeEventListener('scroll', onScroll);
      }
    };
  }

  global.IfluxStockScrollFeed = { mount: mount, DEFAULT_PAGE: DEFAULT_PAGE };
})(window);
