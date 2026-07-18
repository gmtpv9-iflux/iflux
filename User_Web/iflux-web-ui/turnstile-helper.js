/* iFlux — Cloudflare Turnstile helper (dùng chung form User Web) */
(function (global) {
  'use strict';

  var SITE_KEY = '0x4AAAAAADz4fhsXKizSR6fp';
  var SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
  var ready = false;

  function load() {
    if (ready && global.turnstile) return Promise.resolve();
    return new Promise(function (resolve, reject) {
      if (document.querySelector('script[data-ifx-turnstile-src]')) {
        var t = setInterval(function () {
          if (global.turnstile) { clearInterval(t); ready = true; resolve(); }
        }, 80);
        setTimeout(function () { clearInterval(t); resolve(); }, 8000);
        return;
      }
      var sc = document.createElement('script');
      sc.src = SRC;
      sc.async = true;
      sc.defer = true;
      sc.setAttribute('data-ifx-turnstile-src', '');
      sc.onload = function () { ready = true; resolve(); };
      sc.onerror = function () { reject(new Error('Không tải được Turnstile')); };
      document.head.appendChild(sc);
    });
  }

  function render(container, widgetKey) {
    if (!container || !global.turnstile) return null;
    container.innerHTML = '';
    try {
      return global.turnstile.render(container, {
        sitekey: SITE_KEY,
        theme: 'auto',
        callback: function () {
          if (widgetKey && global.__ifxTurnstileWidgets) {
            global.__ifxTurnstileWidgets[widgetKey] = true;
          }
        }
      });
    } catch (e) {
      return null;
    }
  }

  function getToken(widgetId) {
    if (!global.turnstile || widgetId == null) return '';
    try { return global.turnstile.getResponse(widgetId) || ''; } catch (e) { return ''; }
  }

  function reset(widgetId) {
    if (!global.turnstile || widgetId == null) return;
    try { global.turnstile.reset(widgetId); } catch (e) { /* ignore */ }
  }

  global.IfluxTurnstile = {
    SITE_KEY: SITE_KEY,
    load: load,
    render: render,
    getToken: getToken,
    reset: reset
  };
})(window);
