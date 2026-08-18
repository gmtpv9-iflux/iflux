/* Trang Dòng tiền — Page Feature helpers (refresh sidebar).
 * Mount Widget Slot = widgets/flow-page (Full Consumption composition).
 * KHÔNG gọi IfluxFlowScoreTop.init() — tránh ghi đè host đã mount theo Widget ID. */
(function (global) {
  'use strict';

  var SIDEBAR_DEDICATED = [
    { blockId: 'BLK-FLW-NET-STOCK', rootId: 'ifx-flow-subj-stock', scope: 'stock' },
    { blockId: 'BLK-FLW-NET-SECTOR', rootId: 'ifx-flow-subj-sector', scope: 'sector' }
  ];

  function blockVisible(blockId) {
    return !!(global.IfluxEntitlements && IfluxEntitlements.canShowBlock(blockId));
  }

  function refreshSidebar() {
    if (!global.IfluxFlowNetTop) return;
    SIDEBAR_DEDICATED.forEach(function (b) {
      var root = document.getElementById(b.rootId);
      if (!root || !blockVisible(b.blockId)) return;
      if (IfluxFlowNetTop.refresh) IfluxFlowNetTop.refresh(root);
    });
  }

  function init() {
    document.addEventListener('iflux-market-tick', function () {
      refreshSidebar();
    });
    /* Share Action: Foundation lazy khi click .ifx-insight-share-btn — không preload trang. */
  }

  global.IfluxFlowPage = { init: init, SIDEBAR_DEDICATED: SIDEBAR_DEDICATED };
})(window);
