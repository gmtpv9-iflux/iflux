/* Legacy pretty URL → entity — redirect sang top-level */
(function (global) {
  'use strict';

  function redirectTo(path) {
    if (global.IfluxHref && global.IfluxHref.navigate) {
      global.IfluxHref.navigate(path, { replace: true });
      return;
    }
    var W = global.IfluxShellUrlWriter;
    if (W && W.navigate) {
      W.navigate(path, { replace: true });
      return;
    }
    global.location.replace(global.IfluxHref ? global.IfluxHref.forCanonical(path) : path);
  }

  function parseEntity() {
    var path = decodeURIComponent((global.location && global.location.pathname) || '');
    var m = path.match(/\/community\/topics\/([^/?#]+)/i);
    if (m) return '/chu-de/' + encodeURIComponent(decodeURIComponent(m[1]));
    m = path.match(/\/community\/tag\/([^/?#]+)/i);
    if (m) return '/chu-de/' + encodeURIComponent(decodeURIComponent(m[1]));
    m = path.match(/\/community\/sectors\/([^/?#]+)/i);
    if (m) return '/nganh/' + encodeURIComponent(decodeURIComponent(m[1]));
    m = path.match(/\/community\/ecosystems\/([^/?#]+)/i);
    if (m) return '/he-sinh-thai/' + encodeURIComponent(decodeURIComponent(m[1]));
    m = path.match(/\/community\/stories\/([^/?#]+)/i);
    if (m) return '/tin-tuc/bai-viet/' + encodeURIComponent(decodeURIComponent(m[1]));
    m = path.match(/\/stories\/([^/?#]+)/i);
    if (m) return '/chu-de/' + encodeURIComponent(decodeURIComponent(m[1]));
    return null;
  }

  var target = parseEntity();
  if (target) redirectTo(target);
  else if (global.IfluxRoutes) redirectTo(IfluxRoutes.to('community'));
  else redirectTo('/tin-tuc');
})(window);
