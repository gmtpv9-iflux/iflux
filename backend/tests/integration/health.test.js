'use strict';

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');

const BASE = process.env.TEST_API_URL || 'http://127.0.0.1:3001';

function get(path) {
  return new Promise((resolve, reject) => {
    http
      .get(BASE + path, (res) => {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(body) });
          } catch {
            resolve({ status: res.statusCode, body });
          }
        });
      })
      .on('error', reject);
  });
}

describe('integration / health', () => {
  it('GET /health returns ok', async () => {
    const res = await get('/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.ok, true);
  });

  it('GET /v1/health/ready returns envelope', async () => {
    const res = await get('/v1/health/ready');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.checks.database, true);
  });
});
