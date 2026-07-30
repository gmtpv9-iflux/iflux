'use strict';

const { buildTypeSeeds } = require('./notification-platform-seed-data');
const {
  LEGACY_TAG_TO_CANONICAL,
  CANONICAL_KEY_RE,
  TYPE_CODE_RE,
  ADMIN_CODE_RE,
  NON_DISPATCHABLE_TYPE_CODES
} = require('./variable-alias');

const PLACEHOLDER_RE = /\{([^}]+)\}/g;

function extractPlaceholders(text) {
  const found = [];
  const str = String(text || '');
  let m;
  PLACEHOLDER_RE.lastIndex = 0;
  while ((m = PLACEHOLDER_RE.exec(str)) !== null) {
    found.push(m[1]);
  }
  return found;
}

function validateNotificationSeeds(seeds) {
  seeds = seeds || buildTypeSeeds();
  const errors = [];
  const codes = new Set();
  const adminCodes = new Set();
  const legacyIds = new Set();

  seeds.forEach(function (item, index) {
    const prefix = 'Type[' + index + '] ' + (item.code || '?');

    if (!item.code || !TYPE_CODE_RE.test(item.code)) {
      errors.push(prefix + ': code invalid (DOMAIN_EVENT regex)');
    }
    if (codes.has(item.code)) errors.push(prefix + ': duplicate code');
    codes.add(item.code);

    if (!item.admin_code || !ADMIN_CODE_RE.test(item.admin_code)) {
      errors.push(prefix + ': admin_code invalid');
    }
    if (adminCodes.has(item.admin_code)) errors.push(prefix + ': duplicate admin_code');
    adminCodes.add(item.admin_code);

    if (legacyIds.has(item.legacy_case_id)) {
      errors.push(prefix + ': duplicate legacy_case_id');
    }
    legacyIds.add(item.legacy_case_id);

    if (typeof item.enabled !== 'boolean') {
      errors.push(prefix + ': enabled must be boolean');
    }

    if (item.code === 'PLATFORM_SMOKE_TEST' && item.enabled !== false) {
      errors.push(prefix + ': PLATFORM_SMOKE_TEST must have enabled=false (OD-C10)');
    }

    const channels = item.supported_channels || ['in_app'];
    if (!Array.isArray(channels) || !channels.length || channels.indexOf('in_app') < 0) {
      errors.push(prefix + ': supported_channels must include in_app');
    }

    if (!item.template) {
      errors.push(prefix + ': missing template block');
    } else {
      if (item.template.channel !== 'in_app') {
        errors.push(prefix + ': template.channel must be in_app');
      }
      if (!item.template.seed_title || !item.template.seed_body) {
        errors.push(prefix + ': template missing seed_title/seed_body');
      }
    }

    const varKeys = new Set();
    const legacyTags = new Set();
    (item.variables || []).forEach(function (v, vi) {
      if (!v.key || !CANONICAL_KEY_RE.test(v.key)) {
        errors.push(prefix + ' variables[' + vi + ']: invalid canonical key');
      }
      if (varKeys.has(v.key)) {
        errors.push(prefix + ': duplicate variable key ' + v.key);
      }
      varKeys.add(v.key);

      if (v.legacy_tag) {
        if (legacyTags.has(v.legacy_tag)) {
          errors.push(prefix + ': duplicate legacy_tag ' + v.legacy_tag);
        }
        legacyTags.add(v.legacy_tag);
        const mapped = LEGACY_TAG_TO_CANONICAL[v.legacy_tag];
        if (mapped && mapped !== v.key) {
          errors.push(prefix + ': legacy_tag ' + v.legacy_tag + ' maps to ' + mapped + ' not ' + v.key);
        }
        if (!mapped && v.legacy_tag !== v.key) {
          errors.push(prefix + ': unknown legacy_tag (not in variable-alias.js): ' + v.legacy_tag);
        }
      }
    });

    if (!item.variables || !item.variables.length) {
      errors.push(prefix + ': variables[] empty (Platform Contract OD-C7)');
    }

    if (item.template) {
      const placeholders = extractPlaceholders(item.template.title + ' ' + item.template.body);
      placeholders.forEach(function (ph) {
        const inVars = legacyTags.has(ph) || varKeys.has(ph);
        const knownLegacy = LEGACY_TAG_TO_CANONICAL[ph] && varKeys.has(LEGACY_TAG_TO_CANONICAL[ph]);
        if (!inVars && !knownLegacy) {
          errors.push(prefix + ': template placeholder {' + ph + '} not in Type.variables contract');
        }
      });
    }
  });

  NON_DISPATCHABLE_TYPE_CODES.forEach(function (code) {
    if (!codes.has(code)) {
      errors.push('Missing required internal type seed: ' + code);
    }
  });

  return { ok: errors.length === 0, errors: errors, count: seeds.length };
}

function main() {
  const result = validateNotificationSeeds();
  if (result.ok) {
    console.log('[validate-notification-seed] PASS —', result.count, 'types');
    process.exit(0);
  }
  console.error('[validate-notification-seed] FAIL —', result.errors.length, 'error(s):');
  result.errors.forEach(function (e) { console.error('  -', e); });
  process.exit(1);
}

if (require.main === module) {
  main();
}

module.exports = { validateNotificationSeeds, extractPlaceholders };
