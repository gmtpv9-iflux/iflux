'use strict';

/**
 * Staging 2 — Người dùng cuối: HTTP
 *
 * Mount: /api/admin/users
 *
 * Ba khóa quyền users.list.{view,edit,export} đã seed ở migration 0003 —
 * chỉ khai ở đây khóa nào thật sự chặn một endpoint.
 */

const express = require('express');
const { z } = require('zod');
const { AppError } = require('../errors');
const { requirePermission } = require('../admin-rbac/permission');
const { listUsers, listAllUsers, getUserById, updateUser } = require('./service');

const listQuerySchema = z.object({
  q: z.string().max(200).optional(),
  status: z.enum(['active', 'suspended']).optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional()
});

// Id không phải uuid sẽ làm Postgres ném lỗi cú pháp → chặn ngay ở biên.
const idSchema = z.string().uuid();

const patchSchema = z.object({
  displayName: z.string().min(1).max(255).optional(),
  phone: z.string().max(20).nullable().optional(),
  accountStatus: z.enum(['active', 'suspended']).optional()
});

function parse(schema, value) {
  const parsed = schema.safeParse(value || {});
  if (!parsed.success) throw new AppError('VALIDATION_ERROR', 'Dữ liệu không hợp lệ.', 400);
  return parsed.data;
}

/** RFC 4180: bọc nháy khi có dấu phẩy, nháy kép hoặc xuống dòng. */
function csvCell(value) {
  const s = value == null ? '' : String(value);
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

/**
 * ISO 8601 UTC. Không để String(Date) tự chạy: nó in ra dạng
 * "Sat Aug 15 2026 23:18:40 GMT+0700 (Indochina Time)" — đổi theo múi giờ của
 * tiến trình nên cùng một bản ghi xuất ở hai máy ra hai chuỗi khác nhau.
 */
function csvTime(value) {
  if (!value) return '';
  const d = value instanceof Date ? value : new Date(value);
  return isNaN(d.getTime()) ? '' : d.toISOString();
}

const CSV_COLUMNS = [
  ['id', function (u) { return u.id; }],
  ['email', function (u) { return u.email; }],
  ['ten_hien_thi', function (u) { return u.displayName; }],
  ['dien_thoai', function (u) { return u.phone; }],
  ['trang_thai', function (u) { return u.accountStatus; }],
  ['xac_thuc_email', function (u) { return csvTime(u.emailVerifiedAt); }],
  ['ngay_tao', function (u) { return csvTime(u.createdAt); }]
];

function createAdminUsersRouter(config) {
  const router = express.Router();

  router.get('/', requirePermission(config, 'users.list.view'), async function (req, res, next) {
    try {
      res.json(await listUsers(parse(listQuerySchema, req.query)));
    } catch (err) {
      next(err);
    }
  });

  router.get('/export', requirePermission(config, 'users.list.export'), async function (req, res, next) {
    try {
      const filters = parse(listQuerySchema, req.query);
      const users = await listAllUsers(filters);
      const lines = [CSV_COLUMNS.map(function (c) { return c[0]; }).join(',')];
      users.forEach(function (u) {
        lines.push(CSV_COLUMNS.map(function (c) { return csvCell(c[1](u)); }).join(','));
      });
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="nguoi-dung.csv"');
      // BOM: Excel trên Windows đọc CSV không BOM thành ANSI, tiếng Việt vỡ dấu.
      // Xuống dòng cuối tệp theo RFC 4180 — thiếu nó một số công cụ nuốt dòng chót.
      res.send('\uFEFF' + lines.join('\n') + '\n');
    } catch (err) {
      next(err);
    }
  });

  router.get('/:id', requirePermission(config, 'users.list.view'), async function (req, res, next) {
    try {
      const user = await getUserById(parse(idSchema, req.params.id));
      if (!user) throw new AppError('NOT_FOUND', 'Không tìm thấy người dùng.', 404);
      res.json({ user: user });
    } catch (err) {
      next(err);
    }
  });

  router.patch('/:id', requirePermission(config, 'users.list.edit'), async function (req, res, next) {
    try {
      const id = parse(idSchema, req.params.id);
      res.json({ user: await updateUser(id, parse(patchSchema, req.body)) });
    } catch (err) {
      next(err);
    }
  });

  return router;
}

module.exports = { createAdminUsersRouter };
