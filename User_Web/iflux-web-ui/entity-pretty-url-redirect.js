/* Legacy pretty URL → entity — redirect sang top-level */
(function (global) {
  'use strict';

  function redirectTo(path) {
    global.location.replace(path);
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
    if (m) return '/ho-co-phieu/' + encodeURIComponent(decodeURIComponent(m[1]));
    m = path.match(/\/community\/stories\/([^/?#]+)/i);
    if (m) return '/cong-dong/bai-viet/' + encodeURIComponent(decodeURIComponent(m[1]));
    m = path.match(/\/stories\/([^/?#]+)/i);
    if (m) return '/chu-de/' + encodeURIComponent(decodeURIComponent(m[1]));
    return null;
  }

  var target = parseEntity();
  if (target) redirectTo(target);
  else if (global.IfluxRoutes) redirectTo(IfluxRoutes.to('community'));
  else redirectTo('/cong-dong');
})(window);
