#!/usr/bin/env node
/**
 * Canonical iFlux Design System — Token Generator (Sub-01 P1 · Token 03A)
 *
 * design_system/tokens/registry.json  →  registered source roots
 *         ↓
 * one compiler  →  each owner's tokens/generated  (readonly)
 *
 * Luật: JSON = writable SoT per owner. CẤM sửa tay file generated.
 * Deterministic: chạy lại ra output y hệt (không timestamp).
 *
 * ONE TOKEN = ONE OWNER = ONE SOURCE DEFINITION
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DS = path.resolve(__dirname, '..');
const REPO = path.resolve(DS, '..');
const REGISTRY_PATH = path.join(DS, 'tokens', 'registry.json');

const GLOBAL_FILE_ORDER = [
  'color.json', 'typography.json', 'spacing.json', 'radius.json',
  'shadow.json', 'motion.json', 'size.json', 'zindex.json', 'breakpoints.json',
];

function header(sourceRel, files, ownerId) {
  const list = files.length ? `{${files.join(', ')}}` : '';
  return `/* DO NOT EDIT — GENERATED FROM TOKEN SOURCE
 * Canonical iFlux Design System — readonly artifact.
 * Source: ${sourceRel}/${list}
 * owner : ${ownerId}
 * Build : node design_system/scripts/build-tokens.mjs
 */
`;
}

/** Global CSS header stays byte-compatible with pre-03A (no owner line). */
function globalCssHeader(files) {
  return `/* DO NOT EDIT — GENERATED FROM TOKEN SOURCE
 * Canonical iFlux Design System — readonly artifact.
 * Source: design_system/tokens/source/{${files.join(', ')}}
 * Build : node design_system/scripts/build-tokens.mjs
 */
`;
}

function varName(parts) { return '--ifx-' + parts.join('-'); }

function loadRegistry() {
  if (!fs.existsSync(REGISTRY_PATH)) {
    throw new Error(`Thiếu registry: design_system/tokens/registry.json`);
  }
  const raw = JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8'));
  if (!Array.isArray(raw.sources) || raw.sources.length === 0) {
    throw new Error('registry.sources phải là mảng không rỗng');
  }
  const ids = new Set();
  for (const src of raw.sources) {
    if (!src.id || !src.owner || !src.layer || !src.sourceRoot || !src.generatedRoot) {
      throw new Error(`Registry entry thiếu id/owner/layer/sourceRoot/generatedRoot: ${JSON.stringify(src)}`);
    }
    if (ids.has(src.id)) throw new Error(`Registry id trùng: ${src.id}`);
    ids.add(src.id);
    if (!['active', 'reserved'].includes(src.status)) {
      throw new Error(`Registry ${src.id}: status phải là active|reserved`);
    }
    if (!['global', 'platform', 'module', 'page', 'widget'].includes(src.layer)) {
      throw new Error(`Registry ${src.id}: layer không hợp lệ`);
    }
  }
  const globals = raw.sources.filter((s) => s.layer === 'global' && s.status === 'active');
  if (globals.length !== 1) {
    throw new Error('Registry phải có đúng 1 source layer=global status=active');
  }
  return raw;
}

function listSourceFiles(absSource, layer) {
  if (layer === 'global') {
    return GLOBAL_FILE_ORDER.map((file) => ({ file, abs: path.join(absSource, file) }));
  }
  if (!fs.existsSync(absSource)) return [];
  return fs.readdirSync(absSource)
    .filter((f) => f.endsWith('.json'))
    .sort()
    .map((file) => ({ file, abs: path.join(absSource, file) }));
}

function ingestSource(src, repo) {
  const absSource = path.join(repo, src.sourceRoot);
  if (src.status !== 'active') {
    return null;
  }
  if (!fs.existsSync(absSource)) {
    throw new Error(`Source root không tồn tại (${src.id}): ${src.sourceRoot}`);
  }

  const refPaths = new Map();
  const primitives = [];
  const semantics = [];
  const themes = new Map();
  let breakpoints = null;
  const claims = [];

  function claim(varN, fileRel) {
    claims.push({
      varName: varN,
      owner: src.owner,
      ownerId: src.id,
      layer: src.layer,
      source: `${src.sourceRoot}/${fileRel}`,
      generatedRoot: src.generatedRoot,
    });
  }

  function walk(file, obj, parts, sink) {
    for (const [key, value] of Object.entries(obj)) {
      if (key.startsWith('$')) continue;
      const p = [...parts, key];
      if (typeof value === 'string') {
        const regKey = p.join('.');
        if (refPaths.has(regKey)) {
          throw new Error(`Token path collision: ${regKey} (file ${file} · owner ${src.id})`);
        }
        refPaths.set(regKey, value);
        const vn = varName(p);
        sink.push({ file, group: parts[0] ?? key, varName: vn, raw: value });
        claim(vn, file);
      } else if (value && typeof value === 'object') {
        walk(file, value, p, sink);
      } else {
        throw new Error(`Giá trị không hợp lệ tại ${p.join('.')} (file ${file} · owner ${src.id})`);
      }
    }
  }

  const files = listSourceFiles(absSource, src.layer);
  if (src.layer === 'global') {
    for (const { file, abs } of files) {
      if (!fs.existsSync(abs)) throw new Error(`Thiếu source: ${src.sourceRoot}/${file}`);
    }
  }

  for (const { file, abs } of files) {
    if (!fs.existsSync(abs)) continue;
    const json = JSON.parse(fs.readFileSync(abs, 'utf8'));
    if (json.primitive) walk(file, json.primitive, [], primitives);
    if (json.semantic) walk(file, json.semantic, [], semantics);
    if (json.theme) {
      for (const [themeName, map] of Object.entries(json.theme)) {
        if (themeName.startsWith('$')) continue;
        const list = themes.get(themeName) ?? [];
        for (const [key, value] of Object.entries(map)) {
          if (key.startsWith('$')) continue;
          if (typeof value !== 'string') {
            throw new Error(`Theme token phải là string: ${themeName}.${key} (${src.id})`);
          }
          const vn = varName([key]);
          list.push({ varName: vn, raw: value, file });
          claim(vn, file);
        }
        themes.set(themeName, list);
      }
    }
    if (json.breakpoint) breakpoints = json.breakpoint;
  }

  return {
    src,
    absSource,
    refPaths,
    primitives,
    semantics,
    themes,
    breakpoints,
    claims,
  };
}

function assertNoCssNameCollision(ingested) {
  const first = new Map();
  for (const pack of ingested) {
    const seenInOwner = new Set();
    for (const c of pack.claims) {
      if (seenInOwner.has(c.varName)) continue;
      seenInOwner.add(c.varName);
      const prev = first.get(c.varName);
      if (prev) {
        throw new Error(
          `Token name collision: ${c.varName}\n` +
          `  owner A: ${prev.owner}\n` +
          `  source A: ${prev.source}\n` +
          `  owner B: ${c.owner}\n` +
          `  source B: ${c.source}`
        );
      }
      first.set(c.varName, c);
    }
  }
}

const REF_RE = /\{([a-z0-9.\-]+)\}/gi;

function resolveRefs(raw, context, refPaths, ownerLayer) {
  return raw.replace(REF_RE, (_, refPath) => {
    if (!refPaths.has(refPath)) {
      throw new Error(`Ref không tồn tại {${refPath}} (tại ${context})`);
    }
    const meta = refPaths.get(refPath);
    if (ownerLayer === 'global' && meta.layer !== 'global') {
      throw new Error(`Global không được ref token non-Global {${refPath}} (tại ${context})`);
    }
    return `var(${varName(refPath.split('.'))})`;
  });
}

function renderBlock(tokens, resolve) {
  let css = '';
  let lastGroup = null;
  for (const t of tokens) {
    const groupLabel = `${t.file.replace('.json', '')} · ${t.group}`;
    if (groupLabel !== lastGroup) {
      css += `\n  /* ── ${groupLabel} ── */\n`;
      lastGroup = groupLabel;
    }
    css += `  ${t.varName}: ${resolve(t.raw, t.varName)};\n`;
  }
  return css;
}

function emitOwner(pack, refLookup) {
  const { src, primitives, semantics, themes, breakpoints } = pack;
  const outCss = path.join(REPO, src.generatedRoot, 'css');
  const outJs = path.join(REPO, src.generatedRoot, 'js');
  const isGlobal = src.layer === 'global';
  const resolve = (raw, ctx) => resolveRefs(raw, ctx, refLookup, src.layer);

  fs.mkdirSync(outCss, { recursive: true });
  fs.mkdirSync(path.join(outCss, 'themes'), { recursive: true });
  if (isGlobal) fs.mkdirSync(outJs, { recursive: true });

  const cssHeader = (files) => (
    isGlobal ? globalCssHeader(files) : header(src.sourceRoot, files, src.id)
  );

  if (primitives.length) {
    const primFiles = [...new Set(primitives.map((t) => t.file))];
    fs.writeFileSync(
      path.join(outCss, 'primitives.css'),
      `${cssHeader(primFiles)}:root {${renderBlock(primitives, resolve)}}\n`
    );
  }

  if (semantics.length) {
    const semFiles = [...new Set(semantics.map((t) => t.file))];
    fs.writeFileSync(
      path.join(outCss, 'semantic.css'),
      `${cssHeader(semFiles)}:root {${renderBlock(semantics, resolve)}}\n`
    );
  }

  for (const [themeName, list] of themes) {
    const themeFiles = [...new Set(list.map((t) => t.file || 'color.json'))];
    const selector = themeName === 'dark' ? ':root,\n[data-theme="dark"]' : `[data-theme="${themeName}"]`;
    let css = `${cssHeader(isGlobal ? ['color.json'] : themeFiles)}${selector} {\n  color-scheme: ${themeName};\n`;
    for (const t of list) css += `  ${t.varName}: ${resolve(t.raw, `${themeName}.${t.varName}`)};\n`;
    css += '}\n';
    fs.writeFileSync(path.join(outCss, 'themes', `${themeName}.css`), css);
  }

  if (isGlobal) {
    if (!breakpoints) throw new Error('Thiếu breakpoints.json');
    const bpEntries = Object.entries(breakpoints)
      .map(([id, px]) => `  '${id}': ${parseInt(px, 10)}`)
      .join(',\n');
    fs.writeFileSync(
      path.join(outJs, 'breakpoints.js'),
      `${globalCssHeader(['breakpoints.json'])}/* Mobile-first: base < ${Object.values(breakpoints)[0]} = CSS mặc định.
 * CẤM dùng trong @media qua var() — media query phải là literal (bp:sm..2xl). */
(function (g) {
  'use strict';
  g.IFX_BREAKPOINTS = Object.freeze({
${bpEntries}
  });
})(typeof window !== 'undefined' ? window : globalThis);
`
    );
  }
}

function generatedDestForClaim(claim, pack) {
  const root = claim.generatedRoot;
  if (pack.themes.size && [...pack.themes.values()].some((list) => list.some((t) => t.varName === claim.varName))) {
    return `${root}/css/themes/{dark,light}.css`;
  }
  if (pack.primitives.some((t) => t.varName === claim.varName)) {
    return `${root}/css/primitives.css`;
  }
  if (pack.semantics.some((t) => t.varName === claim.varName)) {
    return `${root}/css/semantic.css`;
  }
  return `${root}/css`;
}

function writeGlobalIndex(globalPack, allClaims, registry) {
  const { primitives, semantics, themes, breakpoints } = globalPack;
  const outJs = path.join(REPO, globalPack.src.generatedRoot, 'js');
  const index = {
    primitive: {},
    semantic: {},
    theme: Object.fromEntries([...themes].map(([n, list]) => [n, list.map((t) => t.varName)])),
    breakpoint: breakpoints,
    sources: registry.sources.map((s) => ({
      id: s.id,
      owner: s.owner,
      layer: s.layer,
      status: s.status,
      sourceRoot: s.sourceRoot,
      generatedRoot: s.generatedRoot,
    })),
    inventory: [],
  };
  for (const t of primitives) (index.primitive[t.group] ??= []).push(t.varName);
  for (const t of semantics) (index.semantic[t.group] ??= []).push(t.varName);

  const seen = new Set();
  for (const pack of allClaims) {
    for (const c of pack.claims) {
      if (seen.has(c.varName)) continue;
      seen.add(c.varName);
      index.inventory.push({
        name: c.varName,
        owner: c.owner,
        layer: c.layer,
        source: c.source,
        generated: generatedDestForClaim(c, pack),
      });
    }
  }

  fs.writeFileSync(
    path.join(outJs, 'token-index.js'),
    `${globalCssHeader(GLOBAL_FILE_ORDER)}(function (g) {
  'use strict';
  g.IFX_TOKEN_INDEX = ${JSON.stringify(index, null, 2)};
})(typeof window !== 'undefined' ? window : globalThis);
`
  );
}

const registry = loadRegistry();
const ingested = [];
for (const src of registry.sources) {
  const pack = ingestSource(src, REPO);
  if (pack) ingested.push(pack);
}

assertNoCssNameCollision(ingested);

const refLookup = new Map();
for (const pack of ingested) {
  for (const [key, raw] of pack.refPaths) {
    if (refLookup.has(key) && refLookup.get(key).ownerId !== pack.src.id) {
      throw new Error(`Token path collision: {${key}} · ${refLookup.get(key).ownerId} vs ${pack.src.id}`);
    }
    refLookup.set(key, { raw, layer: pack.src.layer, ownerId: pack.src.id });
  }
}

for (const pack of ingested) {
  emitOwner(pack, refLookup);
}

const globalPack = ingested.find((p) => p.src.layer === 'global');
if (!globalPack) throw new Error('Không ingest được Global source');
writeGlobalIndex(globalPack, ingested, registry);

const counts = ingested.map((p) => {
  const th = [...p.themes].map(([n, l]) => `${n}=${l.length}`).join(' · ') || 'none';
  return `${p.src.id}: prim=${p.primitives.length} sem=${p.semantics.length} theme ${th}`;
});
console.log(`[build-tokens] OK — ${counts.join(' | ')} · breakpoints: ${Object.keys(globalPack.breakpoints).length}`);
