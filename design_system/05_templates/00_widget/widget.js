/**
 * IfxTemplates — sổ đăng ký Template + khung Widget dùng chung.
 * Mỗi Template khai báo đúng một hàm vẽ và dữ liệu mẫu của chính nó; Preview (Admin)
 * và Widget (User Web) cùng gọi mount() → giao diện chỉ có một nguồn.
 *
 *   IfxTemplates.define('TMP-X', {
 *     inputs: [{ label, demo: 'a | b | c' }, …],   // "Đầu vào" — chuỗi ngăn bởi "|"
 *     head: true,                                  // false khi template tự vẽ header riêng
 *     render: function (input, ctx) { return html },
 *     bind:   function (root, input, ctx) {}       // tuỳ chọn: tương tác
 *   });
 *   IfxTemplates.mount(host, 'TMP-X', { title, description, input });
 *   input: mảng chuỗi theo thứ tự inputs. Thiếu / rỗng → dùng demo của template.
 */
(function (global) {
  'use strict';
  var REG = {};

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
  /** "a | b | c" → ['a','b','c'] */
  function list(s) {
    return String(s == null ? '' : s).split('|').map(function (x) { return x.trim(); })
      .filter(function (x) { return x !== ''; });
  }
  function num(s) {
    var n = parseFloat(String(s == null ? '' : s).replace(/[^\d.,-]/g, '').replace(',', '.'));
    return isNaN(n) ? 0 : n;
  }

  function define(id, def) { REG[id] = def; return def; }
  function has(id) { return !!REG[id]; }
  function get(id) { return REG[id] || null; }

  function demo(id) {
    var def = REG[id];
    return def ? (def.inputs || []).map(function (i) { return i.demo || ''; }) : [];
  }

  /** Đủ số ô; ô nào rỗng lấy demo của template. */
  function resolveInput(id, input) {
    var d = demo(id);
    var src = Array.isArray(input) ? input : [];
    return d.map(function (fallback, i) {
      var v = src[i];
      return v != null && String(v).trim() !== '' ? String(v) : fallback;
    });
  }

  function headHtml(ctx) {
    if (!ctx.title && !ctx.description) return '';
    return '<header class="ifx-tpl-head"><div class="ifx-tpl-heading">' +
      (ctx.title ? '<h3 class="ifx-tpl-title">' + esc(ctx.title) + '</h3>' : '') +
      (ctx.description ? '<p class="ifx-tpl-desc">' + esc(ctx.description) + '</p>' : '') +
      '</div>' + (ctx.actions ? '<div class="ifx-tpl-actions">' + ctx.actions + '</div>' : '') +
      '</header>';
  }

  function mount(host, id, ctx) {
    ctx = ctx || {};
    var def = REG[id];
    if (!host) return null;
    if (!def) {
      host.innerHTML = '<div class="ifx-tpl"><div class="ifx-tpl-empty">Chưa có Template ' + esc(id) + '</div></div>';
      return null;
    }
    var input = resolveInput(id, ctx.input);
    var body = def.render(input, ctx);
    host.innerHTML = '<article class="ifx-tpl" data-ifx-template="' + esc(id) + '">' +
      (def.head === false ? '' : headHtml(ctx)) +
      (def.head === false ? body : '<div class="ifx-tpl-body">' + body + '</div>') +
      '</article>';
    var root = host.firstElementChild;
    if (def.bind) def.bind(root, input, ctx);
    return root;
  }

  global.IfxTemplates = {
    define: define, has: has, get: get, demo: demo, mount: mount,
    util: { esc: esc, list: list, num: num }
  };
})(typeof window !== 'undefined' ? window : globalThis);
