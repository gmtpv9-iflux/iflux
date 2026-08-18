'use strict';

const { LIFECYCLE, assertTransition } = require('../contracts/artifact-lifecycle');
const { validateWidgetPublished } = require('../contracts/widget-published.contract');
const { validatePageCanonical } = require('../contracts/page-published.contract');
const { checksumArtifact, etagFromChecksum } = require('../lib/artifact-hash');
const { toWidgetRef } = require('../contracts/widget-published.contract');
const resolvers = require('./resolvers');

function validateWidgetDraft(draft) {
  const errors = [];
  if (!draft || !draft.id) errors.push('draft.id bắt buộc');
  if (!draft.title) errors.push('draft.title bắt buộc');
  return errors;
}

function validatePageDraft(draft) {
  const errors = [];
  if (!draft || !draft.page) errors.push('draft.page bắt buộc');
  if (!Array.isArray(draft.placements)) errors.push('draft.placements bắt buộc');
  if (!Array.isArray(draft.sections)) errors.push('draft.sections bắt buộc');
  return errors;
}

function buildWidgetPublished(draft, version, placement) {
  let state = LIFECYCLE.DRAFT;
  const errs = validateWidgetDraft(draft);
  if (errs.length) {
    const e = new Error('Validate widget draft: ' + errs.join('; '));
    e.statusCode = 400;
    throw e;
  }
  assertTransition(state, LIFECYCLE.VALIDATED);
  state = LIFECYCLE.VALIDATED;

  const tpl = resolvers.resolveTemplate(draft);
  const layout = resolvers.resolveLayout(draft, placement);
  const perm = resolvers.resolvePermission(draft);
  const cap = resolvers.resolveCapability(draft);
  assertTransition(state, LIFECYCLE.RESOLVED);
  state = LIFECYCLE.RESOLVED;

  const dep = resolvers.resolveDependency(tpl.display, draft);
  const body = {
    id: draft.id,
    version: version,
    content: {
      title: draft.title,
      description: draft.description || '',
      problem: draft.problem || '',
      dataDefinition: draft.dataDefinition || draft.outputs || [],
      demoData: draft.demoData || {},
      metadata: draft.metadata || {},
      insightMetadata: draft.insightMetadata || {},
      shareMetadata: draft.shareMetadata || {}
    },
    display: tpl.display,
    layout: layout.layout,
    dependencies: dep.dependencies,
    permission: perm.permission,
    capabilities: cap.capabilities
  };

  assertTransition(state, LIFECYCLE.FROZEN);
  state = LIFECYCLE.FROZEN;
  const checksum = checksumArtifact(body);
  body.publishMeta = {
    publishedAt: new Date().toISOString(),
    etag: etagFromChecksum(checksum),
    checksum: checksum,
    lifecycle: LIFECYCLE.FROZEN
  };

  const valErrs = validateWidgetPublished(body);
  if (valErrs.length) {
    const e = new Error('Freeze widget: ' + valErrs.join('; '));
    e.statusCode = 400;
    throw e;
  }
  assertTransition(state, LIFECYCLE.PUBLISHED);
  body.publishMeta.lifecycle = LIFECYCLE.PUBLISHED;
  return { artifact: body, lifecycle: LIFECYCLE.PUBLISHED };
}

function buildPagePublished(draft, version, widgetArtifacts) {
  let state = LIFECYCLE.DRAFT;
  const errs = validatePageDraft(draft);
  if (errs.length) {
    const e = new Error('Validate page draft: ' + errs.join('; '));
    e.statusCode = 400;
    throw e;
  }
  assertTransition(state, LIFECYCLE.VALIDATED);
  state = LIFECYCLE.VALIDATED;

  const widgetRefs = (widgetArtifacts || []).map(toWidgetRef).filter(Boolean);
  const placements = (draft.placements || []).map(function (p) {
    return {
      widgetId: p.widgetId || p.id,
      section: p.section,
      position: p.position,
      span: p.span,
      enabled: p.enabled !== false,
      locked: !!p.locked,
      userCanOverride: !!p.userCanOverride,
      config: p.config || {}
    };
  });

  assertTransition(state, LIFECYCLE.RESOLVED);
  state = LIFECYCLE.RESOLVED;

  const body = {
    page: draft.page,
    version: version,
    path: draft.path || null,
    title: draft.title || '',
    intro: draft.intro || '',
    documentTitle: draft.documentTitle || '',
    sections: draft.sections || [],
    placements: placements,
    widgetRefs: widgetRefs
  };

  assertTransition(state, LIFECYCLE.FROZEN);
  state = LIFECYCLE.FROZEN;
  const checksum = checksumArtifact(body);
  body.publishMeta = {
    publishedAt: new Date().toISOString(),
    etag: etagFromChecksum(checksum),
    checksum: checksum,
    lifecycle: LIFECYCLE.FROZEN
  };

  const valErrs = validatePageCanonical(body);
  if (valErrs.length) {
    const e = new Error('Freeze page: ' + valErrs.join('; '));
    e.statusCode = 400;
    throw e;
  }
  assertTransition(state, LIFECYCLE.PUBLISHED);
  body.publishMeta.lifecycle = LIFECYCLE.PUBLISHED;
  return { artifact: body, lifecycle: LIFECYCLE.PUBLISHED, widgetArtifacts: widgetArtifacts || [] };
}

module.exports = {
  buildWidgetPublished,
  buildPagePublished,
  validateWidgetDraft,
  validatePageDraft
};
