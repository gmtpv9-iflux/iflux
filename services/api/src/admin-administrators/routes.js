'use strict';

/**
 * Staging 2 — ADM-15 HTTP
 * Mount: /api/admin/administrators
 */

const express = require('express');
const { z } = require('zod');
const { AppError } = require('../errors');
const { authenticateAdmin } = require('../admin-auth/token');
const { requirePermission, loadAccess } = require('../admin-rbac/permission');
const service = require('./service');

const idSchema = z.string().uuid();

const createAccountSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email(),
  password: z.string().min(8),
  roleIds: z.array(z.string().uuid()).optional()
});

const patchAccountSchema = z
  .object({
    name: z.string().min(1).max(255).optional(),
    email: z.string().email().optional()
  })
  .strict();

const statusSchema = z.object({
  status: z.enum(['active', 'disabled'])
});

const passwordSchema = z.object({
  password: z.string().min(8)
});

const roleIdsSchema = z.object({
  roleIds: z.array(z.string().uuid())
});

const createRoleSchema = z.object({
  code: z.string().min(1).max(50).regex(/^[a-z0-9_]+$/),
  name: z.string().min(1).max(100),
  description: z.string().max(2000).optional().nullable()
});

const patchRoleSchema = z
  .object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(2000).optional().nullable()
  })
  .strict();

const keysSchema = z.object({
  keys: z.array(z.string().min(1))
});

const profilePatchSchema = z
  .object({
    name: z.string().min(1).max(255).optional(),
    currentPassword: z.string().min(1).optional(),
    password: z.string().min(8).optional()
  })
  .strict();

function parse(schema, value) {
  const parsed = schema.safeParse(value == null ? {} : value);
  if (!parsed.success) throw new AppError('VALIDATION_ERROR', 'Dữ liệu không hợp lệ.', 400);
  return parsed.data;
}

function clientIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  if (fwd) return String(fwd).split(',')[0].trim();
  return req.ip || '';
}

function actor(req) {
  return {
    adminId: req.admin.id,
    adminEmail: req.admin.email,
    ip: clientIp(req)
  };
}

function requireStatusKey(config) {
  return function (req, res, next) {
    const status = req.body && req.body.status;
    const key =
      status === 'disabled'
        ? 'admin.accounts.disable'
        : status === 'active'
          ? 'admin.accounts.enable'
          : null;
    if (!key) {
      return next(new AppError('VALIDATION_ERROR', 'Dữ liệu không hợp lệ.', 400));
    }
    return requirePermission(config, key)(req, res, next);
  };
}

function createAdminAdministratorsRouter(config) {
  const router = express.Router();

  router.get('/accounts', requirePermission(config, 'admin.accounts.view'), async function (req, res, next) {
    try {
      res.json({ accounts: await service.listAccounts() });
    } catch (err) {
      next(err);
    }
  });

  router.post('/accounts', requirePermission(config, 'admin.accounts.create'), async function (req, res, next) {
    try {
      const body = parse(createAccountSchema, req.body);
      res.status(201).json({ account: await service.createAccount(body, actor(req)) });
    } catch (err) {
      next(err);
    }
  });

  router.get('/accounts/:id', requirePermission(config, 'admin.accounts.view'), async function (req, res, next) {
    try {
      const account = await service.getAccount(parse(idSchema, req.params.id));
      if (!account) throw new AppError('NOT_FOUND', 'Không tìm thấy tài khoản.', 404);
      res.json({ account: account });
    } catch (err) {
      next(err);
    }
  });

  router.patch('/accounts/:id', requirePermission(config, 'admin.accounts.edit'), async function (req, res, next) {
    try {
      const account = await service.updateAccount(
        parse(idSchema, req.params.id),
        parse(patchAccountSchema, req.body),
        actor(req)
      );
      if (!account) throw new AppError('NOT_FOUND', 'Không tìm thấy tài khoản.', 404);
      res.json({ account: account });
    } catch (err) {
      next(err);
    }
  });

  router.delete('/accounts/:id', requirePermission(config, 'admin.accounts.delete'), async function (req, res, next) {
    try {
      const result = await service.deleteAccount(parse(idSchema, req.params.id), actor(req));
      if (!result) throw new AppError('NOT_FOUND', 'Không tìm thấy tài khoản.', 404);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  router.patch('/accounts/:id/status', requireStatusKey(config), async function (req, res, next) {
    try {
      const body = parse(statusSchema, req.body);
      const account = await service.setAccountStatus(
        parse(idSchema, req.params.id),
        body.status,
        actor(req)
      );
      if (!account) throw new AppError('NOT_FOUND', 'Không tìm thấy tài khoản.', 404);
      res.json({ account: account });
    } catch (err) {
      next(err);
    }
  });

  router.post(
    '/accounts/:id/reset-password',
    requirePermission(config, 'admin.accounts.reset_password'),
    async function (req, res, next) {
      try {
        const result = await service.resetPassword(
          parse(idSchema, req.params.id),
          parse(passwordSchema, req.body).password,
          actor(req)
        );
        if (!result) throw new AppError('NOT_FOUND', 'Không tìm thấy tài khoản.', 404);
        res.json(result);
      } catch (err) {
        next(err);
      }
    }
  );

  router.put(
    '/accounts/:id/roles',
    requirePermission(config, 'admin.accounts.assign_role'),
    async function (req, res, next) {
      try {
        const account = await service.assignAccountRoles(
          parse(idSchema, req.params.id),
          parse(roleIdsSchema, req.body).roleIds,
          actor(req)
        );
        if (!account) throw new AppError('NOT_FOUND', 'Không tìm thấy tài khoản.', 404);
        res.json({ account: account });
      } catch (err) {
        next(err);
      }
    }
  );

  router.get('/roles', requirePermission(config, 'admin.roles.view'), async function (req, res, next) {
    try {
      res.json({ roles: await service.listRoles() });
    } catch (err) {
      next(err);
    }
  });

  router.post('/roles', requirePermission(config, 'admin.roles.create'), async function (req, res, next) {
    try {
      res.status(201).json({ role: await service.createRole(parse(createRoleSchema, req.body), actor(req)) });
    } catch (err) {
      next(err);
    }
  });

  router.patch('/roles/:id', requirePermission(config, 'admin.roles.edit'), async function (req, res, next) {
    try {
      const role = await service.updateRole(
        parse(idSchema, req.params.id),
        parse(patchRoleSchema, req.body),
        actor(req)
      );
      if (!role) throw new AppError('NOT_FOUND', 'Không tìm thấy vai trò.', 404);
      res.json({ role: role });
    } catch (err) {
      next(err);
    }
  });

  router.delete('/roles/:id', requirePermission(config, 'admin.roles.delete'), async function (req, res, next) {
    try {
      const result = await service.deleteRole(parse(idSchema, req.params.id), actor(req));
      if (!result) throw new AppError('NOT_FOUND', 'Không tìm thấy vai trò.', 404);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  router.post('/roles/:id/clone', requirePermission(config, 'admin.roles.clone'), async function (req, res, next) {
    try {
      const role = await service.cloneRole(parse(idSchema, req.params.id), actor(req));
      if (!role) throw new AppError('NOT_FOUND', 'Không tìm thấy vai trò.', 404);
      res.status(201).json({ role: role });
    } catch (err) {
      next(err);
    }
  });

  router.get('/permissions', requirePermission(config, 'admin.permissions.view'), async function (req, res, next) {
    try {
      res.json({ permissions: service.catalog() });
    } catch (err) {
      next(err);
    }
  });

  router.get(
    '/permissions/matrix',
    requirePermission(config, 'admin.permissions.view'),
    async function (req, res, next) {
      try {
        const roleId = parse(idSchema, req.query.roleId);
        const matrix = await service.getMatrix(roleId);
        if (!matrix) throw new AppError('NOT_FOUND', 'Không tìm thấy vai trò.', 404);
        res.json(matrix);
      } catch (err) {
        next(err);
      }
    }
  );

  router.put(
    '/permissions/roles/:id',
    requirePermission(config, 'admin.permissions.assign'),
    async function (req, res, next) {
      try {
        const matrix = await service.setRolePermissions(
          parse(idSchema, req.params.id),
          parse(keysSchema, req.body).keys,
          actor(req)
        );
        if (!matrix) throw new AppError('NOT_FOUND', 'Không tìm thấy vai trò.', 404);
        res.json(matrix);
      } catch (err) {
        next(err);
      }
    }
  );

  router.get('/profile', authenticateAdmin(config), async function (req, res, next) {
    try {
      const profile = await service.getProfile(req.admin.email);
      if (!profile) throw new AppError('NOT_FOUND', 'Không tìm thấy hồ sơ.', 404);
      res.json({ profile: profile });
    } catch (err) {
      next(err);
    }
  });

  router.patch('/profile', authenticateAdmin(config), async function (req, res, next) {
    try {
      const patch = parse(profilePatchSchema, req.body);
      if (patch.password && !patch.currentPassword) {
        throw new AppError('VALIDATION_ERROR', 'Dữ liệu không hợp lệ.', 400);
      }
      const access = await loadAccess(req.admin.email);
      if (!access || access.status !== 'active') {
        throw new AppError('FORBIDDEN', 'Tài khoản quản trị không còn hiệu lực.', 403);
      }
      req.admin.id = access.id;
      const profile = await service.updateProfile(req.admin.email, patch, actor(req));
      if (!profile) throw new AppError('NOT_FOUND', 'Không tìm thấy hồ sơ.', 404);
      res.json({ profile: profile });
    } catch (err) {
      next(err);
    }
  });

  return router;
}

module.exports = { createAdminAdministratorsRouter };
