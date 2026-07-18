#!/usr/bin/env node
'use strict';

/**
 * Phase 3 — Publish Community page + 2 pilot widgets (TMP-ARTIFACT-CARD).
 * Chạy trên server: node scripts/seed-phase3-community-pilots.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { loadConfig } = require('../src/config');
const { initPool, closePool } = require('../src/core/database/connection');
const service = require('../src/modules/widget-publish/widget-publish.service');

function baseWidgetDrafts() {
  return {
    'WGT-COM-001': {
      id: 'WGT-COM-001',
      title: 'Heatmap cổ phiếu cộng đồng',
      template: 'TMP-COM-STOCK-HEAT',
      blocks: ['BLK-COM-TRENDING'],
      css: [
        '/User_Web/iflux-web-ui/community.css',
        '/User_Web/iflux-web-ui/block-templates.css',
        '/User_Web/iflux-web-ui/watchlist.css'
      ]
    },
    'WGT-COM-CHUDE-TOP': {
      id: 'WGT-COM-CHUDE-TOP',
      title: 'Chủ đề tích cực hàng đầu',
      template: 'TMP-COM-STORY-TOP',
      blocks: ['BLK-COM-CHUDE-TOP'],
      css: ['/User_Web/iflux-web-ui/community.css', '/User_Web/iflux-web-ui/block-templates.css']
    },
    'WGT-MKT-006': {
      id: 'WGT-MKT-006',
      title: 'Biểu đồ Câu chuyện',
      template: 'TMP-MARKET-HEATMAP',
      blocks: ['BLK-MKT-HEAT-CHUDE'],
      css: [
        '/User_Web/iflux-web-ui/block-templates.css',
        '/User_Web/iflux-web-ui/market.css',
        '/User_Web/iflux-web-ui/market-components.css'
      ]
    },
    'WGT-COM-002': {
      id: 'WGT-COM-002',
      title: 'Thành viên tích cực',
      template: 'TMP-COM-ACTIVE',
      blocks: ['BLK-COM-ACTIVE'],
      css: ['/User_Web/iflux-web-ui/community.css']
    },
    'WGT-COM-PILOT-NEW': {
      id: 'WGT-COM-PILOT-NEW',
      title: 'Pilot Platform #1',
      description: 'Widget mới chứng minh Publish → Runtime generic.',
      template: 'TMP-ARTIFACT-CARD',
      blocks: [],
      css: ['/User_Web/iflux-web-ui/block-templates.css', '/User_Web/iflux-web-ui/widget-shell.css']
    },
    'WGT-COM-PILOT-NEW-2': {
      id: 'WGT-COM-PILOT-NEW-2',
      title: 'Pilot Platform #2',
      description: 'Widget thứ hai — không sửa Runtime.',
      template: 'TMP-ARTIFACT-CARD',
      blocks: [],
      css: ['/User_Web/iflux-web-ui/block-templates.css', '/User_Web/iflux-web-ui/widget-shell.css']
    }
  };
}

function pageDraft() {
  return {
    page: 'community',
    path: '/cong-dong',
    title: 'Cộng đồng',
    intro: 'PagePublished + Layout Engine Host Tree.',
    documentTitle: 'Cộng đồng · iFlux',
    sections: [
      { key: 'main', label: 'Main — Widget grid', visible: true, layout: 'grid-12' },
      { key: 'sidebar-right', label: 'Sidebar phải', visible: true, layout: null }
    ],
    placements: [
      { widgetId: 'WGT-COM-001', section: 'main', position: 0, span: 6, enabled: true, locked: true, config: {} },
      { widgetId: 'WGT-COM-CHUDE-TOP', section: 'main', position: 1, span: 6, enabled: true, locked: true, config: {} },
      { widgetId: 'WGT-COM-PILOT-NEW', section: 'main', position: 2, span: 6, enabled: true, locked: false, config: {} },
      { widgetId: 'WGT-COM-PILOT-NEW-2', section: 'main', position: 3, span: 6, enabled: true, locked: false, config: {} },
      { widgetId: 'WGT-MKT-006', section: 'sidebar-right', position: 0, span: 12, enabled: true, locked: true, config: { source: 'story' } },
      { widgetId: 'WGT-COM-002', section: 'sidebar-right', position: 1, span: 12, enabled: true, locked: true, config: {} }
    ]
  };
}

async function main() {
  const config = loadConfig();
  initPool(config);
  const result = await service.publishPageDraft(pageDraft(), baseWidgetDrafts(), 'seed-phase3-pilots');
  console.log('OK page', result.page.version, 'widgets', result.widgets.map(function (w) {
    return w.id + '@v' + w.version + ':' + (w.display && w.display.module);
  }).join(' | '));
  await closePool();
}

main().catch(function (err) {
  console.error(err.message || err);
  process.exit(1);
});
