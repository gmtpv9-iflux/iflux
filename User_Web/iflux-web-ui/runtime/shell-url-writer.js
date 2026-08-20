/* B3 — Shell URL Writer (ADR-AFF-007 rev.2)
 * Single decision point: decorate(canonical) → final URL
 * Caller chỉ truyền canonical — CẤM export prepend helper
 */
(function (global) {
  'use strict';

  var PUBLIC_ID_RE = /^IFL[A-Z0-9]{5,17}$/;

  function normalizeCanonical(path) {
    if (global.IfluxNormalizePath) return global.IfluxNormalizePath(path);
    path = String(path || '/').split('?')[0].split('#')[0];
    if (path.length > 1 && path.charAt(path.length - 1) === '/') {
      path = path.slice(0, -1);
    }
    return path || '/';
  }

  function isPublicIdSegment(seg) {
    return PUBLIC_ID_RE.test(String(seg || '').trim().toUpperCase());
  }

  /* Pre-shell fallback — same public prefixes as IfluxRoutes (zone policy, not page list) */
  var APP_PUBLIC_PREFIXES = [
    '/trang-chu', '/nha-cua-toi', '/thi-truong', '/dong-tien', '/co-phieu', '/nganh', '/he-sinh-thai',
    '/cau-chuyen', '/chu-de', '/cong-dong', '/goi-cuoc', '/hoi-dap', '/thanh-vien',
    '/tin-nhan', '/theo-doi', '/tim-kiem', '/canh-bao', '/chia-se', '/tai-khoan'
  ];

  function matchesAppPublicPrefix(path) {
    path = normalizeCanonical(path);
    if (path === '/' || path === '/guest') return true;
    var i;
    for (i = 0; i < APP_PUBLIC_PREFIXES.length; i++) {
      var p = APP_PUBLIC_PREFIXES[i];
      if (path === p || path.indexOf(p + '/') === 0) return true;
    }
    return false;
  }

  function splitPathQueryHash(input) {
    input = String(input || '');
    var hashIdx = input.indexOf('#');
    var hash = hashIdx >= 0 ? input.slice(hashIdx) : '';
    var noHash = hashIdx >= 0 ? input.slice(0, hashIdx) : input;
    var qIdx = noHash.indexOf('?');
    var query = qIdx >= 0 ? noHash.slice(qIdx) : '';
    var pathOnly = qIdx >= 0 ? noHash.slice(0, qIdx) : noHash;
    return { path: pathOnly, query: query, hash: hash };
  }

  function isApplicationZone(path) {
    path = normalizeCanonical(path);
    if (!path) return false;
    if (/^https?:\/\//i.test(path)) return false;
    if (/^\/api(\/|$)/i.test(path)) return false;
    if (/^\/User_Web(\/|$)/i.test(path)) return false;
    if (/^\/Admin_Design_system/i.test(path)) return false;
    if (/^\/admin(\/|$)/i.test(path)) return false;
    if (/^\/assets(\/|$)/i.test(path)) return false;
    if (/^\/(favicon\.ico|robots\.txt|sitemap\.xml)(\/|$)?$/i.test(path)) return false;
    if (/\/oauth|\/callback|\/payment|\/thanh-toan|\/logout/i.test(path)) return false;
    if (global.IfluxRoutes) {
      if (IfluxRoutes.isAuthPage && IfluxRoutes.isAuthPage(path)) return false;
      var r = IfluxRoutes.detectRoute && IfluxRoutes.detectRoute(path);
      if (r && r.zone === 'auth') return false;
      if (r && r.zone === 'app') return true;
    }
    if (matchesAppPublicPrefix(path)) return true;
    return false;
  }

  function getOwnerPublicId() {
    var PNC = global.IfluxNavigationContext;
    if (!PNC || !PNC.getContext) return null;
    var ctx = PNC.getContext();
    if (!ctx || !ctx.ownerPublicId) return null;
    return String(ctx.ownerPublicId).trim().toUpperCase();
  }

  function decorateCanonical(canonical) {
    canonical = normalizeCanonical(canonical);
    if (!isApplicationZone(canonical)) return canonical;
    var owner = getOwnerPublicId();
    if (!owner) return canonical;
    if (canonical === '/') return '/' + owner;
    return '/' + owner + canonical;
  }

  function decorate(input) {
    var parts = splitPathQueryHash(input);
    var decorated = decorateCanonical(parts.path);
    return decorated + parts.query + parts.hash;
  }

  function barHasForeignOwnerPrefix() {
    if (!global.location) return false;
    var owner = getOwnerPublicId();
    if (!owner) return false;
    var segs = String(global.location.pathname || '').split('/');
    if (segs.length >= 2 && segs[0] === '' && isPublicIdSegment(segs[1])) {
      return segs[1].toUpperCase() !== owner;
    }
    return false;
  }

  function syncBarWithOwner() {
    if (!global.location || barHasForeignOwnerPrefix()) return;
    var canonical = normalizeCanonical(global.location.pathname);
    if (!isApplicationZone(canonical)) return;
    if (!getOwnerPublicId()) return;
    var expected = decorateCanonical(canonical);
    if (global.location.pathname === expected) return;
    replacePath(canonical, { preserveSearch: true, preserveHash: true });
  }

  function navigate(canonical, opts) {
    opts = opts || {};
    var parts = splitPathQueryHash(canonical);
    var url = decorateCanonical(parts.path) + (opts.query || parts.query || '') + (opts.hash != null ? opts.hash : parts.hash || '');

    var doReplace = opts.replace !== false;
    /* Soft Persistent Shell khi route allow — giữ header/logo; hard fallback. */
    var preferSoft = opts.soft !== false;
    if (preferSoft) {
      var SN = global.IfluxSoftNav;
      if (SN && typeof SN.canSoftNavigate === 'function' && SN.canSoftNavigate(url) && typeof SN.navigate === 'function') {
        try {
          var softResult = SN.navigate(url, {
            replace: doReplace
          });
          if (softResult && typeof softResult.then === 'function') {
            softResult.then(function (ok) {
              if (ok === false) {
                if (doReplace) global.location.replace(url);
                else global.location.assign(url);
              }
            }).catch(function () {
              if (doReplace) global.location.replace(url);
              else global.location.assign(url);
            });
            return;
          }
          if (softResult !== false) return;
        } catch (eSoft) { /* fall through hard */ }
      }
    }

    if (doReplace) global.location.replace(url);
    else global.location.assign(url);
  }

  function replacePath(canonical, opts) {
    opts = opts || {};
    var parts = splitPathQueryHash(canonical);
    var url = decorateCanonical(parts.path);
    var search = opts.preserveSearch && global.location ? global.location.search : (opts.query || parts.query || '');
    var hash = opts.preserveHash && global.location ? global.location.hash : (opts.hash != null ? opts.hash : parts.hash || '');
    var finalUrl = url + search + hash;
    if (global.history && global.history.replaceState) {
      global.history.replaceState(null, '', finalUrl);
    } else if (global.location) {
      global.location.replace(finalUrl);
    }
  }

  global.IfluxShellUrlWriter = {
    decorate: decorate,
    isApplicationZone: isApplicationZone,
    navigate: navigate,
    replacePath: replacePath,
    syncBarWithOwner: syncBarWithOwner
  };
})(typeof window !== 'undefined' ? window : this);
