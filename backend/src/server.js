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

  /* RSS Cộng đồng — mỗi 10 phút → news_posts (đủ field → published_rss; thiếu → pending)
     Tắt: RSS_COMMUNITY_INGEST_CRON=off */
  const rssCron = process.env.RSS_COMMUNITY_INGEST_CRON || '*/10 * * * *';
  if (rssCron !== 'off' && rssCron !== '0') {
    registerJob('rss-news-ingest', rssCron, async () => {
      try {
        const { runRssNewsIngest } = require('./modules/news/rss-ingest.service');
        const out = await runRssNewsIngest({});
        logger.info(
          {
            feeds: out && out.feeds,
            created: out && out.created,
            updated: out && out.updated
          },
          'rss-news-ingest done'
        );
      } catch (err) {
        logger.error({ err: err.message }, 'rss-news-ingest failed');
      }
    });
  }

  /* Topic/Story lifecycle (Owner 2026-10, Phase 6 cuối ngày) — 00:00 hàng ngày:
     1) recomputeDailyStats — tính lại topic_daily_stats hôm nay.
     2) confirmPendingTopics — quét Topic đạt ngưỡng 100 lần nhắc nhưng bị sót (phòng hờ).
     3) cleanupInactiveTopics — xoá Topic không nhắc tới 90 ngày (CASCADE Story liên kết).
     4) evaluateAllStoryLifecycles — lifecycle 5-trạng-thái (percentile+window) của Story, tính
        trên Engagement Topic liên kết — Admin override thắng.
     5) autoCreateFromTopTrendingWeekly — Topic lọt Top 5 Thịnh hành tuần chưa có Story -> tự tạo.
     Tắt: TOPIC_LIFECYCLE_CRON=off. */
  const topicCron = process.env.TOPIC_LIFECYCLE_CRON || '0 0 * * *';
  if (topicCron !== 'off' && topicCron !== '0') {
    registerJob('topic-lifecycle-daily', topicCron, async () => {
      try {
        const topicsService = require('./modules/community/topics.service');
        const storiesService = require('./modules/community/stories.service');
        await topicsService.recomputeDailyStats();
        await topicsService.confirmPendingTopics();
        const cleanup = await topicsService.cleanupInactiveTopics();
        const lifecycle = await storiesService.evaluateAllStoryLifecycles();
        const autoCreate = await storiesService.autoCreateFromTopTrendingWeekly();
        logger.info(
          { deletedTopics: cleanup.deleted, storiesEvaluated: lifecycle.evaluated, storiesChanged: lifecycle.changed, storiesAutoCreated: autoCreate.created },
          'topic-lifecycle-daily done'
        );
      } catch (err) {
        logger.error({ err: err.message }, 'topic-lifecycle-daily failed');
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

  /* Market Data Sync Cycle — Sync Clock (interval từ market_price_sync_config) */
  try {
    const priceSync = require('./modules/market/market-price-sync.service');
    priceSync.startSyncClock(logger);
    logger.info('market-data-sync-clock started');
  } catch (err) {
    logger.error({ err: err.message }, 'market-data-sync-clock failed to start');
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
      try {
        require('./modules/market/market-price-sync.service').stopSyncClock();
      } catch (_e) { /* ignore */ }
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
