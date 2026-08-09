'use strict';

const { query } = require('../../core/database/connection');
const { AppError } = require('../../shared/exceptions/app-error');

/**
 * Public Market Master — Internal API → PostgreSQL (Solution LOCK).
 * Runtime quotes/OHLC stay outside this service.
 */

async function listStocks(filters) {
  filters = filters || {};
  const params = [];
  let sql = `
    SELECT s.ticker, s.name, s.short_name, s.english_name, s.exchange, s.status,
           s.cap_group, s.market_cap, s.sector_id, s.ecosystem_id, s.slug,
           sec.code AS sector_code, sec.name_vi AS sector_name,
           eco.code AS ecosystem_code, eco.name_vi AS ecosystem_name
    FROM stocks s
    LEFT JOIN sectors sec ON sec.id = s.sector_id
    LEFT JOIN ecosystems eco ON eco.id = s.ecosystem_id
    WHERE 1=1`;
  if (filters.status) {
    params.push(String(filters.status));
    sql += ` AND s.status = $${params.length}`;
  } else {
    sql += ` AND LOWER(COALESCE(s.status, 'active')) = 'active'`;
  }
  if (filters.exchange) {
    params.push(String(filters.exchange).toUpperCase());
    sql += ` AND UPPER(s.exchange) = $${params.length}`;
  }
  sql += ' ORDER BY s.ticker ASC';
  const res = await query(sql, params);
  return (res.rows || []).map(function (r) {
    return {
      ticker: r.ticker,
      name: r.name,
      short_name: r.short_name || null,
      english_name: r.english_name || null,
      exchange: r.exchange,
      status: r.status,
      cap_group: r.cap_group,
      market_cap: r.market_cap != null ? Number(r.market_cap) : null,
      sector_id: r.sector_id,
      sector_code: r.sector_code,
      sector_name: r.sector_name,
      ecosystem_id: r.ecosystem_id,
      ecosystem_code: r.ecosystem_code,
      ecosystem_name: r.ecosystem_name,
      slug: r.slug
    };
  });
}

async function getStock(ticker) {
  const t = String(ticker || '').trim().toUpperCase();
  if (!t) throw AppError.badRequest('VALIDATION', 'Ticker bắt buộc');
  const res = await query(
    `SELECT s.ticker, s.name, s.exchange, s.status, s.cap_group, s.market_cap,
            s.sector_id, s.ecosystem_id, s.slug, s.description,
            sec.code AS sector_code, sec.name_vi AS sector_name,
            eco.code AS ecosystem_code, eco.name_vi AS ecosystem_name
     FROM stocks s
     LEFT JOIN sectors sec ON sec.id = s.sector_id
     LEFT JOIN ecosystems eco ON eco.id = s.ecosystem_id
     WHERE s.ticker = $1`,
    [t]
  );
  if (!res.rows[0]) throw AppError.notFound('Không tìm thấy mã');
  const r = res.rows[0];
  return {
    ticker: r.ticker,
    name: r.name,
    exchange: r.exchange,
    status: r.status,
    cap_group: r.cap_group,
    market_cap: r.market_cap != null ? Number(r.market_cap) : null,
    sector_id: r.sector_id,
    sector_code: r.sector_code,
    sector_name: r.sector_name,
    ecosystem_id: r.ecosystem_id,
    ecosystem_code: r.ecosystem_code,
    ecosystem_name: r.ecosystem_name,
    slug: r.slug,
    description: r.description
  };
}

async function listSectors() {
  const res = await query(
    `SELECT s.id, s.code, s.slug, s.name_vi, s.is_active,
            (SELECT COUNT(*)::int FROM stocks st WHERE st.sector_id = s.id) AS stock_count
     FROM sectors s
     WHERE s.is_active = TRUE
     ORDER BY s.display_order ASC, s.name_vi ASC`
  );
  return (res.rows || []).map(function (r) {
    return {
      id: r.id,
      code: r.code,
      slug: r.slug,
      name: r.name_vi,
      name_vi: r.name_vi,
      status: 'active',
      stock_count: Number(r.stock_count) || 0
    };
  });
}

async function listEcosystems() {
  const res = await query(
    `SELECT e.id, e.code, e.slug, e.name_vi, e.is_active,
            COALESCE(
              (SELECT array_agg(st.ticker ORDER BY st.ticker)
                 FROM stocks st WHERE st.ecosystem_id = e.id),
              ARRAY[]::varchar[]
            ) AS tickers,
            (SELECT COUNT(*)::int FROM stocks st WHERE st.ecosystem_id = e.id) AS stock_count
     FROM ecosystems e
     WHERE e.is_active = TRUE
     ORDER BY e.display_order ASC, e.name_vi ASC`
  );
  return (res.rows || []).map(function (r) {
    const tickers = Array.isArray(r.tickers) ? r.tickers.filter(Boolean) : [];
    return {
      id: r.id,
      code: r.code,
      slug: r.slug,
      name: r.name_vi,
      name_vi: r.name_vi,
      status: 'active',
      tickers: tickers,
      stock_count: Number(r.stock_count) || tickers.length
    };
  });
}

module.exports = {
  listStocks,
  getStock,
  listSectors,
  listEcosystems
};
