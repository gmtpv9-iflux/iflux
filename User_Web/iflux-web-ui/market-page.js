/* Trang Thị trường — sidebar tổng quan + main: heatmap, thanh khoản, xếp hạng */
(function (global) {
  'use strict';

  var _tickTimer = null;

  /* Permission SoT = IfluxEntitlements. Composite chỉ HỎI engine, không tự quyết.
     Engine vắng mặt => fail-closed (không lộ block paywall). */
  function blockVisible(blockId) {
    return !!(global.IfluxEntitlements && IfluxEntitlements.canShowBlock(blockId));
  }

  function initSidebar() {
    var overview = document.getElementById('ifx-mkt-sidebar-overview');
    var breadth = document.getElementById('ifx-mkt-sidebar-breadth');

    if (overview && blockVisible('BLK-MKT-OVERVIEW') && global.IfluxCommunityMarketOverview) {
      IfluxCommunityMarketOverview.mount(overview, {
        sidebar: true,
        marketSidebar: true,
        includeBreadth: false
      });
    }

    if (breadth && blockVisible('BLK-MKT-BREADTH') && global.IfluxCommunityMarketOverview) {
      IfluxCommunityMarketOverview.mountBreadthSidebar(breadth, { entBlock: 'BLK-MKT-BREADTH' });
    }
  }

  function refreshSidebar() {
    var overview = document.getElementById('ifx-mkt-sidebar-overview');
    if (overview && global.IfluxCommunityMarketOverview) {
      IfluxCommunityMarketOverview.refresh(overview);
    }
    var breadth = document.querySelector('#ifx-mkt-sidebar-breadth [data-ifx-breadth-block]');
    if (breadth && global.IfluxBreadthBlock) {
      IfluxBreadthBlock.render(breadth);
    }
  }

  function initHeatmaps() {
    if (!global.IfluxMarketHeatmap) return;
    [
      { id: 'ifx-mkt-heat-sector', source: 'sector', block: 'BLK-MKT-HEAT-SECTOR' },
      { id: 'ifx-mkt-heat-family', source: 'family', block: 'BLK-MKT-HEAT-FAMILY' },
      { id: 'ifx-mkt-heat-story', source: 'chu-de', block: 'BLK-MKT-HEAT-CHUDE' }
    ].forEach(function (cfg) {
      if (!blockVisible(cfg.block)) return;
      var el = document.getElementById(cfg.id);
      if (el) IfluxMarketHeatmap.mount(el, cfg.source);
    });
  }

  function liqMountOpts(widgetId, metric) {
    var copy = global.WidgetLibraryCatalog && WidgetLibraryCatalog.resolveWidgetCopy
      ? WidgetLibraryCatalog.resolveWidgetCopy(widgetId)
      : {};
    return {
      metric: metric,
      widgetId: widgetId,
      withHead: true,
      title: copy.title,
      description: copy.description
    };
  }

  function initLiquidity() {
    if (!blockVisible('BLK-MKT-LIQ') || !global.IfluxMarketLiquidity) return;
    var vol = document.getElementById('ifx-mkt-liq-volume');
    var val = document.getElementById('ifx-mkt-liq-value');
    if (vol) IfluxMarketLiquidity.mountBlock(vol, 'volume', liqMountOpts('WGT-MKT-007', 'volume'));
    if (val) IfluxMarketLiquidity.mountBlock(val, 'value', liqMountOpts('WGT-MKT-008', 'value'));
  }

  function initRankings() {
    if (!blockVisible('BLK-MKT-RANKINGS') || !global.IfluxMarketRankings) return;
    [
      { id: 'ifx-mkt-rank-sector', source: 'sector' },
      { id: 'ifx-mkt-rank-family', source: 'family' },
      { id: 'ifx-mkt-rank-story', source: 'chu-de' }
    ].forEach(function (cfg) {
      var el = document.getElementById(cfg.id);
      if (el) {
        el.setAttribute('data-ifx-mkt-rank', cfg.source);
        IfluxMarketRankings.mount(el, cfg.source);
      }
    });
  }

  var _liqTimer = null;
  var _liqInterval = null;

  function startLiquidityClock() {
    function refreshLiq() {
      if (global.IfluxMarketLiquidity) IfluxMarketLiquidity.tickAll();
    }

    function clearLiqTimers() {
      if (_liqTimer) { clearTimeout(_liqTimer); _liqTimer = null; }
      if (_liqInterval) { clearInterval(_liqInterval); _liqInterval = null; }
    }

    function armNext() {
      clearLiqTimers();
      if (!global.IfluxMockMarket || !IfluxMockMarket.isTradingActive()) return;
      var delay = IfluxMockMarket.msUntilNextLiquidityUpdate
        ? IfluxMockMarket.msUntilNextLiquidityUpdate()
        : null;
      if (delay == null) return;
      _liqTimer = setTimeout(function () {
        refreshLiq();
        if (global.IfluxMockMarket && IfluxMockMarket.isTradingActive()) {
          _liqInterval = setInterval(function () {
            if (global.IfluxMockMarket && IfluxMockMarket.isTradingActive()) refreshLiq();
            else clearLiqTimers();
          }, getLiqUpdateMs());
        }
      }, delay);
    }

    refreshLiq();
    if (global.IfluxMockMarket && IfluxMockMarket.isTradingActive()) armNext();
    else if (global.IfluxMarketLiquidity) {
      document.querySelectorAll('[data-ifx-liq-metric]').forEach(function (block) {
        var root = block.parentElement;
        if (root && root._ifxLiqRefresh) root._ifxLiqRefresh();
      });
    }
  }

  function getTickIntervalMs() {
    if (global.IfluxMockMarket && IfluxMockMarket.getTickIntervalMs) {
      return IfluxMockMarket.getTickIntervalMs();
    }
    if (global.IfluxCoreConfig && IfluxCoreConfig.getSessionBounds) {
      return IfluxCoreConfig.getSessionBounds().tickIntervalMs;
    }
    return 12000;
  }

  function getLiqUpdateMs() {
    if (global.IfluxMockMarket && IfluxMockMarket.getLiqUpdateMs) {
      return IfluxMockMarket.getLiqUpdateMs();
    }
    return 300000;
  }

  var _tickBound = false;

  function bindMarketTickRefresh() {
    if (_tickBound) return;
    _tickBound = true;
    document.addEventListener('iflux-market-tick', function () {
      refreshSidebar();
      if (global.IfluxMarketRankings) IfluxMarketRankings.refreshAll();
      document.querySelectorAll('[data-ifx-mkt-heatmap]').forEach(function (canvas) {
        var source = canvas.getAttribute('data-ifx-mkt-heatmap');
        if (global.IfluxMarketHeatmap && source) {
          IfluxMarketHeatmap.paint(canvas, source);
        }
      });
    });
  }

  function restartTickTimer() {
    if (_tickTimer) clearInterval(_tickTimer);
    _tickTimer = null;
    startRealtime();
  }

  function startRealtime() {
    if (_tickTimer) clearInterval(_tickTimer);
    bindMarketTickRefresh();

    function onTick() {
      if (global.IfluxMockMarket && IfluxMockMarket.isTradingActive && !IfluxMockMarket.isTradingActive()) {
        return;
      }
      if (global.IfluxMockMarket && IfluxMockMarket.tickRealtime) {
        IfluxMockMarket.tickRealtime();
      }
    }

    _tickTimer = setInterval(onTick, getTickIntervalMs());
    onTick();
    startLiquidityClock();
  }

  function init() {
    initSidebar();
    initHeatmaps();
    initLiquidity();
    initRankings();
    startRealtime();
    document.addEventListener('iflux-core-config-changed', restartTickTimer);
    if (global.IfluxInsightShare) IfluxInsightShare.patchAll(document);
  }

  global.IfluxMarketPage = { init: init, refreshSidebar: refreshSidebar };
})(window);
