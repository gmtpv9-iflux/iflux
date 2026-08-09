'use strict';

const express = require('express');
const { z } = require('zod');
const { validate } = require('../../middleware/validate');
const { success } = require('../../shared/response/api-response');
const { requireAdminPermission } = require('../admin-rbac/admin-perm-guard');
const svc = require('./market-mdm.service');

function createMarketMdmRouter(deps) {
  deps = deps || {};
  const router = express.Router();
  const config = deps.config || {};
  const perm = function () {
    return requireAdminPermission(deps, Array.prototype.slice.call(arguments));
  };

  router.get('/sources', perm('data.sources.view'), async (req, res, next) => {
    try {
      const sources = await svc.listSourcesWithAuthority();
      return success(res, { sources: sources, total: sources.length });
    } catch (err) {
      next(err);
    }
  });

  router.get('/field-authority', perm('data.sources.view'), async (req, res, next) => {
    try {
      return success(res, await svc.fieldAuthorityMatrix());
    } catch (err) {
      next(err);
    }
  });

  /* BR-11.FA — set Current Source cho Entity×Field (external source_code only) */
  router.put(
    '/field-authority',
    perm('data.sources.edit'),
    validate(
      z.object({
        body: z.object({
          entity: z.string().default('stock'),
          field_key: z.string().min(1).max(80),
          source_code: z.string().min(1).max(80).optional(),
          source_id: z.string().uuid().optional(),
          trust_level: z.enum(['trusted', 'review_required', 'not_trusted', 'authoritative']).optional()
        })
      })
    ),
    async (req, res, next) => {
      try {
        const b = req.validated.body;
        let sourceCode = b.source_code;
        if (!sourceCode && b.source_id) {
          const sources = await svc.listSourcesWithAuthority();
          const hit = sources.filter(function (s) { return s.id === b.source_id; })[0];
          sourceCode = hit ? hit.code : null;
        }
        if (!sourceCode) {
          return res.status(400).json({
            error: { code: 'VALIDATION', message: 'source_code hoặc source_id bắt buộc' }
          });
        }
        const trust =
          b.trust_level === 'authoritative'
            ? 'trusted'
            : b.trust_level || 'trusted';
        const row = await svc.setCurrentFieldSource(b.entity, b.field_key, sourceCode, trust);
        return success(res, { item: row });
      } catch (err) {
        next(err);
      }
    }
  );

  /* BR-11.IMP — một nút Sync; không chọn Source; không ghi Master (Import≠Apply) */
  router.post('/imports/sync-all', perm('data.sources.execute'), async (req, res, next) => {
    try {
      const adminId = req.admin && req.admin.id ? req.admin.id : null;
      const actor =
        (req.admin && (req.admin.email || req.admin.id)) || 'system@admin-key';
      const out = await svc.runSyncAll(adminId, actor);
      return success(res, out, 201);
    } catch (err) {
      next(err);
    }
  });

  /* BR-11.APPLY — ghi Master + hoàn tất History/Audit */
  router.post(
    '/imports/apply',
    perm('data.sources.execute'),
    validate(
      z.object({
        body: z.object({
          import_ids: z.array(z.string().uuid()).min(1)
        })
      })
    ),
    async (req, res, next) => {
      try {
        const adminId = req.admin && req.admin.id ? req.admin.id : null;
        const actor =
          (req.admin && (req.admin.email || req.admin.id)) || 'system@admin-key';
        const out = await svc.applyImportBatch(req.validated.body.import_ids, adminId, actor);
        return success(res, out);
      } catch (err) {
        next(err);
      }
    }
  );

  router.post(
    '/conflicts/reject-batch',
    perm('data.sources.execute'),
    validate(
      z.object({
        body: z.object({
          ids: z.array(z.string().uuid()).min(1)
        })
      })
    ),
    async (req, res, next) => {
      try {
        const adminId = req.admin && req.admin.id ? req.admin.id : null;
        const actor =
          (req.admin && (req.admin.email || req.admin.id)) || 'system@admin-key';
        const out = await svc.rejectConflictsBatch(req.validated.body.ids, adminId, actor);
        return success(res, out);
      } catch (err) {
        next(err);
      }
    }
  );

  router.put(
    '/sources/:code/staging',
    perm('data.sources.edit'),
    validate(
      z.object({
        body: z.object({
          payload_text: z.string().max(2000000)
        })
      })
    ),
    async (req, res, next) => {
      try {
        const row = await svc.setSourceStaging(req.params.code, req.validated.body.payload_text);
        return success(res, { item: row });
      } catch (err) {
        next(err);
      }
    }
  );

  router.get('/sources/:code/staging', perm('data.sources.view'), async (req, res, next) => {
    try {
      return success(res, { item: await svc.getSourceStaging(req.params.code) });
    } catch (err) {
      next(err);
    }
  });

  router.get('/imports', perm('data.sources.view'), async (req, res, next) => {
    try {
      const completedOnly = String(req.query.completed || '') === '1';
      return success(res, {
        items: await svc.listImports(80, { completedOnly: completedOnly })
      });
    } catch (err) {
      next(err);
    }
  });

  router.get('/imports/:id/change-set', perm('data.sources.view'), async (req, res, next) => {
    try {
      return success(res, { items: await svc.listChangeSet(req.params.id) });
    } catch (err) {
      next(err);
    }
  });

  router.get('/audit', perm('data.sources.view'), async (req, res, next) => {
    try {
      return success(res, { items: await svc.listSotAudit(100) });
    } catch (err) {
      next(err);
    }
  });

  router.post(
    '/imports',
    perm('data.sources.execute'),
    validate(
      z.object({
        body: z.object({
          source_code: z.string().min(1).max(80),
          items: z
            .array(
              z.object({
                ticker: z.string().min(1),
                name: z.string().optional(),
                exchange: z.string().optional(),
                market_cap: z.union([z.number(), z.string()]).optional(),
                cap_group: z.string().optional(),
                sector_id: z.union([z.number(), z.string()]).optional(),
                ecosystem_id: z.union([z.number(), z.string()]).optional(),
                status: z.string().optional(),
                description: z.string().optional()
              })
            )
            .min(1)
        })
      })
    ),
    async (req, res, next) => {
      try {
        const adminId = req.admin && req.admin.id ? req.admin.id : null;
        const items = req.validated.body.items.map(function (it) {
          return {
            ticker: it.ticker,
            name: it.name,
            exchange: it.exchange,
            market_cap: it.market_cap != null ? Number(it.market_cap) : null,
            cap_group: it.cap_group,
            sector_id: it.sector_id,
            ecosystem_id: it.ecosystem_id,
            status: it.status,
            description: it.description
          };
        });
        const out = await svc.runImport(req.validated.body.source_code, items, adminId);
        return success(res, out, 201);
      } catch (err) {
        next(err);
      }
    }
  );

  router.post(
    '/imports/from-source',
    perm('data.sources.execute'),
    validate(
      z.object({
        body: z.object({
          source_code: z.string().min(1).max(80),
          csv_text: z.string().optional(),
          items: z
            .array(
              z.object({
                ticker: z.string().min(1),
                name: z.string().optional(),
                exchange: z.string().optional(),
                market_cap: z.union([z.number(), z.string()]).optional(),
                cap_group: z.string().optional()
              })
            )
            .optional()
        })
      })
    ),
    async (req, res, next) => {
      try {
        const adminId = req.admin && req.admin.id ? req.admin.id : null;
        const b = req.validated.body;
        const out = await svc.runImportFromSource(
          b.source_code,
          {
            config: config,
            csvText: b.csv_text,
            items: b.items
          },
          adminId
        );
        return success(res, out, out.failed ? 200 : 201);
      } catch (err) {
        next(err);
      }
    }
  );

  router.get('/conflicts', perm('data.sources.view'), async (req, res, next) => {
    try {
      let importIds = null;
      /* Query có `import_ids` (kể cả rỗng) = scope theo lần Import; không truyền = xem pending còn lại. */
      if (Object.prototype.hasOwnProperty.call(req.query, 'import_ids')) {
        importIds = String(req.query.import_ids || '')
          .split(',')
          .map(function (x) {
            return String(x || '').trim();
          })
          .filter(Boolean);
      }
      const items = await svc.listConflicts({
        state: req.query.state,
        source: req.query.source,
        import_ids: importIds,
        limit: req.query.limit
      });
      return success(res, { items: items, total: items.length });
    } catch (err) {
      next(err);
    }
  });

  async function decide(req, res, next, decision) {
    try {
      const adminId = req.admin && req.admin.id ? req.admin.id : null;
      const actor =
        (req.admin && (req.admin.email || req.admin.id)) || 'system@admin-key';
      const note = req.body && req.body.note != null ? String(req.body.note) : '';
      return success(res, await svc.resolveConflict(req.params.id, decision, adminId, note, actor));
    } catch (err) {
      next(err);
    }
  }

  router.post('/conflicts/:id/apply', perm('data.sources.execute'), function (req, res, next) {
    return decide(req, res, next, 'apply');
  });
  router.post('/conflicts/:id/reject', perm('data.sources.execute'), function (req, res, next) {
    return decide(req, res, next, 'reject');
  });
  router.post('/conflicts/:id/skip', perm('data.sources.execute'), function (req, res, next) {
    return decide(req, res, next, 'skip');
  });

  return router;
}

module.exports = { createMarketMdmRouter };
