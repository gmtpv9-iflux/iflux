'use strict';

const crypto = require('crypto');
const bcrypt = require('bcrypt');
const { query } = require('../../core/database/connection');
const { sendVerificationOtp, isConfigured } = require('../../core/email/mailer');
const { getLogger } = require('../../core/logger/logger');
const verifierRegistry = require('./identity/verifier-registry');
const { toLegacySocialProfile } = require('./identity/verified-identity');

const OTP_TTL_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_MS = 60 * 1000;

function genReferralCode() {
  /* Public Identity (publicId := referral_code). Chỉ cấp lúc INSERT — AFF-ID-002 immutable sau khi có mã. */
  return 'IFL' + Math.random().toString(36).slice(2, 7).toUpperCase();
}

function hashOtp(email, code, secret) {
  return crypto.createHash('sha256').update(`${email}:${code}:${secret}`).digest('hex');
}

function useDemoOtp(config) {
  // Nếu đã cấu hình email thật → luôn gửi email thật, không dùng demo.
  if (isConfigured(config)) return false;
  // Bật demo khi chạy local, HOẶC khi bật cờ EMAIL_OTP_DEMO (tạm cho test trên môi trường khác).
  return config.APP_ENV === 'local' || config.EMAIL_OTP_DEMO === true;
}

function getDemoOtpCode(config) {
  return config.EMAIL_OTP_DEMO_CODE || '123456';
}

function generateOtp() {
  return String(crypto.randomInt(0, 1000000)).padStart(6, '0');
}

function buildVerificationResponse(config, normEmail, demoMode, otp) {
  if (demoMode) {
    return {
      requiresVerification: true,
      email: normEmail,
      verificationMode: 'demo',
      demoCode: otp,
      message: `Local chưa cấu hình email (Resend/SMTP) — dùng mã OTP demo: ${otp}`
    };
  }
  return {
    requiresVerification: true,
    email: normEmail,
    verificationMode: 'email',
    message: `Mã xác thực 6 số đã gửi tới ${normEmail}. Mã có hiệu lực 15 phút.`
  };
}

async function getUserByEmail(email) {
  const res = await query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
  return res.rows[0] || null;
}

function normalizePhone(phone) {
  if (!phone) return '';
  let digits = String(phone).replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('0')) digits = '84' + digits.slice(1);
  else if (digits.length === 9 && /^[35789]/.test(digits)) digits = '84' + digits;
  return digits;
}

async function getUserByPhone(phone) {
  const norm = normalizePhone(phone);
  if (!norm || norm.length < 10) return null;
  const res = await query('SELECT * FROM users WHERE phone IS NOT NULL AND phone <> \'\'');
  for (const row of res.rows) {
    if (normalizePhone(row.phone) === norm) return row;
  }
  return null;
}

function assertPhoneAvailable(phone) {
  return getUserByPhone(phone).then((existing) => {
    if (!existing) return;
    const err = new Error('Phone already registered');
    err.statusCode = 422;
    throw err;
  });
}

async function getUserProfile(id) {
  const res = await query(
    `SELECT id, email, phone, display_name, nickname, referral_code, referred_by,
            subscription_tier AS plan, subscription_expires_at AS plan_expired_at,
            account_status AS status, created_at, email_verified_at
     FROM users WHERE id = $1`,
    [id]
  );
  return res.rows[0] || null;
}

async function resolveReferrer(referralCode) {
  if (!referralCode) return null;
  const ref = await query('SELECT id FROM users WHERE referral_code = $1', [
    String(referralCode).trim().toUpperCase()
  ]);
  return ref.rows[0]?.id || null;
}

async function lookupReferrerByCode(referralCode) {
  if (!referralCode) return null;
  const res = await query(
    'SELECT id, display_name, referral_code FROM users WHERE referral_code = $1',
    [String(referralCode).trim().toUpperCase()]
  );
  return res.rows[0] || null;
}

async function createUserFromPending(normEmail, payload) {
  const { password_hash, display_name, phone, referred_by } = payload;
  let referralCode = genReferralCode();

  for (let i = 0; i < 5; i++) {
    try {
      const ins = await query(
        `INSERT INTO users (email, password_hash, display_name, nickname, phone, referral_code, referred_by, email_verified_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
         RETURNING id, email, subscription_tier, created_at`,
        [
          normEmail,
          password_hash,
          display_name || null,
          display_name || null,
          phone ? normalizePhone(phone) : null,
          referralCode,
          referred_by || null
        ]
      );
      return ins.rows[0];
    } catch (e) {
      if (e.code === '23505' && String(e.detail || e.constraint || '').includes('phone')) {
        const err = new Error('Phone already registered');
        err.statusCode = 422;
        throw err;
      }
      if (e.code === '23505' && String(e.detail || '').includes('referral_code')) {
        referralCode = genReferralCode();
        continue;
      }
      throw e;
    }
  }
  const err = new Error('Could not create user');
  err.statusCode = 500;
  throw err;
}

async function startRegistration(config, payload) {
  const { email, password, referral_code, display_name, phone } = payload;
  const normEmail = String(email).trim().toLowerCase();

  if (await getUserByEmail(normEmail)) {
    const err = new Error('Email already registered');
    err.statusCode = 422;
    throw err;
  }

  if (phone) {
    await assertPhoneAvailable(phone);
  }

  const referredBy = await resolveReferrer(referral_code);
  const passwordHash = await bcrypt.hash(password, 10);
  const demoMode = useDemoOtp(config);
  const otp = demoMode ? getDemoOtpCode(config) : generateOtp();
  const codeHash = hashOtp(normEmail, otp, config.JWT_SECRET);
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  const pendingPayload = {
    password_hash: passwordHash,
    display_name: display_name || null,
    phone: phone || null,
    referred_by: referredBy
  };

  await query('DELETE FROM email_verification_otps WHERE email = $1', [normEmail]);
  await query(
    `INSERT INTO email_verification_otps (email, code_hash, payload, expires_at)
     VALUES ($1, $2, $3, $4)`,
    [normEmail, codeHash, JSON.stringify(pendingPayload), expiresAt]
  );

  if (demoMode) {
    getLogger().info({ email: normEmail, otp }, 'Demo OTP mode (local, no SMTP)');
  } else {
    await sendVerificationOtp(config, {
      to: normEmail,
      code: otp,
      displayName: display_name
    });
  }

  return buildVerificationResponse(config, normEmail, demoMode, otp);
}

async function resendVerificationOtp(config, email) {
  const normEmail = String(email || '').trim().toLowerCase();
  if (!normEmail) {
    const err = new Error('Email required');
    err.statusCode = 422;
    throw err;
  }

  if (await getUserByEmail(normEmail)) {
    const err = new Error('Email already registered');
    err.statusCode = 422;
    throw err;
  }

  const row = await query(
    `SELECT * FROM email_verification_otps WHERE email = $1 ORDER BY created_at DESC LIMIT 1`,
    [normEmail]
  ).then((r) => r.rows[0]);

  if (!row) {
    const err = new Error('No pending registration for this email');
    err.statusCode = 404;
    throw err;
  }

  const elapsed = Date.now() - new Date(row.last_sent_at).getTime();
  if (elapsed < RESEND_COOLDOWN_MS) {
    const waitSec = Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000);
    const err = new Error(`Please wait ${waitSec} seconds before resending`);
    err.statusCode = 429;
    throw err;
  }

  const demoMode = useDemoOtp(config);
  const otp = demoMode ? getDemoOtpCode(config) : generateOtp();
  const codeHash = hashOtp(normEmail, otp, config.JWT_SECRET);
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);
  const payload = typeof row.payload === 'string' ? JSON.parse(row.payload) : row.payload;

  await query(
    `UPDATE email_verification_otps
     SET code_hash = $1, expires_at = $2, attempts = 0, last_sent_at = NOW()
     WHERE id = $3`,
    [codeHash, expiresAt, row.id]
  );

  if (demoMode) {
    getLogger().info({ email: normEmail, otp }, 'Demo OTP resend (local, no SMTP)');
    return {
      ok: true,
      email: normEmail,
      verificationMode: 'demo',
      demoCode: otp,
      message: `Local demo — mã OTP: ${otp}`
    };
  }

  await sendVerificationOtp(config, {
    to: normEmail,
    code: otp,
    displayName: payload.display_name
  });

  return {
    ok: true,
    email: normEmail,
    verificationMode: 'email',
    message: `Đã gửi lại mã xác thực tới ${normEmail}.`
  };
}

async function emitReferralCreatedAfterIdentityCreated(opts) {
  const { notifyReferralSignupF0Safe } = require('../notifications/referral-signup.consumer');
  return notifyReferralSignupF0Safe(opts);
}

async function verifyEmailCode(config, email, code) {
  const normEmail = String(email || '').trim().toLowerCase();
  const normCode = String(code || '').trim();

  if (!normEmail || normCode.length !== 6) {
    const err = new Error('Invalid verification code');
    err.statusCode = 422;
    throw err;
  }

  if (await getUserByEmail(normEmail)) {
    const err = new Error('Email already registered');
    err.statusCode = 422;
    throw err;
  }

  const row = await query(
    `SELECT * FROM email_verification_otps WHERE email = $1 ORDER BY created_at DESC LIMIT 1`,
    [normEmail]
  ).then((r) => r.rows[0]);

  if (!row) {
    const err = new Error('Invalid verification code');
    err.statusCode = 422;
    throw err;
  }

  if (new Date(row.expires_at) < new Date()) {
    const err = new Error('Verification code expired');
    err.statusCode = 422;
    throw err;
  }

  if (row.attempts >= MAX_ATTEMPTS) {
    const err = new Error('Too many verification attempts');
    err.statusCode = 429;
    throw err;
  }

  const expectedHash = hashOtp(normEmail, normCode, config.JWT_SECRET);
  if (expectedHash !== row.code_hash) {
    await query(
      `UPDATE email_verification_otps SET attempts = attempts + 1 WHERE id = $1`,
      [row.id]
    );
    const err = new Error('Invalid verification code');
    err.statusCode = 422;
    throw err;
  }

  const payload = typeof row.payload === 'string' ? JSON.parse(row.payload) : row.payload;
  if (payload.phone) {
    await assertPhoneAvailable(payload.phone);
  }
  const user = await createUserFromPending(normEmail, payload);
  await query('DELETE FROM email_verification_otps WHERE email = $1', [normEmail]);
  try {
    await emitReferralCreatedAfterIdentityCreated({
      newUserId: user.id,
      displayName: payload.display_name,
      referredById: payload.referred_by
    });
  } catch (e) {
    getLogger().warn({ err: e && e.message, userId: user.id }, 'referral hook after verify');
  }
  return user;
}

async function loginUser(email, password) {
  const user = await getUserByEmail(String(email).trim().toLowerCase());
  if (!user) {
    const err = new Error('Invalid credentials');
    err.statusCode = 401;
    throw err;
  }
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    const err = new Error('Invalid credentials');
    err.statusCode = 401;
    throw err;
  }
  if (!user.email_verified_at) {
    const err = new Error('Email not verified');
    err.statusCode = 403;
    throw err;
  }
  if (user.account_status !== 'active') {
    const err = new Error('Account suspended');
    err.statusCode = 403;
    throw err;
  }
  return user;
}

async function updateProfile(userId, fields) {
  const { nickname, phone, display_name } = fields;
  await query(
    `UPDATE users SET
       nickname = COALESCE($1, nickname),
       display_name = COALESCE($2, display_name),
       phone = COALESCE($3, phone),
       updated_at = NOW()
     WHERE id = $4`,
    [nickname || null, display_name || null, phone || null, userId]
  );
}

async function getUserPasswordCapability(userId) {
  const res = await query(
    'SELECT auth_provider, password_hash FROM users WHERE id = $1',
    [userId]
  );
  const row = res.rows[0];
  if (!row) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }
  return {
    auth_provider: row.auth_provider || 'email',
    has_password: !!(row.password_hash && String(row.password_hash).length > 0)
  };
}

async function changeUserPassword(userId, currentPassword, newPassword) {
  const next = String(newPassword || '');
  if (next.length < 8) {
    const err = new Error('Mật khẩu mới phải có ít nhất 8 ký tự.');
    err.statusCode = 422;
    throw err;
  }
  const res = await query('SELECT password_hash FROM users WHERE id = $1', [userId]);
  const row = res.rows[0];
  if (!row) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }
  if (!row.password_hash) {
    const err = new Error('Tài khoản đăng nhập bằng mạng xã hội — chưa có mật khẩu email để đổi.');
    err.statusCode = 422;
    throw err;
  }
  const valid = await bcrypt.compare(String(currentPassword || ''), row.password_hash);
  if (!valid) {
    const err = new Error('Mật khẩu hiện tại không đúng.');
    err.statusCode = 401;
    throw err;
  }
  const hash = await bcrypt.hash(next, 10);
  await query('UPDATE users SET password_hash = $2, updated_at = NOW() WHERE id = $1', [userId, hash]);
}

const AFFILIATE_RATES = { f0_pct: 10, f1_pct: 5, f2_pct: 2.5 };
const AFFILIATE_LAYERS = ['F0', 'F1', 'F2'];

function buildUplineChain(userId, parents, maxDepth) {
  const chain = [];
  let current = String(userId);
  const visited = new Set();
  for (let depth = 0; depth < maxDepth; depth += 1) {
    const ref = parents[current];
    if (!ref || visited.has(ref)) break;
    const refId = String(ref);
    chain.push(refId);
    visited.add(refId);
    current = refId;
  }
  return chain;
}

function cycleLabel(cycle) {
  if (cycle === 'annual') return 'Hàng năm';
  if (cycle === 'lifetime') return 'Trọn đời';
  if (cycle === 'monthly') return 'Hàng tháng';
  return cycle || '—';
}

function buildSourceNote(layer, uplineIndex, uplineChain, usersById) {
  if (layer === 'F0') return 'Giới thiệu trực tiếp mua hàng';
  if (layer === 'F1' && uplineIndex >= 1) {
    const mid = usersById[uplineChain[uplineIndex - 1]];
    return mid ? `F0 của ${mid.display_name || 'Thành viên'}` : 'Giới thiệu cấp 2';
  }
  if (layer === 'F2') return 'Chuỗi F1 → F2';
  return 'Giới thiệu gián tiếp';
}

async function getAffiliateSync(userId) {
  userId = String(userId);
  const usersRes = await query(
    `SELECT id, display_name, referral_code, referred_by, subscription_tier, created_at, account_status
     FROM users`
  );
  const usersById = {};
  const parentsMap = {};
  usersRes.rows.forEach((row) => {
    usersById[row.id] = row;
    if (row.referred_by) parentsMap[row.id] = String(row.referred_by);
  });

  const ordersRes = await query(
    `SELECT o.id, o.user_id, o.plan_name, o.cycle, o.amount, o.status, o.created_at,
            u.display_name AS buyer_name, u.referred_by, u.subscription_tier
     FROM subscription_orders o
     JOIN users u ON u.id = o.user_id
     WHERE o.status IN ('approved', 'paid')
     ORDER BY o.created_at DESC`
  );

  const purchaseCounts = {};
  ordersRes.rows.forEach((order) => {
    const buyerId = String(order.user_id);
    purchaseCounts[buyerId] = (purchaseCounts[buyerId] || 0) + 1;
  });

  const members = [];
  Object.keys(parentsMap).forEach((childId) => {
    const chain = buildUplineChain(childId, parentsMap, 3);
    const idx = chain.indexOf(userId);
    if (idx < 0 || idx > 2) return;
    const user = usersById[childId];
    if (!user) return;
    const purchases = purchaseCounts[childId] || 0;
    members.push({
      id: String(user.id),
      display_name: user.display_name || 'Thành viên',
      referral_code: user.referral_code || '',
      layer: AFFILIATE_LAYERS[idx],
      referred_by: user.referred_by ? String(user.referred_by) : null,
      joined_at: user.created_at,
      tier: String(user.subscription_tier || 'free').toLowerCase(),
      via_user_id: idx === 0 ? null : chain[idx - 1],
      purchases,
      account_status: user.account_status || 'active',
      status: purchases > 0 ? 'purchased' : 'active'
    });
  });

  members.sort((a, b) => String(b.joined_at || '').localeCompare(String(a.joined_at || '')));

  const rates = [AFFILIATE_RATES.f0_pct, AFFILIATE_RATES.f1_pct, AFFILIATE_RATES.f2_pct];
  const events = [];
  ordersRes.rows.forEach((order) => {
    const buyerId = String(order.user_id);
    const chain = buildUplineChain(buyerId, parentsMap, 3);
    chain.forEach((referrerId, idx) => {
      if (referrerId !== userId) return;
      const pct = rates[idx];
      const commission = Math.round(Number(order.amount || 0) * pct / 100);
      if (commission <= 0) return;
      events.push({
        id: `srv_${order.id}_${AFFILIATE_LAYERS[idx]}`,
        beneficiaryId: userId,
        buyerId,
        buyerName: order.buyer_name || 'Thành viên',
        layer: AFFILIATE_LAYERS[idx],
        orderId: order.id,
        orderAmount: Number(order.amount || 0),
        commissionPct: pct,
        commission,
        productLabel: `${order.plan_name || 'Gói cước'} / ${cycleLabel(order.cycle)}`,
        sourceNote: buildSourceNote(AFFILIATE_LAYERS[idx], idx, chain, usersById),
        status: 'pending',
        paid: false,
        at: order.created_at
          ? String(order.created_at).slice(0, 10)
          : new Date().toISOString().slice(0, 10)
      });
    });
  });

  const userIds = new Set(members.map((m) => m.id));
  Object.values(parentsMap).forEach((refId) => userIds.add(String(refId)));
  userIds.add(userId);
  const users = Array.from(userIds).map((id) => {
    const user = usersById[id];
    if (!user) return null;
    return {
      id: String(user.id),
      display_name: user.display_name || 'Thành viên',
      referral_code: user.referral_code || ''
    };
  }).filter(Boolean);

  return {
    parentsMap,
    members,
    events,
    users,
    signups: members.filter((m) => m.layer === 'F0').length
  };
}

async function getUserBySocialProvider(provider, providerId) {
  const res = await query(
    'SELECT * FROM users WHERE auth_provider = $1 AND auth_provider_id = $2',
    [provider, providerId]
  );
  return res.rows[0] || null;
}

function placeholderEmail(provider, providerId) {
  return provider + '+' + providerId + '@social.iflux.local';
}

async function createSocialUser(provider, profile, referredBy) {
  const email =
    profile.email && profile.emailVerified !== false
      ? String(profile.email).toLowerCase()
      : placeholderEmail(provider, profile.providerId);
  let referralCode = genReferralCode();

  for (let i = 0; i < 5; i++) {
    try {
      const ins = await query(
        `INSERT INTO users (
          email, password_hash, display_name, nickname,
          auth_provider, auth_provider_id, referral_code, referred_by, email_verified_at
        ) VALUES ($1, NULL, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, email, subscription_tier, created_at`,
        [
          email,
          profile.displayName || null,
          profile.displayName || null,
          provider,
          profile.providerId,
          referralCode,
          referredBy || null,
          profile.emailVerified ? new Date() : null
        ]
      );
      return ins.rows[0];
    } catch (e) {
      if (e.code === '23505' && String(e.detail || e.constraint || '').includes('email')) {
        const err = new Error('Email already registered with another method');
        err.statusCode = 422;
        throw err;
      }
      if (e.code === '23505' && String(e.detail || '').includes('referral_code')) {
        referralCode = genReferralCode();
        continue;
      }
      throw e;
    }
  }
  const err = new Error('Could not create social user');
  err.statusCode = 500;
  throw err;
}

/**
 * Đăng nhập / đăng ký social — Identity orchestration.
 * Verify = VerifierRegistry → VerifiedIdentity (không verify token trong service này).
 * @param {object} config
 * @param {{ provider: string, id_token?: string, access_token?: string, oauth_code?: string, referral_code?: string }} payload
 */
async function socialLoginOrRegister(config, payload) {
  const provider = String(payload.provider || '').toLowerCase();
  const verified = await verifierRegistry.verify(config, provider, payload);
  const profile = toLegacySocialProfile(verified);

  let user = await getUserBySocialProvider(provider, profile.providerId);
  let isNew = false;

  if (!user && profile.email) {
    const byEmail = await getUserByEmail(profile.email);
    if (byEmail) {
      if (byEmail.auth_provider === 'email' || !byEmail.auth_provider_id) {
        await query(
          `UPDATE users SET auth_provider = $1, auth_provider_id = $2, email_verified_at = COALESCE(email_verified_at, NOW())
           WHERE id = $3`,
          [provider, profile.providerId, byEmail.id]
        );
        user = await getUserProfile(byEmail.id);
      } else {
        const err = new Error('Email already registered with another social account');
        err.statusCode = 422;
        throw err;
      }
    }
  }

  if (!user) {
    const referredBy = await resolveReferrer(payload.referral_code);
    user = await createSocialUser(provider, profile, referredBy);
    isNew = true;
    getLogger().info({ provider, userId: user.id }, 'Social user created');
    try {
      await emitReferralCreatedAfterIdentityCreated({
        newUserId: user.id,
        displayName: profile.displayName,
        referredById: referredBy
      });
    } catch (e) {
      getLogger().warn({ err: e && e.message, userId: user.id }, 'referral hook after social signup');
    }
  }

  return { user, isNew };
}

module.exports = {
  getUserByEmail,
  getUserProfile,
  startRegistration,
  resendVerificationOtp,
  loginUser,
  updateProfile,
  getUserPasswordCapability,
  changeUserPassword,
  verifyEmailCode,
  lookupReferrerByCode,
  getAffiliateSync,
  socialLoginOrRegister
};
