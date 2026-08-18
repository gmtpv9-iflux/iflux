/* ADM-SYS-003 — RETIRED Phase C (OD-C3)
 *
 * CASES + MERGE_TAGS runtime đã chuyển sang:
 * - SoT seed: backend/.../notification-platform-seed-data.js
 * - Admin list: GET /api/admin/notifications/types
 *
 * File giữ lại đến Phase D (User Web catalog retire).
 * Không load file này trên ADM-SYS-003 announcements.html.
 */
(function (global) {
  'use strict';

  global.IfluxSystemNotificationCatalog = {
    MERGE_TAGS: [],
    CASES: [],
    mergeTagCount: 0,
    caseCount: 0,
    getCaseById: function () { return null; },
    listGroups: function () { return []; }
  };
})(window);
