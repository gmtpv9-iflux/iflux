'use strict';

const crypto = require('crypto');
const store = require('./artifact-store');

/**
 * Placement Widget Index — read-only projection from PagePublished artifacts.
 * Parity: page-settings-catalog.listEnabledPlacementWidgets (enabled + L4 intersect).
 * L4 set = widget_current_versions ∪ widgetIds referenced in published placements.
 */
async function buildPlacementWidgetIndex() {
  const pages = await store.listCurrentPages();
  const dbL4Ids = await store.listCurrentWidgetIds();
  const l4 = new Set(dbL4Ids);

  pages.forEach(function (row) {
    const art = row.artifact || {};
    (art.placements || []).forEach(function (p) {
      if (p && p.widgetId) l4.add(p.widgetId);
    });
  });

  const byPage = {};
  const allSet = new Set();
  let latestPublishedAt = null;

  pages.forEach(function (row) {
    const pk = row.pageKey;
    const art = row.artifact || {};
    const ids = [];
    (art.placements || []).forEach(function (p) {
      if (!p || !p.widgetId) return;
      if (p.enabled === false) return;
      if (!l4.has(p.widgetId)) return;
      ids.push(p.widgetId);
      allSet.add(p.widgetId);
    });
    byPage[pk] = [...new Set(ids)].sort();
    if (row.publishedAt) {
      const t = new Date(row.publishedAt).getTime();
      if (!latestPublishedAt || t > latestPublishedAt) latestPublishedAt = t;
    }
  });

  const allEnabled = [...allSet].sort();
  const payload = {
    updatedAt: latestPublishedAt ? new Date(latestPublishedAt).toISOString() : new Date().toISOString(),
    byPage: byPage,
    allEnabled: allEnabled
  };
  const etag = 'sha256:' + crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');
  payload.etag = etag;
  return payload;
}

module.exports = { buildPlacementWidgetIndex };
