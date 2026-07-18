'use strict';

/**
 * SoT — Artifact Lifecycle (Widget/Page published artifacts)
 * Draft → Validated → Resolved → Frozen → Published → Deprecated → Archived
 */

const LIFECYCLE = Object.freeze({
  DRAFT: 'draft',
  VALIDATED: 'validated',
  RESOLVED: 'resolved',
  FROZEN: 'frozen',
  PUBLISHED: 'published',
  DEPRECATED: 'deprecated',
  ARCHIVED: 'archived'
});

const TRANSITIONS = Object.freeze({
  [LIFECYCLE.DRAFT]: [LIFECYCLE.VALIDATED],
  [LIFECYCLE.VALIDATED]: [LIFECYCLE.RESOLVED, LIFECYCLE.DRAFT],
  [LIFECYCLE.RESOLVED]: [LIFECYCLE.FROZEN, LIFECYCLE.VALIDATED],
  [LIFECYCLE.FROZEN]: [LIFECYCLE.PUBLISHED, LIFECYCLE.RESOLVED],
  [LIFECYCLE.PUBLISHED]: [LIFECYCLE.DEPRECATED],
  [LIFECYCLE.DEPRECATED]: [LIFECYCLE.ARCHIVED, LIFECYCLE.PUBLISHED],
  [LIFECYCLE.ARCHIVED]: []
});

function canTransition(from, to) {
  if (!from || !to) return false;
  const allowed = TRANSITIONS[from];
  return Array.isArray(allowed) && allowed.indexOf(to) >= 0;
}

function assertTransition(from, to) {
  if (!canTransition(from, to)) {
    const err = new Error('Chuyển trạng thái artifact không hợp lệ: ' + from + ' → ' + to);
    err.statusCode = 400;
    throw err;
  }
}

module.exports = { LIFECYCLE, TRANSITIONS, canTransition, assertTransition };
