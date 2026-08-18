'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { success, fail } = require('../../src/shared/response/api-response');

describe('api-response', () => {
  it('builds success envelope', () => {
    const res = {
      statusCode: 0,
      body: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(payload) {
        this.body = payload;
        return this;
      }
    };
    success(res, { ok: true });
    assert.equal(res.body.success, true);
    assert.deepEqual(res.body.data, { ok: true });
    assert.equal(res.body.error, null);
    assert.ok(res.body.meta.ts);
  });

  it('builds error envelope', () => {
    const res = {
      statusCode: 0,
      body: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(payload) {
        this.body = payload;
        return this;
      }
    };
    fail(res, { code: 'TEST', message: 'failed' }, 400);
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'TEST');
  });
});
