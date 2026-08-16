'use strict';

const { AppError } = require('../errors');

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILS = 8;

function createLoginThrottle() {
  const store = new Map();

  function keyOf(ip, email) {
    return String(ip || '') + '|' + String(email || '').toLowerCase();
  }

  return {
    check: function (ip, email) {
      const rec = store.get(keyOf(ip, email));
      if (!rec) return;
      if (Date.now() - rec.first > WINDOW_MS) {
        store.delete(keyOf(ip, email));
        return;
      }
      if (rec.count >= MAX_FAILS) {
        throw new AppError(
          'TOO_MANY_ATTEMPTS',
          'Quá nhiều lần thử. Vui lòng đợi ít phút rồi thử lại.',
          429
        );
      }
    },
    fail: function (ip, email) {
      const k = keyOf(ip, email);
      const rec = store.get(k);
      if (!rec || Date.now() - rec.first > WINDOW_MS) {
        store.set(k, { count: 1, first: Date.now() });
      } else {
        rec.count += 1;
      }
    },
    reset: function (ip, email) {
      store.delete(keyOf(ip, email));
    }
  };
}

module.exports = { createLoginThrottle };
