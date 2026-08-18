'use strict';

const { query } = require('../../core/database/connection');
const { getAffiliateSync } = require('../legacy-auth/auth.service');

async function sumPayoutsForUser(userId, statuses) {
  const res = await query(
    `SELECT COALESCE(SUM(amount), 0)::numeric AS total
     FROM affiliate_payout_requests
     WHERE user_id = $1 AND status = ANY($2::text[])`,
    [userId, statuses]
  );
  return Number(res.rows[0].total || 0);
}

async function sumOrderCreditsForUser(userId) {
  const res = await query(
    `SELECT COALESCE(SUM(amount), 0)::numeric AS total
     FROM affiliate_order_credits
     WHERE user_id = $1 AND NOT refunded`,
    [userId]
  );
  return Number(res.rows[0].total || 0);
}

async function getSpendableBalance(userId) {
  const sync = await getAffiliateSync(userId);
  const totalEarn = (sync.events || []).reduce((sum, e) => sum + Number(e.commission || 0), 0);
  const reservedPayouts = await sumPayoutsForUser(userId, ['pending', 'processing', 'paid']);
  const spentOnOrders = await sumOrderCreditsForUser(userId);
  return Math.max(0, totalEarn - reservedPayouts - spentOnOrders);
}

async function spendCreditForOrder(userId, orderId, amount) {
  amount = Math.round(Number(amount) || 0);
  if (amount <= 0) return null;

  const available = await getSpendableBalance(userId);
  if (amount > available) {
    const err = new Error(
      `Số dư Affiliate khả dụng (${available.toLocaleString('vi-VN')} ₫) không đủ`
    );
    err.statusCode = 422;
    throw err;
  }

  const id = 'affcr_' + Date.now();
  const res = await query(
    `INSERT INTO affiliate_order_credits (id, user_id, order_id, amount)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [id, userId, orderId, amount]
  );
  return res.rows[0];
}

async function refundCreditForOrder(orderId) {
  await query(
    `UPDATE affiliate_order_credits
     SET refunded = TRUE
     WHERE order_id = $1 AND NOT refunded`,
    [orderId]
  );
}

module.exports = {
  getSpendableBalance,
  spendCreditForOrder,
  refundCreditForOrder,
  sumOrderCreditsForUser
};
