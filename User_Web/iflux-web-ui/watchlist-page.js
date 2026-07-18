/* Trang Watchlist đầy đủ — dùng chung block với Dashboard */
(function (global) {
  'use strict';

  function init() {
    var root = document.querySelector('[data-ifx-wl-page]');
    if (!root || !global.IfluxWatchlistBlock) return;
    IfluxWatchlistBlock.initPage(root);
    if (global.IfluxWatchlistUI) IfluxWatchlistUI.bindHearts(document);
  }

  global.IfluxWatchlistPage = {
    init: init,
    render: function () {
      if (global.IfluxWatchlistBlock) IfluxWatchlistBlock.refreshAll();
    }
  };
})(window);
