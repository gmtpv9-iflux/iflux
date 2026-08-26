#!/usr/bin/env node
/**
 * Canonical iFlux Design System — Governance checks (P2+, tái dùng ở P7).
 * Quét toàn bộ design_system/ (trừ vendor/ third-party và generated tự sinh):
 *   1. 0 inline style="..." trong HTML.
 *   2. 0 legacy naming: selector .ix-* / biến --ix-* / class="ix-...".
 *   3. Media query chỉ dùng literal 5 mốc LOCK (480/768/1024/1280/1440, min-width)
 *      + prefers-color-scheme (theme adapter).
 *   4. 0 Admin runtime / business dependency (path, client, header cấm).
 *   5. Generated CSS/JS khớp generator (build lại và so sánh).
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DS = path.resolve(__dirname, '..');

const SKIP_DIRS = new Set(['vendor', 'fonts', 'node_modules']);
const TEXT_EXT = new Set(['.css', '.js', '.mjs', '.html', '.json', '.md']);

function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      yield* walk(path.join(dir, entry.name));
    } else if (TEXT_EXT.has(path.extname(entry.name))) {
      yield path.join(dir, entry.name);
    }
  }
}

const violations = [];
function violate(file, rule, detail) {
  violations.push(`${path.relative(DS, file)} — ${rule}: ${detail}`);
}

const ALLOWED_MEDIA = new Set([
  '(min-width: 480px)',
  '(min-width: 768px)',
  '(min-width: 1024px)',
  '(min-width: 1280px)',
  '(min-width: 1440px)',
  '(prefers-color-scheme: light)',
  '(prefers-color-scheme: dark)',
]);

const ADMIN_DEPS = [
  'Admin_Design_system/',
  'iflux-admin-ui',
  '/api/admin',
  'X-Admin-Key',
  'IfluxApiClient',
  'iflux-api-bundle',
  'adminToken',
];

/* Bỏ comment trước khi check — comment được phép nhắc legacy để giải thích REUSE/DROP. */
function stripComments(src, ext) {
  if (ext === '.css') return src.replace(/\/\*[\s\S]*?\*\//g, '');
  if (ext === '.js' || ext === '.mjs') {
    return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/[^\n]*/g, '$1');
  }
  if (ext === '.html') return src.replace(/<!--[\s\S]*?-->/g, '');
  return src;
}

for (const file of walk(DS)) {
  const ext = path.extname(file);
  const src = stripComments(fs.readFileSync(file, 'utf8'), ext);

  if (ext === '.html') {
    const inline = src.match(/\sstyle\s*=\s*["']/g);
    if (inline) violate(file, 'inline-style', `${inline.length} thuộc tính style="..."`);
    const legacyClass = src.match(/class\s*=\s*["'][^"']*(?<![\w-])ix-[\w-]+/g);
    if (legacyClass) violate(file, 'legacy-class', legacyClass.join(' | '));
  }

  if (ext === '.css' || ext === '.html') {
    const legacySelector = src.match(/(?<![\w-])\.ix-[\w-]+/g);
    if (legacySelector) violate(file, 'legacy-naming', [...new Set(legacySelector)].join(' '));
  }

  /* Biến legacy --ix-* chỉ check trong artifact code (json/md là tài liệu/meta). */
  if (['.css', '.js', '.mjs', '.html'].includes(ext)) {
    const legacyVar = src.match(/--ix-[\w-]+/g);
    if (legacyVar) violate(file, 'legacy-var', [...new Set(legacyVar)].join(' '));
  }

  if (ext === '.css') {
    const medias = src.match(/@media[^{]+/g) || [];
    for (const m of medias) {
      const cond = m.replace('@media', '').trim().replace(/\s+/g, ' ');
      if (!ALLOWED_MEDIA.has(cond)) violate(file, 'media-query', cond);
      if (/var\s*\(/.test(cond)) violate(file, 'media-query-var', cond);
    }
  }

  for (const dep of ADMIN_DEPS) {
    if (src.includes(dep)) {
      const loadRe = new RegExp(`(href|src|url|import|from|fetch)[^\\n]*${dep.replace(/[/\\]/g, '\\$&')}`, 'i');
      if (loadRe.test(src)) violate(file, 'admin-dependency', dep);
    }
  }
}

// 5. Generated khớp generator — build vào thư mục tạm rồi diff.
const genDir = path.join(DS, 'tokens', 'generated');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ifx-gen-check-'));
fs.cpSync(genDir, path.join(tmp, 'before'), { recursive: true });
execFileSync('node', [path.join(DS, 'scripts', 'build-tokens.mjs')], { stdio: 'pipe' });
try {
  execFileSync('diff', ['-r', path.join(tmp, 'before'), genDir], { stdio: 'pipe' });
} catch (e) {
  violations.push(`tokens/generated — generated-drift: khác output generator\n${e.stdout}`);
}
fs.rmSync(tmp, { recursive: true, force: true });

if (violations.length > 0) {
  console.error(`[check-governance] FAIL — ${violations.length} vi phạm:`);
  for (const v of violations) console.error('  ✗ ' + v);
  process.exit(1);
}
const layoutCss = fs.readFileSync(path.join(DS, 'foundation', 'layout.css'), 'utf8');
const missingCols = [];
['', 'sm-', 'md-', 'lg-', 'xl-', '2xl-'].forEach((bp) => {
  for (let n = 1; n <= 12; n += 1) {
    const cls = `.ifx-col-${bp}${n}`;
    if (!new RegExp(cls.replace('.', '\\.') + '\\s*\\{').test(layoutCss)) missingCols.push(cls);
  }
});
if (missingCols.length) {
  console.error('[check-governance] FAIL — thiếu grid span:', missingCols.join(' '));
  process.exit(1);
}

execFileSync('node', [path.join(DS, 'scripts', 'audit-icons.mjs')], { stdio: 'inherit' });

console.log('[check-governance] PASS — 0 inline style · 0 legacy .ix-*/--ix-* · media literal 5 mốc LOCK · 0 admin dependency · generated khớp generator · grid 1–12 × 6 bp · icons missing=0.');
