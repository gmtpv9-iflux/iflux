'use strict';

/**
 * Wave A — Backfill author attribution SoT trên news_posts.
 * Owner LOCK: VCCorp / rss:cafef → CafeF (kể cả published); published_rss theo source_id.
 * Không rewrite body_html.
 */
const { query } = require('../../core/database/connection');
const {
  resolveRssAuthor,
  looksLikeVccorp,
  isLegacyRssAuthorId
} = require('./news-entity-resolve.service');

function providerFromPayload(p) {
  return (
    (p && p.source_id) ||
    (p && p.source && (p.source.id || p.source.name)) ||
    p.source_name ||
    (p.author && p.author.id) ||
    ''
  );
}

function needsAttributionFix(p, status) {
  const author = (p && p.author) || {};
  const id = String(author.id || '');
  const name = String(author.display_name || author.name || '');
  const vendorName = (p && p.vendor && (p.vendor.name || p.vendor.display_name)) || '';
  if (looksLikeVccorp(name) || looksLikeVccorp(vendorName)) return true;
  if (id === 'rss-author' || id.indexOf('rss:') === 0) return true;
  if (!author.id || !name) return true;
  if (status === 'published_rss') {
    const want = resolveRssAuthor(providerFromPayload(p));
    if (want && (want.id !== id || want.display_name !== name)) return true;
  }
  if (p && (p.vendor || p.publisher || p.provider)) return true;
  return false;
}

function resolveBackfillAuthor(p, status) {
  const fromSource = resolveRssAuthor(providerFromPayload(p));
  const author = (p && p.author) || {};
  const name = String(author.display_name || author.name || '');
  const vendorName = (p && p.vendor && (p.vendor.name || p.vendor.display_name)) || '';

  /* Owner §10.1: mọi VCCorp / legacy rss cafef → CafeF */
  if (
    looksLikeVccorp(name) ||
    looksLikeVccorp(vendorName) ||
    String(author.id || '') === 'rss:cafef' ||
    String(author.id || '') === 'rss-author'
  ) {
    return resolveRssAuthor(fromSource ? fromSource.id : 'cafef') || resolveRssAuthor('cafef');
  }

  if (status === 'published_rss' || p.from_rss || p.origin === 'rss') {
    return fromSource || resolveRssAuthor(author.id) || author;
  }

  if (isLegacyRssAuthorId(author.id) && fromSource) {
    return fromSource;
  }

  return author;
}

async function backfillAuthorAttributionSoT(opts) {
  opts = opts || {};
  const limit = Math.min(Math.max(Number(opts.limit) || 5000, 1), 20000);
  const dryRun = !!opts.dryRun;

  const before = await query(
    `SELECT
       COUNT(*) FILTER (
         WHERE payload->'author'->>'display_name' ILIKE '%vccorp%'
            OR payload->'vendor'->>'name' ILIKE '%vccorp%'
       )::int AS vccorp_author,
       COUNT(*) FILTER (
         WHERE payload->'author'->>'id' IN ('rss:cafef','rss-author')
       )::int AS legacy_rss_id,
       COUNT(*)::int AS total
     FROM news_posts`
  );

  const res = await query(
    `SELECT id, status, payload FROM news_posts
     ORDER BY updated_at DESC NULLS LAST
     LIMIT $1`,
    [limit]
  );

  let scanned = 0;
  let updated = 0;
  let skipped = 0;
  const samples = [];

  for (let i = 0; i < res.rows.length; i++) {
    const row = res.rows[i];
    scanned += 1;
    const p = row.payload || {};
    if (!needsAttributionFix(p, row.status)) {
      skipped += 1;
      continue;
    }
    const nextAuthor = resolveBackfillAuthor(p, row.status);
    if (!nextAuthor || !nextAuthor.id || !nextAuthor.display_name) {
      skipped += 1;
      continue;
    }
    const merged = Object.assign({}, p, {
      author: {
        id: nextAuthor.id,
        display_name: nextAuthor.display_name,
        tier: nextAuthor.tier != null ? nextAuthor.tier : null,
        tier_label: nextAuthor.tier_label != null ? nextAuthor.tier_label : null
      },
      publisher: null,
      provider: null,
      vendor: null
    });

    if (samples.length < 8) {
      samples.push({
        id: row.id,
        status: row.status,
        from: p.author || null,
        to: merged.author
      });
    }

    if (!dryRun) {
      await query(
        `UPDATE news_posts
         SET payload = $2::jsonb, updated_at = NOW()
         WHERE id = $1`,
        [row.id, JSON.stringify(merged)]
      );
    }
    updated += 1;
  }

  const after = dryRun
    ? null
    : (
        await query(
          `SELECT
             COUNT(*) FILTER (
               WHERE payload->'author'->>'display_name' ILIKE '%vccorp%'
                  OR payload->'vendor'->>'name' ILIKE '%vccorp%'
             )::int AS vccorp_author,
             COUNT(*) FILTER (
               WHERE payload->'author'->>'id' IN ('rss:cafef','rss-author')
             )::int AS legacy_rss_id
           FROM news_posts`
        )
      ).rows[0];

  return {
    ok: true,
    dryRun,
    before: before.rows[0],
    after,
    scanned,
    updated,
    skipped,
    samples
  };
}

module.exports = {
  backfillAuthorAttributionSoT,
  resolveBackfillAuthor,
  needsAttributionFix
};
