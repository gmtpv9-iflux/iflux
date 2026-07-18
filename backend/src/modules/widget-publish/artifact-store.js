'use strict';

const { query, getPool } = require('../../core/database/connection');
const { LIFECYCLE } = require('./contracts/artifact-lifecycle');

async function logLifecycle(artifactType, artifactKey, version, fromState, toState, actor, detail) {
  await query(
    `INSERT INTO artifact_lifecycle_events
      (artifact_type, artifact_key, version, from_state, to_state, actor, detail)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [artifactType, artifactKey, version, fromState, toState, actor || null, detail ? JSON.stringify(detail) : null]
  );
}

async function nextWidgetVersion(widgetId) {
  const res = await query(
    'SELECT COALESCE(MAX(version), 0) + 1 AS v FROM widget_published_versions WHERE widget_id = $1',
    [widgetId]
  );
  return Number(res.rows[0].v);
}

async function nextPageVersion(pageKey) {
  const res = await query(
    'SELECT COALESCE(MAX(version), 0) + 1 AS v FROM page_published_versions WHERE page_key = $1',
    [pageKey]
  );
  return Number(res.rows[0].v);
}

async function saveWidgetPublished(artifact, actor) {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const version = artifact.version;
    const ins = await client.query(
      `INSERT INTO widget_published_versions
        (widget_id, version, lifecycle_state, artifact, etag, checksum, published_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [
        artifact.id,
        version,
        LIFECYCLE.PUBLISHED,
        JSON.stringify(artifact),
        artifact.publishMeta.etag,
        artifact.publishMeta.checksum,
        artifact.publishMeta.publishedAt
      ]
    );
    const versionId = ins.rows[0].id;
    await client.query(
      `INSERT INTO widget_current_versions (widget_id, version_id, version, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (widget_id) DO UPDATE SET
         version_id = EXCLUDED.version_id,
         version = EXCLUDED.version,
         updated_at = NOW()`,
      [artifact.id, versionId, version]
    );
    await client.query(
      `INSERT INTO artifact_lifecycle_events
        (artifact_type, artifact_key, version, from_state, to_state, actor)
       VALUES ('widget', $1, $2, 'frozen', 'published', $3)`,
      [artifact.id, version, actor || null]
    );
    await client.query('COMMIT');
    return { versionId, version };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function savePagePublished(artifact, actor) {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const version = artifact.version;
    const ins = await client.query(
      `INSERT INTO page_published_versions
        (page_key, version, lifecycle_state, artifact, etag, checksum, published_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [
        artifact.page,
        version,
        LIFECYCLE.PUBLISHED,
        JSON.stringify(artifact),
        artifact.publishMeta.etag,
        artifact.publishMeta.checksum,
        artifact.publishMeta.publishedAt
      ]
    );
    const versionId = ins.rows[0].id;
    await client.query(
      `INSERT INTO page_current_versions (page_key, version_id, version, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (page_key) DO UPDATE SET
         version_id = EXCLUDED.version_id,
         version = EXCLUDED.version,
         updated_at = NOW()`,
      [artifact.page, versionId, version]
    );
    await client.query(
      `INSERT INTO artifact_lifecycle_events
        (artifact_type, artifact_key, version, from_state, to_state, actor)
       VALUES ('page', $1, $2, 'frozen', 'published', $3)`,
      [artifact.page, version, actor || null]
    );
    await client.query('COMMIT');
    return { versionId, version };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function getCurrentWidget(widgetId) {
  const res = await query(
    `SELECT w.artifact, w.etag, w.version, w.checksum, w.published_at
     FROM widget_current_versions c
     JOIN widget_published_versions w ON w.id = c.version_id
     WHERE c.widget_id = $1`,
    [widgetId]
  );
  if (!res.rows.length) return null;
  const row = res.rows[0];
  return {
    artifact: row.artifact,
    etag: row.etag,
    version: row.version,
    checksum: row.checksum,
    publishedAt: row.published_at
  };
}

async function getWidgetByVersion(widgetId, version) {
  const res = await query(
    `SELECT artifact, etag, version, checksum, published_at
     FROM widget_published_versions
     WHERE widget_id = $1 AND version = $2`,
    [widgetId, version]
  );
  if (!res.rows.length) return null;
  const row = res.rows[0];
  return {
    artifact: row.artifact,
    etag: row.etag,
    version: row.version,
    checksum: row.checksum,
    publishedAt: row.published_at
  };
}

async function getCurrentPage(pageKey) {
  const res = await query(
    `SELECT p.artifact, p.etag, p.version, p.checksum, p.published_at
     FROM page_current_versions c
     JOIN page_published_versions p ON p.id = c.version_id
     WHERE c.page_key = $1`,
    [pageKey]
  );
  if (!res.rows.length) return null;
  const row = res.rows[0];
  return {
    artifact: row.artifact,
    etag: row.etag,
    version: row.version,
    checksum: row.checksum,
    publishedAt: row.published_at
  };
}

module.exports = {
  logLifecycle,
  nextWidgetVersion,
  nextPageVersion,
  saveWidgetPublished,
  savePagePublished,
  getCurrentWidget,
  getWidgetByVersion,
  getCurrentPage
};
