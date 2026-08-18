/**
 * iFlux App Shell — Market Status Bar (status thị trường toàn cục)
 * Dải mỏng ngay dưới header, hiện trên MỌI trang có App Shell.
 * KHÔNG phải Widget — là thành phần App Shell đi chung header.
 * Ngữ cảnh vùng giá VN-Index (hỗ trợ/kháng cự) không có nguồn xác thực runtime
 * (SOL-UNAVAIL) → giữ chrome (dải + dot), giá trị UNAVAIL (—), dot trung tính.
 */
(function (global) {
  'use strict';
  if (global.IfluxMarketStatusBar) return;

  var TICK_MS = 15000;
  var el = null;
  var timer = null;

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
    if (!ensureEl()) return false;

    var dot = el.querySelector('.ifx-market-status__dot');
    var track = el.querySelector('.ifx-market-status__track');
    if (dot) dot.style.left = '50%';
    el.setAttribute('data-tone', 'neutral');

    var label = 'VN-Index — · Dữ liệu vùng giá chưa khả dụng';
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
