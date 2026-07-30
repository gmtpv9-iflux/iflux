'use strict';

const { query } = require('../../core/database/connection');
const { AppError } = require('../../shared/exceptions/app-error');
const { writeRuntimeFile, entitlementPayloadToRuntime } = require('./plans-runtime-file');

async function listPlans() {
  return (await query('SELECT * FROM sub_admin_plans ORDER BY code ASC')).rows || [];
}
async function createPlan(input) {
  const res = await query(
    `INSERT INTO sub_admin_plans (code, name, price_vnd, status) VALUES ($1,$2,$3,$4) RETURNING *`,
    [String(input.code||'').trim(), String(input.name||'').trim(), Number(input.price_vnd)||0, String(input.status||'active')]
  );
  return res.rows[0];
}
async function updatePlan(id, input) {
  const cur = await query('SELECT * FROM sub_admin_plans WHERE id=$1', [id]);
  if (!cur.rows[0]) throw AppError.notFound('Không tìm thấy gói');
  const r = cur.rows[0];
  const res = await query(
    `UPDATE sub_admin_plans SET name=$2, price_vnd=$3, status=$4, updated_at=NOW() WHERE id=$1 RETURNING *`,
    [id, input.name!=null?String(input.name).trim():r.name, input.price_vnd!=null?Number(input.price_vnd):r.price_vnd, input.status!=null?String(input.status):r.status]
  );
  return res.rows[0];
}
async function deletePlan(id) {
  const res = await query('DELETE FROM sub_admin_plans WHERE id=$1 RETURNING id', [id]);
  if (!res.rows[0]) throw AppError.notFound('Không tìm thấy gói');
  return { id };
}

async function getKv(scope) {
  const res = await query(`SELECT * FROM system_admin_kv WHERE scope=$1 AND code='primary' LIMIT 1`, [scope]);
  return res.rows[0] || { scope, code: 'primary', payload: {} };
}
async function setKv(scope, payload) {
  const res = await query(
    `UPDATE system_admin_kv SET payload=$2::jsonb, updated_at=NOW() WHERE scope=$1 AND code='primary' RETURNING *`,
    [scope, JSON.stringify(payload||{})]
  );
  if (!res.rows[0]) {
    const ins = await query(
      `INSERT INTO system_admin_kv (scope, code, payload) VALUES ($1,'primary',$2::jsonb) RETURNING *`,
      [scope, JSON.stringify(payload||{})]
    );
    return ins.rows[0];
  }
  return res.rows[0];
}

async function getEntitlements() { return getKvViaTable('sub_admin_entitlements'); }
async function setEntitlements(payload) {
  const json = JSON.stringify(payload || {});
  let res = await query(
    `UPDATE sub_admin_entitlements SET payload=$1::jsonb, updated_at=NOW() WHERE code='matrix' RETURNING *`,
    [json]
  );
  if (!res.rows[0]) {
    res = await query(
      `INSERT INTO sub_admin_entitlements (code, payload) VALUES ('matrix', $1::jsonb) RETURNING *`,
      [json]
    );
  }
  const runtime = entitlementPayloadToRuntime(payload);
  if (runtime) writeRuntimeFile(runtime);
  return res.rows[0];
}
async function getKvViaTable(table) {
  const res = await query(`SELECT * FROM ${table} WHERE code='matrix' OR code='default' ORDER BY code LIMIT 1`);
  return res.rows[0] || { payload: {} };
}
async function getLoyalty() {
  const res = await query(`SELECT * FROM sub_admin_loyalty WHERE code='default' LIMIT 1`);
  return res.rows[0] || { payload: {} };
}
async function setLoyalty(payload) {
  const res = await query(
    `UPDATE sub_admin_loyalty SET payload=$1::jsonb, updated_at=NOW() WHERE code='default' RETURNING *`,
    [JSON.stringify(payload||{})]
  );
  return res.rows[0];
}
async function listSubscribers() {
  return (await query('SELECT * FROM sub_admin_subscribers ORDER BY email ASC')).rows || [];
}
async function exportSubscribers() {
  const rows = await listSubscribers();
  return { csv: 'email,plan,status\n' + rows.map((r) => `${r.email},${r.plan_code},${r.status}`).join('\n'), total: rows.length };
}

async function listCauChuyen() {
  return (await query('SELECT * FROM stories_cau_chuyen ORDER BY code ASC')).rows || [];
}
async function updateCauChuyen(id, input) {
  const cur = await query('SELECT * FROM stories_cau_chuyen WHERE id=$1', [id]);
  if (!cur.rows[0]) throw AppError.notFound('Không tìm thấy câu chuyện');
  const r = cur.rows[0];
  const res = await query(
    `UPDATE stories_cau_chuyen SET title=$2, body=$3, updated_at=NOW() WHERE id=$1 RETURNING *`,
    [id, input.title!=null?String(input.title).trim():r.title, input.body!=null?String(input.body):r.body]
  );
  return res.rows[0];
}
function storiesAnalytics() {
  return { cards: [{ key: 'stories', label: 'Chủ đề', value: '—' }, { key: 'views', label: 'Lượt xem', value: '—' }], updated_at: new Date().toISOString() };
}

module.exports = {
  listPlans, createPlan, updatePlan, deletePlan,
  getEntitlements, setEntitlements, getLoyalty, setLoyalty,
  listSubscribers, exportSubscribers,
  getKv, setKv,
  listCauChuyen, updateCauChuyen, storiesAnalytics
};
