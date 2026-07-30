/**
 * Template → Implementation(Web) status (Admin mirror · Wave 2–3).
 * Admin chỉ xem Ready/Draft — không nhập module path.
 * Khớp backend `runtime-implementations.js` (Developer/Build).
 */
(function (global) {
  'use strict';

  var WEB = {
    'TMP-ARTIFACT-CARD': { status: 'ready', module: '/User_Web/iflux-web-ui/widgets/artifact-card/index.js' },
    'TMP-MARKET-HEATMAP': { status: 'ready', module: '/User_Web/iflux-web-ui/widgets/market-heatmap/index.js' },
    'TMP-COM-STOCK-HEAT': { status: 'ready', module: '/User_Web/iflux-web-ui/widgets/community-stock-heat/index.js?v=comStockHeat20260722' },
    'TMP-COM-STORY-TOP': { status: 'ready', module: '/User_Web/iflux-web-ui/widgets/community-story-top/index.js' },
    'TMP-COM-ACTIVE': { status: 'ready', module: '/User_Web/iflux-web-ui/widgets/community-active/index.js' },
    'TMP-HEATMAP': { status: 'ready', module: '/User_Web/iflux-web-ui/widgets/market-heatmap/index.js' },
    'TMP-TREND-LINE': { status: 'ready', module: '/User_Web/iflux-web-ui/widgets/trend-line/index.js' },
    'TMP-COMMUNITY-LIST': { status: 'ready', module: '/User_Web/iflux-web-ui/widgets/community-list/index.js' },
    'TMP-COMMUNITY-STORY-TOP': { status: 'ready', module: '/User_Web/iflux-web-ui/widgets/community-story-top/index.js' },
    'TMP-DIVERGING-BARS': { status: 'ready', module: '/User_Web/iflux-web-ui/widgets/diverging-bars/index.js' },
    'TMP-SUMMARY': { status: 'ready', module: '/User_Web/iflux-web-ui/widgets/market-overview/index.js' },
    'TMP-BREADTH': { status: 'ready', module: '/User_Web/iflux-web-ui/widgets/market-breadth/index.js' },
    'TMP-COLLECTION': { status: 'ready', module: '/User_Web/iflux-web-ui/widgets/watchlist/index.js' },
    'TMP-NET-SUBJECT': { status: 'ready', module: '/User_Web/iflux-web-ui/widgets/flow-subj-net/index.js' },
    'TMP-RANK-PERF': { status: 'ready', module: '/User_Web/iflux-web-ui/widgets/rank-perf/index.js' },
    'TMP-FLOW-SUMMARY': { status: 'ready', module: '/User_Web/iflux-web-ui/widgets/flow-summary/index.js' },
    'TMP-FLOW-RANK-DUO': { status: 'ready', module: '/User_Web/iflux-web-ui/widgets/flow-rank-duo/index.js' },
    'TMP-FLOW-RANK-SIGNAL': { status: 'ready', module: '/User_Web/iflux-web-ui/widgets/flow-rank-signal/index.js' },
    'TMP-ZONE-POSITION': { status: 'ready', module: '/User_Web/iflux-web-ui/widgets/zone-position/index.js' },
    'TMP-SR-HISTORY': { status: 'ready', module: '/User_Web/iflux-web-ui/widgets/sr-history/index.js' }
  };

  function status(templateId) {
    var row = WEB[templateId];
    return row && row.status === 'ready' && row.module ? 'ready' : 'draft';
  }

  function impl(templateId) {
    return WEB[templateId] || null;
  }

  function isReady(templateId) {
    return status(templateId) === 'ready';
  }

  global.TemplateWebImplementations = {
    RUNTIME: 'web',
    all: WEB,
    status: status,
    impl: impl,
    isReady: isReady
  };
})(typeof window !== 'undefined' ? window : this);
