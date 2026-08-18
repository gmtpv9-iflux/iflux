'use strict';

const nodemailer = require('nodemailer');
const { getLogger } = require('../../logger/logger');

let transporter = null;

function isSmtpConfigured(config) {
  return !!(config.SMTP_HOST && config.SMTP_USER && config.SMTP_PASS);
}

function getTransporter(config) {
  if (transporter) return transporter;
  if (!isSmtpConfigured(config)) return null;

  transporter = nodemailer.createTransport({
    host: config.SMTP_HOST,
    port: config.SMTP_PORT,
    secure: config.SMTP_SECURE,
    auth: {
      user: config.SMTP_USER,
      pass: config.SMTP_PASS
    }
  });
  return transporter;
}

function initSmtpProvider(config) {
  getTransporter(config);
}

async function sendEmail(config, { to, subject, text, html }) {
  const transport = getTransporter(config);
  if (!transport) {
    const err = new Error('SMTP not configured');
    err.statusCode = 503;
    throw err;
  }

  const from = config.EMAIL_FROM || config.SMTP_FROM || config.SMTP_USER;
  await transport.sendMail({ from, to, subject, text, html });
  getLogger().info({ to, provider: 'smtp' }, 'Email sent');
}

module.exports = {
  name: 'smtp',
  isSmtpConfigured,
  initSmtpProvider,
  sendEmail
};
