/**
 * IfxTemplates — sổ đăng ký Template + khung Widget dùng chung.
 * Mỗi Template khai báo đúng một hàm vẽ và dữ liệu mẫu của chính nó; Preview (Admin)
 * và Widget (User Web) cùng gọi mount() → giao diện chỉ có một nguồn.
 *
 * Khung KHÔNG có CSS riêng — ghép từ tầng thấp hơn của DS:
 *   Card (04_components/03_card) · Title (03_primitives/08_title: .ifx-widget-title)
 *   · Layout (02_foundation: .ifx-inline-sm) · <small> (foundation typography).
 * Đổi kiểu khung / tiêu đề → sửa ở Card / Title, mọi Template đổi theo.
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

  /** "+0.68%" — 2 chữ số thập phân, luôn có dấu khi dương. */
  function fmtPct(n) {
    if (n == null || isNaN(n)) return '—';
    return (n >= 0 ? '+' : '') + Number(n).toFixed(2) + '%';
  }
  /** Số kiểu vi-VN, tối đa 2 chữ số thập phân. */
  function fmtNum(n) {
    if (n == null || n === '' || isNaN(n)) return '—';
    return Number(n).toLocaleString('vi-VN', { maximumFractionDigits: 2 });
  }
  /** Chiều biến động → class trạng thái dùng chung (is-up / is-down / ''). */
  function dir(n) {
    if (n == null || !n) return '';
    return n > 0 ? 'is-up' : 'is-down';
  }
  /** "a | b" từng cột cùng độ dài lớn nhất (thiếu → ''). */
  function columns(inputs) {
    var cols = inputs.map(list);
    var max = cols.reduce(function (m, c) { return Math.max(m, c.length); }, 0);
    return cols.map(function (c) { var out = c.slice(); while (out.length < max) out.push(''); return out; });
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

  /** ctx.icon — mã icon Tabler (vd 'flame', 'chart-line', khớp iconKey Widget Definition Tầng 4),
   * vẽ trước khối Tiêu đề. ctx.statusHtml — slot trạng thái (HTML tin cậy từ caller, như
   * ctx.actions), đặt ngay sau Tiêu đề — chỗ trống cho Widget tương lai cần hiện badge/trạng
   * thái mà không phải sửa khung dùng chung này lần nữa. */
  /* .ifx-widget__header/__subtitle/__actions/__footer — alias tương thích (không còn CSS riêng,
     xem widget-shell.css) — chỉ để code cũ còn querySelector theo tên cũ (vd design_system/
     04_components/28_share/share.js — Insight Share) vẫn tìm đúng phần tử, không cần sửa lại
     từng nơi. Style thật luôn là .ifx-card-header/.ifx-card-footer (card.css). */
  function headHtml(ctx, aside) {
    var actions = (aside || '') + (ctx.actions || '');
    if (!ctx.title && !ctx.description && !actions && !ctx.icon) return '';
    var icon = ctx.icon ? '<i class="ti ti-' + esc(ctx.icon) + ' ifx-card-header__icon" aria-hidden="true"></i>' : '';
    var status = ctx.statusHtml ? ' ' + ctx.statusHtml : '';
    /* Icon + Tiêu đề cùng 1 hàng (.ifx-widget-title__head); Mô tả hàng dưới, full-width — không
       còn Icon 1 bên riêng biệt với khối Tiêu đề+Mô tả. */
    var head = (icon || ctx.title) ? '<div class="ifx-widget-title__head">' + icon +
      (ctx.title ? '<h3>' + esc(ctx.title) + status + '</h3>' : '') + '</div>' : '';
    return '<header class="ifx-card-header ifx-widget__header"><div class="ifx-widget-title">' + head +
      (ctx.description ? '<p class="ifx-widget__subtitle">' + esc(ctx.description) + '</p>' : '') +
      '</div>' + (actions ? '<div class="ifx-inline-sm ifx-widget__actions">' + actions + '</div>' : '') +
      '</header>';
  }

  /** ctx.footerHref — Widget (không phải Template) biết nên dẫn tới trang nào; thiếu → không
   * vẽ Footer (Template không tự bịa đích đến). ctx.footerLabel thiếu → nhãn mặc định 'Xem thêm'. */
  function footerHtml(ctx) {
    if (!ctx.footerHref) return '';
    var label = ctx.footerLabel || 'Xem thêm';
    return '<footer class="ifx-card-footer ifx-widget__footer"><a href="' + esc(ctx.footerHref) + '">' + esc(label) + ' →</a></footer>';
  }

  function mount(host, id, ctx) {
    ctx = ctx || {};
    var def = REG[id];
    if (!host) return null;
    if (!def) {
      host.innerHTML = '<div class="ifx-card"><div class="ifx-card-body"><small>Chưa có Template ' + esc(id) + '</small></div></div>';
      return null;
    }
    var input = resolveInput(id, ctx.input);
    var body = def.render(input, ctx);
    /* def.frame → class bổ sung cho khung Card (vd. ifx-card-accent); def.aside → phần phải của header. */
    var frame = def.frame ? ' ' + def.frame(input, ctx) : '';
    var aside = def.aside ? def.aside(input, ctx) : '';
    host.innerHTML = '<article class="ifx-card' + frame + '" data-ifx-template="' + esc(id) + '">' +
      (def.head === false ? '' : headHtml(ctx, aside)) +
      (def.head === false ? body : '<div class="ifx-card-body">' + body + '</div>') +
      footerHtml(ctx) +
      '</article>';
    var root = host.firstElementChild;
    if (def.bind) def.bind(root, input, ctx);
    return root;
  }

  global.IfxTemplates = {
    define: define, has: has, get: get, demo: demo, mount: mount,
    util: { esc: esc, list: list, num: num, fmtPct: fmtPct, fmtNum: fmtNum, dir: dir, columns: columns }
  };
})(typeof window !== 'undefined' ? window : globalThis);
