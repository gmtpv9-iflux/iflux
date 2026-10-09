#!/usr/bin/env node
/**
 * Version hash tự động cho JS/CSS riêng của User Web (mỗi file NGOÀI bundle web.css) — chấm dứt
 * lỗi "sửa 1 file, quên bump version ở 1-trong-N nơi tham chiếu" (xem docs/SoT — Runtime Loading
 * & Caching Governance.md §5 — case study 2026-10-09: 1 lỗi "Invalid token" mất cả buổi lùng vì
 * version bị kẹt ở 1 trong ~6 lớp loader lồng nhau).
 *
 *   node ui_tooling/scripts/sync-js-versions.mjs          → rewrite tại chỗ
 *   node ui_tooling/scripts/sync-js-versions.mjs --check  → chỉ kiểm tra, exit 1 nếu lệch (CI)
 *
 * Cách hoạt động:
 *  1. Mọi file .js/.css trong User_Web/iflux-web-ui/** (trừ platform/web/generated/web.css —
 *     bundle CSS đã có build-web-bundle.mjs tự hash riêng) được tính hash nội dung
 *     (sha256, 10 ký tự đầu — CÙNG công thức build-web-bundle.mjs để nhất quán toàn repo).
 *  2. Quét lại TOÀN BỘ .js/.html trong User_Web/** tìm mọi nơi tham chiếu tới các file đó —
 *     dù viết dạng 'x.js?v=cũ', 'x.js' (không version), hay 'x.js' + VER/PF/... (biến version
 *     dùng chung qua nhiều nơi, kiểu cũ) — tất cả được NORMALIZE về đúng 1 dạng: 'x.js?v=<hash>'.
 *  3. Sau khi rewrite, biến dùng-chung (VER/PF/...) không còn nơi nào dùng thì tự xoá khai báo
 *     ('var VER = ...;') — không để lại biến chết.
 *
 * KHÔNG đụng: file ngoài User_Web/iflux-web-ui/ (design_system/, Admin_Design_system/ — hệ
 * version riêng, chia sẻ với Admin, chưa trong phạm vi lỗi hôm nay), platform/web/generated/web.css
 * (đã có cơ chế hash riêng của chính nó), URL bên ngoài (http/https).
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const VERSIONED_ROOT = 'User_Web/iflux-web-ui';
const SCAN_ROOT = 'User_Web';
const EXCLUDE_EXACT = new Set([
  // Bundle CSS tự hash riêng (build-web-bundle.mjs) — không version-hoá lại ở đây.
]);

function listFiles(dir, exts) {
  const out = [];
  const walk = (d) => {
    const abs = path.join(REPO, d);
    if (!fs.existsSync(abs)) return;
    for (const n of fs.readdirSync(abs)) {
      const rel = path.posix.join(d, n);
      const st = fs.statSync(path.join(REPO, rel));
      if (st.isDirectory()) walk(rel);
      else if (exts.some((e) => n.endsWith(e))) out.push(rel);
    }
  };
  walk(dir);
  return out;
}

function hashOf(content) {
  return crypto.createHash('sha256').update(content).digest('hex').slice(0, 10);
}

/** relPath (posix, KHÔNG dấu / đầu, từ REPO root) → hash nội dung HIỆN TẠI trong `files`. */
function buildVersionMap(files) {
  const map = new Map();
  for (const [rel, content] of files) {
    if (!/\.(js|css)$/.test(rel) || !rel.startsWith(VERSIONED_ROOT + '/')) continue;
    if (EXCLUDE_EXACT.has(rel)) continue;
    map.set('/' + rel, hashOf(content));
  }
  return map;
}

/**
 * Giải quyết 1 chuỗi path đã có prefix rõ ràng ('./x', '../x', '/User_Web/...') về path tuyệt
 * đối (có dấu / đầu, từ REPO root). Trả về null nếu không nằm trong VERSIONED_ROOT.
 */
function resolvePrefixedRef(referrerRel, rawPath, versionMap) {
  const clean = rawPath.split('?')[0].split('#')[0];
  if (!clean || /^https?:|^\/\//.test(clean)) return null;
  const abs = clean.startsWith('/')
    ? path.posix.normalize(clean)
    : path.posix.normalize(path.posix.join(path.posix.dirname('/' + referrerRel), clean));
  return versionMap.has(abs) ? abs : null;
}

/**
 * Giải quyết 1 chuỗi BARE (không '/', './', '../' ở đầu — vd 'runtime/x.js', 'x.js') — CHỈ coi
 * là tham chiếu hợp lệ khi ngay trước đó trong code là `ASSET +` hoặc `A +` (quy ước loader
 * dùng chung toàn repo: `var ASSET = '/User_Web/iflux-web-ui/';` / `var A = '...';` — đã xác
 * nhận giá trị LUÔN giống nhau ở mọi file dùng tên biến này). KHÔNG dùng `BASE` — giá trị biến
 * này KHÔNG cố định giữa các file (có nơi là subfolder, có nơi là array khác hẳn) — tự suy ra
 * sai còn nguy hơn bỏ qua.
 * Bare path KHÔNG kèm tiền tố cũng là lý do các chuỗi tình cờ giống tên file (vd
 * `indexOf('iflux-web-ui.js')`, `querySelector('script[src*="iflux-web-ui.js"]')` — kiểm tra
 * substring/CSS selector, KHÔNG phải tham chiếu tải file) không bị hiểu nhầm thành reference —
 * đây chính là nguyên nhân gây dao động vô hạn (file tự tham chiếu hash của chính nó) phát hiện
 * khi review diff lần đầu chạy tool này (2026-10-09).
 */
function resolveBareRef(rawPath, versionMap) {
  const clean = rawPath.split('?')[0].split('#')[0];
  const abs = path.posix.normalize('/' + VERSIONED_ROOT + '/' + clean);
  return versionMap.has(abs) ? abs : null;
}

const PREFIXED_CONCAT_RE = /(['"])((?:\.{0,2}\/)+[\w\-./]*\.(?:js|css))\1\s*\+\s*([A-Za-z_$][\w$]*)\b/g;
const PREFIXED_PATH_RE = /(['"])((?:\.{0,2}\/)+[\w\-./]*\.(?:js|css))(\?[^'"]*)?\1/g;
const BARE_CONCAT_RE = /\b(ASSET|A)(\s*\+\s*)(['"])([\w-][\w\-./]*\.(?:js|css))\3\s*\+\s*([A-Za-z_$][\w$]*)\b/g;
const BARE_PATH_RE = /\b(ASSET|A)(\s*\+\s*)(['"])([\w-][\w\-./]*\.(?:js|css))(\?[^'"]*)?\3/g;
/* object property { file: 'x.js?v=...' } — bare, ASSET nối ở nơi KHÁC (vd `base + step.file`,
   xem iflux-web-ui.js loadChainThen()) — vẫn rõ ràng là tham chiếu tải file, không mơ hồ như
   bare đứng 1 mình. */
const FILE_PROP_PATH_RE = /\b(file)(\s*:\s*)(['"])([\w-][\w\-./]*\.(?:js|css))(\?[^'"]*)?\3/g;

function rewriteFile(referrerRel, raw, versionMap) {
  let content = raw;
  let changed = false;
  const touchedVars = new Set();

  // 1) '<path>' + VARNAME → '<path>?v=<hash>' — path có prefix rõ, rồi path bare (ASSET +/A +).
  content = content.replace(PREFIXED_CONCAT_RE, (m, q, p, varName) => {
    const target = resolvePrefixedRef(referrerRel, p, versionMap);
    if (!target) return m;
    touchedVars.add(varName);
    changed = true;
    return `${q}${p}?v=${versionMap.get(target)}${q}`;
  });
  content = content.replace(BARE_CONCAT_RE, (m, assetVar, plus, q, p, varName) => {
    const target = resolveBareRef(p, versionMap);
    if (!target) return m;
    touchedVars.add(varName);
    changed = true;
    return `${assetVar}${plus}${q}${p}?v=${versionMap.get(target)}${q}`;
  });

  // 2) '<path>(?v=cũ)?' độc lập (không nối biến) — path có prefix rõ, rồi path bare.
  content = content.replace(PREFIXED_PATH_RE, (m, q, p, oldQuery) => {
    const target = resolvePrefixedRef(referrerRel, p, versionMap);
    if (!target) return m;
    const nextQuery = `?v=${versionMap.get(target)}`;
    if (oldQuery === nextQuery) return m;
    changed = true;
    return `${q}${p}${nextQuery}${q}`;
  });
  content = content.replace(BARE_PATH_RE, (m, assetVar, plus, q, p, oldQuery) => {
    const target = resolveBareRef(p, versionMap);
    if (!target) return m;
    const nextQuery = `?v=${versionMap.get(target)}`;
    if (oldQuery === nextQuery) return m;
    changed = true;
    return `${assetVar}${plus}${q}${p}${nextQuery}${q}`;
  });
  content = content.replace(FILE_PROP_PATH_RE, (m, prop, colon, q, p, oldQuery) => {
    const target = resolveBareRef(p, versionMap);
    if (!target) return m;
    const nextQuery = `?v=${versionMap.get(target)}`;
    if (oldQuery === nextQuery) return m;
    changed = true;
    return `${prop}${colon}${q}${p}${nextQuery}${q}`;
  });

  // 3) Dọn biến version dùng-chung kiểu cũ (var VER = '...';) nếu không còn ai dùng.
  for (const name of touchedVars) {
    const occurrences = content.match(new RegExp('\\b' + name + '\\b', 'g')) || [];
    const declLine = new RegExp('^[ \\t]*var[ \\t]+' + name + '[ \\t]*=[^\\n]*;\\r?\\n', 'm');
    if (occurrences.length <= 1 && declLine.test(content)) {
      content = content.replace(declLine, '');
      changed = true;
    }
  }

  return { content, changed };
}

const MAX_ITERATIONS = 20;

function main() {
  const check = process.argv.includes('--check');

  const targetRels = listFiles(VERSIONED_ROOT, ['.js', '.css']);
  const scanRels = [...listFiles(SCAN_ROOT, ['.html']), ...listFiles(SCAN_ROOT, ['.js'])];

  /* Một file version-hoá (.js dưới VERSIONED_ROOT) CŨNG CÓ THỂ là referrer (đang trong scanRels) —
     nội dung của nó đổi (vì ta rewrite tham chiếu BÊN TRONG nó) sẽ đổi luôn hash của chính nó. Vì
     vậy không thể hash 1 lần rồi rewrite 1 lần — phải lặp tới khi không còn gì đổi (fixed point).
     Dependency chain thật trong repo chỉ sâu vài bậc (manifest → widget wrapper → content script),
     không có chu trình (A→B→A) — hội tụ rất nhanh, giới hạn an toàn MAX_ITERATIONS để tránh treo
     vô hạn nếu lỡ có chu trình thật (sẽ in cảnh báo thay vì loop mãi). */
  const original = new Map();
  const files = new Map();
  for (const rel of new Set([...targetRels, ...scanRels])) {
    const content = fs.readFileSync(path.join(REPO, rel), 'utf8');
    original.set(rel, content);
    files.set(rel, content);
  }

  let iteration = 0;
  let anyChangeEver = false;
  for (; iteration < MAX_ITERATIONS; iteration++) {
    const versionMap = buildVersionMap(files);
    let changedThisPass = false;
    for (const rel of scanRels) {
      const { content, changed } = rewriteFile(rel, files.get(rel), versionMap);
      if (changed) {
        files.set(rel, content);
        changedThisPass = true;
        anyChangeEver = true;
      }
    }
    if (!changedThisPass) break;
  }
  if (iteration === MAX_ITERATIONS) {
    console.error(`[sync-js-versions] FAIL — không hội tụ sau ${MAX_ITERATIONS} lần lặp (nghi ngờ chu trình tham chiếu A→B→A). Kiểm tra lại dependency giữa các file vừa sửa.`);
    process.exit(1);
  }

  const changedRels = [...files.keys()].filter((rel) => files.get(rel) !== original.get(rel));

  if (check) {
    if (changedRels.length) {
      console.error('[sync-js-versions] FAIL — chạy "node ui_tooling/scripts/sync-js-versions.mjs" để tự sửa:\n  ' + changedRels.join('\n  '));
      process.exit(1);
    }
    console.log(`[sync-js-versions] PASS — ${targetRels.length} file version-hoá, ${scanRels.length} file đã quét, khớp hết (hội tụ sau ${iteration + 1} lượt).`);
  } else {
    for (const rel of changedRels) {
      fs.writeFileSync(path.join(REPO, rel), files.get(rel));
    }
    console.log(`[sync-js-versions] OK — ${targetRels.length} file version-hoá, ${changedRels.length} file cập nhật (hội tụ sau ${iteration + 1} lượt)${anyChangeEver ? '' : ', không có gì đổi'}.`);
  }
}

main();
