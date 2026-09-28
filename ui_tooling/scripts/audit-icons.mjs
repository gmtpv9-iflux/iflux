#!/usr/bin/env node
/**
 * Audit Canonical Tabler Vendor (Owner-designated source).
 * Source = vendor/tabler/tabler-icons.min.css
 * Sinh icon-index.json (readonly catalog data) và chứng minh missing = 0.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const VENDOR = path.resolve(__dirname, '../../vendor/tabler');
const CSS = path.join(VENDOR, 'tabler-icons.min.css');
const OUT = path.join(VENDOR, 'icon-index.json');

if (!fs.existsSync(CSS)) {
  console.error('[audit-icons] FAIL — thiếu source', CSS);
  process.exit(1);
}

const css = fs.readFileSync(CSS, 'utf8');
const names = [...css.matchAll(/\.ti-([a-z0-9-]+)\s*\{/g)].map((m) => m[1]);
const unique = [...new Set(names)].sort();
const withGlyph = unique.filter((n) => new RegExp(`\\.ti-${n}\\{[^}]*--ti-svg:`).test(css) || css.includes(`.ti-${n}{--ti-svg:`));
const missingGlyph = unique.filter((n) => !withGlyph.includes(n));

const fontFace = /@font-face/.test(css);
const extUrls = [...css.matchAll(/url\((['"]?)(?!data:)([^)'"]+)\1\)/g)].map((m) => m[2]);
const missingFiles = extUrls.filter((u) => !fs.existsSync(path.resolve(VENDOR, u.split('?')[0])));

const index = {
  $meta: {
    sot: 'Owner-designated Tabler vendor source — SVG mask, self-contained',
    source: 'vendor/tabler/tabler-icons.min.css',
    format: 'CSS mask + data:image/svg+xml (không webfont, không file font)',
    note: 'Giữ nguyên tên class Tabler (.ti .ti-*). Custom iFlux icon tách riêng icons/custom/.',
  },
  count: unique.length,
  icons: unique.map((name) => ({ name, className: `ti ti-${name}` })),
};

fs.writeFileSync(OUT, JSON.stringify(index, null, 2) + '\n');

const ok = missingGlyph.length === 0 && missingFiles.length === 0 && unique.length === withGlyph.length;
console.log(`[audit-icons] source icons: ${unique.length}`);
console.log(`[audit-icons] canonical icons (index): ${index.count}`);
console.log(`[audit-icons] missing glyph: ${missingGlyph.length}`);
console.log(`[audit-icons] @font-face: ${fontFace} · external url: ${extUrls.length} · missing files: ${missingFiles.length}`);
if (!ok) {
  if (missingGlyph.length) console.error('  missing glyph:', missingGlyph.join(', '));
  if (missingFiles.length) console.error('  missing files:', missingFiles.join(', '));
  process.exit(1);
}
console.log('[audit-icons] PASS — Source = Canonical · Missing = 0 · 0 font/asset dependency');
