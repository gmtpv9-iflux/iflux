/**
 * iFlux Runtime — Legacy Bridge (ESM)
 * Bắc cầu giữa runtime ES module mới và các lib cũ dạng IIFE gán vào window
 * (mock-market, block-templates...). Cho phép nạp script/CSS ON-DEMAND, đúng
 * nguyên tắc Lazy Page Runtime: chỉ tải khi widget cần, không nhồi ở boot.
 *
 * KHÔNG import implementation của widget ở đây — chỉ nạp động theo yêu cầu.
 */

var scriptPromises = {};
var stylePromises = {};

/** Nạp 1 <script> cổ điển (idempotent) — trả Promise resolve khi onload. */
export function loadScript(src) {
  if (scriptPromises[src]) return scriptPromises[src];
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

/** Nạp 1 stylesheet (idempotent). */
export function loadStyle(href) {
  if (stylePromises[href]) return stylePromises[href];
  stylePromises[href] = new Promise(function (resolve) {
    if (document.querySelector('link[data-rt-style="' + href + '"]')) {
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
 * @param {string} name  Tên biến global (vd 'IfluxMockMarket')
 * @param {string} src   Đường dẫn script cung cấp global đó
 */
export async function ensureGlobal(name, src) {
  if (window[name]) return window[name];
  await loadScript(src);
  return window[name];
}

/**
 * Nạp danh sách <script> cổ điển theo đúng thứ tự (idempotent theo src).
 * Dùng cho composite page module cần nạp đúng dependency của 1 trang.
 * @param {Array<string>} srcs
 */
export async function loadScriptsSequential(srcs) {
  for (var i = 0; i < (srcs || []).length; i++) {
    if (srcs[i]) await loadScript(srcs[i]);
  }
}

/**
 * Nạp script theo TẦNG: mỗi tier là mảng script nạp SONG SONG (Promise.all),
 * chỉ chờ giữa các tier để tôn trọng thứ tự phụ thuộc. Cắt waterfall so với
 * loadScriptsSequential khi các script trong cùng tier độc lập với nhau.
 * @param {Array<Array<string>>} tiers
 */
export async function loadScriptTiers(tiers) {
  for (var i = 0; i < (tiers || []).length; i++) {
    var tier = (tiers[i] || []).filter(Boolean);
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
