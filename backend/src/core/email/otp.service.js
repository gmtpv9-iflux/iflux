'use strict';

const { getLogger } = require('../logger/logger');
const { buildVerificationOtpEmail } = require('./templates/verification-otp.template');
const smtpProvider = require('./providers/smtp.provider');
const resendProvider = require('./providers/resend.provider');

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

async function sendVerificationOtp(config, { to, code, displayName }) {
  const provider = getProvider(config);
  if (!provider) {
    const err = new Error('Email service not configured');
    err.statusCode = 503;
    throw err;
  }

  const { subject, text, html } = buildVerificationOtpEmail({ code, displayName });
  await provider.sendEmail(config, { to, subject, text, html });
}

module.exports = {
  initMailer,
  sendVerificationOtp,
  isConfigured,
  resolveProviderName,
  getProvider
};
