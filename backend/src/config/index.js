'use strict';

const { z } = require('zod');

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production', 'test']).default('development'),
  APP_ENV: z.enum(['local', 'staging', 'production']).default('local'),
  PORT: z.coerce.number().int().positive().default(3001),
  HOST: z.string().default('0.0.0.0'),
  DATABASE_URL: z.string().min(1),
  DATABASE_ADMIN_URL: z.string().optional(),
  DATABASE_NAME: z.string().default('iflux_dev'),
  DATABASE_USER: z.string().default('iflux'),
  DATABASE_PASSWORD: z.string().default('iflux_local'),
  REDIS_URL: z.string().optional(),
  JWT_SECRET: z.string().min(8),
  JWT_EXPIRES_IN: z.string().default('7d'),
  JWT_REMEMBER_EXPIRES_IN: z.string().default('30d'),
  CORS_ORIGIN: z.string().default('*'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  STORAGE_DRIVER: z.enum(['local', 's3']).default('local'),
  STORAGE_LOCAL_PATH: z.string().default('./storage'),
  MEDIA_PUBLIC_BASE_URL: z.string().optional().default('/media'),
  QUEUE_ENABLED: z
    .string()
    .optional()
    .transform((v) => v === 'true' || v === '1'),
  SCHEDULER_ENABLED: z
    .string()
    .optional()
    .transform((v) => v !== 'false' && v !== '0'),
  API_PREFIX: z.string().default('/v1'),
  LEGACY_API_PREFIX: z.string().default('/api'),
  ADMIN_API_KEY: z.string().default('iflux-admin-local-dev'),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_SECURE: z
    .string()
    .optional()
    .transform((v) => v === 'true' || v === '1'),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
  EMAIL_PROVIDER: z.enum(['resend', 'smtp']).optional(),
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM: z.string().optional(),
  EMAIL_OTP_DEMO_CODE: z.string().length(6).default('123456'),
  EMAIL_OTP_DEMO: z
    .string()
    .optional()
    .transform((v) => v === 'true' || v === '1'),
  GOOGLE_CLIENT_ID: z.string().optional(),
  APPLE_CLIENT_ID: z.string().optional(),
  APPLE_TEAM_ID: z.string().optional(),
  APPLE_KEY_ID: z.string().optional(),
  APPLE_PRIVATE_KEY: z.string().optional(),
  FACEBOOK_APP_ID: z.string().optional(),
  FACEBOOK_APP_SECRET: z.string().optional(),
  ZALO_APP_ID: z.string().optional(),
  ZALO_APP_SECRET: z.string().optional(),
  ZALO_OAUTH_REDIRECT_URI: z.string().optional(),
  ADMIN_ALLOWED_EMAILS: z.string().optional(),
  ADMIN_PASSWORD_HASH: z.string().optional(),
  ADMIN_PASSWORD_HASHES: z.string().optional(),
  TURNSTILE_SITE_KEY: z.string().optional(),
  TURNSTILE_SECRET_KEY: z.string().optional(),
  DNSE_API_KEY: z.string().optional(),
  DNSE_API_SECRET: z.string().optional(),
  DNSE_BASE_URL: z.string().default('https://openapi.dnse.com.vn'),
  DNSE_API_VERSION: z.string().default('2026-05-07'),
  DNSE_DATE_HEADER: z.string().default('X-Aux-Date'),
  DNSE_ACCOUNT_EMAIL: z.string().optional(),
  DNSE_USERNAME: z.string().optional(),
  DNSE_PASSWORD: z.string().optional(),
  DNSE_AUTH_URL: z.string().default('https://api.dnse.com.vn/auth-service/login'),
  DNSE_DATAFEED_HOST: z.string().default('datafeed-lts-krx.dnse.com.vn'),
  DNSE_DATAFEED_PORT: z.coerce.number().int().positive().default(443),
  DNSE_DATAFEED_PATH: z.string().default('/wss'),
  MEDIA_IMPORT_AUTO_ENABLED: z
    .string()
    .optional()
    .transform((v) => v !== 'false' && v !== '0')
    .default('true'),
  MEDIA_IMPORT_BATCH_SIZE: z.coerce.number().int().positive().default(5),
  MEDIA_IMPORT_MAX_RETRY: z.coerce.number().int().positive().default(3),
  PUBLIC_SITE_URL: z.string().url().default('https://iflux.vn'),
  SEO_STATIC_LASTMOD: z.string().optional()
});

function loadConfig() {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const details = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new Error(`Invalid environment configuration: ${details}`);
  }
  return Object.freeze(parsed.data);
}

module.exports = { loadConfig };
