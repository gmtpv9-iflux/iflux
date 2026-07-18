#!/usr/bin/env node
'use strict';

/**
 * Phase 4 — Seed PagePublished cho market, flow, dashboard (sidebar only).
 *
 * Flow: remap section main → basic|advanced|exclusive (Page Feature tabs).
 * Dashboard: chỉ sidebar (PRF) — không serialize Main/canvas.
 *
 * Usage (trên server backend):
 *   node scripts/seed-phase4-pages.js
 *   node scripts/seed-phase4-pages.js --page=market
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { loadConfig } = require('../src/config');
const { initPool, closePool } = require('../src/core/database/connection');
const service = require('../src/modules/widget-publish/widget-publish.service');
const { legacyRuntimeFor, legacyCssFor } = require('../src/modules/widget-publish/seed/legacy-runtime-map');

const REPO_ROOT = path.join(__dirname, '..', '..');
const DEFAULT_COMPOSITION = path.join(REPO_ROOT, 'Admin_Design_system', 'data', 'page-composition.json');
const BUNDLED_COMPOSITION = path.join(__dirname, 'data', 'page-composition.json');

const FLOW_SECTION_BY_ID = {
  'WGT-FLW-SUBJ-STOCK': 'sidebar',
  'WGT-FLW-SUBJ-SECTOR': 'sidebar',
  'WGT-FLW-STAT_STOCK': 'basic',
  'WGT-FLW-STAT_SECTOR': 'advanced',
  'WGT-FLW-STAT_HST': 'advanced',
  'WGT-FLW-STAT_STORY': 'advanced',
  'WGT-FLW-EX_TM_IN': 'exclusive',
  'WGT-FLW-EX_TM_SECTOR_IN': 'exclusive',
  'WGT-FLW-EX_TM_HST_IN': 'exclusive',
  'WGT-FLW-EX_TM_STORY_IN': 'exclusive'
};

const FLOW_CONFIG_BY_ID = {
  'WGT-FLW-SUBJ-STOCK': { scope: 'stock' },
  'WGT-FLW-SUBJ-SECTOR': { scope: 'sector' }
};

const WGT_BLOCKS = {
  'WGT-MKT-001': ['BLK-MKT-OVERVIEW', 'BLK-COM-OVERVIEW'],
  'WGT-MKT-002': ['BLK-MKT-BREADTH', 'BLK-COM-BREADTH'],
  'WGT-MKT-004': ['BLK-MKT-HEAT-SECTOR'],
  'WGT-MKT-005': ['BLK-MKT-HEAT-FAMILY'],
  'WGT-MKT-006': ['BLK-MKT-HEAT-CHUDE'],
  'WGT-PRF-001': ['BLK-PRF-CARD'],
  'WGT-PRF-002': ['BLK-PRF-PLAN'],
  'WGT-FLW-SUBJ-STOCK': ['BLK-FLW-NET-STOCK'],
  'WGT-FLW-SUBJ-SECTOR': ['BLK-FLW-NET-SECTOR'],
  'WGT-FLW-STAT_STOCK': ['BLK-FLW-SCORE-BASIC'],
  'WGT-FLW-STAT_SECTOR': ['BLK-FLW-SCORE-ADV'],
  'WGT-FLW-STAT_HST': ['BLK-FLW-SCORE-ADV'],
  'WGT-FLW-STAT_STORY': ['BLK-FLW-SCORE-ADV'],
  'WGT-FLW-EX_TM_IN': ['BLK-FLW-SCORE-EX'],
  'WGT-FLW-EX_TM_SECTOR_IN': ['BLK-FLW-SCORE-EX'],
  'WGT-FLW-EX_TM_HST_IN': ['BLK-FLW-SCORE-EX'],
  'WGT-FLW-EX_TM_STORY_IN': ['BLK-FLW-SCORE-EX']
};

function parseArgs() {
  const pageArg = process.argv.find(function (a) { return a.indexOf('--page=') === 0; });
  return {
    pageKey: pageArg ? pageArg.split('=')[1].trim().toLowerCase() : null
  };
}

function resolveCompositionPath() {
  if (fs.existsSync(BUNDLED_COMPOSITION)) return BUNDLED_COMPOSITION;
  if (fs.existsSync(DEFAULT_COMPOSITION)) return DEFAULT_COMPOSITION;
  throw new Error('Không tìm thấy page-composition.json');
}

function widgetDraftFromPlacement(w) {
  const rt = legacyRuntimeFor(w.id);
  const css = (Array.isArray(w.css) && w.css.length)
    ? w.css.slice()
    : (rt ? legacyCssFor(rt.renderer) : []);
  return {
    id: w.id,
    title: w.title || w.id,
    description: w.description || '',
    template: w.template || 'TMP-LEGACY',
    blocks: WGT_BLOCKS[w.id] || [],
    minTier: 'free',
    css: css,
    metadata: { config: w.config || {} }
  };
}

function normalizeFlowPage(pageData) {
  const widgets = (pageData.widgets || []).map(function (w) {
    const section = FLOW_SECTION_BY_ID[w.id] || w.section || 'main';
    const config = Object.assign({}, w.config || {}, FLOW_CONFIG_BY_ID[w.id] || {});
    return Object.assign({}, w, { section: section, config: config });
  });
  return Object.assign({}, pageData, {
    sections: [
      { key: 'sidebar', label: 'Sidebar dòng tiền', visible: true, layout: null },
      { key: 'basic', label: 'Thống kê cơ bản', visible: true, layout: 'grid-12' },
      { key: 'advanced', label: 'Thống kê nâng cao', visible: true, layout: 'grid-12' },
      { key: 'exclusive', label: 'Độc quyền', visible: true, layout: 'grid-12' }
    ],
    widgets: widgets
  });
}

/** Dashboard Phase 4: chỉ sidebar Admin widgets — không Main/canvas. */
function normalizeDashboardPage(pageData) {
  const widgets = (pageData.widgets || []).filter(function (w) {
    return w && w.section === 'sidebar';
  });
  return Object.assign({}, pageData, {
    title: '',
    intro: '',
    sections: [
      { key: 'sidebar', label: 'Thông tin cá nhân', visible: true, layout: null },
      { key: 'main', label: 'Bảng tổng quan', visible: true, layout: 'stack' }
    ],
    widgets: widgets
  });
}

function pageDraftFromComposition(pageKey, pageData) {
  const placements = (pageData.widgets || []).map(function (w) {
    return {
      widgetId: w.id,
      section: w.section,
      position: w.position,
      span: w.span,
      enabled: w.enabled !== false,
      locked: !!w.locked,
      userCanOverride: !!w.userCanOverride,
      config: w.config || {}
    };
  });
  return {
    page: pageKey,
    path: pageData.path || null,
    title: pageData.title || '',
    intro: pageData.intro || '',
    documentTitle: pageData.documentTitle || '',
    sections: pageData.sections || [],
    placements: placements
  };
}

async function publishOne(pageKey, composition) {
  let pageData = composition.pages && composition.pages[pageKey];
  if (!pageData) throw new Error('Không tìm thấy trang: ' + pageKey);

  if (pageKey === 'flow') pageData = normalizeFlowPage(pageData);
  if (pageKey === 'dashboard') pageData = normalizeDashboardPage(pageData);

  const pageDraft = pageDraftFromComposition(pageKey, pageData);
  const widgetDrafts = {};
  (pageData.widgets || []).forEach(function (w) {
    widgetDrafts[w.id] = widgetDraftFromPlacement(w);
  });

  console.log('Publishing page:', pageKey, 'widgets:', Object.keys(widgetDrafts).join(', ') || '(none)');
  const result = await service.publishPageDraft(pageDraft, widgetDrafts, 'seed-phase4-pages');
  console.log('OK', pageKey, 'v' + result.page.version, 'etag', result.page.publishMeta.etag);
  return result;
}

async function main() {
  const args = parseArgs();
  const compositionPath = resolveCompositionPath();
  const composition = JSON.parse(fs.readFileSync(compositionPath, 'utf8'));
  const pages = args.pageKey
    ? [args.pageKey]
    : ['market', 'flow', 'dashboard'];

  const config = loadConfig();
  initPool(config);

  for (var i = 0; i < pages.length; i++) {
    await publishOne(pages[i], composition);
  }

  await closePool();
  console.log('Phase 4 seed done.');
}

main().catch(function (err) {
  console.error(err.message || err);
  process.exit(1);
});
