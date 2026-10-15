'use strict';

const { getLogger } = require('../logger/logger');
const { buildVerificationOtpEmail } = require('./templates/verification-otp.template');
const smtpProvider = require('./providers/smtp.provider');
const resendProvider = require('./providers/resend.provider');

const PUBLIC_ORIGIN = 'https://iflux.vn';

function absolutizeAsset(url) {
  var raw = String(url || '').trim();
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.indexOf('//') === 0) return 'https:' + raw;
  return PUBLIC_ORIGIN + (raw.charAt(0) === '/' ? raw : '/' + raw);
}

/** Logo footer mail = cùng nguồn Admin → Cài đặt SEO → SEO Hệ thống → Logo (marketing_brand_identity,
 * code='primary'). Best-effort — lỗi đọc DB không được chặn gửi OTP, chỉ bỏ qua logo. */
async function resolveFooterLogoUrl() {
  try {
    var siteSeo = require('../../modules/site-seo/site-seo.service');
    var data = await siteSeo.getGlobalSeo();
    var raw = data && data.payload && data.payload.logoUrl;
    return absolutizeAsset(raw);
  } catch (e) {
    getLogger().warn({ err: e && e.message }, 'Không đọc được logo SEO hệ thống cho mail OTP — bỏ qua');
    return '';
  }
}

const PROVIDERS = {
  smtp: smtpProvider,
  resend: resendProvider
};

function resolveProviderName(config) {
  const explicit = String(config.EMAIL_PROVIDER || '').toLowerCase();
  if (explicit && PROVIDERS[explicit]) return explicit;
  if (resendProvider.isResendConfigured(config)) return 'resend';
  if (smtpProvider.isSmtpConfigured(config)) return 'smtp';
  return '';
}

function getProvider(config) {
  const name = resolveProviderName(config);
  return name ? PROVIDERS[name] : null;
}

function isConfigured(config) {
  return !!resolveProviderName(config);
}

function initMailer(config) {
  const name = resolveProviderName(config);
  if (!name) {
    getLogger().warn(
      'Email OTP chưa cấu hình — local dùng OTP demo; staging/production cần RESEND_API_KEY hoặc SMTP'
    );
    return;
  }
  if (name === 'smtp') smtpProvider.initSmtpProvider(config);
  else resendProvider.initResendProvider(config);
  getLogger().info({ provider: name }, 'Email OTP provider ready');
}

async function sendVerificationOtp(config, { to, code, displayName, expiryMinutes }) {
  const provider = getProvider(config);
  if (!provider) {
    const err = new Error('Email service not configured');
    err.statusCode = 503;
    throw err;
  }

  const logoUrl = await resolveFooterLogoUrl();
  const { subject, text, html } = buildVerificationOtpEmail({ code, displayName, expiryMinutes, logoUrl });
  await provider.sendEmail(config, { to, subject, text, html });
}

module.exports = {
  initMailer,
  sendVerificationOtp,
  isConfigured,
  resolveProviderName,
  getProvider
};
