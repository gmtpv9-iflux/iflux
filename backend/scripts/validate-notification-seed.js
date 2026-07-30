#!/usr/bin/env node
'use strict';

const { validateNotificationSeeds } = require('../src/modules/notifications/validate-notification-seed');

const result = validateNotificationSeeds();
if (result.ok) {
  console.log('[validate-notification-seed] PASS —', result.count, 'types');
  process.exit(0);
}
console.error('[validate-notification-seed] FAIL —', result.errors.length, 'error(s):');
result.errors.forEach(function (e) { console.error('  -', e); });
process.exit(1);
