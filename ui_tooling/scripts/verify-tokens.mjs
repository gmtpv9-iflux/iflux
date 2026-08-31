#!/usr/bin/env node
/**
 * Canonical iFlux Design System — Token Parity Verifier (Sub-01 P1)
 *
 * So GIÁ TRỊ RESOLVE CUỐI của token generated với bộ token legacy đang chạy
 * (Admin_Design_system/iflux-admin-ui). Lệch = FAIL (trừ exception đã đăng ký).
 *
 * Mapping tên:
 *   --ifx-*            ↔ --ifx-*            (primitive, giữ nguyên tên)
 *   --color-X (theme)  ↔ --ifx-X            (riêng scrim → overlay-scrim)
 *   --radius-X         ↔ --ifx-radius-X
 *   --shadow-X         ↔ --ifx-shadow-X     (card/dropdown/modal)
 *   --transition-X     ↔ --ifx-transition-X
 *
 * Exception đã đăng ký (xem gates/P1.md — trace consumer 2026-08-26):
 *   REPAIR  dark --color-scrim: legacy broken (--ifx-color-scrim undefined → dark render
 *           transparent tại .ix-overlay/.ix-modal-overlay). Canonical sửa theo intent
 *           rgba(0,0,0,0.45) — khác legacy CÓ CHỦ ĐÍCH, không so parity.
 *   DROP    --color-text-card-title (dark+light): 0 consumer style trên staging +
 *           production worktree → không promote vào canonical (DROP candidate).
 * Ngoài parity theo thiết kế (không so):
 *   --ifx-bp-* legacy (breakpoint SoT mới do Owner LOCK, khác giá trị cũ)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '../..');
const DS = path.join(REPO, 'design_system');
const LEGACY_DIR = path.join(REPO, 'Admin_Design_system', 'iflux-admin-ui');

const LEGACY_FILES = [
  'primitives/color.css', 'primitives/radius.css', 'primitives/shadow.css',
  'primitives/motion.css', 'primitives/z-index.css', 'primitives/layout.css',
  'spacing.css', 'typography.css', 'semantic/theme.css',
];

const REPAIRED = new Set(['dark:--color-scrim']);
const DROPPED = new Set(['dark:--color-text-card-title', 'light:--color-text-card-title']);

function stripComments(css) { return css.replace(/\/\*[\s\S]*?\*\//g, ''); }

/** Trả về danh sách rule top-level {selector, body}; bỏ toàn bộ nội dung @media. */
function topLevelRules(css) {
  const rules = [];
  let i = 0;
  while (i < css.length) {
    const open = css.indexOf('{', i);
    if (open === -1) break;
    const selector = css.slice(i, open).trim();
    let depth = 1;
    let j = open + 1;
    while (j < css.length && depth > 0) {
      if (css[j] === '{') depth += 1;
      else if (css[j] === '}') depth -= 1;
      j += 1;
    }
    const body = css.slice(open + 1, j - 1);
    if (!selector.startsWith('@')) rules.push({ selector, body });
    i = j;
  }
  return rules;
}

function extractVars(body) {
  const map = new Map();
  const re = /(--[\w-]+)\s*:\s*([^;]+);/g;
  let m;
  while ((m = re.exec(body)) !== null) map.set(m[1], m[2].trim());
  return map;
}

function collect(files, baseDir) {
  const base = new Map();
  const dark = new Map();
  const light = new Map();
  for (const f of files) {
    const css = stripComments(fs.readFileSync(path.join(baseDir, f), 'utf8'));
    for (const { selector, body } of topLevelRules(css)) {
      const vars = extractVars(body);
      if (vars.size === 0) continue;
      if (selector.includes('[data-theme="dark"]')) for (const [k, v] of vars) dark.set(k, v);
      else if (selector.includes('[data-theme="light"]')) for (const [k, v] of vars) light.set(k, v);
      else if (selector.split(',').some((s) => s.trim() === ':root')) for (const [k, v] of vars) base.set(k, v);
    }
  }
  return { base, dark, light };
}

function makeResolver(themeMap, baseMap) {
  const lookup = (name) => (themeMap?.get(name) ?? baseMap.get(name));
  return function resolve(value, seen = new Set()) {
    if (value == null) return null;
    return value.replace(/var\((--[\w-]+)(?:\s*,\s*([^)]+))?\)/g, (_, ref, fallback) => {
      if (seen.has(ref)) return `<<cycle:${ref}>>`;
      const next = lookup(ref);
      if (next == null) return fallback != null ? resolve(fallback, seen) : `<<unresolved:${ref}>>`;
      const nested = new Set(seen);
      nested.add(ref);
      return resolve(next, nested);
    });
  };
}

const norm = (v) => (v == null ? v : v.replace(/\s+/g, ' ').trim().toLowerCase());

const legacy = collect(LEGACY_FILES, LEGACY_DIR);
const gen = collect(
  ['primitives.css', 'semantic.css'],
  path.join(DS, '01_tokens', '02_generated', '01_css')
);
const genThemes = collect(
  ['01_themes/dark.css', '01_themes/light.css'],
  path.join(DS, '01_tokens', '02_generated', '01_css')
);
// themes/dark.css dùng selector ":root,[data-theme=dark]" → rơi vào cả dark; gộp:
const genDark = new Map([...genThemes.base, ...genThemes.dark]);
const genLight = genThemes.light;

let compared = 0;
let skippedRepaired = 0;
let skippedDropped = 0;
const mismatches = [];

function compare(label, legacyName, legacyResolve, genName, genResolve, legacyRawMap, genRawMap) {
  const lv = legacyRawMap.has(legacyName) ? legacyResolve(legacyRawMap.get(legacyName)) : null;
  const gv = genRawMap.has(genName) ? genResolve(genRawMap.get(genName)) : null;
  if (lv == null || gv == null) {
    mismatches.push(`${label}: THIẾU — legacy ${legacyName}=${lv} · generated ${genName}=${gv}`);
    return;
  }
  compared += 1;
  if (norm(lv) !== norm(gv)) {
    mismatches.push(`${label}: ${legacyName} = ${lv}  ≠  ${genName} = ${gv}`);
  }
}

const legacyBaseResolve = makeResolver(null, legacy.base);
const genBaseResolve = makeResolver(null, gen.base);

// A) Primitives + semantic --ifx-* trùng tên (theo generated — generated là canonical scope)
for (const name of gen.base.keys()) {
  if (!legacy.base.has(name)) continue; // token đổi tên/mới — check riêng bên dưới
  compare('base', name, legacyBaseResolve, name, genBaseResolve, legacy.base, gen.base);
}

// B) Semantic đổi tên: --radius-X / --shadow-X / --transition-X → --ifx-*
for (const [name] of legacy.base) {
  let genName = null;
  if (/^--radius-[\w-]+$/.test(name)) genName = name.replace('--radius-', '--ifx-radius-');
  else if (/^--transition-[\w-]+$/.test(name)) genName = name.replace('--transition-', '--ifx-transition-');
  else if (/^--shadow-(card|dropdown|modal)$/.test(name)) genName = name.replace('--shadow-', '--ifx-shadow-');
  if (genName == null) continue;
  compare('base', name, legacyBaseResolve, genName, genBaseResolve, legacy.base, gen.base);
}

// C) Theme semantic: --color-X → --ifx-X (scrim → overlay-scrim)
const renameTheme = (name) =>
  name === '--color-scrim' ? '--ifx-overlay-scrim' : name.replace('--color-', '--ifx-');

for (const [themeName, legacyTheme, genTheme] of [
  ['dark', legacy.dark, genDark],
  ['light', legacy.light, genLight],
]) {
  // theme.css dark block cũng là :root → legacy dark = base-của-theme.css; resolver ưu tiên theme map
  const legacyResolve = makeResolver(new Map([...legacy.dark, ...legacyTheme]), legacy.base);
  const legacyResolveActual = themeName === 'dark'
    ? makeResolver(legacy.dark, legacy.base)
    : makeResolver(new Map([...legacy.dark, ...legacy.light]), legacy.base);
  const genResolve = themeName === 'dark'
    ? makeResolver(genDark, gen.base)
    : makeResolver(new Map([...genDark, ...genLight]), gen.base);
  void legacyResolve;
  for (const [name] of legacyTheme) {
    if (!name.startsWith('--color-')) continue;
    if (REPAIRED.has(`${themeName}:${name}`)) { skippedRepaired += 1; continue; }
    if (DROPPED.has(`${themeName}:${name}`)) {
      if (genTheme.has(renameTheme(name))) {
        mismatches.push(`${themeName}: ${name} đã DROP nhưng vẫn tồn tại trong generated (${renameTheme(name)})`);
      }
      skippedDropped += 1;
      continue;
    }
    compare(themeName, name, legacyResolveActual, renameTheme(name), genResolve, legacyTheme, genTheme);
  }
}

console.log(`[verify-tokens] So sánh: ${compared} token · REPAIR đã đăng ký: ${skippedRepaired} · DROP candidate: ${skippedDropped} · lệch: ${mismatches.length}`);
if (mismatches.length > 0) {
  for (const m of mismatches) console.error('  MISMATCH ' + m);
  process.exit(1);
}
console.log('[verify-tokens] PASS — 0 giá trị lệch so với bộ token đang chạy.');
