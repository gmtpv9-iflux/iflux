/**
 * iFlux App Shell — Market Status Bar (status thị trường toàn cục)
 * Dải mỏng ngay dưới header, hiện trên MỌI trang có App Shell.
 * Trái = Kháng cự (đỏ) · Giữa = Cân bằng (vàng) · Phải = Hỗ trợ (xanh).
 * Dot = vị trí VN-Index hiện tại trong biên hỗ trợ/kháng cự 15 phiên gần nhất.
 * Nguồn dữ liệu: IfluxMockMarket.getMarketZoneContext() (SoT duy nhất).
 * KHÔNG phải Widget — là thành phần App Shell đi chung header.
 */
(function (global) {
  'use strict';
  if (global.IfluxMarketStatusBar) return;

  var TICK_MS = 15000;
  var el = null;
  var timer = null;

  function mk() { return global.IfluxMockMarket; }

  function fmtNum(n) {
    if (n == null || isNaN(n)) return '—';
    return Number(n).toLocaleString('vi-VN', { maximumFractionDigits: 2 });
  }

  function ensureEl() {
    var existing = document.querySelector('[data-ifx-market-status]');
    if (existing) { el = existing; return el; }
    var nav = document.querySelector('.ifx-topnav');
    if (!nav || !nav.parentNode) return null;
    el = document.createElement('div');
    el.className = 'ifx-market-status';
    el.setAttribute('data-ifx-market-status', '');
    el.setAttribute('role', 'img');
    el.innerHTML =
      '<div class="ifx-market-status__track">' +
        '<span class="ifx-market-status__dot"></span>' +
      '</div>';
    nav.parentNode.insertBefore(el, nav.nextSibling);
    return el;
  }

  function paint() {
    var m = mk();
    if (!m || typeof m.getMarketZoneContext !== 'function') return false;
    var ctx = m.getMarketZoneContext();
    if (!ctx) return false;
    if (!ensureEl()) return false;

    var pos = ctx.position == null ? 0.5 : ctx.position;
    pos = Math.max(0, Math.min(1, pos));
    // Trái = Kháng cự (pos=1) → dot trái; Phải = Hỗ trợ (pos=0) → dot phải.
    var dotLeft = Math.round((1 - pos) * 100);

    var dot = el.querySelector('.ifx-market-status__dot');
    var track = el.querySelector('.ifx-market-status__track');
    if (dot) dot.style.left = dotLeft + '%';
    el.setAttribute('data-tone', ctx.zoneTone || 'neutral');

    var sessions = ctx.sessions || 15;
    var idxName = (ctx.index && ctx.index.name) ? ctx.index.name : 'VN-Index';
    var label =
      idxName + ' ' + fmtNum(ctx.index && ctx.index.value) +
      ' · ' + (ctx.zoneLabel || '') +
      ' · Kháng cự ' + fmtNum(ctx.resistance) + ' (+' + ctx.distResPct + '%)' +
      ' · Hỗ trợ ' + fmtNum(ctx.support) + ' (−' + ctx.distSupPct + '%)' +
      ' · Tham chiếu ' + sessions + ' phiên';
    el.setAttribute('aria-label', label);
    if (track) track.setAttribute('title', label);
    return true;
  }

  function poll(retries) {
    if (paint()) return;
    if (retries <= 0) return;
    setTimeout(function () { poll(retries - 1); }, 400);
  }

  function start() {
    poll(20);
    if (timer) clearInterval(timer);
    timer = setInterval(paint, TICK_MS);
  }

  function init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', start);
    } else {
      start();
    }
  }

  global.IfluxMarketStatusBar = { init: init, refresh: paint };
  init();
})(window);
