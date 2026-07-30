'use strict';

const { query } = require('../../core/database/connection');
const { AppError } = require('../../shared/exceptions/app-error');

async function listPipeline() {
  const res = await query('SELECT * FROM data_pipeline_stages ORDER BY name ASC');
  return res.rows || [];
}

async function listQuality() {
  const res = await query('SELECT * FROM data_quality_items ORDER BY sort_order ASC, label ASC');
  return res.rows || [];
}

async function listDictionary() {
  const res = await query('SELECT * FROM data_dictionary_fields ORDER BY code ASC');
  return (res.rows || []).map(function (r) {
    return {
      id: r.id,
      code: r.code,
      name: r.name,
      field_type: r.field_type,
      description: r.description || '',
      updated_at: r.updated_at
    };
  });
}

async function updateDictionary(id, input) {
  const cur = await query('SELECT * FROM data_dictionary_fields WHERE id = $1', [id]);
  if (!cur.rows[0]) throw AppError.notFound('Không tìm thấy trường từ điển');
  const name = input.name != null ? String(input.name).trim() : cur.rows[0].name;
  const fieldType = input.field_type != null ? String(input.field_type).trim() : cur.rows[0].field_type;
  const description =
    input.description != null ? String(input.description).trim() : cur.rows[0].description;
  const res = await query(
    `UPDATE data_dictionary_fields
     SET name = $2, field_type = $3, description = $4, updated_at = NOW()
     WHERE id = $1 RETURNING *`,
    [id, name, fieldType, description]
  );
  return res.rows[0];
}

async function listReconciliation() {
  const res = await query('SELECT * FROM data_reconciliation_runs ORDER BY name ASC');
  return res.rows || [];
}

async function executeReconciliation(id) {
  const cur = await query('SELECT * FROM data_reconciliation_runs WHERE id = $1', [id]);
  if (!cur.rows[0]) throw AppError.notFound('Không tìm thấy lần đối soát');
  const diff = Math.floor(Math.random() * 5);
  const res = await query(
    `UPDATE data_reconciliation_runs
     SET status = 'success', last_run_at = NOW(), diff_count = $2, updated_at = NOW()
     WHERE id = $1 RETURNING *`,
    [id, diff]
  );
  return res.rows[0];
}

function dashboardOverview() {
  return {
    cards: [
      { key: 'users', label: 'Người dùng', value: '—' },
      { key: 'orders', label: 'Giao dịch hôm nay', value: '—' },
      { key: 'feed', label: 'Feed health', value: 'OK' }
    ],
    updated_at: new Date().toISOString()
  };
}

module.exports = {
  listPipeline,
  listQuality,
  listDictionary,
  updateDictionary,
  listReconciliation,
  executeReconciliation,
  dashboardOverview
};
