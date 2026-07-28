'use strict';

const { query } = require('../../core/database/connection');
const dispatcher = require('./dispatcher');
const { getLogger } = require('../../core/logger/logger');

async function loadRecipientName(userId) {
  if (!userId) return '';
  const res = await query(
    'SELECT display_name, nickname FROM users WHERE id = $1',
    [userId]
  );
  const row = res.rows[0];
  if (!row) return '';
  return row.display_name || row.nickname || '';
}

/**
 * Phase D — F0 only: notify direct referrer when new member signs up.
 * Domain helper — not Dispatcher business logic.
 */
async function notifyReferralSignupF0(opts) {
  opts = opts || {};
  const newUserId = opts.newUserId;
  const referredById = opts.referredById;
  if (!newUserId || !referredById) return { skipped: true, reason: 'no_referrer' };
  if (String(newUserId) === String(referredById)) return { skipped: true, reason: 'self_referral' };

  const recipientName = await loadRecipientName(referredById);
  const memberName = opts.displayName || 'Thành viên mới';

  return dispatcher.dispatch({
    typeCode: 'AFFILIATE_REFERRAL_SUCCESS',
    recipientUserId: referredById,
    variables: {
      recipient_name: recipientName,
      member: memberName,
      affiliate_tier: opts.layer || 'F0'
    },
    dedupeKey: 'affiliate_referral:' + newUserId,
    href: '/home?tab=affiliate',
    icon: 'ti-user-plus',
    metadata: {
      newUserId: String(newUserId),
      layer: 'F0'
    }
  });
}

async function notifyReferralSignupF0Safe(opts) {
  try {
    return await notifyReferralSignupF0(opts);
  } catch (err) {
    getLogger().warn({ err: err && err.message, opts: opts && opts.newUserId }, 'referral signup notification failed');
    return { skipped: true, reason: 'error' };
  }
}

module.exports = {
  notifyReferralSignupF0,
  notifyReferralSignupF0Safe
};
