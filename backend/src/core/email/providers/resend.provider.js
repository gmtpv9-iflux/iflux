'use strict';

const { getLogger } = require('../../logger/logger');

function isResendConfigured(config) {
  return !!(config.RESEND_API_KEY && getFromAddress(config));
}

function getFromAddress(config) {
  return config.EMAIL_FROM || config.RESEND_FROM || config.SMTP_FROM || null;
}

function initResendProvider() {
  /* stateless — API key per request */
}

async function sendEmail(config, { to, subject, text, html }) {
  if (!isResendConfigured(config)) {
    const err = new Error('Resend not configured');
    err.statusCode = 503;
    throw err;
  }

  const from = getFromAddress(config);
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + config.RESEND_API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      html,
      text
    })
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.message || data.error || 'Resend API failed');
    err.statusCode = res.status >= 500 ? 503 : 422;
    throw err;
  }

  getLogger().info({ to, provider: 'resend', id: data.id }, 'Email sent');
}

module.exports = {
  name: 'resend',
  isResendConfigured,
  getFromAddress,
  initResendProvider,
  sendEmail
};
