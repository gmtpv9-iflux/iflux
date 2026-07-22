'use strict';

/**
 * Runtime Implementation registry (Developer/Build) — Wave 3.
 *
 * Publish gọi resolveRuntimeImplementation(templateId, runtime).
 * Admin KHÔNG nhập path module.
 *
 * Wave 1 `template-runtime-map.js` trở thành facade mỏng (re-export WEB).
 * Đích: Runtime Implementation → Publish → Artifact (không map tay mỗi lần Admin thêm TMP).
 */

const RUNTIME_WEB = 'web';

/** @type {Record<string, { renderer: string, module: string, status: 'ready'|'draft' }>} */
const WEB_IMPLEMENTATIONS = {
  /* —— Orphan / pilot ids —— */
  'TMP-ARTIFACT-CARD': {
    status: 'ready',
    renderer: 'artifact-card',
    module: '/User_Web/iflux-web-ui/widgets/artifact-card/index.js?v=phase3Com20260716'
  },
  'TMP-MARKET-HEATMAP': {
    status: 'ready',
    renderer: 'market-heatmap',
    module: '/User_Web/iflux-web-ui/widgets/market-heatmap/index.js'
  },
  'TMP-COM-STOCK-HEAT': {
    status: 'ready',
    renderer: 'community-stock-heat',
    module: '/User_Web/iflux-web-ui/widgets/community-stock-heat/index.js?v=comStockHeat20260722b'
  },
  'TMP-COM-STORY-TOP': {
    status: 'ready',
    renderer: 'community-story-top',
    module: '/User_Web/iflux-web-ui/widgets/community-story-top/index.js?v=stocksOnlyH20260722'
  },
  'TMP-COM-ACTIVE': {
    status: 'ready',
    renderer: 'community-active',
    module: '/User_Web/iflux-web-ui/widgets/community-active/index.js?v=bpPhaseD20260716'
  },

  /* —— Admin catalog (15) —— */
  'TMP-HEATMAP': {
    status: 'ready',
    renderer: 'market-heatmap',
    module: '/User_Web/iflux-web-ui/widgets/market-heatmap/index.js'
  },
  'TMP-TREND-LINE': {
    status: 'ready',
    renderer: 'trend-line',
    module: '/User_Web/iflux-web-ui/widgets/trend-line/index.js?v=pubFix20260722c'
  },
  'TMP-COMMUNITY-LIST': {
    status: 'ready',
    renderer: 'community-list',
    module: '/User_Web/iflux-web-ui/widgets/community-list/index.js?v=pubFix20260722'
  },
  'TMP-COMMUNITY-STORY-TOP': {
    status: 'ready',
    renderer: 'community-story-top',
    module: '/User_Web/iflux-web-ui/widgets/community-story-top/index.js?v=stocksOnlyH20260722'
  },
  'TMP-DIVERGING-BARS': {
    status: 'ready',
    renderer: 'diverging-bars',
    module: '/User_Web/iflux-web-ui/widgets/diverging-bars/index.js?v=pubFix20260722b'
  },
  'TMP-SUMMARY': {
    status: 'ready',
    renderer: 'market-overview',
    module: '/User_Web/iflux-web-ui/widgets/market-overview/index.js?v=wave1GapA20260722'
  },
  'TMP-BREADTH': {
    status: 'ready',
    renderer: 'market-breadth',
    module: '/User_Web/iflux-web-ui/widgets/market-breadth/index.js?v=wave1GapA20260722'
  },
  'TMP-COLLECTION': {
    status: 'ready',
    renderer: 'watchlist',
    module: '/User_Web/iflux-web-ui/widgets/watchlist/index.js?v=wave1GapA20260722'
  },
  'TMP-NET-SUBJECT': {
    status: 'ready',
    renderer: 'flow-subj-net',
    module: '/User_Web/iflux-web-ui/widgets/flow-subj-net/index.js?v=wave1GapA20260722'
  },
  /* Gap B → Ready (Wave 2–3 đóng) */
  'TMP-RANK-PERF': {
    status: 'ready',
    renderer: 'rank-perf',
    module: '/User_Web/iflux-web-ui/widgets/rank-perf/index.js?v=wave23GapB20260722'
  },
  'TMP-FLOW-SUMMARY': {
    status: 'ready',
    renderer: 'flow-summary',
    module: '/User_Web/iflux-web-ui/widgets/flow-summary/index.js?v=wave23GapB20260722'
  },
  'TMP-FLOW-RANK-DUO': {
    status: 'ready',
    renderer: 'flow-rank-duo',
    module: '/User_Web/iflux-web-ui/widgets/flow-rank-duo/index.js?v=wave23GapB20260722'
  },
  'TMP-FLOW-RANK-SIGNAL': {
    status: 'ready',
    renderer: 'flow-rank-signal',
    module: '/User_Web/iflux-web-ui/widgets/flow-rank-signal/index.js?v=wave23GapB20260722'
  },
  'TMP-ZONE-POSITION': {
    status: 'ready',
    renderer: 'zone-position',
    module: '/User_Web/iflux-web-ui/widgets/zone-position/index.js?v=wave23GapB20260722'
  },
  'TMP-SR-HISTORY': {
    status: 'ready',
    renderer: 'sr-history',
    module: '/User_Web/iflux-web-ui/widgets/sr-history/index.js?v=wave23GapB20260722'
  }
};

/**
 * @param {string} templateId
 * @param {string} [runtime]
 * @returns {{ renderer: string, module: string, status: string, runtime: string }|null}
 */
function resolveRuntimeImplementation(templateId, runtime) {
  const rt = String(runtime || RUNTIME_WEB).toLowerCase();
  if (!templateId) return null;
  if (rt !== RUNTIME_WEB) {
    /* Web-first: Runtime khác chưa đăng ký Implementation */
    return null;
  }
  const impl = WEB_IMPLEMENTATIONS[templateId];
  if (!impl || !impl.module) return null;
  if (impl.status && impl.status !== 'ready') return null;
  return {
    runtime: RUNTIME_WEB,
    status: impl.status || 'ready',
    renderer: impl.renderer || 'generic',
    module: impl.module
  };
}

function webImplementationStatus(templateId) {
  const impl = WEB_IMPLEMENTATIONS[templateId];
  if (!impl) return 'draft';
  return impl.status === 'ready' && impl.module ? 'ready' : 'draft';
}

/** Facade Wave 1 shape (renderer + module only). */
function templateRuntimeFor(templateId) {
  const impl = resolveRuntimeImplementation(templateId, RUNTIME_WEB);
  if (!impl) return null;
  return { renderer: impl.renderer, module: impl.module };
}

module.exports = {
  RUNTIME_WEB,
  WEB_IMPLEMENTATIONS,
  resolveRuntimeImplementation,
  webImplementationStatus,
  templateRuntimeFor
};
