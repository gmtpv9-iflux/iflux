/**
 * Slice 4.5 — URL chi tiết comment CP cũ → Comments Host (/binh-luan).
 * location.replace: Back không quay URL đã retire.
 */
(function () {
  'use strict';

  function resolveHref() {
    var params = new URLSearchParams((location && location.search) || '');
    var feed = String(params.get('feed') || '').trim();
    var ticker = String(params.get('ticker') || '').trim().toUpperCase();
    var seo = window.IfluxSeoUrl;

    if (feed && feed.indexOf(':') >= 0) {
      var i = feed.indexOf(':');
      var type = feed.slice(0, i);
      var id = feed.slice(i + 1);
      if (type === 'cau-chuyen' || type === 'chu-de') type = 'story';
      if (seo && seo.commentsPath) return seo.commentsPath(type, id);
      if (type === 'sector') return '/nganh/' + encodeURIComponent(id) + '/binh-luan';
      if (type === 'family') return '/he-sinh-thai/' + encodeURIComponent(id) + '/binh-luan';
      if (type === 'story') return '/cau-chuyen/' + encodeURIComponent(id) + '/binh-luan';
    }
    if (ticker) {
      if (seo && seo.stockCommentsPath) return seo.stockCommentsPath(ticker);
      if (seo && seo.commentsPath) return seo.commentsPath('stock', ticker);
      return '/co-phieu/' + encodeURIComponent(ticker) + '/binh-luan';
    }
    return seo && seo.commentsPath ? seo.commentsPath('stock', 'HPG') : '/co-phieu/HPG/binh-luan';
  }

  function go() {
    var href = resolveHref();
    /* P6-API-01 — internal nav chỉ Writer.navigate */
    var W = window.IfluxShellUrlWriter;
    if (W && W.navigate) {
      W.navigate(href, { replace: true });
      return;
    }
    try {
      location.replace(href);
    } catch (e) {
      location.href = href;
    }
  }

  if (window.IfluxSeoUrl) go();
  else {
    window.addEventListener('iflux-shell-ready', go, { once: true });
    setTimeout(go, 800);
  }
})();
