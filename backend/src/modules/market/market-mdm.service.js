'use strict';

const { query, getPool } = require('../../core/database/connection');
const { AppError } = require('../../shared/exceptions/app-error');
const {
  normalizeCapGroup,
  isEmptyMasterValue,
  isEmptyMarketCapMaster,
  valuesEqual
} = require('./market-cap-group');
const { loadCandidates } = require('./market-source-adapters');

/** Field Master iFlux-only — không nhận overwrite từ external (kể cả Trusted). */
const IFLUX_OWNED = new Set(['ecosystem_id', 'slug']);
/** Cột stocks được adapter normalize / Apply khi FA Trusted cho field. */
const MASTER_INTAKE = [
  'ticker',
  'name',
  'short_name',
  'english_name',
  'exchange',
  'isin',
  'sector_id',
  'shares_outstanding',
  'market_cap',
  'cap_group',
  'description',
  'status'
];

/** External Provider codes — cột ma trận Field Mapping (thứ tự UI). */
const EXTERNAL_PROVIDER_CODES = ['dnse', 'ssi_market_feed', 'vndirect_finfo', 'fiinpro_eod'];

/** Chỉ kênh đang kết nối được mới hiện trên ma trận / dropdown Current Source. */
const CONNECTED_SOURCE_STATUSES = new Set(['connected', 'success']);

function isSourceConnectedStatus(status) {
  return CONNECTED_SOURCE_STATUSES.has(String(status || '').toLowerCase());
}

/**
 * SoT rows = cột bảng stocks đưa vào Field Authority (trừ created_at / updated_at).
 * Không gồm lot_threshold / is_active / display_order / icon_media_id (đã DROP).
 * Không gồm slug — public URL identity do hệ thống tự sinh, không thuộc Field Mapping ngoài.
 */
const STOCKS_CONFIG_FIELDS = [
  'ticker',
  'name',
  'short_name',
  'english_name',
  'exchange',
  'isin',
  'sector_id',
  'ecosystem_id',
  'shares_outstanding',
  'market_cap',
  'cap_group',
  'description',
  'status'
];

const FIELD_LABELS = {
  ticker: 'Mã cổ phiếu',
  name: 'Tên công ty',
  short_name: 'Tên ngắn',
  english_name: 'Tên tiếng Anh',
  exchange: 'Sàn',
  isin: 'ISIN',
  sector_id: 'Ngành',
  ecosystem_id: 'Hệ sinh thái',
  shares_outstanding: 'Khối lượng lưu hành',
  market_cap: 'Vốn hóa',
  cap_group: 'Nhóm vốn hóa',
  description: 'Mô tả',
  status: 'Trạng thái',
  trading_date: 'Ngày giao dịch',
  open: 'Giá mở',
  high: 'Giá cao',
  low: 'Giá thấp',
  close: 'Giá đóng',
  volume: 'Khối lượng',
  trading_value: 'Giá trị giao dịch',
  reference_price: 'Giá tham chiếu',
  price_change: 'Biến động giá',
  price_change_percent: 'Biến động %',
  source: 'Nguồn provenance'
};

/** Block 2 — Current Market Price State (stock_prices). */
const STOCK_PRICE_CONFIG_FIELDS = [
  'ticker',
  'trading_date',
  'open',
  'high',
  'low',
  'close',
  'volume',
  'trading_value',
  'reference_price',
  'price_change',
  'price_change_percent',
  'source'
];

const PROVIDER_FIELD_NATIVE = {
  dnse: {
    ticker: 'symbol',
    name: 'name',
    short_name: 'shortName',
    exchange: 'marketId',
    isin: 'isin',
    // market data securityStatus: HALT | NO_HALT (khi kênh connected mới hiện cột)
    status: 'securityStatus',
    trading_date: 'time',
    open: 'openPrice',
    high: 'highestPrice',
    low: 'lowestPrice',
    close: 'matchPrice',
    volume: 'totalVolumeTraded',
    trading_value: 'grossTradeAmount',
    reference_price: 'basicPrice',
    source: '_provider'
  },
  ssi_market_feed: {
    ticker: 'ticker',
    name: 'name',
    exchange: 'exchange',
    market_cap: 'market_cap',
    cap_group: 'cap_group'
  },
  fiinpro_eod: {
    ticker: 'ticker',
    name: 'name',
    exchange: 'exchange',
    market_cap: 'market_cap',
    cap_group: 'cap_group'
  },
  vndirect_finfo: {
    // /v4/stocks
    ticker: 'code',
    name: 'companyName',
    short_name: 'shortName',
    english_name: 'companyNameEng',
    exchange: 'floor',
    isin: 'isin',
    // listing lifecycle: listed | delisted → map active/delisted
    status: 'status',
    // /v4/ratios
    shares_outstanding: 'OUTSTANDING_SHARES',
    market_cap: 'MARKETCAP',
    // empty-fill từ MARKETCAP khi FiinPro live chưa wire
    cap_group: 'MARKETCAP→cap_group',
    // /v4/company_profiles
    description: 'vnSummary',
    // /v4/industry_classification L2 (19) → sectors.code
    sector_id: 'industryLevel:2→sector',
    // stock_prices (/v4/stock_prices)
    trading_date: 'date',
    open: 'open',
    high: 'high',
    low: 'low',
    close: 'close',
    volume: 'nmVolume',
    trading_value: 'nmValue',
    reference_price: 'basicPrice',
    price_change: 'change',
    price_change_percent: 'pctChange',
    source: '_provider'
  }
};

function providerNativeForField(sourceCode, fieldKey) {
  const map = PROVIDER_FIELD_NATIVE[sourceCode] || {};
  return map[fieldKey] || null;
}

function providersMapForField(fieldKey, connectedCodes) {
  const codes = Array.isArray(connectedCodes) ? connectedCodes : EXTERNAL_PROVIDER_CODES;
  const out = {};
  codes.forEach(function (code) {
    out[code] = providerNativeForField(code, fieldKey);
  });
  return out;
}

/** Registry codes đang connected/success, giữ thứ tự EXTERNAL_PROVIDER_CODES. */
async function listConnectedProviderCodes() {
  const res = await query(
    `SELECT code, name, status FROM data_sources
     WHERE channel_class = 'external_provider'`
  );
  const byCode = {};
  (res.rows || []).forEach(function (r) {
    byCode[r.code] = r;
  });
  return EXTERNAL_PROVIDER_CODES.filter(function (code) {
    const row = byCode[code];
    return row && isSourceConnectedStatus(row.status);
  }).map(function (code) {
    const row = byCode[code];
    return { code: code, label: (row && row.name) || code, status: row.status };
  });
}

function fieldsForEntity(entity) {
  if (entity === 'stock_price') return STOCK_PRICE_CONFIG_FIELDS;
  return STOCKS_CONFIG_FIELDS;
}

function exposedFieldsForSource(sourceCode) {
  const map = PROVIDER_FIELD_NATIVE[sourceCode] || {};
  return Object.keys(map).map(function (ifluxKey) {
    return { iflux_field: ifluxKey, native_field: map[ifluxKey] };
  });
}

async function writeSotAudit(clientOrNull, row) {
  const sql = `INSERT INTO market_sot_audit
    (admin_id, actor, entity, entity_key, field_key, from_value, to_value, source_code, why, result, import_id, conflict_id)
   VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`;
  const params = [
    row.admin_id || null,
    row.actor || (row.admin_id ? String(row.admin_id) : 'system@admin-key'),
    row.entity || 'stock',
    row.entity_key,
    row.field_key,
    row.from_value != null ? String(row.from_value) : null,
    row.to_value != null ? String(row.to_value) : null,
    row.source_code || 'admin',
    row.why || '',
    row.result || '',
    row.import_id || null,
    row.conflict_id || null
  ];
  if (clientOrNull) await clientOrNull.query(sql, params);
  else await query(sql, params);
}

async function insertChangeSet(client, item) {
  await client.query(
    `INSERT INTO market_data_change_set_items
      (import_id, entity, entity_key, field_key, current_value, incoming_value,
       source_code, trust_level, class, result, note, conflict_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
    [
      item.import_id,
      item.entity || 'stock',
      item.entity_key,
      item.field_key || '*',
      item.current_value != null ? String(item.current_value) : null,
      item.incoming_value != null ? String(item.incoming_value) : null,
      item.source_code || '',
      item.trust_level || '',
      item.class,
      item.result || 'noop',
      item.note || '',
      item.conflict_id || null
    ]
  );
}

async function listSourcesWithAuthority() {
  const sources = await query(
    `SELECT * FROM data_sources
     WHERE channel_class = 'external_provider'
     ORDER BY name ASC`
  );
  const auth = await query(
    `SELECT * FROM market_source_field_authority ORDER BY entity, field_key`
  );
  const imports = await query(
    `SELECT DISTINCT ON (source_code)
       source_code, id, status, started_at, finished_at, received_count, conflict_count, missing_count
     FROM market_data_imports
     ORDER BY source_code, started_at DESC`
  );
  const lastSuccess = await query(
    `SELECT DISTINCT ON (source_code)
       source_code, id, finished_at, status
     FROM market_data_imports
     WHERE status = 'success'
     ORDER BY source_code, finished_at DESC NULLS LAST`
  );
  const bySource = {};
  (auth.rows || []).forEach(function (r) {
    const k = r.source_id;
    if (!bySource[k]) bySource[k] = [];
    bySource[k].push({
      id: r.id,
      entity: r.entity,
      field_key: r.field_key,
      trust_level: r.trust_level
    });
  });
  const lastByCode = {};
  (imports.rows || []).forEach(function (r) {
    lastByCode[r.source_code] = r;
  });
  const successByCode = {};
  (lastSuccess.rows || []).forEach(function (r) {
    successByCode[r.source_code] = r;
  });

  return (sources.rows || []).map(function (s) {
    const fa = bySource[s.id] || [];
    const trusted = fa.filter(function (x) {
      return x.trust_level === 'trusted';
    }).length;
    const review = fa.filter(function (x) {
      return x.trust_level === 'review_required';
    }).length;
    const last = lastByCode[s.code] || null;
    const ok = successByCode[s.code] || null;
    return {
      id: s.id,
      code: s.code,
      name: s.name,
      provider: s.name,
      source_type: s.source_type,
      type: s.source_type,
      channel_class: s.channel_class || 'external_provider',
      status: s.status,
      latency_ms: s.latency_ms,
      last_check_at: s.last_check_at,
      description: s.description,
      exposed_fields: exposedFieldsForSource(s.code),
      trust_summary: {
        trusted: trusted,
        review_required: review,
        not_trusted: fa.length - trusted - review,
        total: fa.length
      },
      last_import_at: last ? last.started_at : null,
      last_import_status: last ? last.status : null,
      last_success_at: ok ? ok.finished_at : null,
      import_status: last ? last.status : null,
      field_authority: fa
    };
  });
}

async function setFieldAuthority(sourceId, entity, fieldKey, trustLevel) {
  const res = await query(
    `INSERT INTO market_source_field_authority (source_id, entity, field_key, trust_level, updated_at)
     VALUES ($1, $2, $3, $4, NOW())
     ON CONFLICT (source_id, entity, field_key)
     DO UPDATE SET trust_level = EXCLUDED.trust_level, updated_at = NOW()
     RETURNING *`,
    [sourceId, entity || 'stock', fieldKey, trustLevel]
  );
  return res.rows[0];
}

/** BR-11.FA — một Current Source / Entity×Field (demote nguồn khác). */
async function setCurrentFieldSource(entity, fieldKey, sourceCode, trustLevel) {
  entity = entity || 'stock';
  fieldKey = String(fieldKey || '').trim();
  sourceCode = String(sourceCode || '').trim().toLowerCase();
  trustLevel = trustLevel || 'trusted';

  if (!fieldKey) throw AppError.badRequest('VALIDATION', 'field_key bắt buộc');
  const allowed = fieldsForEntity(entity);
  if (allowed.indexOf(fieldKey) < 0) {
    throw AppError.badRequest(
      'VALIDATION',
      entity === 'stock_price'
        ? 'field_key không thuộc stock_prices'
        : 'field_key không thuộc bảng stocks'
    );
  }

  await query(
    `UPDATE market_source_field_authority
     SET trust_level = 'not_trusted', updated_at = NOW()
     WHERE entity = $1 AND field_key = $2`,
    [entity, fieldKey]
  );

  const src = await query(
    `SELECT id, code, status, channel_class FROM data_sources
     WHERE code = $1 AND channel_class = 'external_provider'`,
    [sourceCode]
  );
  if (!src.rows[0]) throw AppError.badRequest('VALIDATION', 'Source không có trong External Provider Registry');
  if (!isSourceConnectedStatus(src.rows[0].status)) {
    throw AppError.badRequest(
      'VALIDATION',
      'Chỉ chọn Source đang kết nối được (connected/success). Hiện tại: ' +
        (src.rows[0].status || 'unknown')
    );
  }
  if (!providerNativeForField(sourceCode, fieldKey)) {
    throw AppError.badRequest(
      'VALIDATION',
      'Provider ' + sourceCode + ' không expose field ' + fieldKey
    );
  }
  if (trustLevel === 'not_trusted') trustLevel = 'trusted';
  const row = await setFieldAuthority(src.rows[0].id, entity, fieldKey, trustLevel);
  return {
    entity: entity,
    field_key: fieldKey,
    source_id: row.source_id,
    source_code: sourceCode,
    trust_level: trustLevel,
    source_editable: true
  };
}

/** Cột provider trên matrix — chỉ kênh đang kết nối; label từ Registry. */
async function listProviderColumns() {
  const connected = await listConnectedProviderCodes();
  return connected.map(function (r) {
    return { code: r.code, label: r.label };
  });
}

/** BR-11 — Field Mapping rows cho một entity (stock | stock_price). */
async function listFieldAuthorityConfigForEntity(entity) {
  entity = entity || 'stock';
  const fieldKeys = fieldsForEntity(entity);
  const connected = await listConnectedProviderCodes();
  const connectedCodes = connected.map(function (r) {
    return r.code;
  });
  const connectedSet = new Set(connectedCodes);

  const auth = await query(
    `SELECT a.entity, a.field_key, a.trust_level, a.source_id, a.updated_at,
            s.code AS source_code, s.name AS source_name, s.status AS source_status,
            s.channel_class
     FROM market_source_field_authority a
     JOIN data_sources s ON s.id = a.source_id
     WHERE a.entity = $1
       AND s.channel_class = 'external_provider'
     ORDER BY a.field_key,
       CASE a.trust_level WHEN 'trusted' THEN 0 WHEN 'review_required' THEN 1 ELSE 2 END,
       s.code`,
    [entity]
  );
  const byField = {};
  (auth.rows || []).forEach(function (r) {
    if (!byField[r.field_key]) byField[r.field_key] = r;
  });

  return fieldKeys.map(function (fk) {
    const cur = byField[fk];
    const fieldLabel = FIELD_LABELS[fk] || fk;
    const providers = providersMapForField(fk, connectedCodes);
    const selectable = connectedCodes.filter(function (code) {
      return !!providerNativeForField(code, fk);
    });
    const active =
      cur &&
      (cur.trust_level === 'trusted' || cur.trust_level === 'review_required') &&
      connectedSet.has(cur.source_code) &&
      providerNativeForField(cur.source_code, fk)
        ? cur
        : null;
    return {
      entity: entity,
      field_key: fk,
      field_label: fieldLabel,
      current_source: active ? active.source_code : null,
      source_id: active ? active.source_id : null,
      source_name: active ? active.source_name : null,
      trust_level: active ? active.trust_level : 'not_trusted',
      source_editable: selectable.length > 0,
      providers: providers,
      selectable_sources: selectable
    };
  });
}

async function listFieldAuthorityConfig() {
  return listFieldAuthorityConfigForEntity('stock');
}

async function getSourceStaging(sourceCode) {
  const res = await query(
    'SELECT source_code, payload_text, updated_at FROM market_source_staging WHERE source_code = $1',
    [sourceCode]
  );
  return res.rows[0] || null;
}

async function setSourceStaging(sourceCode, payloadText) {
  const code = String(sourceCode || '').trim().toLowerCase();
  const src = await query('SELECT code FROM data_sources WHERE code = $1', [code]);
  if (!src.rows[0]) throw AppError.badRequest('VALIDATION', 'Source không tồn tại');
  const res = await query(
    `INSERT INTO market_source_staging (source_code, payload_text, updated_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (source_code)
     DO UPDATE SET payload_text = EXCLUDED.payload_text, updated_at = NOW()
     RETURNING source_code, payload_text, updated_at`,
    [code, String(payloadText || '')]
  );
  return res.rows[0];
}

async function getTrustedMap(sourceCode) {
  const res = await query(
    `SELECT a.field_key, a.trust_level
     FROM market_source_field_authority a
     JOIN data_sources s ON s.id = a.source_id
     WHERE s.code = $1 AND a.entity = 'stock'`,
    [sourceCode]
  );
  const map = {};
  (res.rows || []).forEach(function (r) {
    map[r.field_key] = r.trust_level;
  });
  return map;
}

function mapExchange(raw) {
  const e = String(raw || '').trim().toUpperCase();
  if (!e) return null;
  if (e === 'STO' || e === 'HSX') return 'HOSE';
  if (e === 'STX') return 'HNX';
  if (e === 'UPX') return 'UPCOM';
  return e;
}

/**
 * BR OD-08 — một pending conflict / entity×field (không nhân bản mỗi lần Import).
 * Chỉ dùng cho xung đột giá trị thật (Master non-empty ≠ Incoming).
 */
async function upsertPendingConflict(client, row) {
  const existing = await client.query(
    `SELECT id FROM market_data_conflicts
     WHERE entity = $1 AND entity_key = $2 AND field_key = $3 AND review_state = 'pending'
     ORDER BY detected_at DESC
     LIMIT 1`,
    [row.entity || 'stock', row.entity_key, row.field_key]
  );
  if (existing.rows[0]) {
    await client.query(
      `UPDATE market_data_conflicts
       SET import_id = $2,
           current_value = $3,
           incoming_value = $4,
           source_code = $5,
           note = $6,
           detected_at = NOW()
       WHERE id = $1`,
      [
        existing.rows[0].id,
        row.import_id,
        row.current_value != null ? String(row.current_value) : null,
        row.incoming_value != null ? String(row.incoming_value) : null,
        row.source_code || '',
        row.note != null ? String(row.note) : ''
      ]
    );
    return existing.rows[0].id;
  }
  const conf = await client.query(
    `INSERT INTO market_data_conflicts
      (import_id, entity, entity_key, field_key, current_value, incoming_value, source_code, review_state, note)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', $8)
     RETURNING id`,
    [
      row.import_id,
      row.entity || 'stock',
      row.entity_key,
      row.field_key,
      row.current_value != null ? String(row.current_value) : null,
      row.incoming_value != null ? String(row.incoming_value) : null,
      row.source_code || '',
      row.note != null ? String(row.note) : ''
    ]
  );
  return conf.rows[0].id;
}

async function applyCandidateStock(client, candidate, trustedMap, importId, sourceCode, adminId, summary, options) {
  options = options || {};
  const deferApply = !!options.deferApply;
  const ticker = String(candidate.ticker || '').trim().toUpperCase();
  if (!ticker) return { class: 'invalid' };

  const name = candidate.name != null ? String(candidate.name).trim() : null;
  const exchange = mapExchange(candidate.exchange);
  const marketCap =
    candidate.market_cap != null && Number.isFinite(Number(candidate.market_cap))
      ? Number(candidate.market_cap)
      : null;
  const capGroup = normalizeCapGroup(candidate.cap_group);

  const curRes = await client.query('SELECT * FROM stocks WHERE ticker = $1 FOR UPDATE', [ticker]);
  const cur = curRes.rows[0] || null;

  const result = {
    class: 'unchanged',
    conflicts: [],
    created: false,
    filled: 0,
    unchanged: 0,
    updated: 0
  };

  function level(field) {
    return trustedMap[field] || 'not_trusted';
  }

  async function recordOwnedTouch(fieldKey, incoming, current) {
    if (incoming == null || incoming === '') return;
    if (valuesEqual(current, incoming)) return;
    const conflictId = await upsertPendingConflict(client, {
      import_id: importId,
      entity: 'stock',
      entity_key: ticker,
      field_key: fieldKey,
      current_value: current,
      incoming_value: incoming,
      source_code: sourceCode,
      note: 'iFlux-owned — Record/Review (không auto overwrite)'
    });
    await insertChangeSet(client, {
      import_id: importId,
      entity_key: ticker,
      field_key: fieldKey,
      current_value: current,
      incoming_value: incoming,
      source_code: sourceCode,
      trust_level: 'iflux_owned',
      class: 'reject',
      result: 'review',
      note: 'iFlux-owned',
      conflict_id: conflictId
    });
    result.conflicts.push(fieldKey);
    result.class = 'conflict';
    summary.conflict_count += 1;
  }

  if (!cur) {
    /* Candidate chỉ có ngành (L2 union) — không tạo mã mới; chỉ fill Master đã có. */
    if (!name) {
      await insertChangeSet(client, {
        import_id: importId,
        entity_key: ticker,
        field_key: 'sector_id',
        incoming_value: candidate.sector_code || null,
        source_code: sourceCode,
        trust_level: level('sector_id'),
        class: 'missing',
        result: 'noop',
        note: 'sector_only_no_master'
      });
      return { class: 'missing', reason: 'sector_only_no_master' };
    }
    const tName = level('name');
    const tTicker = level('ticker');
    if (tName !== 'trusted' && tTicker !== 'trusted') {
      await insertChangeSet(client, {
        import_id: importId,
        entity_key: ticker,
        field_key: '*',
        incoming_value: name || ticker,
        source_code: sourceCode,
        trust_level: tName,
        class: 'invalid',
        result: 'reject',
        note: 'new_stock_not_trusted'
      });
      return { class: 'invalid', reason: 'new_stock_not_trusted' };
    }
    if (deferApply) {
      const conflictId = await upsertPendingConflict(client, {
        import_id: importId,
        entity: 'stock',
        entity_key: ticker,
        field_key: '*',
        current_value: null,
        incoming_value: name || ticker,
        source_code: sourceCode,
        note: JSON.stringify({
          deferred_new: true,
          name: name || ticker,
          exchange: exchange || 'HOSE',
          market_cap: level('market_cap') === 'trusted' ? marketCap : null,
          cap_group: level('cap_group') === 'trusted' ? capGroup : null
        })
      });
      await insertChangeSet(client, {
        import_id: importId,
        entity_key: ticker,
        field_key: '*',
        incoming_value: name || ticker,
        source_code: sourceCode,
        trust_level: 'trusted',
        class: 'new',
        result: 'pending',
        conflict_id: conflictId,
        note: 'deferred_new — chờ Apply'
      });
      result.class = 'new';
      result.conflicts.push('*');
      return result;
    }
    await client.query(
      `INSERT INTO stocks (ticker, name, exchange, status, market_cap, cap_group, updated_at)
       VALUES ($1, $2, $3, 'active', $4, $5, NOW())`,
      [
        ticker,
        name || ticker,
        exchange || 'HOSE',
        level('market_cap') === 'trusted' ? marketCap : null,
        level('cap_group') === 'trusted' ? capGroup : null
      ]
    );
    await insertChangeSet(client, {
      import_id: importId,
      entity_key: ticker,
      field_key: '*',
      incoming_value: name || ticker,
      source_code: sourceCode,
      trust_level: 'trusted',
      class: 'new',
      result: 'apply'
    });
    await writeSotAudit(client, {
      admin_id: adminId,
      entity_key: ticker,
      field_key: '*',
      from_value: null,
      to_value: name || ticker,
      source_code: sourceCode,
      why: 'Trusted New — Auto Add',
      result: 'auto_apply_new',
      import_id: importId
    });
    result.class = 'new';
    result.created = true;
    return result;
  }

  async function handleField(fieldKey, incoming, current) {
    if (MASTER_INTAKE.indexOf(fieldKey) < 0) return;
    if (IFLUX_OWNED.has(fieldKey)) return;
    if (incoming == null || incoming === '') return;

    const tl = level(fieldKey);

    if (tl === 'not_trusted') {
      await insertChangeSet(client, {
        import_id: importId,
        entity_key: ticker,
        field_key: fieldKey,
        current_value: current,
        incoming_value: incoming,
        source_code: sourceCode,
        trust_level: tl,
        class: 'noop',
        result: 'reject',
        note: 'not_trusted'
      });
      return;
    }

    if (tl === 'review_required') {
      if (valuesEqual(current, incoming)) {
        result.unchanged += 1;
        await insertChangeSet(client, {
          import_id: importId,
          entity_key: ticker,
          field_key: fieldKey,
          current_value: current,
          incoming_value: incoming,
          source_code: sourceCode,
          trust_level: tl,
          class: 'unchanged',
          result: 'noop'
        });
        return;
      }
      const conflictId = await upsertPendingConflict(client, {
        import_id: importId,
        entity: 'stock',
        entity_key: ticker,
        field_key: fieldKey,
        current_value: current,
        incoming_value: incoming,
        source_code: sourceCode,
        note: 'review_required'
      });
      await insertChangeSet(client, {
        import_id: importId,
        entity_key: ticker,
        field_key: fieldKey,
        current_value: current,
        incoming_value: incoming,
        source_code: sourceCode,
        trust_level: tl,
        class: 'conflict',
        result: 'review',
        conflict_id: conflictId
      });
      result.conflicts.push(fieldKey);
      result.class = 'conflict';
      return;
    }

    /* trusted */
    const masterEmpty =
      fieldKey === 'market_cap' ? isEmptyMarketCapMaster(current) : isEmptyMasterValue(current);
    if (masterEmpty) {
      if (deferApply) {
        const conflictId = await upsertPendingConflict(client, {
          import_id: importId,
          entity: 'stock',
          entity_key: ticker,
          field_key: fieldKey,
          current_value: current,
          incoming_value: incoming,
          source_code: sourceCode,
          note: 'deferred_fill'
        });
        await insertChangeSet(client, {
          import_id: importId,
          entity_key: ticker,
          field_key: fieldKey,
          current_value: current,
          incoming_value: incoming,
          source_code: sourceCode,
          trust_level: tl,
          class: 'fill',
          result: 'pending',
          conflict_id: conflictId
        });
        result.conflicts.push(fieldKey);
        result.class = 'conflict';
        return;
      }
      const writeVal =
        fieldKey === 'sector_id' || fieldKey === 'shares_outstanding' || fieldKey === 'market_cap'
          ? Number(incoming)
          : incoming;
      await client.query(
        `UPDATE stocks SET ${fieldKey} = $2, updated_at = NOW() WHERE ticker = $1`,
        [ticker, writeVal]
      );
      result.filled += 1;
      result.class = 'filled';
      await insertChangeSet(client, {
        import_id: importId,
        entity_key: ticker,
        field_key: fieldKey,
        current_value: current,
        incoming_value: incoming,
        source_code: sourceCode,
        trust_level: tl,
        class: 'fill',
        result: 'apply'
      });
      await writeSotAudit(client, {
        admin_id: adminId,
        entity_key: ticker,
        field_key: fieldKey,
        from_value: current,
        to_value: incoming,
        source_code: sourceCode,
        why: 'Trusted Empty — Auto Fill',
        result: 'auto_apply_fill',
        import_id: importId
      });
      return;
    }
    if (valuesEqual(current, incoming)) {
      result.unchanged += 1;
      await insertChangeSet(client, {
        import_id: importId,
        entity_key: ticker,
        field_key: fieldKey,
        current_value: current,
        incoming_value: incoming,
        source_code: sourceCode,
        trust_level: tl,
        class: 'unchanged',
        result: 'noop'
      });
      return;
    }
    const conflictId = await upsertPendingConflict(client, {
      import_id: importId,
      entity: 'stock',
      entity_key: ticker,
      field_key: fieldKey,
      current_value: current,
      incoming_value: incoming,
      source_code: sourceCode,
      note: 'value_conflict'
    });
    await insertChangeSet(client, {
      import_id: importId,
      entity_key: ticker,
      field_key: fieldKey,
      current_value: current,
      incoming_value: incoming,
      source_code: sourceCode,
      trust_level: tl,
      class: 'conflict',
      result: 'review',
      conflict_id: conflictId
    });
    result.conflicts.push(fieldKey);
    result.class = 'conflict';
  }

  /* Ecosystem vẫn iFlux-owned — chỉ Record/Review nếu provider gửi. */
  if (candidate.ecosystem_id != null) {
    await recordOwnedTouch('ecosystem_id', candidate.ecosystem_id, cur.ecosystem_id);
  }

  let sectorId = candidate.sector_id != null ? Number(candidate.sector_id) : null;
  if ((sectorId == null || !Number.isFinite(sectorId)) && candidate.sector_code) {
    const sec = await client.query('SELECT id FROM sectors WHERE code = $1 LIMIT 1', [
      String(candidate.sector_code).trim()
    ]);
    if (sec.rows[0]) sectorId = Number(sec.rows[0].id);
  }

  if (name) await handleField('name', name, cur.name);
  if (candidate.short_name) await handleField('short_name', candidate.short_name, cur.short_name);
  if (candidate.english_name) {
    await handleField('english_name', candidate.english_name, cur.english_name);
  }
  if (exchange) await handleField('exchange', exchange, cur.exchange);
  if (candidate.isin) await handleField('isin', candidate.isin, cur.isin);
  if (sectorId != null && Number.isFinite(sectorId)) {
    await handleField('sector_id', sectorId, cur.sector_id);
  }
  if (candidate.shares_outstanding != null) {
    await handleField('shares_outstanding', candidate.shares_outstanding, cur.shares_outstanding);
  }
  if (marketCap != null) await handleField('market_cap', marketCap, cur.market_cap);
  if (capGroup) await handleField('cap_group', capGroup, cur.cap_group);
  if (candidate.description) {
    await handleField('description', candidate.description, cur.description);
  }
  if (candidate.status) await handleField('status', candidate.status, cur.status);

  if (result.conflicts.length && result.filled === 0 && !result.created) result.class = 'conflict';
  else if (result.filled && !result.conflicts.length) result.class = 'filled';
  else if (!result.conflicts.length && !result.filled) result.class = 'unchanged';

  return result;
}

async function assertSourceImportable(sourceCode) {
  const src = await query('SELECT id, code, status FROM data_sources WHERE code = $1', [sourceCode]);
  if (!src.rows[0]) throw AppError.badRequest('VALIDATION', 'Source không tồn tại trong registry');
  if (String(src.rows[0].status).toLowerCase() === 'disabled') {
    throw AppError.badRequest('VALIDATION', 'Nguồn đang Disabled — không được import/apply');
  }
  return src.rows[0];
}

async function runImport(sourceCode, candidates, adminId, options) {
  options = options || {};
  /* Owner 2026-08-08: NEW + MATCHED trusted auto-persist; chỉ CONFLICT → Review.
     Không dùng deferApply làm approval gate cho toàn bộ universe. */
  if (options.deferApply === undefined) options.deferApply = false;
  const src = await assertSourceImportable(sourceCode);
  const trustedMap = await getTrustedMap(sourceCode);
  const client = await getPool().connect();
  let importId;
  let finalStatus = 'partial';
  const summary = {
    received: Array.isArray(candidates) ? candidates.length : 0,
    valid: 0,
    invalid: 0,
    new_count: 0,
    filled_count: 0,
    updated_count: 0,
    unchanged_count: 0,
    conflict_count: 0,
    missing_count: 0,
    auto_applied_count: 0,
    rejected_count: 0,
    failed_count: 0
  };

  try {
    await client.query('BEGIN');
    const ins = await client.query(
      `INSERT INTO market_data_imports (source_id, source_code, status, admin_id, received_count)
       VALUES ($1, $2, 'running', $3, $4) RETURNING id`,
      [src.id, sourceCode, adminId || null, summary.received]
    );
    importId = ins.rows[0].id;

    const seen = new Set();
    for (const raw of candidates || []) {
      const r = await applyCandidateStock(
        client,
        raw,
        trustedMap,
        importId,
        sourceCode,
        adminId,
        summary,
        options
      );
      const t = String((raw && raw.ticker) || '')
        .trim()
        .toUpperCase();
      if (t) seen.add(t);
      if (r.class === 'invalid') {
        summary.invalid += 1;
        continue;
      }
      summary.valid += 1;
      if (r.created) {
        summary.new_count += 1;
        summary.auto_applied_count += 1;
      } else if (r.class === 'new') {
        summary.new_count += 1;
        summary.conflict_count += (r.conflicts && r.conflicts.length) || 1;
      } else if (r.class === 'filled') {
        summary.filled_count += 1;
        summary.updated_count += 1;
        summary.auto_applied_count += r.filled || 1;
      } else if (r.class === 'conflict') {
        summary.conflict_count += (r.conflicts && r.conflicts.length) || 0;
        if (r.filled) {
          summary.filled_count += 1;
          summary.updated_count += 1;
          summary.auto_applied_count += r.filled;
        }
      } else {
        summary.unchanged_count += 1;
      }
    }

    /* BR-18.4 Missing — skip khi sync-all (tính 1 lần ở operation); Missing ≠ Delete */
    if (!options.skipMissing) {
      const master = await client.query(
        `SELECT ticker FROM stocks WHERE LOWER(COALESCE(status,'active')) = 'active'`
      );
      for (const row of master.rows || []) {
        if (seen.has(row.ticker)) continue;
        summary.missing_count += 1;
        await insertChangeSet(client, {
          import_id: importId,
          entity_key: row.ticker,
          field_key: '*',
          current_value: row.ticker,
          incoming_value: null,
          source_code: sourceCode,
          trust_level: '',
          class: 'missing',
          result: 'missing',
          note: 'Missing ≠ Delete'
        });
      }
    }

    finalStatus = options.deferApply ? 'partial' : 'success';
    await client.query(
      `UPDATE market_data_imports SET
         status = $13,
         finished_at = NOW(),
         valid_count = $2,
         invalid_count = $3,
         new_count = $4,
         filled_count = $5,
         unchanged_count = $6,
         conflict_count = $7,
         missing_count = $8,
         auto_applied_count = $9,
         updated_count = $10,
         rejected_count = $11,
         failed_count = $12
       WHERE id = $1`,
      [
        importId,
        summary.valid,
        summary.invalid,
        summary.new_count,
        summary.filled_count,
        summary.unchanged_count,
        summary.conflict_count,
        summary.missing_count,
        summary.auto_applied_count,
        summary.updated_count,
        summary.rejected_count,
        summary.failed_count,
        finalStatus
      ]
    );
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  return { import_id: importId, summary, status: finalStatus, defer_apply: !!options.deferApply };
}

async function runImportFromSource(sourceCode, options, adminId) {
  options = options || {};
  await assertSourceImportable(sourceCode);
  let candidates;
  try {
    if (!options.csvText && !options.items) {
      const st = await getSourceStaging(sourceCode);
      if (st && st.payload_text) options = Object.assign({}, options, { csvText: st.payload_text });
    }
    candidates = await loadCandidates(sourceCode, options);
  } catch (err) {
    const src = await query('SELECT id FROM data_sources WHERE code = $1', [sourceCode]);
    const ins = await query(
      `INSERT INTO market_data_imports
         (source_id, source_code, status, admin_id, received_count, finished_at, error_summary, failed_count)
       VALUES ($1, $2, 'failed', $3, 0, NOW(), $4, 1)
       RETURNING id`,
      [src.rows[0] && src.rows[0].id, sourceCode, adminId || null, String(err.message || err)]
    );
    return {
      import_id: ins.rows[0].id,
      summary: { failed: true, error: String(err.message || err) },
      failed: true
    };
  }
  return runImport(sourceCode, candidates, adminId, {
    skipMissing: !!options.skipMissing,
    deferApply: !!options.deferApply
  });
}

/**
 * BR-11.IMP / BR-11.RES / BR-11.ALL —
 * Import/Sync Operation: không chọn Source; resolve từ Field Authority.
 */
async function runSyncAll(adminId, actor) {
  const config = await listFieldAuthorityConfig();
  const sourceSet = {};
  config.forEach(function (c) {
    if (c.iflux_owned) return;
    if (!c.current_source) return;
    if (c.trust_level !== 'trusted' && c.trust_level !== 'review_required') return;
    sourceSet[c.current_source] = true;
  });
  const sourceCodes = Object.keys(sourceSet);
  const sourcesUsed = [];
  const imports = [];
  const totals = {
    new_count: 0,
    filled_count: 0,
    unchanged_count: 0,
    conflict_count: 0,
    missing_count: 0,
    failed_sources: 0,
    ok_sources: 0
  };

  if (!sourceCodes.length) {
    return {
      sources_used: [],
      imports: [],
      summary: Object.assign({ message: 'Chưa có Field Authority Active — cấu hình Current Source trước khi Sync' }, totals),
      actor: actor || null
    };
  }

  for (let i = 0; i < sourceCodes.length; i++) {
    const code = sourceCodes[i];
    let out;
    try {
      out = await runImportFromSource(code, { skipMissing: true, deferApply: false }, adminId);
    } catch (err) {
      out = {
        failed: true,
        summary: { failed: true, error: String(err.message || err) },
        import_id: null
      };
    }
    const failed = !!(out && out.failed);
    const s = (out && out.summary) || {};
    sourcesUsed.push({
      source_code: code,
      ok: !failed,
      import_id: out && out.import_id,
      error: failed ? s.error || 'failed' : null,
      new_count: s.new_count || 0,
      filled_count: s.filled_count || 0,
      conflict_count: s.conflict_count || 0,
      unchanged_count: s.unchanged_count || 0
    });
    imports.push(out);
    if (failed) totals.failed_sources += 1;
    else {
      totals.ok_sources += 1;
      totals.new_count += s.new_count || 0;
      totals.filled_count += s.filled_count || 0;
      totals.unchanged_count += s.unchanged_count || 0;
      totals.conflict_count += s.conflict_count || 0;
    }
  }

  /* BR-11 Import≠Apply: không ghi Audit hoàn tất tại Import — Audit sau Apply */
  const importIds = imports.map(function (x) { return x && x.import_id; }).filter(Boolean);
  return {
    sources_used: sourcesUsed,
    imports: imports,
    import_ids: importIds,
    summary: totals,
    actor: actor || null,
    defer_apply: true,
    message: 'Import xong — mở Conflict Review; Apply mới ghi Market Master'
  };
}

async function listConflicts(filters) {
  filters = filters || {};
  const params = [];
  /* BR OD-08 — Admin Review chỉ thấy xung đột giá trị thật (Master ≠ Incoming).
     Loại deferred_new / deferred_fill (không phải conflict). */
  let sql = `
    SELECT DISTINCT ON (entity, entity_key, field_key) *
    FROM market_data_conflicts
    WHERE 1=1
      AND current_value IS DISTINCT FROM incoming_value
      AND field_key <> '*'
      AND COALESCE(note, '') NOT LIKE '%deferred%'`;
  if (filters.state) {
    params.push(filters.state);
    sql += ` AND review_state = $${params.length}`;
  } else {
    sql += ` AND review_state = 'pending'`;
  }
  if (filters.source) {
    params.push(filters.source);
    sql += ` AND source_code = $${params.length}`;
  }
  if (Array.isArray(filters.import_ids)) {
    if (!filters.import_ids.length) return [];
    params.push(filters.import_ids);
    sql += ` AND import_id = ANY($${params.length}::uuid[])`;
  }
  sql += ' ORDER BY entity, entity_key, field_key, detected_at DESC';
  const limit = Math.min(Math.max(Number(filters.limit) || 2000, 1), 5000);
  params.push(limit);
  sql = `SELECT * FROM (${sql}) AS conflicts ORDER BY detected_at DESC LIMIT $${params.length}`;
  const res = await query(sql, params);
  return res.rows || [];
}

async function resolveConflict(id, decision, adminId, note, actor) {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const cur = await client.query(
      `SELECT * FROM market_data_conflicts WHERE id = $1 FOR UPDATE`,
      [id]
    );
    const row = cur.rows[0];
    if (!row) throw AppError.notFound('Không tìm thấy conflict');
    if (row.review_state !== 'pending') {
      throw AppError.badRequest('VALIDATION', 'Conflict đã được xử lý');
    }

    const why = note != null ? String(note) : '';

    if (decision === 'apply') {
      const col = row.field_key;
      if (IFLUX_OWNED.has(col)) {
        throw AppError.badRequest('VALIDATION', 'Không Apply trực tiếp field iFlux-owned qua conflict MDM');
      }
      const allowed = MASTER_INTAKE;
      if (allowed.indexOf(col) < 0) {
        throw AppError.badRequest('VALIDATION', 'Field không được Apply qua conflict');
      }
      let val = row.incoming_value;
      if (col === 'market_cap') val = Number(val);
      if (col === 'cap_group') val = normalizeCapGroup(val);
      await client.query(
        `UPDATE stocks SET ${col} = $2, updated_at = NOW() WHERE ticker = $1`,
        [row.entity_key, val]
      );
      await client.query(
        `UPDATE market_data_conflicts
         SET review_state = 'applied', decided_by = $2, decided_at = NOW(), note = CASE WHEN $3 = '' THEN note ELSE $3 END
         WHERE id = $1`,
        [id, adminId || null, why]
      );
      await writeSotAudit(client, {
        admin_id: adminId,
        actor: actor || null,
        entity_key: row.entity_key,
        field_key: col,
        from_value: row.current_value,
        to_value: val,
        source_code: row.source_code,
        why: why || 'Admin Apply conflict',
        result: 'apply',
        import_id: row.import_id,
        conflict_id: id
      });
    } else if (decision === 'reject' || decision === 'skip') {
      const state = decision === 'skip' ? 'skipped' : 'rejected';
      await client.query(
        `UPDATE market_data_conflicts
         SET review_state = $2, decided_by = $3, decided_at = NOW(),
             note = CASE WHEN $4 = '' THEN note ELSE $4 END
         WHERE id = $1`,
        [id, state, adminId || null, why]
      );
      await writeSotAudit(client, {
        admin_id: adminId,
        actor: actor || null,
        entity_key: row.entity_key,
        field_key: row.field_key,
        from_value: row.current_value,
        to_value: row.incoming_value,
        source_code: row.source_code,
        why: why || 'Admin ' + decision,
        result: decision,
        import_id: row.import_id,
        conflict_id: id
      });
    } else {
      throw AppError.badRequest('VALIDATION', 'decision phải là apply|reject|skip');
    }

    await client.query('COMMIT');
    return { id: id, decision: decision };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function listImports(limit, opts) {
  opts = opts || {};
  const params = [limit || 50];
  let sql = `SELECT i.*,
       (SELECT COUNT(*)::int FROM market_data_change_set_items c WHERE c.import_id = i.id) AS change_set_count
     FROM market_data_imports i`;
  if (opts.completedOnly) {
    sql += ` WHERE i.status = 'success'`;
  }
  sql += ' ORDER BY i.started_at DESC LIMIT $1';
  const res = await query(sql, params);
  return res.rows || [];
}

async function listChangeSet(importId) {
  const res = await query(
    `SELECT * FROM market_data_change_set_items WHERE import_id = $1 ORDER BY created_at ASC`,
    [importId]
  );
  return res.rows || [];
}

async function fieldAuthorityMatrix() {
  /* Owner LOCK — Block 1 Stock + Block 2 Stock Prices (Current Market Price State). */
  const config = await listFieldAuthorityConfigForEntity('stock');
  const config_stock_price = await listFieldAuthorityConfigForEntity('stock_price');
  const provider_columns = await listProviderColumns();
  return {
    config: config,
    config_stock_price: config_stock_price,
    provider_columns: provider_columns
  };
}

async function listSotAudit(limit) {
  const res = await query(
    `SELECT * FROM market_sot_audit ORDER BY created_at DESC LIMIT $1`,
    [limit || 100]
  );
  return res.rows || [];
}


/**
 * BR-11 Apply — ghi Master cho mọi conflict pending còn lại của các import_id.
 * History status → success; Audit ghi tại đây.
 */
async function applyImportBatch(importIds, adminId, actor) {
  const ids = (importIds || []).filter(Boolean);
  if (!ids.length) throw AppError.badRequest('VALIDATION', 'import_ids bắt buộc');
  const client = await getPool().connect();
  let applied = 0;
  let rejectedLeft = 0;
  try {
    await client.query('BEGIN');
    const confRes = await client.query(
      `SELECT * FROM market_data_conflicts
       WHERE import_id = ANY($1::uuid[]) AND review_state = 'pending'
       ORDER BY CASE WHEN field_key = '*' THEN 0 ELSE 1 END, detected_at ASC`,
      [ids]
    );
    for (const row of confRes.rows || []) {
      const note = row.note || '';
      if (row.field_key === '*' && String(note).indexOf('deferred_new') >= 0) {
        let payload = {};
        try { payload = JSON.parse(note); } catch (e) { payload = { name: row.incoming_value }; }
        const exists = await client.query('SELECT ticker FROM stocks WHERE ticker = $1', [row.entity_key]);
        if (!exists.rows[0]) {
          await client.query(
            `INSERT INTO stocks (ticker, name, exchange, status, market_cap, cap_group, updated_at)
             VALUES ($1, $2, $3, 'active', $4, $5, NOW())`,
            [
              row.entity_key,
              payload.name || row.incoming_value || row.entity_key,
              payload.exchange || 'HOSE',
              payload.market_cap != null ? payload.market_cap : null,
              payload.cap_group || null
            ]
          );
        }
        await client.query(
          `UPDATE market_data_conflicts
           SET review_state = 'applied', decided_by = $2, decided_at = NOW()
           WHERE id = $1`,
          [row.id, adminId || null]
        );
        await writeSotAudit(client, {
          admin_id: adminId,
          actor: actor || null,
          entity_key: row.entity_key,
          field_key: '*',
          from_value: null,
          to_value: payload.name || row.incoming_value,
          source_code: row.source_code,
          why: 'Admin Apply',
          result: 'applied',
          import_id: row.import_id,
          conflict_id: row.id
        });
        applied += 1;
        continue;
      }

      const col = row.field_key;
      if (IFLUX_OWNED.has(col) || MASTER_INTAKE.indexOf(col) < 0) {
        await client.query(
          `UPDATE market_data_conflicts
           SET review_state = 'rejected', decided_by = $2, decided_at = NOW(), note = COALESCE(NULLIF(note,''), 'skip_non_intakeable')
           WHERE id = $1`,
          [row.id, adminId || null]
        );
        rejectedLeft += 1;
        continue;
      }
      let val = row.incoming_value;
      if (col === 'market_cap') val = Number(val);
      if (col === 'cap_group') val = normalizeCapGroup(val);
      const stock = await client.query('SELECT ticker FROM stocks WHERE ticker = $1', [row.entity_key]);
      if (!stock.rows[0]) {
        await client.query(
          `INSERT INTO stocks (ticker, name, exchange, status, updated_at)
           VALUES ($1, $2, 'HOSE', 'active', NOW())`,
          [row.entity_key, row.entity_key]
        );
      }
      await client.query(
        `UPDATE stocks SET ${col} = $2, updated_at = NOW() WHERE ticker = $1`,
        [row.entity_key, val]
      );
      await client.query(
        `UPDATE market_data_conflicts
         SET review_state = 'applied', decided_by = $2, decided_at = NOW()
         WHERE id = $1`,
        [row.id, adminId || null]
      );
      await writeSotAudit(client, {
        admin_id: adminId,
        actor: actor || null,
        entity_key: row.entity_key,
        field_key: col,
        from_value: row.current_value,
        to_value: val,
        source_code: row.source_code,
        why: 'Admin Apply',
        result: 'applied',
        import_id: row.import_id,
        conflict_id: row.id
      });
      applied += 1;
    }

    await client.query(
      `UPDATE market_data_imports
       SET status = 'success', finished_at = COALESCE(finished_at, NOW()),
           auto_applied_count = auto_applied_count + $2
       WHERE id = ANY($1::uuid[]) AND status IN ('partial', 'running')`,
      [ids, applied]
    );
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
  return { import_ids: ids, applied: applied, skipped_non_intakeable: rejectedLeft };
}

async function rejectConflictsBatch(ids, adminId, actor) {
  const list = (ids || []).filter(Boolean);
  if (!list.length) throw AppError.badRequest('VALIDATION', 'ids bắt buộc');
  let n = 0;
  for (let i = 0; i < list.length; i++) {
    await resolveConflict(list[i], 'reject', adminId, 'Admin Reject selected', actor);
    n += 1;
  }
  return { rejected: n };
}

module.exports = {
  listSourcesWithAuthority,
  setFieldAuthority,
  setCurrentFieldSource,
  listFieldAuthorityConfig,
  listFieldAuthorityConfigForEntity,
  getTrustedMap,
  runImport,
  runImportFromSource,
  runSyncAll,
  getSourceStaging,
  setSourceStaging,
  listConflicts,
  resolveConflict,
  applyImportBatch,
  rejectConflictsBatch,
  listImports,
  listChangeSet,
  fieldAuthorityMatrix,
  listSotAudit,
  writeSotAudit,
  assertSourceImportable,
  STOCK_PRICE_CONFIG_FIELDS,
  IFLUX_OWNED
};
