#!/usr/bin/env node
'use strict';

/**
 * Seed PagePublished + WidgetPublished qua Publish Pipeline (pilot: community).
 * Nguồn: Admin_Design_system/data/page-composition.json + entitlement map L4.
 *
 * Usage:
 *   node backend/scripts/seed-widget-publish-v1.js
 *   node backend/scripts/seed-widget-publish-v1.js --page=market
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { loadConfig } = require('../src/config');
const { initPool, closePool } = require('../src/core/database/connection');
const service = require('../src/modules/widget-publish/widget-publish.service');

const REPO_ROOT = path.join(__dirname, '..', '..');
const DEFAULT_COMPOSITION = path.join(REPO_ROOT, 'Admin_Design_system', 'data', 'page-composition.json');
const BUNDLED_COMPOSITION = path.join(__dirname, 'data', 'page-composition.json');

function parseArgs() {
  const pageArg = process.argv.find(function (a) { return a.indexOf('--page=') === 0; });
  const compArg = process.argv.find(function (a) { return a.indexOf('--composition=') === 0; });
  return {
    pageKey: pageArg ? pageArg.split('=')[1].trim().toLowerCase() : 'community',
    compositionPath: compArg ? compArg.split('=').slice(1).join('=') : null
  };
}

function resolveCompositionPath(explicit) {
  if (explicit && fs.existsSync(explicit)) return explicit;
  if (fs.existsSync(BUNDLED_COMPOSITION)) return BUNDLED_COMPOSITION;
  if (fs.existsSync(DEFAULT_COMPOSITION)) return DEFAULT_COMPOSITION;
  throw new Error('Không tìm thấy page-composition.json');
}
const WGT_BLOCKS = {
  'WGT-MKT-001': ['BLK-MKT-OVERVIEW', 'BLK-COM-OVERVIEW'],
  'WGT-MKT-002': ['BLK-MKT-BREADTH', 'BLK-COM-BREADTH'],
  'WGT-MKT-004': ['BLK-MKT-HEAT-SECTOR'],
  'WGT-MKT-005': ['BLK-MKT-HEAT-FAMILY'],
  'WGT-MKT-006': ['BLK-MKT-HEAT-CHUDE'],
  'WGT-COM-001': ['BLK-COM-TRENDING'],
  'WGT-COM-002': ['BLK-COM-ACTIVE'],
  'WGT-COM-CHUDE-TOP': ['BLK-COM-CHUDE-TOP']
};

const WGT_TIER = {
  'WGT-COM-004': 'elite'
};

function parsePageArg() {
  return parseArgs().pageKey;
}

/** Khớp WGT_DEPLOY / WGT_TIER trong platform-layers-widgets.js (seed-only). */

function loadComposition(compositionPath) {
  const raw = fs.readFileSync(compositionPath, 'utf8');
  return JSON.parse(raw);
}

function widgetDraftFromPlacement(w) {
  return {
    id: w.id,
    title: w.title || w.id,
    description: w.description || '',
    template: w.template || 'TMP-LEGACY',
    blocks: WGT_BLOCKS[w.id] || [],
    minTier: WGT_TIER[w.id] || 'free',
    css: Array.isArray(w.css) ? w.css.slice() : [],
    metadata: { config: w.config || {} }
  };
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

async function main() {
  const args = parseArgs();
  const pageKey = args.pageKey;
  const compositionPath = resolveCompositionPath(args.compositionPath);
  const composition = loadComposition(compositionPath);
  const pageData = composition.pages && composition.pages[pageKey];
  if (!pageData) {
    throw new Error('Không tìm thấy trang trong page-composition: ' + pageKey);
  }

  const config = loadConfig();
  initPool(config);

  const pageDraft = pageDraftFromComposition(pageKey, pageData);
  const widgetDrafts = {};
  (pageData.widgets || []).forEach(function (w) {
    widgetDrafts[w.id] = widgetDraftFromPlacement(w);
  });

  console.log('Publishing page:', pageKey, 'widgets:', Object.keys(widgetDrafts).join(', '));
  const result = await service.publishPageDraft(pageDraft, widgetDrafts, 'seed-widget-publish-v1');
  console.log('OK page version', result.page.version, 'etag', result.page.publishMeta.etag);
  console.log('Widgets published:', result.widgets.map(function (w) { return w.id + '@v' + w.version; }).join(', '));

  await closePool();
}

main().catch(function (err) {
  console.error(err.message || err);
  process.exit(1);
});
