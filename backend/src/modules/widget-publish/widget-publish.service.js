'use strict';

const pipeline = require('./pipeline/publish-pipeline');
const store = require('./artifact-store');
const { buildPageResponse } = require('./contracts/page-published.contract');

async function publishWidgetDraft(draft, placement, actor) {
  const version = await store.nextWidgetVersion(draft.id);
  const { artifact } = pipeline.buildWidgetPublished(draft, version, placement);
  await store.saveWidgetPublished(artifact, actor);
  return artifact;
}

async function publishPageDraft(draft, widgetDraftsById, actor) {
  const widgetArtifacts = [];
  const placementById = {};
  (draft.placements || []).forEach(function (p) {
    const wid = p.widgetId || p.id;
    if (wid) placementById[wid] = p;
  });

  for (const wid of Object.keys(widgetDraftsById)) {
    const wDraft = widgetDraftsById[wid];
    const placement = placementById[wid] || null;
    const wArt = await publishWidgetDraft(wDraft, placement, actor);
    widgetArtifacts.push(wArt);
  }

  const version = await store.nextPageVersion(draft.page);
  const { artifact } = pipeline.buildPagePublished(draft, version, widgetArtifacts);
  await store.savePagePublished(artifact, actor);
  return { page: artifact, widgets: widgetArtifacts };
}

async function getPagePublishedForRuntime(pageKey, opts) {
  opts = opts || {};
  const row = await store.getCurrentPage(pageKey);
  if (!row) return null;

  const canonical = row.artifact;
  let embedded = null;
  if (opts.embed !== false) {
    embedded = [];
    for (const ref of canonical.widgetRefs || []) {
      const w = ref.version
        ? await store.getWidgetByVersion(ref.widgetId, ref.version)
        : await store.getCurrentWidget(ref.widgetId);
      if (w && w.artifact) embedded.push(w.artifact);
    }
  }

  const response = buildPageResponse(canonical, embedded);
  return {
    body: response,
    etag: row.etag,
    version: row.version,
    publishedAt: row.publishedAt
  };
}

async function getWidgetPublished(widgetId) {
  const row = await store.getCurrentWidget(widgetId);
  if (!row) return null;
  return {
    body: row.artifact,
    etag: row.etag,
    version: row.version,
    publishedAt: row.publishedAt
  };
}

module.exports = {
  publishWidgetDraft,
  publishPageDraft,
  getPagePublishedForRuntime,
  getWidgetPublished
};
