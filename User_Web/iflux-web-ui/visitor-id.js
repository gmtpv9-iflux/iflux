/* iFlux — định danh khách (like/đồng tình khi chưa đăng nhập) */
(function (global) {
  'use strict';

  var KEY = 'iflux_visitor_id';

  function get() {
    try {
      var id = localStorage.getItem(KEY);
      if (id && id.length >= 8) return id;
      id = 'v_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10);
      localStorage.setItem(KEY, id);
      return id;
    } catch (e) {
      return 'v_anon_' + Date.now();
    }
  }

  function apiHeaders() {
    var h = { 'Content-Type': 'application/json', 'X-Visitor-Id': get() };
    if (global.IfluxAuth && IfluxAuth.getToken) {
      var tok = IfluxAuth.getToken();
      if (tok) h.Authorization = 'Bearer ' + tok;
    }
    return h;
  }

  global.IfluxVisitorId = { get: get, apiHeaders: apiHeaders };
})(window);
