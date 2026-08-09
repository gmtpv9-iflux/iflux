'use strict';

/**
 * Market Data Sync Cycle → Price Ingest → stock_prices (Current Market Price State).
 * Polling = Sync Clock; UPSERT (ticker, trading_date, source) — không tạo history theo cycle.
 */

const { query } = require('../../core/database/connection');
const { AppError } = require('../../shared/exceptions/app-error');
const runtimeQuotes = require('./market-runtime-quotes.service');
const timeCfg = require('./market-time-config.service');

const ALLOWED_INTERVALS = [10, 30, 60, 300, 900];
const SOURCE_VNDIRECT = 'vndirect_finfo';
const SOURCE_DNSE = 'dnse';

let cycleRunning = false;
let clockTimer = null;

function numOrNull(v) {
  if (v == null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function tradingDateFromSource(dateStr) {
  if (dateStr && /^\d{4}-\d{2}-\d{2}/.test(String(dateStr))) {
    return String(dateStr).slice(0, 10);
  }
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  return fmt.format(new Date());
}

async function getSyncConfig() {
  const res = await query('SELECT * FROM market_price_sync_config WHERE id = 1');
  return res.rows[0] || null;
}

async function updateSyncConfig(patch) {
  const cur = await getSyncConfig();
  if (!cur) throw AppError.notFound('Chưa có market_price_sync_config');

  let enabled = cur.enabled;
  if (patch.enabled !== undefined) enabled = !!patch.enabled;

  let interval = Number(cur.interval_seconds);
  if (patch.interval_seconds !== undefined) {
    interval = Number(patch.interval_seconds);
    if (ALLOWED_INTERVALS.indexOf(interval) < 0) {
      throw AppError.badRequest(
        'VALIDATION',
        'interval_seconds phải thuộc ' + ALLOWED_INTERVALS.join(', ')
      );
    }
  }

  let nextSync = cur.next_sync_at;
  if (patch.interval_seconds !== undefined || patch.enabled === true) {
    nextSync = new Date();
  }

  const res = await query(
    `UPDATE market_price_sync_config
     SET enabled = $1,
         interval_seconds = $2,
         next_sync_at = COALESCE($3, next_sync_at),
         updated_at = NOW()
     WHERE id = 1
     RETURNING *`,
    [enabled, interval, nextSync]
  );
  return res.rows[0];
}

async function resolveIngestSourceCode() {
  const res = await query(
    `SELECT s.code
     FROM market_source_field_authority a
     JOIN data_sources s ON s.id = a.source_id
     WHERE a.entity = 'stock_price'
       AND a.field_key = 'close'
       AND a.trust_level IN ('trusted', 'review_required')
       AND s.channel_class = 'external_provider'
     LIMIT 1`
  );
  return (res.rows[0] && res.rows[0].code) || SOURCE_VNDIRECT;
}

async function listActiveTickers() {
  const res = await query(
    `SELECT ticker FROM stocks
     WHERE COALESCE(status, 'active') NOT IN ('delisted', 'inactive', 'disabled')
     ORDER BY ticker`
  );
  return (res.rows || []).map(function (r) {
    return String(r.ticker).toUpperCase();
  });
}

async function resolveInstrumentSourceCode() {
  const res = await query(
    `SELECT s.code
     FROM market_source_field_authority a
     JOIN data_sources s ON s.id = a.source_id
     WHERE a.entity = 'stock'
       AND a.field_key = 'ticker'
       AND a.trust_level IN ('trusted', 'review_required')
       AND s.channel_class = 'external_provider'
     LIMIT 1`
  );
  return (res.rows[0] && res.rows[0].code) || SOURCE_DNSE;
}

function normalizeExchange(exchangeHint) {
  let ex = String(exchangeHint || '')
    .trim()
    .toUpperCase();
  if (ex === 'STO' || ex === 'HSX') ex = 'HOSE';
  if (ex === 'STX') ex = 'HNX';
  if (ex === 'UPX') ex = 'UPCOM';
  if (ex !== 'HOSE' && ex !== 'HNX' && ex !== 'UPCOM') return null;
  return ex;
}

function isStubName(name, ticker) {
  const n = String(name || '').trim();
  if (!n) return true;
  return n.toUpperCase() === String(ticker || '').toUpperCase();
}

function hasListedIdentity(c) {
  if (!c) return false;
  const name = c.name != null ? String(c.name).trim() : '';
  const shortName = c.short_name != null ? String(c.short_name).trim() : '';
  return !!(name || shortName);
}

/**
 * LISTED authority → Stock Master (BR-MS-02 / BR-MS-04).
 * Fill-only khi Master stub/null — không đè tên Admin đã có.
 * Cấm gọi từ quote path với name=ticker (BR-MS-05).
 */
async function ensureStockRow(ticker, meta) {
  meta = meta || {};
  const t = String(ticker || '')
    .trim()
    .toUpperCase();
  if (!t) return { ok: false, reason: 'no_ticker' };

  const ex = normalizeExchange(meta.exchange);
  if (!ex) return { ok: false, reason: 'bad_exchange' };

  const name = meta.name != null ? String(meta.name).trim() : '';
  const shortName = meta.short_name != null ? String(meta.short_name).trim() : '';
  const englishName = meta.english_name != null ? String(meta.english_name).trim() : '';
  const isin = meta.isin != null ? String(meta.isin).trim() : '';
  if (!name && !shortName) return { ok: false, reason: 'no_listed_identity' };

  const displayName = name || shortName;

  const before = await query(
    `SELECT ticker, name, short_name, english_name, exchange, isin
     FROM stocks WHERE ticker = $1`,
    [t]
  );
  const cur = before.rows[0] || null;

  if (!cur) {
    await query(
      `INSERT INTO stocks (
         ticker, name, short_name, english_name, exchange, isin, status, updated_at
       ) VALUES ($1, $2, $3, $4, $5, $6, 'active', NOW())`,
      [
        t,
        displayName,
        shortName || null,
        englishName || null,
        ex,
        isin || null
      ]
    );
    return { ok: true, created: true, filled: true };
  }

  const sets = [];
  const params = [t];
  function pushSet(col, val) {
    params.push(val);
    sets.push(col + ' = $' + params.length);
  }

  if (displayName && isStubName(cur.name, t)) pushSet('name', displayName);
  if (shortName && (cur.short_name == null || String(cur.short_name).trim() === '')) {
    pushSet('short_name', shortName);
  }
  if (englishName && (cur.english_name == null || String(cur.english_name).trim() === '')) {
    pushSet('english_name', englishName);
  }
  if (ex && (!cur.exchange || String(cur.exchange).toUpperCase() !== ex)) {
    /* fill/correct exchange từ LISTED khi lệch stub */
    pushSet('exchange', ex);
  }
  if (isin && (cur.isin == null || String(cur.isin).trim() === '')) {
    pushSet('isin', isin);
  }

  if (!sets.length) return { ok: true, created: false, filled: false };

  await query(
    'UPDATE stocks SET ' + sets.join(', ') + ', updated_at = NOW() WHERE ticker = $1',
    params
  );
  return { ok: true, created: false, filled: true };
}

function emptyReconcileBucket() {
  return { missing_in_master: [], stub_identity: [], exchange_mismatch: [] };
}

/**
 * BR-MS-06: LISTED ↔ Master theo HOSE/HNX/UPCOM.
 * listedByTicker: map ticker → { name, short_name, exchange }
 */
async function reconcileListedVsMaster(listedByTicker) {
  const byEx = {
    HOSE: emptyReconcileBucket(),
    HNX: emptyReconcileBucket(),
    UPCOM: emptyReconcileBucket()
  };
  const tickers = Object.keys(listedByTicker);
  if (!tickers.length) {
    return { by_exchange: byEx, totals: { missing: 0, stub: 0, exchange_mismatch: 0 } };
  }

  const res = await query(
    `SELECT ticker, name, short_name, exchange
     FROM stocks WHERE ticker = ANY($1::varchar[])`,
    [tickers]
  );
  const master = Object.create(null);
  (res.rows || []).forEach(function (r) {
    master[String(r.ticker).toUpperCase()] = r;
  });

  tickers.forEach(function (tk) {
    const src = listedByTicker[tk];
    const ex = normalizeExchange(src.exchange) || 'HOSE';
    const bucket = byEx[ex] || byEx.HOSE;
    const cur = master[tk];
    if (!cur) {
      bucket.missing_in_master.push(tk);
      return;
    }
    const srcHasShort = !!(src.short_name && String(src.short_name).trim());
    const srcHasName = !!(src.name && String(src.name).trim());
    if (
      (srcHasShort || srcHasName) &&
      (isStubName(cur.name, tk) || cur.short_name == null || String(cur.short_name).trim() === '')
    ) {
      bucket.stub_identity.push(tk);
    }
    const curEx = normalizeExchange(cur.exchange);
    if (curEx && ex && curEx !== ex) bucket.exchange_mismatch.push(tk);
  });

  function countAll(key) {
    return byEx.HOSE[key].length + byEx.HNX[key].length + byEx.UPCOM[key].length;
  }

  return {
    by_exchange: {
      HOSE: {
        missing_in_master: byEx.HOSE.missing_in_master.length,
        stub_identity: byEx.HOSE.stub_identity.length,
        exchange_mismatch: byEx.HOSE.exchange_mismatch.length,
        sample_missing: byEx.HOSE.missing_in_master.slice(0, 10),
        sample_stub: byEx.HOSE.stub_identity.slice(0, 10)
      },
      HNX: {
        missing_in_master: byEx.HNX.missing_in_master.length,
        stub_identity: byEx.HNX.stub_identity.length,
        exchange_mismatch: byEx.HNX.exchange_mismatch.length,
        sample_missing: byEx.HNX.missing_in_master.slice(0, 10),
        sample_stub: byEx.HNX.stub_identity.slice(0, 10)
      },
      UPCOM: {
        missing_in_master: byEx.UPCOM.missing_in_master.length,
        stub_identity: byEx.UPCOM.stub_identity.length,
        exchange_mismatch: byEx.UPCOM.exchange_mismatch.length,
        sample_missing: byEx.UPCOM.missing_in_master.slice(0, 10),
        sample_stub: byEx.UPCOM.stub_identity.slice(0, 10)
      }
    },
    totals: {
      missing: countAll('missing_in_master'),
      stub: countAll('stub_identity'),
      exchange_mismatch: countAll('exchange_mismatch')
    }
  };
}

async function syncInstrumentUniverseFromVndirectList() {
  const adapters = require('./market-source-adapters');
  const candidates = await adapters.loadCandidates('vndirect_finfo', {});
  let created = 0;
  let filled = 0;
  let skippedSectorOnly = 0;
  let skippedBad = 0;
  const listedByTicker = Object.create(null);

  for (let i = 0; i < candidates.length; i++) {
    const c = candidates[i];
    if (!c || !c.ticker) continue;

    if (!hasListedIdentity(c)) {
      skippedSectorOnly += 1;
      continue;
    }

    listedByTicker[c.ticker] = {
      name: c.name,
      short_name: c.short_name,
      exchange: c.exchange
    };

    const out = await ensureStockRow(c.ticker, {
      name: c.name,
      short_name: c.short_name,
      english_name: c.english_name,
      exchange: c.exchange,
      isin: c.isin
    });
    if (!out || !out.ok) {
      skippedBad += 1;
      continue;
    }
    if (out.created) created += 1;
    if (out.filled) filled += 1;
  }

  const reconcile = await reconcileListedVsMaster(listedByTicker);

  return {
    source_code: 'vndirect_finfo',
    received: candidates.length,
    listed_identity: Object.keys(listedByTicker).length,
    new_auto: created,
    filled: filled,
    skipped_sector_only: skippedSectorOnly,
    skipped_bad: skippedBad,
    reconcile: reconcile,
    mode: 'full_universe_list_auto_new'
  };
}

async function syncInstrumentUniverse() {
  const mdm = require('./market-mdm.service');
  const code = await resolveInstrumentSourceCode();
  let primary = null;
  let primaryError = null;
  try {
    primary = await mdm.runImportFromSource(code, { skipMissing: true, deferApply: false }, null);
  } catch (err) {
    primaryError = err && err.message ? err.message : String(err);
  }

  /*
   * BR-MS-02/04/06: luôn chạy LISTED fill + reconcile (idempotent).
   * MDM có thể để stub/conflict tên — LISTED authority fill-only bổ sung.
   */
  const listedFill = await syncInstrumentUniverseFromVndirectList();

  const out = {
    primary: primary,
    listed_fill: listedFill,
    source_code: code
  };
  if (primaryError) out.primary_error = primaryError;
  return out;
}

async function upsertPriceRow(row) {
  await query(
    `INSERT INTO stock_prices (
       ticker, trading_date, open, high, low, close, volume, trading_value,
       reference_price, price_change, price_change_percent, source, created_at, updated_at
     ) VALUES (
       $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW(),NOW()
     )
     ON CONFLICT (ticker, trading_date, source) DO UPDATE SET
       open = EXCLUDED.open,
       high = EXCLUDED.high,
       low = EXCLUDED.low,
       close = EXCLUDED.close,
       volume = EXCLUDED.volume,
       trading_value = EXCLUDED.trading_value,
       reference_price = EXCLUDED.reference_price,
       price_change = EXCLUDED.price_change,
       price_change_percent = EXCLUDED.price_change_percent,
       updated_at = NOW()`,
    [
      row.ticker,
      row.trading_date,
      row.open,
      row.high,
      row.low,
      row.close,
      row.volume,
      row.trading_value,
      row.reference_price,
      row.price_change,
      row.price_change_percent,
      row.source
    ]
  );
}

/**
 * Fetch from source + map → UPSERT. NEW ticker → ensure Master rồi ghi giá.
 * v1: chỉ vndirect_finfo.
 */
async function priceIngestFromSource(sourceCode, tickers) {
  if (sourceCode !== SOURCE_VNDIRECT) {
    throw AppError.badRequest(
      'VALIDATION',
      'Price Ingest v1 chỉ hỗ trợ vndirect_finfo (Current Source: ' + sourceCode + ')'
    );
  }
  const fetched = await runtimeQuotes.fetchProviderQuotes(tickers);
  const quotes = (fetched && fetched.quotes) || {};
  const keys = Object.keys(quotes);
  if (!keys.length) return 0;

  /* BR-MS-05: quote/price không tạo Stock Master identity */
  const masterRes = await query(
    `SELECT ticker FROM stocks WHERE ticker = ANY($1::varchar[])`,
    [keys.map(function (k) {
      return String(k).toUpperCase();
    })]
  );
  const inMaster = Object.create(null);
  (masterRes.rows || []).forEach(function (r) {
    inMaster[String(r.ticker).toUpperCase()] = true;
  });

  let n = 0;
  let skippedNoMaster = 0;
  for (let i = 0; i < keys.length; i++) {
    const q = quotes[keys[i]];
    if (!q || !q.ticker) continue;
    const ticker = String(q.ticker).toUpperCase();
    if (!inMaster[ticker]) {
      skippedNoMaster += 1;
      continue;
    }
    await upsertPriceRow({
      ticker: ticker,
      trading_date: tradingDateFromSource(q.date),
      open: numOrNull(q.open),
      high: numOrNull(q.high),
      low: numOrNull(q.low),
      close: numOrNull(q.close),
      volume: numOrNull(q.volume),
      trading_value: numOrNull(q.trading_value),
      reference_price: numOrNull(q.ref),
      price_change: numOrNull(q.change),
      price_change_percent: numOrNull(q.pctChange),
      source: SOURCE_VNDIRECT
    });
    n += 1;
  }
  return n;
}

async function tickSecondsFromSoT() {
  const t = await timeCfg.getTimeConfig();
  const tick = Number(t.tick_interval_seconds) || timeCfg.DEFAULTS.tick_interval_seconds;
  return Math.min(3600, Math.max(1, tick));
}

async function bumpSyncStatus(started, status, records, errorText) {
  const tick = await tickSecondsFromSoT().catch(function () {
    return 60;
  });
  const next = new Date(Date.now() + tick * 1000);
  await query(
    `UPDATE market_price_sync_config
     SET last_sync_at = $1,
         next_sync_at = $2,
         last_result = $3,
         last_records_synced = $4,
         last_error = $5,
         interval_seconds = $6,
         updated_at = NOW()
     WHERE id = 1`,
    [started, next, status, records, errorText || null, tick]
  );
  return tick;
}

async function runSyncCycle(opts) {
  opts = opts || {};
  if (cycleRunning) {
    return { skipped: true, reason: 'cycle_in_progress' };
  }
  cycleRunning = true;
  const started = new Date();
  let runId = null;
  let records = 0;
  let status = 'success';
  let errorText = null;
  let instrumentImport = null;
  let sourceCode = SOURCE_VNDIRECT;

  try {
    const ins = await query(
      `INSERT INTO market_data_sync_runs (started_at, status, created_at)
       VALUES ($1, 'running', NOW()) RETURNING id`,
      [started]
    );
    runId = ins.rows[0].id;

    /* Full-Universe: ingest instrument Source trước (NEW auto / CONFLICT review-only) */
    if (!opts.skip_instrument_sync) {
      instrumentImport = await syncInstrumentUniverse();
    }

    sourceCode = await resolveIngestSourceCode();
    const tickers = opts.tickers || (await listActiveTickers());
    if (!tickers.length) {
      status = 'success';
      records = 0;
    } else {
      records = await priceIngestFromSource(sourceCode, tickers);
    }

    await bumpSyncStatus(started, status, records, null);

    await query(
      `UPDATE market_data_sync_runs
       SET completed_at = NOW(), status = $2, records_processed = $3, error = NULL
       WHERE id = $1`,
      [runId, status, records]
    );

    return {
      run_id: runId,
      status: status,
      records_processed: records,
      source_code: sourceCode,
      instrument_import: instrumentImport
    };
  } catch (err) {
    status = 'error';
    errorText = err && err.message ? err.message : String(err);
    await bumpSyncStatus(started, status, records, errorText).catch(function () {});
    if (runId) {
      await query(
        `UPDATE market_data_sync_runs
         SET completed_at = NOW(), status = $2, records_processed = $3, error = $4
         WHERE id = $1`,
        [runId, status, records, errorText]
      ).catch(function () {});
    }
    return {
      run_id: runId,
      status: status,
      records_processed: records,
      error: errorText,
      instrument_import: instrumentImport
    };
  } finally {
    cycleRunning = false;
  }
}

async function listSyncRuns(limit) {
  const res = await query(
    `SELECT id, started_at, completed_at, status, records_processed, error, created_at
     FROM market_data_sync_runs
     ORDER BY started_at DESC
     LIMIT $1`,
    [Math.min(Math.max(Number(limit) || 50, 1), 200)]
  );
  return res.rows || [];
}

async function listCurrentPrices(opts) {
  opts = opts || {};
  const limit = Math.min(Math.max(Number(opts.limit) || 100, 1), 500);
  const q = String(opts.q || '')
    .trim()
    .toUpperCase();
  const params = [];
  let sql = `SELECT id, ticker, trading_date, open, high, low, close, volume, trading_value,
                    reference_price, price_change, price_change_percent, source, created_at, updated_at
             FROM stock_prices`;
  if (q) {
    params.push(q + '%');
    sql += ' WHERE ticker LIKE $' + params.length;
  }
  params.push(limit);
  sql += ' ORDER BY updated_at DESC, ticker ASC LIMIT $' + params.length;
  const res = await query(sql, params);
  return res.rows || [];
}

async function getQuotesFromDb(tickers) {
  const list = [];
  const seen = new Set();
  (tickers || []).forEach(function (raw) {
    const t = String(raw == null ? '' : raw)
      .trim()
      .toUpperCase();
    if (!t || seen.has(t)) return;
    seen.add(t);
    list.push(t);
  });
  const out = {};
  if (!list.length) return { quotes: out, meta: { source: 'stock_prices', count: 0 } };

  const res = await query(
    `SELECT DISTINCT ON (ticker)
       ticker, trading_date, open, high, low, close, volume, trading_value,
       reference_price, price_change, price_change_percent, source, updated_at
     FROM stock_prices
     WHERE ticker = ANY($1::varchar[])
     ORDER BY ticker, trading_date DESC, updated_at DESC`,
    [list]
  );
  (res.rows || []).forEach(function (r) {
    const close = numOrNull(r.close);
    const ref = numOrNull(r.reference_price);
    let dateStr = r.trading_date;
    if (dateStr instanceof Date) {
      dateStr = dateStr.toISOString().slice(0, 10);
    } else if (dateStr != null) {
      dateStr = String(dateStr).slice(0, 10);
    }
    out[r.ticker] = {
      ticker: r.ticker,
      date: dateStr,
      price: close,
      ref: ref,
      open: numOrNull(r.open),
      high: numOrNull(r.high),
      low: numOrNull(r.low),
      close: close,
      change: numOrNull(r.price_change),
      pctChange: numOrNull(r.price_change_percent),
      volume: numOrNull(r.volume),
      trading_value: numOrNull(r.trading_value),
      state:
        close == null || ref == null
          ? 'ref'
          : close > ref
            ? 'up'
            : close < ref
              ? 'down'
              : 'ref',
      source: r.source
    };
  });
  return {
    quotes: out,
    meta: {
      source: 'stock_prices',
      count: Object.keys(out).length,
      requested: list.length
    }
  };
}

async function maybeRunDueCycle() {
  if (cycleRunning) return null;
  const tcfg = await timeCfg.getTimeConfig();
  /* WHEN = Time SoT (ngày + phiên VN). Không dùng enabled UI / interval_seconds authority. */
  if (!timeCfg.isTradingActive(new Date(), tcfg)) return null;
  const cfg = await getSyncConfig();
  if (cfg && cfg.next_sync_at && new Date(cfg.next_sync_at) > new Date()) return null;
  return runSyncCycle();
}

function startSyncClock(logger) {
  if (clockTimer) return;
  clockTimer = setInterval(function () {
    maybeRunDueCycle()
      .then(function (out) {
        if (out && logger && out.status) {
          logger.info(
            { run_id: out.run_id, status: out.status, records: out.records_processed },
            'market-data-sync-cycle'
          );
        }
      })
      .catch(function (err) {
        if (logger) logger.error({ err: err.message }, 'market-data-sync-cycle failed');
      });
  }, 5000);
  if (typeof clockTimer.unref === 'function') clockTimer.unref();
}

function stopSyncClock() {
  if (clockTimer) {
    clearInterval(clockTimer);
    clockTimer = null;
  }
}

/** Bổ sung miss cho API (không tạo Sync Cycle audit). */
async function ingestTickersNow(tickers) {
  const sourceCode = await resolveIngestSourceCode();
  return priceIngestFromSource(sourceCode, tickers);
}

module.exports = {
  ALLOWED_INTERVALS,
  getSyncConfig,
  updateSyncConfig,
  runSyncCycle,
  listSyncRuns,
  listCurrentPrices,
  getQuotesFromDb,
  ingestTickersNow,
  startSyncClock,
  stopSyncClock,
  upsertPriceRow,
  tradingDateFromSource
};
