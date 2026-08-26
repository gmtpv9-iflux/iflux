#!/usr/bin/env node
/**
 * Canonical iFlux Design System — Token Generator (Sub-01 P1)
 *
 * tokens/source/*.json (SoT — writable)
 *         ↓
 * tokens/generated/css/*  +  tokens/generated/js/*  (readonly artifact)
 *
 * Luật: JSON = SoT duy nhất. CẤM sửa tay file generated.
 * Deterministic: chạy lại ra output y hệt (không timestamp).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'tokens', 'source');
const OUT_CSS = path.join(ROOT, 'tokens', 'generated', 'css');
const OUT_JS = path.join(ROOT, 'tokens', 'generated', 'js');

const FILE_ORDER = [
  'color.json', 'typography.json', 'spacing.json', 'radius.json',
  'shadow.json', 'motion.json', 'size.json', 'zindex.json', 'breakpoints.json',
];

const HEADER = (files) => `/* DO NOT EDIT — GENERATED FROM TOKEN SOURCE
 * Canonical iFlux Design System — readonly artifact.
 * Source: design_system/tokens/source/{${files.join(', ')}}
 * Build : node design_system/scripts/build-tokens.mjs
 */
`;

const registry = new Map();       // 'color.navy.600' -> raw value (section-less path)
const primitives = [];            // { file, group, varName, raw }
const semantics = [];             // { file, group, varName, raw }
const themes = new Map();         // 'dark' -> [{ varName, raw }]
let breakpoints = null;

function varName(parts) { return '--ifx-' + parts.join('-'); }

function walk(file, obj, parts, sink) {
  for (const [key, value] of Object.entries(obj)) {
    if (key.startsWith('$')) continue;
    const p = [...parts, key];
    if (typeof value === 'string') {
      const regKey = p.join('.');
      if (registry.has(regKey)) {
        throw new Error(`Token collision: ${regKey} (file ${file})`);
      }
      registry.set(regKey, value);
      sink.push({ file, group: parts[0] ?? key, varName: varName(p), raw: value });
    } else if (value && typeof value === 'object') {
      walk(file, value, p, sink);
    } else {
      throw new Error(`Giá trị không hợp lệ tại ${p.join('.')} (file ${file})`);
    }
  }
}

for (const file of FILE_ORDER) {
  const full = path.join(SRC, file);
  if (!fs.existsSync(full)) throw new Error(`Thiếu source: ${file}`);
  const json = JSON.parse(fs.readFileSync(full, 'utf8'));
  if (json.primitive) walk(file, json.primitive, [], primitives);
  if (json.semantic) walk(file, json.semantic, [], semantics);
  if (json.theme) {
    for (const [themeName, map] of Object.entries(json.theme)) {
      if (themeName.startsWith('$')) continue;
      const list = themes.get(themeName) ?? [];
      for (const [key, value] of Object.entries(map)) {
        if (key.startsWith('$')) continue;
        if (typeof value !== 'string') throw new Error(`Theme token phải là string: ${themeName}.${key}`);
        list.push({ varName: varName([key]), raw: value });
      }
      themes.set(themeName, list);
    }
  }
  if (json.breakpoint) breakpoints = json.breakpoint;
}

const REF_RE = /\{([a-z0-9.\-]+)\}/gi;
function resolveRefs(raw, context) {
  return raw.replace(REF_RE, (_, refPath) => {
    if (!registry.has(refPath)) {
      throw new Error(`Ref không tồn tại {${refPath}} (tại ${context})`);
    }
    return `var(${varName(refPath.split('.'))})`;
  });
}

function renderBlock(tokens) {
  let css = '';
  let lastGroup = null;
  for (const t of tokens) {
    const groupLabel = `${t.file.replace('.json', '')} · ${t.group}`;
    if (groupLabel !== lastGroup) {
      css += `\n  /* ── ${groupLabel} ── */\n`;
      lastGroup = groupLabel;
    }
    css += `  ${t.varName}: ${resolveRefs(t.raw, t.varName)};\n`;
  }
  return css;
}

fs.mkdirSync(OUT_CSS, { recursive: true });
fs.mkdirSync(path.join(OUT_CSS, 'themes'), { recursive: true });
fs.mkdirSync(OUT_JS, { recursive: true });

const primFiles = [...new Set(primitives.map((t) => t.file))];
fs.writeFileSync(
  path.join(OUT_CSS, 'primitives.css'),
  `${HEADER(primFiles)}:root {${renderBlock(primitives)}}\n`
);

const semFiles = [...new Set(semantics.map((t) => t.file))];
fs.writeFileSync(
  path.join(OUT_CSS, 'semantic.css'),
  `${HEADER(semFiles)}:root {${renderBlock(semantics)}}\n`
);

for (const [themeName, list] of themes) {
  const selector = themeName === 'dark' ? ':root,\n[data-theme="dark"]' : `[data-theme="${themeName}"]`;
  let css = `${HEADER(['color.json'])}${selector} {\n  color-scheme: ${themeName};\n`;
  for (const t of list) css += `  ${t.varName}: ${resolveRefs(t.raw, `${themeName}.${t.varName}`)};\n`;
  css += '}\n';
  fs.writeFileSync(path.join(OUT_CSS, 'themes', `${themeName}.css`), css);
}

if (!breakpoints) throw new Error('Thiếu breakpoints.json');
const bpEntries = Object.entries(breakpoints)
  .map(([id, px]) => `  '${id}': ${parseInt(px, 10)}`)
  .join(',\n');
fs.writeFileSync(
  path.join(OUT_JS, 'breakpoints.js'),
  `${HEADER(['breakpoints.json'])}/* Mobile-first: base < ${Object.values(breakpoints)[0]} = CSS mặc định.
 * CẤM dùng trong @media qua var() — media query phải là literal (bp:sm..2xl). */
(function (g) {
  'use strict';
  g.IFX_BREAKPOINTS = Object.freeze({
${bpEntries}
  });
})(typeof window !== 'undefined' ? window : globalThis);
`
);

const index = {
  primitive: {},
  semantic: {},
  theme: Object.fromEntries([...themes].map(([n, list]) => [n, list.map((t) => t.varName)])),
  breakpoint: breakpoints,
};
for (const t of primitives) (index.primitive[t.group] ??= []).push(t.varName);
for (const t of semantics) (index.semantic[t.group] ??= []).push(t.varName);
fs.writeFileSync(
  path.join(OUT_JS, 'token-index.js'),
  `${HEADER(FILE_ORDER)}(function (g) {
  'use strict';
  g.IFX_TOKEN_INDEX = ${JSON.stringify(index, null, 2)};
})(typeof window !== 'undefined' ? window : globalThis);
`
);

console.log(`[build-tokens] OK — primitives: ${primitives.length} · semantic: ${semantics.length} · theme: ${[...themes].map(([n, l]) => `${n}=${l.length}`).join(' · ')} · breakpoints: ${Object.keys(breakpoints).length}`);
