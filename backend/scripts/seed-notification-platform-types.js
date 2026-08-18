'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { loadConfig } = require('../src/config');
const { initPool, getPool, closePool } = require('../src/core/database/connection');
const { buildTypeSeeds } = require('../src/modules/notifications/notification-platform-seed-data');
const { validateNotificationSeeds } = require('../src/modules/notifications/validate-notification-seed');

async function seedNotificationPlatformTypes() {
  const seeds = buildTypeSeeds();
  const validation = validateNotificationSeeds(seeds);
  if (!validation.ok) {
    console.error('[seed-notification-platform] validate FAIL — abort seed (OD-C5/C9)');
    validation.errors.forEach(function (e) { console.error('  -', e); });
    throw new Error('Seed validation failed');
  }

  initPool(loadConfig());
  const pool = getPool();
  const client = await pool.connect();
  let insertedTypes = 0;
  let updatedTypes = 0;
  let insertedTemplates = 0;
  let updatedTemplates = 0;

  try {
    await client.query('BEGIN');

    for (const item of seeds) {
      const typeRes = await client.query(
        `INSERT INTO notification_types (
           code, legacy_case_id, admin_code, name, description, category,
           group_label, channel_label, variables, sample_variables,
           supported_channels, enabled, icon
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10::jsonb,$11::jsonb,$12,$13)
         ON CONFLICT (code) DO UPDATE SET
           legacy_case_id = EXCLUDED.legacy_case_id,
           admin_code = EXCLUDED.admin_code,
           name = EXCLUDED.name,
           description = EXCLUDED.description,
           category = EXCLUDED.category,
           group_label = EXCLUDED.group_label,
           channel_label = EXCLUDED.channel_label,
           variables = EXCLUDED.variables,
           sample_variables = EXCLUDED.sample_variables,
           supported_channels = EXCLUDED.supported_channels,
           enabled = EXCLUDED.enabled,
           icon = EXCLUDED.icon,
           updated_at = NOW()
         RETURNING (xmax = 0) AS inserted`,
        [
          item.code,
          item.legacy_case_id,
          item.admin_code,
          item.name,
          item.description,
          item.category,
          item.group_label,
          item.channel_label,
          JSON.stringify(item.variables),
          JSON.stringify(item.sample_variables),
          JSON.stringify(item.supported_channels),
          item.enabled,
          item.icon
        ]
      );
      if (typeRes.rows[0] && typeRes.rows[0].inserted) insertedTypes += 1;
      else updatedTypes += 1;

      const tpl = item.template;
      const tplRes = await client.query(
        `INSERT INTO notification_templates (
           type_code, channel, title, body, seed_title, seed_body, enabled, version
         ) VALUES ($1,$2,$3,$4,$5,$6,true,1)
         ON CONFLICT (type_code, channel) DO UPDATE SET
           seed_title = EXCLUDED.seed_title,
           seed_body = EXCLUDED.seed_body,
           updated_at = NOW()
         RETURNING (xmax = 0) AS inserted`,
        [
          item.code,
          tpl.channel,
          tpl.title,
          tpl.body,
          tpl.seed_title,
          tpl.seed_body
        ]
      );
      if (tplRes.rows[0] && tplRes.rows[0].inserted) insertedTemplates += 1;
      else updatedTemplates += 1;
    }

    await client.query('COMMIT');
    console.log('[seed-notification-platform] types inserted:', insertedTypes, 'updated:', updatedTypes);
    console.log('[seed-notification-platform] templates inserted:', insertedTemplates, 'seed_updated:', updatedTemplates);
    console.log('[seed-notification-platform] total seeds:', seeds.length);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

seedNotificationPlatformTypes()
  .then(async function () { await closePool(); process.exit(0); })
  .catch(async function (err) {
    console.error('[seed-notification-platform] failed:', err.message || err);
    try { await closePool(); } catch (e) { /* ignore */ }
    process.exit(1);
  });
