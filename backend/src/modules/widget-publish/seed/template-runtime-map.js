'use strict';

/**
 * Template → renderer/module (Publish-time only).
 * Admin chọn Template; Pipeline resolve display.module.
 */
const TEMPLATE_RUNTIME = {
  'TMP-ARTIFACT-CARD': {
    renderer: 'artifact-card',
    module: '/User_Web/iflux-web-ui/widgets/artifact-card/index.js?v=phase3Com20260716'
  },
  'TMP-MARKET-HEATMAP': {
    renderer: 'market-heatmap',
    module: '/User_Web/iflux-web-ui/widgets/market-heatmap/index.js'
  },
  'TMP-COM-STOCK-HEAT': {
    renderer: 'community-stock-heat',
    module: '/User_Web/iflux-web-ui/widgets/community-stock-heat/index.js?v=bpPhaseD20260716'
  },
  'TMP-COM-STORY-TOP': {
    renderer: 'community-story-top',
    module: '/User_Web/iflux-web-ui/widgets/community-story-top/index.js?v=bpPhaseD20260716'
  },
  'TMP-COM-ACTIVE': {
    renderer: 'community-active',
    module: '/User_Web/iflux-web-ui/widgets/community-active/index.js?v=bpPhaseD20260716'
  }
};

function templateRuntimeFor(templateId) {
  if (!templateId) return null;
  return TEMPLATE_RUNTIME[templateId] || null;
}

module.exports = { TEMPLATE_RUNTIME, templateRuntimeFor };
