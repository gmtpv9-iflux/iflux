'use strict';

const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

/**
 * Xác minh token Cloudflare Turnstile.
 * @returns {Promise<{ok:boolean, skipped?:boolean, reason?:string}>}
 */
async function verifyTurnstile(config, token, remoteIp) {
  const secret = config.TURNSTILE_SECRET_KEY;
  if (!secret) return { ok: true, skipped: true };
  if (!token) return { ok: false, reason: 'missing-token' };
  try {
    const params = new URLSearchParams();
    params.append('secret', secret);
    params.append('response', token);
    if (remoteIp) params.append('remoteip', remoteIp);

    const res = await fetch(TURNSTILE_VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    });
    const data = await res.json().catch(() => ({}));
    if (data && data.success) return { ok: true };
    return { ok: false, reason: (data['error-codes'] || []).join(',') || 'verify-failed' };
  } catch {
    return { ok: false, reason: 'verify-error' };
  }
}

function clientIp(req) {
  return (
    (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
    req.ip ||
    ''
  );
}

module.exports = { verifyTurnstile, clientIp };
