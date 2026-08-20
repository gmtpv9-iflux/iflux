/**
 * iFlux User Web — Route SoT (public URL tiếng Việt ↔ file vật lý)
 * Mọi redirect/link điều hướng phải dùng IfluxRoutes.to() — không hardcode path English.
 */
(function (global) {
  'use strict';
  if (global.IfluxRoutes) return;

  var ROUTES = {
    home: { public: '/trang-chu', file: '/User_Web/home/index.html', zone: 'app', auth: true, landing: true },
    market: { public: '/thi-truong', file: '/User_Web/market/index.html', zone: 'app' },
    flow: { public: '/dong-tien', file: '/User_Web/flow/index.html', zone: 'app' },
    stocks: { public: '/co-phieu', file: '/User_Web/stocks/index.html', zone: 'app', auth: true },
    sectors: { public: '/nganh', file: '/User_Web/sectors/index.html', zone: 'app', auth: true },
    ecosystems: { public: '/he-sinh-thai', file: '/User_Web/ecosystems/index.html', zone: 'app', auth: true },
    chuDe: { public: '/chu-de', file: '/User_Web/chu-de/index.html', zone: 'app', auth: true },
    stories: { public: '/chu-de', file: '/User_Web/chu-de/index.html', zone: 'app', auth: true },
    news: { public: '/tin-tuc', file: '/User_Web/news/index.html', zone: 'app' },
    newsWrite: { public: '/tin-tuc/viet-bai', file: '/User_Web/news/write.html', zone: 'app' },
    pricing: { public: '/goi-cuoc', file: '/User_Web/pricing/index.html', zone: 'app' },
    faq: { public: '/hoi-dap', file: '/User_Web/faq/index.html', zone: 'app' },
    loyalty: { public: '/thanh-vien', file: '/User_Web/loyalty/index.html', zone: 'app' },
    membership: { public: '/thanh-vien', file: '/User_Web/loyalty/index.html', zone: 'app' },
    messages: { public: '/tin-nhan', file: '/User_Web/messages/index.html', zone: 'app', auth: true },
    watchlist: { public: '/theo-doi', file: '/User_Web/watchlist/index.html', zone: 'app', auth: true },
    search: { public: '/tim-kiem', file: '/User_Web/search/index.html', zone: 'app' },
    alerts: { public: '/canh-bao', file: '/User_Web/alerts/index.html', zone: 'app' },
    share: { public: '/chia-se', file: '/User_Web/share/index.html', zone: 'app' },
    account: { public: '/tai-khoan', file: '/User_Web/account/profile.html', zone: 'app', auth: true },
    'auth.login': { public: '/dang-nhap', file: '/User_Web/auth/login.html', zone: 'auth' },
    'auth.register': { public: '/dang-ky', file: '/User_Web/auth/register.html', zone: 'auth' },
    'auth.forgot': { public: '/quen-mat-khau', file: '/User_Web/auth/forgot.html', zone: 'auth' },
    'auth.verifyOtp': { public: '/xac-minh-otp', file: '/User_Web/auth/verify-otp.html', zone: 'auth' }
  };

  /* Path English / alias → khớp route (detect + bookmark cũ) */
  var LEGACY_PUBLIC = {
    '/home': 'home',
    '/nha-cua-toi': 'home',
    '/trang-chu': 'home',
    '/market': 'market',
    '/flow': 'flow',
    '/stocks': 'stocks',
    '/sectors': 'sectors',
    '/ecosystems': 'ecosystems',
    '/stories': 'chuDe',
    '/cong-dong': 'news',
    '/cong-dong/viet-bai': 'newsWrite',
    '/community': 'news',
    '/community/write': 'newsWrite',
    '/tin-tuc': 'news',
    '/tin-tuc/viet-bai': 'newsWrite',
    '/pricing': 'pricing',
    '/faq': 'faq',
    '/loyalty': 'membership',
    '/membership': 'membership',
    '/messages': 'messages',
    '/watchlist': 'watchlist',
    '/search': 'search',
    '/alerts': 'alerts',
    '/share': 'share',
    '/account': 'account',
    '/auth/login': 'auth.login',
    '/auth/register': 'auth.register',
    '/auth/forgot': 'auth.forgot',
    '/auth/verify-otp': 'auth.verifyOtp'
  };

  var KEY_ALIASES = {
    dashboard: 'home',
    login: 'auth.login',
    register: 'auth.register',
    forgot: 'auth.forgot',
    root: 'home',
    landing: 'home',
    'chu-de': 'chuDe',
    write: 'newsWrite'
  };

  function normalizePath(path) {
    if (global.IfluxNormalizePath) return global.IfluxNormalizePath(path);
    path = String(path || '/').split('?')[0].split('#')[0];
    if (path.length > 1 && path.charAt(path.length - 1) === '/') {
      path = path.slice(0, -1);
    }
    return path || '/';
  }

  function resolveKey(key) {
    key = String(key || '').toLowerCase();
    if (KEY_ALIASES[key]) key = KEY_ALIASES[key];
    if (key === 'chude') key = 'chuDe';
    return ROUTES[key] ? key : null;
  }

  function pathMatchesRoute(path, route) {
    if (!route) return false;
    path = normalizePath(path);
    if (path === '/' && route.landing) return true;
    var pub = route.public;
    if (path === pub) return true;
    if (pub !== '/' && path.indexOf(pub + '/') === 0) return true;
    if (path === route.file) return true;
    var base = route.file.replace(/\/index\.html$/, '').replace(/\.html$/, '');
    if (path === base || path.indexOf(base + '/') === 0) return true;
    return false;
  }

  function detectRoute(path) {
    path = normalizePath(path);
    if (path === '/' || path === '/guest') return ROUTES.home;
    if (LEGACY_PUBLIC[path] && ROUTES[LEGACY_PUBLIC[path]]) return ROUTES[LEGACY_PUBLIC[path]];
    if (path === '/cong-dong/viet-bai' || path.indexOf('/cong-dong/viet-bai/') === 0) return ROUTES.newsWrite;
    if (path === '/cong-dong' || path.indexOf('/cong-dong/') === 0) return ROUTES.news;
    var keys = Object.keys(ROUTES);
    var i;
    for (i = 0; i < keys.length; i++) {
      if (pathMatchesRoute(path, ROUTES[keys[i]])) return ROUTES[keys[i]];
    }
    return null;
  }

  function to(key, opts) {
    opts = opts || {};
    var rk = resolveKey(key);
    if (!rk) return siteRoot();
    var route = ROUTES[rk];
    var url = route.landing && !opts.canonical ? siteRoot() : route.public;
    if (opts.query) {
      var q = Object.keys(opts.query).map(function (k) {
        return encodeURIComponent(k) + '=' + encodeURIComponent(opts.query[k]);
      }).join('&');
      if (q) url += (url.indexOf('?') >= 0 ? '&' : '?') + q;
    }
    if (!opts.skipDecorate && !opts.raw) {
      if (global.IfluxHref && IfluxHref.forCanonical) {
        url = IfluxHref.forCanonical(url);
      } else {
        var W = global.IfluxShellUrlWriter;
        if (W && W.decorate) url = W.decorate(url);
      }
    }
    return url;
  }

  function href(canonical, opts) {
    if (global.IfluxHref && IfluxHref.forCanonical) {
      return IfluxHref.forCanonical(canonical, opts);
    }
    opts = opts || {};
    if (opts.raw || opts.skipDecorate) return String(canonical || '/');
    var W = global.IfluxShellUrlWriter;
    if (W && W.decorate) return W.decorate(canonical);
    return String(canonical || '/');
  }

  function siteRoot() {
    return '/';
  }

  function pathname() {
    return normalizePath(global.location && global.location.pathname);
  }

  function isAuthPage(path) {
    var r = detectRoute(path);
    return !!(r && r.zone === 'auth');
  }

  function isLegacyGuestPath(path) {
    return normalizePath(path) === '/guest';
  }

  function isPublicPage(path) {
    path = normalizePath(path);
    var r = detectRoute(path);
    if (!r) return false;
    if (r.zone === 'auth') return true;
    if (r.zone === 'app' && !r.auth) return true;
    return false;
  }

  function requiresAuth(path) {
    var r = detectRoute(path);
    return !!(r && r.zone === 'app' && r.auth);
  }

  function isAppShellPage(path) {
    var r = detectRoute(path);
    return !!(r && r.zone === 'app');
  }

  function loginWithReturn(returnPath) {
    var ret = normalizePath(returnPath || pathname());
    if (isAuthPage(ret) || ret === '/' || ret === '/guest') ret = to('home', { canonical: true, skipDecorate: true });
    return to('auth.login') + '?return=' + encodeURIComponent(ret);
  }

  function currentReturnPath() {
    return pathname() + ((global.location && global.location.search) || '');
  }

  function userWebAsset(rel) {
    rel = String(rel || '').replace(/^\.\.\//, '').replace(/^iflux-web-ui\//, '');
    return '/User_Web/iflux-web-ui/' + rel;
  }

  function adminAsset(rel) {
    rel = String(rel || '').replace(/^\.\.\//, '');
    return '/Admin_Design_system/' + rel;
  }

  global.IfluxRoutes = {
    ROUTES: ROUTES,
    to: to,
    href: href,
    siteRoot: siteRoot,
    route: function (key) { var k = resolveKey(key); return k ? ROUTES[k] : null; },
    detectRoute: detectRoute,
    pathname: pathname,
    normalizePath: normalizePath,
    isAuthPage: isAuthPage,
    isGuestPage: isLegacyGuestPath,
    isLegacyGuestPath: isLegacyGuestPath,
    isPublicPage: isPublicPage,
    requiresAuth: requiresAuth,
    isAppShellPage: isAppShellPage,
    loginWithReturn: loginWithReturn,
    currentReturnPath: currentReturnPath,
    userWebAsset: userWebAsset,
    adminAsset: adminAsset
  };
})(window);
