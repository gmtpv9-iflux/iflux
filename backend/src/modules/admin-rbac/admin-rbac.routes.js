'use strict';

const express = require('express');
const rbac = require('./admin-rbac.service');
const { createRbacContext, requirePermission, requireAnyPermission } = require('./admin-rbac.middleware');

function ipOf(req) {
  return (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.ip || null;
}

function audit(req, action, targetType, targetId, detail) {
  return rbac.writeAudit({
    adminId: req.admin && req.admin.id,
    email: req.admin && req.admin.email,
    action, targetType, targetId, detail, ip: ipOf(req)
  });
}

function createAdminRbacRouter(deps) {
  deps = deps || {};
  const { config, auth } = deps;
  const router = express.Router();
  const guard = auth && auth.authenticateAdmin;
  const ctx = createRbacContext(config);

  // Mọi route đều cần xác thực admin + nạp ngữ cảnh quyền
  router.use(guard, ctx);

  /* ── Ngữ cảnh của chính mình ── */
  router.get('/me', (req, res) => {
    const set = req.admin._permSet || new Set();
    res.json({
      admin: {
        id: req.admin.id, email: req.admin.email, name: req.admin.name,
        isSuper: !!req.admin.isSuper, roles: req.admin.roles || [],
        permissions: Array.from(set)
      }
    });
  });

  /* Hồ sơ cá nhân — mọi admin tự sửa tên của mình (không cần access.admin_accounts.edit) */
  router.patch('/me', async (req, res, next) => {
    try {
      const name = req.body && req.body.name != null ? String(req.body.name).trim() : '';
      if (!name) {
        return res.status(400).json({ error: { message: 'Họ tên là bắt buộc.' } });
      }
      await rbac.updateAccount(req.admin.id, { name: name });
      await audit(req, 'update_own_profile', 'admin_account', req.admin.id, { name: name });
      res.json({ ok: true, admin: { id: req.admin.id, name: name, email: req.admin.email } });
    } catch (err) { next(err); }
  });

  router.post('/change-password', async (req, res, next) => {
    try {
      await rbac.changeOwnPassword(req.admin.email, req.body.currentPassword, req.body.newPassword);
      await audit(req, 'change_own_password', 'admin_account', req.admin.id, {});
      res.json({ ok: true });
    } catch (err) { next(err); }
  });

  /* ── Catalog quyền ── */
  router.get('/permissions', requirePermission('access.permissions.view'), async (req, res, next) => {
    try { res.json({ modules: await rbac.listPermissionsGrouped() }); } catch (err) { next(err); }
  });

  /* ── Vai trò ── */
  router.get('/roles', requirePermission('access.roles.view'), async (req, res, next) => {
    try { res.json({ roles: await rbac.listRoles() }); } catch (err) { next(err); }
  });

  router.get('/roles/:id', requirePermission('access.roles.view'), async (req, res, next) => {
    try {
      const keys = await rbac.getRolePermissionKeys(req.params.id);
      if (keys === null) return res.status(404).json({ error: { message: 'Không tìm thấy vai trò.' } });
      res.json({ permissionKeys: keys });
    } catch (err) { next(err); }
  });

  router.post('/roles', requirePermission('access.roles.create'), async (req, res, next) => {
    try {
      const id = await rbac.createRole(req.body || {});
      rbac.invalidateContextCache();
      await audit(req, 'create_role', 'admin_role', id, { name: req.body && req.body.name });
      res.json({ id });
    } catch (err) { next(err); }
  });

  router.patch('/roles/:id', requirePermission('access.roles.edit'), async (req, res, next) => {
    try {
      await rbac.updateRole(req.params.id, req.body || {});
      rbac.invalidateContextCache();
      await audit(req, 'update_role', 'admin_role', req.params.id, req.body || {});
      res.json({ ok: true });
    } catch (err) { next(err); }
  });

  router.post('/roles/:id/clone', requirePermission('access.roles.create'), async (req, res, next) => {
    try {
      const id = await rbac.cloneRole(req.params.id, req.body && req.body.name);
      rbac.invalidateContextCache();
      await audit(req, 'clone_role', 'admin_role', id, { from: req.params.id });
      res.json({ id });
    } catch (err) { next(err); }
  });

  router.put('/roles/:id/permissions', requireAnyPermission('access.roles.assign_permission', 'access.permissions.assign_permission'), async (req, res, next) => {
    try {
      await rbac.setRolePermissions(req.params.id, (req.body && req.body.permissionKeys) || []);
      rbac.invalidateContextCache();
      await audit(req, 'set_role_permissions', 'admin_role', req.params.id, { count: ((req.body && req.body.permissionKeys) || []).length });
      res.json({ ok: true });
    } catch (err) { next(err); }
  });

  router.delete('/roles/:id', requirePermission('access.roles.delete'), async (req, res, next) => {
    try {
      await rbac.deleteRole(req.params.id);
      rbac.invalidateContextCache();
      await audit(req, 'delete_role', 'admin_role', req.params.id, {});
      res.json({ ok: true });
    } catch (err) { next(err); }
  });

  /* ── Tài khoản admin ── */
  router.get('/accounts', requirePermission('access.admin_accounts.view'), async (req, res, next) => {
    try { res.json({ accounts: await rbac.listAccounts() }); } catch (err) { next(err); }
  });

  router.post('/accounts', requirePermission('access.admin_accounts.create'), async (req, res, next) => {
    try {
      const id = await rbac.createAccount(req.body || {});
      rbac.invalidateContextCache();
      await audit(req, 'create_admin', 'admin_account', id, { email: req.body && req.body.email });
      res.json({ id });
    } catch (err) { next(err); }
  });

  router.patch('/accounts/:id', requirePermission('access.admin_accounts.edit'), async (req, res, next) => {
    try {
      await rbac.updateAccount(req.params.id, req.body || {});
      rbac.invalidateContextCache();
      await audit(req, 'update_admin', 'admin_account', req.params.id, req.body || {});
      res.json({ ok: true });
    } catch (err) { next(err); }
  });

  router.put('/accounts/:id/roles', requirePermission('access.admin_accounts.edit'), async (req, res, next) => {
    try {
      await rbac.setAccountRoles(req.params.id, (req.body && req.body.roleIds) || []);
      rbac.invalidateContextCache();
      await audit(req, 'set_admin_roles', 'admin_account', req.params.id, { roleIds: (req.body && req.body.roleIds) || [] });
      res.json({ ok: true });
    } catch (err) { next(err); }
  });

  router.patch('/accounts/:id/status', function (req, res, next) {
    const status = String((req.body && req.body.status) || '').trim();
    const key =
      status === 'locked'
        ? 'access.admin_accounts.status_locked'
        : 'access.admin_accounts.status_active';
    return requirePermission(key)(req, res, next);
  }, async (req, res, next) => {
    try {
      await rbac.setAccountStatus(req.params.id, req.body && req.body.status);
      rbac.invalidateContextCache();
      await audit(req, 'set_admin_status', 'admin_account', req.params.id, { status: req.body && req.body.status });
      res.json({ ok: true });
    } catch (err) { next(err); }
  });

  router.post('/accounts/:id/reset-password', requirePermission('access.admin_accounts.reset_password'), async (req, res, next) => {
    try {
      await rbac.resetPassword(req.params.id, req.body && req.body.newPassword);
      rbac.invalidateContextCache();
      await audit(req, 'reset_admin_password', 'admin_account', req.params.id, {});
      res.json({ ok: true });
    } catch (err) { next(err); }
  });

  router.delete('/accounts/:id', requirePermission('access.admin_accounts.delete'), async (req, res, next) => {
    try {
      await rbac.deleteAccount(req.params.id);
      rbac.invalidateContextCache();
      await audit(req, 'delete_admin', 'admin_account', req.params.id, {});
      res.json({ ok: true });
    } catch (err) { next(err); }
  });

  /* ── Nhật ký ── */
  router.get('/audit', requirePermission('access.audit.view'), async (req, res, next) => {
    try { res.json({ entries: await rbac.listAudit(req.query.limit) }); } catch (err) { next(err); }
  });

  return router;
}

module.exports = { createAdminRbacRouter };
