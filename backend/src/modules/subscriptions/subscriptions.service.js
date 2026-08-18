'use strict';

const { query } = require('../../core/database/connection');

function planDays(cycle) {
  if (cycle === 'annual') return 365;
  if (cycle === 'lifetime') return null;
  return 30;
}

const PLAN_NAMES = {
  premium: 'Premium',
  elite: 'Elite',
  free: 'Miễn phí',
  guest: 'Vãng lai'
};

function normalizePlanFields(payload) {
  const tier = String(payload.planTier || '').toLowerCase() || 'premium';
  const canonicalName = PLAN_NAMES[tier];
  const incomingName = String(payload.planName || '').trim();
  if (canonicalName) {
    return { planTier: tier, planName: canonicalName };
  }
  return { planTier: tier, planName: incomingName || tier };
}

function rowToOrder(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    userName: row.user_name,
    email: row.email,
    planTier: row.plan_tier,
    planName: row.plan_name,
    cycle: row.cycle,
    amount: Number(row.amount),
    couponDiscount: Number(row.coupon_discount),
    payMethod: row.pay_method,
    transferRef: row.transfer_ref,
    status: row.status,
    createdAt: row.created_at,
    approvedAt: row.approved_at,
    rejectedAt: row.rejected_at,
    rejectReason: row.reject_reason || '',
    approvedBy: row.approved_by,
    refundedAt: row.refunded_at,
    referrerUserId: row.buyer_referred_by || row.referrer_user_id || null
  };
}

const ORDER_SELECT = `
  SELECT o.*, u.referred_by AS buyer_referred_by
  FROM subscription_orders o
  LEFT JOIN users u ON u.id = o.user_id
`;

async function cancelPendingTransfers(userId) {
  await query(
    `UPDATE subscription_orders
     SET status = 'rejected', rejected_at = NOW(), reject_reason = 'Thay bằng đơn mới'
     WHERE user_id = $1 AND status = 'pending' AND pay_method = 'transfer'`,
    [userId]
  );
}

async function applyPlanToUser(userId, order) {
  const days = planDays(order.cycle);
  let expiresAt = null;
  if (days != null) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    expiresAt = d.toISOString();
  }
  await query(
    `UPDATE users SET
       subscription_tier = $2,
       subscription_expires_at = $3,
       updated_at = NOW()
     WHERE id = $1`,
    [userId, order.planTier, expiresAt]
  );
}

async function createOrder(userId, payload) {
  await cancelPendingTransfers(userId);

  const planFields = normalizePlanFields(payload);
  payload = Object.assign({}, payload, planFields);

  const status = payload.payMethod === 'transfer' ? 'pending' : 'paid';
  const id = 'ord_' + Date.now();

  const res = await query(
    `INSERT INTO subscription_orders (
       id, user_id, user_name, email, plan_tier, plan_name, cycle,
       amount, coupon_discount, pay_method, transfer_ref, status, approved_at
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
     RETURNING *`,
    [
      id,
      userId,
      payload.userName || '',
      payload.email || '',
      payload.planTier,
      payload.planName,
      payload.cycle,
      payload.amount,
      payload.couponDiscount || 0,
      payload.payMethod,
      payload.transferRef || '',
      status,
      status === 'paid' ? new Date() : null
    ]
  );

  const order = rowToOrder(res.rows[0]);
  order.referrerUserId = await getBuyerReferredBy(userId);
  if (status === 'paid') {
    await applyPlanToUser(userId, order);
  }
  return order;
}

async function listOrders(filters = {}) {
  const clauses = [];
  const params = [];
  let n = 1;

  if (filters.userId) {
    clauses.push(`o.user_id = $${n++}`);
    params.push(filters.userId);
  }
  if (filters.status) {
    clauses.push(`o.status = $${n++}`);
    params.push(filters.status);
  }
  if (filters.payMethod) {
    clauses.push(`o.pay_method = $${n++}`);
    params.push(filters.payMethod);
  }
  if (filters.q) {
    clauses.push(
      `(LOWER(o.email) LIKE $${n} OR LOWER(o.user_name) LIKE $${n} OR LOWER(o.id) LIKE $${n} OR LOWER(o.transfer_ref) LIKE $${n})`
    );
    params.push('%' + String(filters.q).toLowerCase() + '%');
    n++;
  }

  const where = clauses.length ? 'WHERE ' + clauses.join(' AND ') : '';
  const limit = filters.limit ? `LIMIT ${Number(filters.limit)}` : '';
  const res = await query(
    `${ORDER_SELECT} ${where} ORDER BY o.created_at DESC ${limit}`,
    params
  );
  return res.rows.map(rowToOrder);
}

async function getById(id) {
  const res = await query(`${ORDER_SELECT} WHERE o.id = $1`, [id]);
  return rowToOrder(res.rows[0]);
}

async function getBuyerReferredBy(userId) {
  const res = await query('SELECT referred_by FROM users WHERE id = $1', [userId]);
  return res.rows[0]?.referred_by || null;
}

async function approveOrder(id, meta = {}) {
  const order = await getById(id);
  if (!order || order.status !== 'pending') {
    const err = new Error('invalid_order');
    err.statusCode = 422;
    throw err;
  }
  const buyerReferredBy = await getBuyerReferredBy(order.userId);
  await applyPlanToUser(order.userId, order);
  const res = await query(
    `UPDATE subscription_orders SET
       status = 'approved', approved_at = NOW(), approved_by = $2
     WHERE id = $1 RETURNING *`,
    [id, meta.adminName || 'Admin']
  );
  const approved = rowToOrder(res.rows[0]);
  approved.buyerReferredBy = buyerReferredBy;
  return approved;
}

async function rejectOrder(id, reason, meta = {}) {
  const order = await getById(id);
  if (!order || order.status !== 'pending') {
    const err = new Error('invalid_order');
    err.statusCode = 422;
    throw err;
  }
  const res = await query(
    `UPDATE subscription_orders SET
       status = 'rejected', rejected_at = NOW(), reject_reason = $2, approved_by = $3
     WHERE id = $1 RETURNING *`,
    [id, reason || 'Không xác nhận được thanh toán', meta.adminName || 'Admin']
  );
  return rowToOrder(res.rows[0]);
}

async function stats() {
  const res = await query(`
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE status = 'pending')::int AS pending,
      COUNT(*) FILTER (WHERE status IN ('approved','paid'))::int AS approved,
      COUNT(*) FILTER (WHERE status = 'rejected')::int AS rejected,
      COUNT(*) FILTER (WHERE status = 'pending' AND pay_method = 'transfer')::int AS pending_transfer,
      COALESCE(SUM(amount) FILTER (WHERE status IN ('approved','paid')), 0)::numeric AS revenue
    FROM subscription_orders
  `);
  const s = res.rows[0];
  return {
    total: s.total,
    pending: s.pending,
    approved: s.approved,
    rejected: s.rejected,
    pendingTransfer: s.pending_transfer,
    revenue: Number(s.revenue)
  };
}

const ALLOWED_STATUS = new Set(['pending', 'approved', 'paid', 'rejected', 'refunded']);

async function findUserByEmail(email) {
  const norm = String(email || '').trim().toLowerCase();
  if (!norm) return null;
  const res = await query(
    `SELECT id, email, display_name, nickname FROM users WHERE LOWER(email) = $1 LIMIT 1`,
    [norm]
  );
  return res.rows[0] || null;
}

/**
 * Admin tạo đơn thủ công giúp khách (sự cố thanh toán, kích hoạt tay…).
 * body: email, planTier, planName?, cycle, amount, payMethod, transferRef?, status?, note?
 */
async function createAdminOrder(payload, meta = {}) {
  const user = await findUserByEmail(payload.email);
  if (!user) {
    const err = new Error('user_not_found');
    err.statusCode = 404;
    throw err;
  }

  const planFields = normalizePlanFields(payload);
  let status = String(payload.status || 'pending').toLowerCase();
  if (!ALLOWED_STATUS.has(status)) status = 'pending';

  const payMethod = payload.payMethod || 'transfer';
  const id = 'ord_adm_' + Date.now();
  const userName = payload.userName || user.display_name || user.nickname || '';
  const email = user.email;
  const transferRef = payload.transferRef || (payload.note ? ('ADMIN: ' + payload.note) : 'ADMIN_MANUAL');

  const activateNow = status === 'approved' || status === 'paid';

  const res = await query(
    `INSERT INTO subscription_orders (
       id, user_id, user_name, email, plan_tier, plan_name, cycle,
       amount, coupon_discount, pay_method, transfer_ref, status,
       approved_at, approved_by, reject_reason
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
     RETURNING *`,
    [
      id,
      user.id,
      userName,
      email,
      planFields.planTier,
      planFields.planName,
      payload.cycle || 'monthly',
      Number(payload.amount) || 0,
      Number(payload.couponDiscount) || 0,
      payMethod,
      transferRef,
      status,
      activateNow ? new Date() : null,
      activateNow ? (meta.adminName || 'Admin') : null,
      status === 'rejected' ? (payload.rejectReason || 'Tạo thủ công — từ chối') : ''
    ]
  );

  const order = rowToOrder(res.rows[0]);
  if (activateNow) {
    await applyPlanToUser(user.id, order);
  }
  return order;
}

async function updateOrder(id, patch, meta = {}) {
  const existing = await getById(id);
  if (!existing) {
    const err = new Error('not_found');
    err.statusCode = 404;
    throw err;
  }

  const planFields = normalizePlanFields({
    planTier: patch.planTier != null ? patch.planTier : existing.planTier,
    planName: patch.planName != null ? patch.planName : existing.planName
  });

  let status = existing.status;
  if (patch.status != null) {
    status = String(patch.status).toLowerCase();
    if (!ALLOWED_STATUS.has(status)) {
      const err = new Error('invalid_status');
      err.statusCode = 422;
      throw err;
    }
  }

  const amount = patch.amount != null ? Number(patch.amount) : existing.amount;
  const cycle = patch.cycle != null ? patch.cycle : existing.cycle;
  const payMethod = patch.payMethod != null ? patch.payMethod : existing.payMethod;
  const transferRef = patch.transferRef != null ? patch.transferRef : existing.transferRef;
  const userName = patch.userName != null ? patch.userName : existing.userName;
  const email = patch.email != null ? patch.email : existing.email;
  const couponDiscount = patch.couponDiscount != null ? Number(patch.couponDiscount) : existing.couponDiscount;

  const statusChanged = status !== existing.status;
  let approvedAt = existing.approvedAt;
  let rejectedAt = existing.rejectedAt;
  let approvedBy = existing.approvedBy;
  let rejectReason = existing.rejectReason || '';
  let refundedAt = existing.refundedAt || null;

  if (statusChanged) {
    if (status === 'approved' || status === 'paid') {
      approvedAt = new Date().toISOString();
      approvedBy = meta.adminName || 'Admin';
      rejectedAt = null;
      rejectReason = '';
    } else if (status === 'rejected') {
      rejectedAt = new Date().toISOString();
      rejectReason = patch.rejectReason || 'Cập nhật thủ công';
      approvedBy = meta.adminName || 'Admin';
    } else if (status === 'refunded') {
      approvedBy = meta.adminName || 'Admin';
      if (!refundedAt) refundedAt = new Date().toISOString();
    } else if (status === 'pending') {
      approvedAt = null;
      rejectedAt = null;
      approvedBy = null;
      rejectReason = '';
    }
  } else if (patch.rejectReason != null) {
    rejectReason = patch.rejectReason;
  }

  const res = await query(
    `UPDATE subscription_orders SET
       user_name = $2,
       email = $3,
       plan_tier = $4,
       plan_name = $5,
       cycle = $6,
       amount = $7,
       coupon_discount = $8,
       pay_method = $9,
       transfer_ref = $10,
       status = $11,
       approved_at = $12,
       rejected_at = $13,
       approved_by = $14,
       reject_reason = $15,
       refunded_at = $16
     WHERE id = $1
     RETURNING *`,
    [
      id,
      userName,
      email,
      planFields.planTier,
      planFields.planName,
      cycle,
      amount,
      couponDiscount,
      payMethod,
      transferRef,
      status,
      approvedAt,
      rejectedAt,
      approvedBy,
      rejectReason,
      refundedAt
    ]
  );

  const order = rowToOrder(res.rows[0]);
  if (statusChanged && (status === 'approved' || status === 'paid')) {
    await applyPlanToUser(order.userId, order);
  }
  return order;
}

async function deleteOrder(id) {
  const existing = await getById(id);
  if (!existing) {
    const err = new Error('not_found');
    err.statusCode = 404;
    throw err;
  }
  await query('DELETE FROM subscription_orders WHERE id = $1', [id]);
  return { ok: true, id };
}

module.exports = {
  createOrder,
  createAdminOrder,
  updateOrder,
  deleteOrder,
  listOrders,
  getById,
  approveOrder,
  rejectOrder,
  stats,
  planDays,
  findUserByEmail
};
