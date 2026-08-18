'use strict';

/**
 * Node wrapper: chạy Python worker RAW-CONTENT-VNSTOCK.
 * Env: ADMIN_API_KEY, IFLUX_API_BASE (default http://127.0.0.1:PORT/api)
 */
const path = require('path');
const { spawn } = require('child_process');

function runVnstockNewsIngest(opts) {
  opts = opts || {};
  const config = opts.config || {};
  const script = path.join(__dirname, 'vnstock_news_ingest.py');
  const python = opts.python || process.env.VNSTOCK_PYTHON || 'python3';
  const prefix = config.LEGACY_API_PREFIX || config.API_PREFIX || '/api';
  const apiBase =
    opts.apiBase ||
    process.env.IFLUX_API_BASE ||
    'http://127.0.0.1:' + (config.PORT || 3001) + prefix;
  const adminKey = opts.adminKey || process.env.ADMIN_API_KEY || config.ADMIN_API_KEY || '';
  const sites = opts.sites || process.env.VNSTOCK_SITES || 'cafef,vietstock';
  const limit = opts.limit != null ? String(opts.limit) : process.env.VNSTOCK_LIMIT || '15';
  const dryRun = !!opts.dryRun;

  const args = [
    script,
    '--sites',
    sites,
    '--limit',
    limit,
    '--api-base',
    apiBase,
    '--admin-key',
    adminKey
  ];
  if (dryRun) args.push('--dry-run');

  return new Promise(function (resolve, reject) {
    const child = spawn(python, args, {
      env: Object.assign({}, process.env, {
        ADMIN_API_KEY: adminKey,
        IFLUX_API_BASE: apiBase
      }),
      cwd: path.join(__dirname, '..')
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', function (d) {
      stdout += d.toString();
    });
    child.stderr.on('data', function (d) {
      stderr += d.toString();
    });
    child.on('error', reject);
    child.on('close', function (code) {
      let parsed = null;
      const lines = stdout.trim().split('\n').filter(Boolean);
      const last = lines[lines.length - 1] || '';
      try {
        parsed = JSON.parse(last);
      } catch (e) {
        parsed = { raw: stdout.slice(-2000) };
      }
      if (code !== 0 && !(parsed && parsed.ok_count > 0)) {
        const err = new Error('vnstock worker exit ' + code + (stderr ? ': ' + stderr.slice(-400) : ''));
        err.detail = parsed;
        err.stderr = stderr;
        return reject(err);
      }
      resolve({
        ok: true,
        exit_code: code,
        result: parsed,
        log: stderr.slice(-1500)
      });
    });
  });
}

module.exports = { runVnstockNewsIngest };
