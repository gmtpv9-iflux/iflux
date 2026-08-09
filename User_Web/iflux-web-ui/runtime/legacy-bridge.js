/* ===== IFX-AUDIT-BEGIN =====
AUDIT-ID: T5A-IGNORE-007
Priority: IGNORE
STATUS: IGNORE
OWNER: Runtime
Candidate Owner: Runtime
Usage audit: N/A
Dep động: N/A
Migration ROI: 1
Khả năng bỏ load: Không
P1 Gate: N/A
Refs: Task5 PhaseA — không audit / không tối ưu
===== IFX-AUDIT-END ===== */
/**
 * iFlux Runtime — Legacy Bridge (ESM)
 * Bắc cầu giữa runtime ES module mới và các lib cũ dạng IIFE gán vào window
 * (market-master, block-templates...). Cho phép nạp script/CSS ON-DEMAND, đúng
 * nguyên tắc Lazy Page Runtime: chỉ tải khi widget cần, không nhồi ở boot.
 *
 * KHÔNG import implementation của widget ở đây — chỉ nạp động theo yêu cầu.
 */

var scriptPromises = {};
var stylePromises = {};

/** Chuẩn hoá CSS path — tránh nạp 2 version cùng file (cascade ghi đè). */
function normalizeStyleHref(href) {
  var s = String(href || '');
  if (/\/User_Web\/iflux-web-ui\/community\.css(\?|$)/.test(s)) {
    return '/User_Web/iflux-web-ui/community.css?v=bodyFill20260809';
  }
  return s;
}

/** Nạp 1 <script> cổ điển (idempotent) — trả Promise resolve khi onload.
 *  Khi src có ?v=… mà bản không version (hoặc version khác) đã nạp → gỡ rồi nạp lại. */
export function loadScript(src) {
  if (scriptPromises[src]) return scriptPromises[src];
  var bare = String(src || '').split('?')[0];
  if (src && src.indexOf('?') >= 0 && bare) {
    Object.keys(scriptPromises).forEach(function (key) {
      if (key === bare || (key.indexOf(bare + '?') === 0 && key !== src)) {
        delete scriptPromises[key];
      }
    });
    document.querySelectorAll('script[data-rt-src]').forEach(function (node) {
      var prev = node.getAttribute('data-rt-src') || '';
      if (prev === bare || (prev.indexOf(bare + '?') === 0 && prev !== src)) {
        if (node.parentNode) node.parentNode.removeChild(node);
      }
    });
  }
  scriptPromises[src] = new Promise(function (resolve, reject) {
    var existing = document.querySelector('script[data-rt-src="' + src + '"]');
    if (existing && existing.getAttribute('data-rt-loaded') === '1') {
      resolve(src);
      return;
    }
    var el = document.createElement('script');
    el.src = src;
    el.async = false;
    el.setAttribute('data-rt-src', src);
    el.addEventListener('load', function () {
      el.setAttribute('data-rt-loaded', '1');
      resolve(src);
    });
    el.addEventListener('error', function () {
      delete scriptPromises[src];
      reject(new Error('Không tải được script: ' + src));
    });
    document.head.appendChild(el);
  });
  return scriptPromises[src];
}

/** Nạp 1 stylesheet (idempotent).
 *  Khi href có ?v=… mà bản không version / version khác đã nạp → gỡ rồi nạp lại. */
export function loadStyle(href) {
  href = normalizeStyleHref(href);
  if (stylePromises[href]) return stylePromises[href];
  var bare = String(href || '').split('?')[0];
  if (href && href.indexOf('?') >= 0 && bare) {
    Object.keys(stylePromises).forEach(function (key) {
      if (key === bare || (key.indexOf(bare + '?') === 0 && key !== href)) {
        delete stylePromises[key];
      }
    });
    document.querySelectorAll('link[rel="stylesheet"]').forEach(function (node) {
      var prev = node.getAttribute('data-rt-style') || node.getAttribute('href') || '';
      var prevBare = String(prev).split('?')[0];
      if (prevBare === bare && prev !== href) {
        if (node.parentNode) node.parentNode.removeChild(node);
      }
    });
  }
  stylePromises[href] = new Promise(function (resolve) {
    if (document.querySelector('link[rel="stylesheet"][href="' + href + '"]') ||
        document.querySelector('link[data-rt-style="' + href + '"]')) {
      resolve(href);
      return;
    }
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.setAttribute('data-rt-style', href);
    // Không reject khi CSS lỗi — CSS thiếu không được làm hỏng widget.
    link.addEventListener('load', function () { resolve(href); });
    link.addEventListener('error', function () { resolve(href); });
    document.head.appendChild(link);
  });
  return stylePromises[href];
}

/** Nạp nhiều stylesheet song song. */
export function loadStyles(list) {
  return Promise.all((list || []).map(loadStyle));
}

/**
 * Đảm bảo một global (window[name]) tồn tại; nếu chưa thì nạp script nguồn.
 * @param {string} name  Tên biến global (vd 'IfluxMarketMaster')
 * @param {string} src   Đường dẫn script cung cấp global đó
 */
export async function ensureGlobal(name, src) {
  if (window[name]) return window[name];
  await loadScript(src);
  return window[name];
}

/**
 * Nạp danh sách <script> cổ điển theo đúng thứ tự (idempotent theo src).
 * W4: skip Shell platform globals đã có (giống loadScriptTiers).
 * @param {Array<string>} srcs
 */
export async function loadScriptsSequential(srcs) {
  for (var i = 0; i < (srcs || []).length; i++) {
    if (!srcs[i]) continue;
    if (shouldSkipShellPlatform(srcs[i])) continue;
    await loadScript(srcs[i]);
  }
}

/** Bare path → window global do Shell / Platform đã nạp — bỏ request trùng (W1–W4). */
var SHELL_PLATFORM_SKIP = [
  { re: /\/block-templates\.js$/i, global: 'IfluxBlockTemplates' },
  { re: /\/watchlist-taxonomy\.js$/i, global: 'IfluxWatchlistTaxonomy' },
  { re: /\/iflux-market-master\.js$/i, global: 'IfluxMarketMaster' },
  { re: /\/seo-url\.js$/i, global: 'IfluxSeoUrl' },
  { re: /\/iflux-market-seed-data\.js$/i, global: 'IfluxMarketSeedData' },
  { re: /\/iflux-market-ecosystem-seeds\.js$/i, global: 'IfluxMarketEcosystemSeeds' },
  { re: /\/iflux-market-registry-store\.js$/i, global: 'IfluxMarketRegistryStore' }
];

function shouldSkipShellPlatform(src) {
  var bare = String(src || '').split('?')[0];
  for (var i = 0; i < SHELL_PLATFORM_SKIP.length; i++) {
    var rule = SHELL_PLATFORM_SKIP[i];
    if (rule.re.test(bare) && window[rule.global]) return true;
  }
  return false;
}

/**
 * Nạp script theo TẦNG: mỗi tier là mảng script nạp SONG SONG (Promise.all),
 * chỉ chờ giữa các tier để tôn trọng thứ tự phụ thuộc. Cắt waterfall so với
 * loadScriptsSequential khi các script trong cùng tier độc lập với nhau.
 * @param {Array<Array<string>>} tiers
 */
export async function loadScriptTiers(tiers) {
  for (var i = 0; i < (tiers || []).length; i++) {
    var tier = (tiers[i] || []).filter(Boolean).filter(function (src) {
      return !shouldSkipShellPlatform(src);
    });
    if (tier.length) await Promise.all(tier.map(loadScript));
  }
}

/**
 * Nạp một chuỗi dependency theo thứ tự.
 * @param {Array<{global:string, src:string}>} specs
 */
export async function ensureSequence(specs) {
  var out = [];
  for (var i = 0; i < (specs || []).length; i++) {
    var spec = specs[i];
    if (window[spec.global]) {
      out.push(window[spec.global]);
      continue;
    }
    await loadScript(spec.src);
    out.push(window[spec.global]);
  }
  return out;
}
