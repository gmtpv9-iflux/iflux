/* Redirect /stocks/{TICKER} hoặc legacy /community/stocks/ → stock/index.html (file:// + dev server) */
(function (global) {
  'use strict';

  function userWebRoot() {
    var path = decodeURIComponent((global.location && global.location.pathname) || '');
    var idx = path.indexOf('/User_Web/');
    return idx >= 0 ? path.slice(0, idx + '/User_Web/'.length) : '/User_Web/';
  }

  function parseTicker() {
    var path = decodeURIComponent((global.location && global.location.pathname) || '');
    var m = path.match(/\/(?:stocks|community\/stocks)\/([^/?#]+)/i);
    if (!m) return '';
    var raw = m[1].replace(/\/index\.html$/i, '');
    if (!raw || raw.toLowerCase() === 'index.html') return '';
    return raw.toUpperCase();
  }

  function redirect() {
    var ticker = parseTicker();
    var root = userWebRoot();
    if (!ticker) {
      global.location.replace(root + 'community/index.html');
      return;
    }
    global.location.replace(root + 'stock/index.html?ticker=' + encodeURIComponent(ticker));
  }

  redirect();
})(window);
