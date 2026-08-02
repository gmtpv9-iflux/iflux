'use strict';

require('dotenv').config();

const { loadConfig } = require('./config');
const { createLogger } = require('./core/logger/logger');
const { initPool, closePool } = require('./core/database/connection');
const { initRedis, closeRedis } = require('./core/cache/redis');
const { initStorage } = require('./core/storage/storage');
const { initQueue } = require('./core/queue/queue');
const { initScheduler, registerJob, stopAll } = require('./core/scheduler/scheduler');
const { createApp } = require('./app');
const { initMailer } = require('./core/email/mailer');

async function bootstrap() {
  const config = loadConfig();
  const logger = createLogger(config);

  initMailer(config);
  initPool(config);
  initRedis(config);
  initStorage(config);
  initQueue(config);
  initScheduler(config);

  registerJob('heartbeat', '*/5 * * * *', async () => {
    logger.debug('scheduler heartbeat');
  });

  /* RSS Cộng đồng — mỗi 10 phút → community_posts (đủ field → published_rss; thiếu → pending)
     Tắt: RSS_COMMUNITY_INGEST_CRON=off */
  const rssCron = process.env.RSS_COMMUNITY_INGEST_CRON || process.env.VNSTOCK_INGEST_CRON || '*/10 * * * *';
  if (rssCron !== 'off' && rssCron !== '0') {
    registerJob('rss-community-ingest', rssCron, async () => {
      try {
        const { runRssCommunityIngest } = require('./modules/community/rss-ingest.service');
        const out = await runRssCommunityIngest({});
        logger.info(
          {
            feeds: out && out.feeds,
            created: out && out.created,
            updated: out && out.updated
          },
          'rss-community-ingest done'
        );
      } catch (err) {
        logger.error({ err: err.message }, 'rss-community-ingest failed');
      }
    });
  }

  /* RAW-CONTENT-VNSTOCK (Content Engine) — mặc định tắt khi đã có RSS Cộng đồng; bật bằng VNSTOCK_INGEST_CRON */
  const vnCron = process.env.VNSTOCK_INGEST_CRON || 'off';
  if (vnCron !== 'off' && vnCron !== '0') {
    registerJob('vnstock-content-ingest', vnCron, async () => {
      try {
        const { runVnstockNewsIngest } = require('../workers/run-vnstock-ingest');
        const out = await runVnstockNewsIngest({ config });
        logger.info(
          {
            ok_count: out && out.result && out.result.ok_count,
            fail_count: out && out.result && out.result.fail_count,
            crawled: out && out.result && out.result.crawled
          },
          'vnstock-content-ingest done'
        );
      } catch (err) {
        logger.error({ err: err.message }, 'vnstock-content-ingest failed');
      }
    });
  }

  /* Tự động hóa cơ chế kích hoạt Media Import (Task 270731_Automated_Media_Import_Trigger) */
  if (config.MEDIA_IMPORT_AUTO_ENABLED !== false) {
    const mediaCron = process.env.MEDIA_IMPORT_AUTO_CRON || '*/1 * * * *'; // mặc định quét mỗi phút
    registerJob('media-auto-import', mediaCron, async () => {
      try {
        const { runAutoImportWorker } = require('./modules/media/media-trigger.worker');
        await runAutoImportWorker(config);
      } catch (err) {
        logger.error({ err: err.message }, 'media-auto-import failed');
      }
    });
  }

  // Seed RBAC (permissions catalog + super role + bootstrap admin). Không để lỗi làm sập server.
  try {
    const { bootstrapRbac } = require('./modules/admin-rbac/admin-rbac.service');
    await bootstrapRbac(config);
    logger.info('RBAC bootstrap done');
  } catch (err) {
    logger.error({ err: err.message }, 'RBAC bootstrap failed (chạy migration 014 chưa?)');
  }

  const app = createApp(config);
  const server = app.listen(config.PORT, config.HOST, () => {
    logger.info(
      {
        port: config.PORT,
        env: config.APP_ENV,
        api: config.API_PREFIX,
        legacy: config.LEGACY_API_PREFIX
      },
      'iFlux API started'
    );
  });

  async function shutdown(signal) {
    logger.info({ signal }, 'Shutting down');
    server.close(async () => {
      stopAll();
      await closeRedis();
      await closePool();
      process.exit(0);
    });
  }

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
