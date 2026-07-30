'use strict';

/**
 * Wave 4 soft gate — CI / smoke:
 * Mọi Template trong danh sách Admin catalog bắt buộc có Implementation(Web) Ready.
 * Chưa cắt legacy / lazyModule (tránh phá Placement cũ).
 *
 * Chạy: node backend/src/modules/widget-publish/scripts/gate-web-implementations.js
 */

const path = require('path');
const fs = require('fs');
const { WEB_IMPLEMENTATIONS, webImplementationStatus } =
  require('../seed/runtime-implementations');

const CATALOG_IDS = [
  'TMP-SUMMARY',
  'TMP-HEATMAP',
  'TMP-TREND-LINE',
  'TMP-NET-SUBJECT',
  'TMP-RANK-PERF',
  'TMP-FLOW-RANK-DUO',
  'TMP-FLOW-RANK-SIGNAL',
  'TMP-FLOW-SUMMARY',
  'TMP-COMMUNITY-LIST',
  'TMP-COMMUNITY-STORY-TOP',
  'TMP-COLLECTION',
  'TMP-BREADTH',
  'TMP-DIVERGING-BARS',
  'TMP-ZONE-POSITION',
  'TMP-SR-HISTORY'
];

function main() {
  const missing = [];
  CATALOG_IDS.forEach(function (id) {
    if (webImplementationStatus(id) !== 'ready') missing.push(id);
  });
  if (missing.length) {
    console.error('GATE FAIL — Template thiếu Implementation(Web) Ready:');
    missing.forEach(function (id) { console.error(' -', id); });
    process.exit(1);
  }
  console.log('GATE OK —', CATALOG_IDS.length, 'Template Admin có Web Ready.');
  console.log('WEB_IMPLEMENTATIONS keys:', Object.keys(WEB_IMPLEMENTATIONS).length);
  /* optional: ensure ESM file exists when running from monorepo root */
  const root = path.resolve(__dirname, '../../../../../../');
  const widgetsRoot = path.join(root, 'User_Web/iflux-web-ui/widgets');
  if (fs.existsSync(widgetsRoot)) {
    var fileMissing = [];
    CATALOG_IDS.forEach(function (id) {
      var impl = WEB_IMPLEMENTATIONS[id];
      if (!impl || !impl.module) return;
      var m = String(impl.module).split('?')[0];
      var rel = m.replace(/^\/?User_Web\/iflux-web-ui\/widgets\//, '');
      var full = path.join(widgetsRoot, rel);
      if (!fs.existsSync(full)) fileMissing.push(id + ' → ' + full);
    });
    if (fileMissing.length) {
      console.error('GATE FAIL — thiếu file ESM:');
      fileMissing.forEach(function (l) { console.error(' -', l); });
      process.exit(1);
    }
    console.log('GATE OK — file ESM tồn tại cho catalog.');
  }
}

main();
