#!/usr/bin/env node
'use strict';
/** ABH E6 — rebuild Plans Runtime Artifact (plans[] from overrides). */
const path = require('path');
const fs = require('fs');

const ROOT = path.join(__dirname, '..');
const BACKEND_ROOT = process.env.IFLUX_BACKEND_ROOT || path.join(ROOT, 'backend');
const { buildPublishedArtifact } = require(path.join(BACKEND_ROOT, 'src/modules/subscription/plan-normalize-publish'));

const TARGETS = [
  path.join(BACKEND_ROOT, 'data/plans-runtime.json'),
  path.join(ROOT, 'User_Web/data/iflux-plans-v1.json')
];

function readRaw(file) {
  if (!fs.existsSync(file)) return { version: 1, updatedAt: 0, overrides: {}, custom: [] };
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

const source = readRaw(TARGETS[0]);
const artifact = buildPublishedArtifact(source);
artifact.updatedAt = Date.now();
const json = JSON.stringify(artifact, null, 2);

TARGETS.forEach((file) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, json, 'utf8');
  console.log('Wrote', file, '— plans:', artifact.plans.length);
});
