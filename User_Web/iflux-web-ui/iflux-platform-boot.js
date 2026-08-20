/* ===== IFX-AUDIT-BEGIN =====
AUDIT-ID: T5A-IGNORE-011
Priority: IGNORE
STATUS: IGNORE
OWNER: Runtime
Candidate Owner: Runtime
Usage audit: N/A
Dep động: N/A
Migration ROI: 1
Khả năng bỏ load: Không
P1 Gate: N/A
Refs: Task5 PhaseA — không audit / không tối ưu
===== IFX-AUDIT-END ===== */
/**
 * iFlux User Web — Route SoT (public URL ↔ file vật lý)
 * Mọi redirect/link điều hướng phải dùng IfluxRoutes.to() — không hardcode ../path
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
    chuDe: { public: '/cau-chuyen', file: '/User_Web/cau-chuyen/index.html', zone: 'app', auth: true },
    stories: { public: '/cau-chuyen', file: '/User_Web/cau-chuyen/index.html', zone: 'app', auth: true },
    cauChuyen: { public: '/cau-chuyen', file: '/User_Web/cau-chuyen/index.html', zone: 'app', auth: true },
    community: { public: '/tin-tuc', file: '/User_Web/community/index.html', zone: 'app' },
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

  var KEY_ALIASES = {
    dashboard: 'home',
    login: 'auth.login',
    register: 'auth.register',
    forgot: 'auth.forgot',
    root: 'home',
    landing: 'home',
    'chu-de': 'cauChuyen',
    chude: 'cauChuyen',
    'cau-chuyen': 'cauChuyen'
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
    var base = route.file.replace(/\/index\.html$/, '');
    if (path === base || path.indexOf(base + '/') === 0) return true;
    return false;
  }

  function detectRoute(path) {
    path = normalizePath(path);
    /* Root / · /guest → landing owner = home */
    if (path === '/' || path === '/guest') return ROUTES.home;
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

  /** Legacy path /guest (bookmark) — không còn trang riêng; resolve = Market. */
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


/* iFlux platform boot: runtime + data provider + api config */
/* iFlux Runtime — environment + dataMode (không chặn fetch theo host) */
(function (global) {
  'use strict';
  if (global.IfluxRuntime) return;

  var MANIFEST = {
    deployments: [
      { environment: 'staging', match: { port: '8888' } },
      { environment: 'staging', match: { hostnamePrefix: 'staging.' } },
      { environment: 'staging', match: { hostname: '103.154.177.157', port: '8888' } },
      { environment: 'production', match: { hostname: ['iflux.vn', 'www.iflux.vn'] } },
      { environment: 'production', match: { hostname: '103.154.177.157', port: ['80', '443', ''] } },
      { environment: 'development', match: { hostname: ['localhost', '127.0.0.1'] } },
      { environment: 'development', match: { protocol: 'file:' } }
    ],
    defaults: {
      production: { dataMode: 'api', apiBaseUrl: 'https://iflux.vn/api' },
      staging: { dataMode: 'sandbox' },
      development: { dataMode: 'mock', apiBaseUrl: 'http://localhost:3001/api' }
    },
    dataModes: {
      api: { provider: 'api', label: 'ApiDataProvider' },
      sandbox: { provider: 'sandbox', label: 'SandboxDataProvider' },
      mock: { provider: 'mock', label: 'MockDataProvider' },
      replay: { provider: 'replay', label: 'ReplayDataProvider' },
      test: { provider: 'test', label: 'TestDataProvider' }
    }
  };

  var VALID_MODES = Object.keys(MANIFEST.dataModes);

  function loc() {
    return global.location || {};
  }

  function matchRule(rule, l) {
    var m = rule.match || rule;
    var host = String(l.hostname || '').toLowerCase();
    var port = String(l.port || '');
    var proto = String(l.protocol || '');

    if (m.protocol && proto !== m.protocol) return false;

    if (m.hostname) {
      var hosts = Array.isArray(m.hostname) ? m.hostname : [m.hostname];
      if (hosts.indexOf(host) < 0) return false;
    }

    if (m.hostnamePrefix) {
      if (host.indexOf(String(m.hostnamePrefix).toLowerCase()) !== 0) return false;
    }

    if (m.port !== undefined) {
      var ports = Array.isArray(m.port) ? m.port : [m.port];
      if (ports.indexOf(port) < 0) return false;
    }

    return true;
  }

  function resolveEnvironment() {
    if (global.IFLUX_ENVIRONMENT) return String(global.IFLUX_ENVIRONMENT);

    var l = loc();
    try {
      var qEnv = new URLSearchParams(l.search || '').get('iflux_env');
      if (qEnv === 'staging') return 'staging';
      if (qEnv === 'production') return 'production';
      if (qEnv === 'development' || qEnv === 'local') return 'development';
    } catch (e) { /* ignore */ }

    var i;
    for (i = 0; i < MANIFEST.deployments.length; i++) {
      if (matchRule(MANIFEST.deployments[i], l)) {
        return MANIFEST.deployments[i].environment;
      }
    }

    return 'development';
  }

  function normalizeMode(mode) {
    mode = String(mode || '').toLowerCase();
    return VALID_MODES.indexOf(mode) >= 0 ? mode : '';
  }

  function resolveDataMode(environment) {
    if (global.IFLUX_DATA_MODE) {
      var forced = normalizeMode(global.IFLUX_DATA_MODE);
      if (forced) return forced;
    }

    var l = loc();
    try {
      var qMode = normalizeMode(new URLSearchParams(l.search || '').get('dataMode'));
      if (qMode) return qMode;
    } catch (e1) { /* ignore */ }

    try {
      var stored = normalizeMode(global.localStorage.getItem('iflux_data_mode'));
      if (stored) {
        // Production dùng API thật — không để sandbox cũ trong localStorage chặn đăng nhập
        if (environment !== 'production' || stored !== 'sandbox') return stored;
      }
    } catch (e2) { /* ignore */ }

    var def = MANIFEST.defaults[environment] || MANIFEST.defaults.staging;
    return normalizeMode(def.dataMode) || 'sandbox';
  }

  function resolveApiBaseUrl(environment, dataMode) {
    if (dataMode !== 'api') return '';
    if (global.IFLUX_API_BASE) return String(global.IFLUX_API_BASE).replace(/\/$/, '');
    if (environment === 'production') {
      var l = loc();
      if (l.host) return String(l.protocol || 'http:') + '//' + l.host + '/api';
    }
    var def = MANIFEST.defaults[environment] || {};
    return def.apiBaseUrl ? String(def.apiBaseUrl).replace(/\/$/, '') : '';
  }

  var environment = resolveEnvironment();
  var dataMode = resolveDataMode(environment);
  var providerMeta = MANIFEST.dataModes[dataMode] || MANIFEST.dataModes.sandbox;
  var config = {
    environment: environment,
    dataMode: dataMode,
    provider: providerMeta.provider,
    providerLabel: providerMeta.label,
    apiBaseUrl: resolveApiBaseUrl(environment, dataMode)
  };

  global.IfluxRuntime = {
    manifest: MANIFEST,
    getConfig: function () {
      return {
        environment: config.environment,
        dataMode: config.dataMode,
        provider: config.provider,
        providerLabel: config.providerLabel,
        apiBaseUrl: config.apiBaseUrl
      };
    },
    getEnvironment: function () { return config.environment; },
    getDataMode: function () { return config.dataMode; },
    getProvider: function () { return config.provider; },
    getApiBaseUrl: function () { return config.apiBaseUrl; },
    isApiMode: function () { return config.dataMode === 'api'; },
    setDataMode: function (mode) {
      mode = normalizeMode(mode);
      if (!mode) return;
      try { global.localStorage.setItem('iflux_data_mode', mode); } catch (e) { /* ignore */ }
      dataMode = mode;
      providerMeta = MANIFEST.dataModes[dataMode] || MANIFEST.dataModes.sandbox;
      config.dataMode = dataMode;
      config.provider = providerMeta.provider;
      config.providerLabel = providerMeta.label;
      config.apiBaseUrl = resolveApiBaseUrl(config.environment, dataMode);
    }
  };

  global.IFLUX_RUNTIME_ENV = environment;
})(window);
/* iFlux Data Layer — chọn provider theo dataMode (UI không biết nguồn dữ liệu) */
(function (global) {
  'use strict';
  if (global.IfluxData) return;

  var PROVIDERS = {
    api: {
      id: 'api',
      label: 'ApiDataProvider',
      usesHttp: true,
      usesBrowserStorage: false
    },
    sandbox: {
      id: 'sandbox',
      label: 'SandboxDataProvider',
      usesHttp: false,
      usesBrowserStorage: true
    },
    mock: {
      id: 'mock',
      label: 'MockDataProvider',
      usesHttp: false,
      usesBrowserStorage: true
    },
    replay: {
      id: 'replay',
      label: 'ReplayDataProvider',
      usesHttp: false,
      usesBrowserStorage: false
    },
    test: {
      id: 'test',
      label: 'TestDataProvider',
      usesHttp: false,
      usesBrowserStorage: true
    }
  };

  function runtime() {
    return global.IfluxRuntime || null;
  }

  function getMode() {
    return runtime() ? runtime().getDataMode() : 'sandbox';
  }

  function getProviderId() {
    return runtime() ? runtime().getProvider() : 'sandbox';
  }

  function getProvider() {
    return PROVIDERS[getProviderId()] || PROVIDERS.sandbox;
  }

  function isApi() {
    return getMode() === 'api';
  }

  function isLocalProvider() {
    return !isApi();
  }

  global.IfluxData = {
    providers: PROVIDERS,
    getMode: getMode,
    getProviderId: getProviderId,
    getProvider: getProvider,
    isApi: isApi,
    isLocalProvider: isLocalProvider,
    /** @deprecated dùng isApi() */
    useApi: isApi
  };
})(window);
/* iFlux — API endpoint config (chỉ active khi dataMode = api) */
(function (global) {
  'use strict';

  function runtimeConfig() {
    return global.IfluxRuntime ? IfluxRuntime.getConfig() : null;
  }

  function getBaseUrl() {
    var c = runtimeConfig();
    return c && c.apiBaseUrl ? c.apiBaseUrl : '';
  }

  function isEnabled() {
    return global.IfluxData ? IfluxData.isApi() && !!getBaseUrl() : false;
  }

  function getRuntimeMode() {
    var c = runtimeConfig();
    if (!c) return 'unknown';
    if (c.dataMode !== 'api') return c.dataMode;
    return c.environment + '-api';
  }

  global.IfluxApiConfig = {
    getBaseUrl: getBaseUrl,
    isEnabled: isEnabled,
    getRuntimeMode: getRuntimeMode,
    /** @deprecated — dùng IfluxRuntime.getDataMode() === 'sandbox' */
    isRemoteSandboxHost: function () {
      return global.IfluxData ? !IfluxData.isApi() : true;
    },
    setBaseUrl: function (url) {
      if (url) global.IFLUX_API_BASE = String(url).replace(/\/$/, '');
      else delete global.IFLUX_API_BASE;
    }
  };
})(window);
/* iFlux App Shell — Market Status Bar (status thị trường toàn cục, mọi trang) */
(function (global) {
  'use strict';
  if (global.__ifxMarketStatusLoaded) return;
  global.__ifxMarketStatusLoaded = true;

  function load() {
    if (global.IfluxMarketStatusBar) return;
    if (!document.querySelector('.ifx-topnav')) return;
    var s = document.createElement('script');
    s.src = '/User_Web/iflux-web-ui/market-status-bar.js?v=mockRmWp5_20260809';
    s.async = true;
    document.head.appendChild(s);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', load);
  } else {
    load();
  }
})(window);
/* =========================================================================
 * iFlux App Shell — Navigation Registry (SoT) + AppShell State + Renderers
 * -------------------------------------------------------------------------
 * Kiến trúc 3 lớp:
 *   Page Registry (IfluxRoutes)  — route ↔ file ↔ slug Việt
 *   Navigation Registry (IfluxNavRegistry) — THUẦN DỮ LIỆU: mục nào, nhãn, icon,
 *       trỏ tới route KEY nào; KHÔNG chứa presentation, KHÔNG tự resolve href.
 *   Entitlement (IfluxEntitlements) — ai được thấy/truy cập.
 * AppShell State (IfluxAppShell) — façade DUY NHẤT chạm Route/Auth/Entitlement/
 *       Notification; compose Registry + business module → dữ liệu sẵn sàng render.
 *
 * App Shell Contract: MỌI renderer (Header/Bottom/UserHub/Context) CHỈ đọc
 *   IfluxNavRegistry (cấu trúc) + IfluxAppShell (state + resolver). CẤM renderer
 *   gọi thẳng IfluxRoutes/IfluxAuth/IfluxEntitlements. Thêm/sửa/xóa 1 mục điều
 *   hướng → chỉ sửa Registry, toàn bộ App Shell tự đồng bộ.
 * ========================================================================= */

/* ── Navigation Registry — thuần dữ liệu ──────────────────────────────── */
(function (global) {
  'use strict';
  if (global.IfluxNavRegistry) return;

  /* Primary nav: mục top-level. label = tên đầy đủ (KHÔNG shortLabel — rút gọn
   * "Nhà" ở bottom bar là PRESENTATION, do renderer tự xử lý). route = key Page Registry.
   * appOnly: chỉ hiện khi đã đăng nhập. exclusive: kiểu link Độc quyền. */
  var primary = [
    { key: 'dashboard', route: 'home',      label: 'Trang chủ', icon: 'ti-home',            appOnly: true, onboard: 'home' },
    { key: 'market',    route: 'market',    label: 'Thị trường',  icon: 'ti-chart-candle', onboard: 'market' },
    { key: 'community', route: 'community', label: 'Tin tức',   icon: 'ti-users', onboard: 'community' },
    { key: 'flow',      route: 'flow',      label: 'Dòng tiền',   icon: 'ti-arrows-exchange', exclusive: true, chip: 'Độc quyền', onboard: 'flow' },
    { key: 'pricing',   route: 'pricing',   label: 'Gói cước',    icon: 'ti-crown', onboard: 'pricing' }
  ];

  /* User Hub: nhóm menu avatar. href literal (đích cố định) hoặc flag hành động
   * (greet/partner/feature/bug). Không đổi so với hành vi hiện tại. */
  var userHub = [
    { title: 'Cá nhân', items: [
      { greet: true },
      { href: '/tai-khoan', icon: 'ti-timeline', label: 'Timeline' }
    ] },
    { title: 'Membership', items: [
      { href: '/account/affiliate', icon: 'ti-affiliate', label: 'Affiliate' },
      { href: '/membership', icon: 'ti-gift', label: 'Chương trình thành viên' }
    ] },
    { title: 'Bảo mật & Quyền riêng tư', items: [
      { href: '/account/privacy', icon: 'ti-shield-lock', label: 'Quyền riêng tư' },
      { href: '/account/billing', icon: 'ti-credit-card', label: 'Tài khoản thanh toán' },
      { href: '/account/security', icon: 'ti-lock', label: 'Đổi mật khẩu' }
    ] },
    { title: 'Hệ thống', items: [
      { href: '/faq', icon: 'ti-help-circle', label: 'Câu hỏi thường gặp' },
      { partner: true, icon: 'ti-handshake', label: 'Liên hệ hợp tác' },
      { feature: true, icon: 'ti-bulb', label: 'Đề xuất tính năng' },
      { bug: true, icon: 'ti-bug', label: 'Báo lỗi' }
    ] }
  ];

  /* Context nav: tab theo entityType. Mở rộng loại mới → thêm 1 key, không refactor. */
  var GROUP_TABS = [
    { key: 'news', icon: 'ti-news', label: 'Tin tức' },
    { key: 'info', icon: 'ti-info-circle', label: 'Thông tin' },
    { key: 'trading', icon: 'ti-chart-bar', label: 'Thống kê' },
    { key: 'comments', icon: 'ti-message', label: 'Bình luận' }
  ];
  var STOCK_TABS = [
    { key: 'news', icon: 'ti-news', label: 'Tin tức' },
    { key: 'info', icon: 'ti-info-circle', label: 'Thông tin' },
    { key: 'trading', icon: 'ti-chart-bar', label: 'Thống kê' },
    { key: 'events', icon: 'ti-calendar-event', label: 'Lịch sự kiện' },
    { key: 'comments', icon: 'ti-message', label: 'Bình luận' }
  ];
  var ARTICLE_TABS = [
    { key: 'like', icon: 'ti-heart', label: 'Thích' },
    { key: 'comments', icon: 'ti-message', label: 'Bình luận' },
    { key: 'share', icon: 'ti-share', label: 'Chia sẻ' }
  ];
  var context = {
    stock:   { tabs: STOCK_TABS },
    sector:  { tabs: GROUP_TABS },
    family:  { tabs: GROUP_TABS },
    story:   { tabs: GROUP_TABS },
    cauChuyen:   { tabs: GROUP_TABS },
    chuDe:   { tabs: GROUP_TABS },
    communityPost: { tabs: ARTICLE_TABS },
    _default: { tabs: GROUP_TABS }
  };

  /* accountProfile: single SoT — desktop tabs + mobile bottom (Slice 1 registry only). */
  var accountProfile = [
    { key: 'affiliate', tabId: 'tab-affiliate', label: 'Affiliate',    icon: 'ti-affiliate',    ownOnly: true },
    { key: 'payment',   tabId: 'tab-payment',   label: 'Liên kết thẻ', icon: 'ti-credit-card',  ownOnly: true },
    { key: 'privacy',   tabId: 'tab-privacy',   label: 'Riêng tư',     icon: 'ti-shield-lock',  ownOnly: true },
    { key: 'security',  tabId: 'tab-security',  label: 'Mật khẩu',     icon: 'ti-lock',         ownOnly: true },
    { key: 'profile',   tabId: 'tab-profile',   label: 'Hồ sơ',        icon: 'ti-user',         ownOnly: true, mobileOnly: true }
  ];

  global.IfluxNavRegistry = {
    primary: primary,
    userHub: userHub,
    context: context,
    accountProfile: accountProfile
  };
})(window);

/* ── AppShell State — façade duy nhất chạm business module ─────────────── */
(function (global) {
  'use strict';
  if (global.IfluxAppShell) return;

  var _entity = null;

  function routes() { return global.IfluxRoutes; }
  function auth() { return global.IfluxAuth; }

  function isLoggedIn() {
    var a = auth();
    return !!(a && a.isLoggedIn && a.isLoggedIn());
  }
  function currentUser() {
    var a = auth();
    return (a && a.getUser) ? a.getUser() : null;
  }

  var LEGACY_HREF = {
    home: '/trang-chu', market: '/thi-truong', flow: '/dong-tien',
    community: '/tin-tuc', pricing: '/goi-cuoc', account: '/tai-khoan', faq: '/hoi-dap'
  };
  function hrefFor(routeKey) {
    var r = routes();
    if (r && r.to) return r.to(routeKey, { canonical: true });
    return LEGACY_HREF[routeKey] || '/';
  }

  function isAccountProfileRoute() {
    var r = routes();
    if (r && r.detectRoute && r.pathname) {
      var rt = r.detectRoute(r.pathname());
      if (rt && (rt.key === 'account' || (rt.file && rt.file.indexOf('/account/') >= 0))) return true;
    }
    var path = '';
    try { path = (global.location && global.location.pathname || '').toLowerCase(); } catch (e) { path = ''; }
    if (/\/(tai-khoan|account)(\/|$)/.test(path)) return true;
    if (/\/user_web\/account\/profile/.test(path)) return true;
    return false;
  }

  function queryProfileUserId() {
    try {
      return (new URLSearchParams(global.location.search).get('user') ||
        new URLSearchParams(global.location.search).get('id') || '').trim();
    } catch (e) {
      return '';
    }
  }

  function isOwnProfileView() {
    var targetId = queryProfileUserId();
    var me = currentUser();
    return !targetId || !!(me && me.id === targetId);
  }

  function isAccountMobileNav() {
    var bp = global.IfluxBreakpoint;
    if (bp && bp.isMobileShell) return bp.isMobileShell();
    if (bp && bp.belowSemantic) return bp.belowSemantic('mobile-shell');
    return false;
  }

  function resolveActiveAccountTabId() {
    try {
      var tab = new URLSearchParams(global.location.search).get('tab');
      if (!tab) return 'tab-affiliate';
      var map = {
        timeline: 'tab-affiliate',
        affiliate: 'tab-affiliate',
        payment: 'tab-payment',
        privacy: 'tab-privacy',
        security: 'tab-security',
        profile: 'tab-profile',
        account: 'tab-profile',
        personal: 'tab-profile'
      };
      if (map[tab]) return map[tab];
      if (tab.indexOf('tab-') === 0) return tab;
      return 'tab-affiliate';
    } catch (e) {
      return 'tab-affiliate';
    }
  }

  /** Cập nhật ?tab= — resolver đọc URL là SoT cho active (desktop + mobile). */
  function syncAccountProfileTabUrl(tabId) {
    try {
      var params = new URLSearchParams(global.location.search || '');
      if (!tabId || tabId === 'tab-affiliate') params.delete('tab');
      else params.set('tab', String(tabId).replace(/^tab-/, ''));
      var qs = params.toString();
      var path = global.location.pathname || '/tai-khoan';
      var hash = global.location.hash || '';
      global.history.replaceState(null, '', path + (qs ? '?' + qs : '') + hash);
    } catch (e) { /* ignore */ }
  }

  function freezeNavItem(item) {
    return Object.freeze({
      key: item.key,
      label: item.label,
      href: item.href != null ? item.href : '',
      active: !!item.active,
      icon: item.icon || '',
      tabId: item.tabId || ''
    });
  }

  function activePage() {
    var r = routes();
    if (r && r.detectRoute && r.pathname) {
      var rt = r.detectRoute(r.pathname());
      if (rt && rt.file) {
        var f = rt.file;
        if (f.indexOf('/home/') >= 0) return 'dashboard';
        if (f.indexOf('/market/') >= 0) return 'market';
        if (f.indexOf('/flow/') >= 0) return 'flow';
        if (f.indexOf('/community/') >= 0) return 'community';
        if (f.indexOf('/pricing/') >= 0) return 'pricing';
        if (f.indexOf('/account/') >= 0) return 'account';
      }
      if (rt && rt.key === 'account') return 'account';
    }
    var path = '';
    try { path = (global.location && global.location.pathname || '').toLowerCase(); } catch (e) { path = ''; }
    if (/\/(trang-chu|nha-cua-toi|home)(\/|$)/.test(path)) return 'dashboard';
    if (/\/(thi-truong|market)(\/|$)/.test(path)) return 'market';
    if (/\/(dong-tien|flow)(\/|$)/.test(path)) return 'flow';
    if (/\/(cong-dong|community)(\/|$)/.test(path)) return 'community';
    if (/\/(goi-cuoc|pricing)(\/|$)/.test(path)) return 'pricing';
    if (isAccountProfileRoute()) return 'account';
    return '';
  }

  function tierChipClass(u) {
    if (!u) return 'ix-chip-primary';
    var phase = u.subscription_phase || '';
    if (phase === 'trial_eligible') return 'ix-chip-warning';
    if (phase === 'freemium' || String(u.tier || 'free').toLowerCase() === 'free') return 'ix-chip-primary';
    if (String(u.tier || '').toLowerCase() === 'elite') return 'ix-chip-warning';
    return 'ix-chip-primary';
  }
  function membership() {
    var a = auth();
    var u = currentUser();
    var label = '';
    if (a && a.getMenuTierLabel) { try { label = a.getMenuTierLabel() || ''; } catch (e) { label = ''; } }
    if (!label && u) label = u.tier_label || (String(u.tier || '').toLowerCase() === 'free' ? 'Miễn phí' : u.tier) || '';
    return { tier: u ? (u.tier || 'free') : 'guest', label: label, chipClass: tierChipClass(u) };
  }

  function notificationCount() {
    var u = currentUser();
    var n = global.IfluxInAppNotifications;
    if (u && n && n.unreadCount) { try { return n.unreadCount(u.id) || 0; } catch (e) { return 0; } }
    return 0;
  }
  function unreadMessageCount() {
    var u = currentUser();
    var s = global.IfluxProfileChatStore;
    if (u && s && s.unreadCount) { try { return s.unreadCount(u.id) || 0; } catch (e) { return 0; } }
    return 0;
  }

  /* Resolver: Registry.primary + href (Route) + lọc appOnly (login) + cờ active. */
  function getPrimaryNav() {
    var reg = global.IfluxNavRegistry;
    if (!reg || !reg.primary) return [];
    var loggedIn = isLoggedIn();
    var active = activePage();
    return reg.primary
      .filter(function (it) { return loggedIn || !it.appOnly; })
      .map(function (it) {
        return {
          key: it.key,
          label: it.label,
          icon: it.icon,
          href: hrefFor(it.route),
          active: it.key === active,
          exclusive: !!it.exclusive,
          chip: it.chip || '',
          onboard: it.onboard || '',
          appOnly: !!it.appOnly
        };
      });
  }

  /* Resolver: Registry.userHub + greet(name/tier) — href literal giữ nguyên. */
  function getUserHub() {
    var reg = global.IfluxNavRegistry;
    if (!reg || !reg.userHub) return [];
    var u = currentUser();
    var name = (u && (u.display_name || u.name)) || '';
    var mem = membership();
    return reg.userHub.map(function (group) {
      return {
        title: group.title,
        items: group.items.map(function (it) {
          if (it.greet) {
            return { greet: true, name: name || 'bạn', href: '/tai-khoan', tier: mem };
          }
          return {
            label: it.label,
            icon: it.icon,
            href: it.href || (it.route ? hrefFor(it.route) : '#'),
            partner: !!it.partner,
            feature: !!it.feature,
            bug: !!it.bug
          };
        })
      };
    });
  }

  /* Resolver: Registry.context[entityType].tabs (fallback _default). */
  function getContextTabs(entityType) {
    var reg = global.IfluxNavRegistry;
    var c = reg && reg.context;
    if (!c) return { tabs: [] };
    return c[entityType] || c._default || { tabs: [] };
  }

  /* ── Navigation Mode (PRIMARY | CONTEXT) ──────────────────────────────
   * CONTEXT = đang ở trang chi tiết entity (cổ phiếu/ngành/họ/câu chuyện).
   * Phát hiện theo path (URL Việt hoặc file vật lý). listHref = trang danh sách
   * để nút Back quay về khi không có history. entityType map sang Registry.context. */
  var ENTITY_ROUTES = [
    { entityType: 'stock',  re: /\/(co-phieu|stocks?)\/[^/]+\/?$/,        list: '/co-phieu' },
    { entityType: 'sector', re: /\/(nganh|sectors?)\/[^/]+\/?$/,          list: '/nganh' },
    { entityType: 'family', re: /\/(he-sinh-thai|ho-co-phieu|ecosystems?)\/[^/]+\/?$/, list: '/he-sinh-thai' },
    { entityType: 'story',  re: /\/(cau-chuyen|chu-de|stories)\/[^/]+\/?$/, list: '/cau-chuyen' },
    { entityType: 'communityPost', re: /\/(tin-tuc|cong-dong|community)\/(bai-viet|posts?)\/[^/]+\/?$/, list: '/tin-tuc' }
  ];
  var FILE_ENTITY = [
    { entityType: 'stock',  re: /\/stock\//,          list: '/co-phieu' },
    { entityType: 'sector', re: /\/sector\//,          list: '/nganh' },
    { entityType: 'family', re: /\/family\//,          list: '/he-sinh-thai' },
    { entityType: 'story',  re: /\/(cau-chuyen|chu-de)\/chi-tiet/,  list: '/cau-chuyen' },
    { entityType: 'communityPost', re: /\/User_Web\/community\/post/i, list: '/tin-tuc' }
  ];
  function detectContext() {
    if (_entity && _entity.entityType) return _entity;
    var path = '';
    try { path = (global.location && global.location.pathname || '').toLowerCase(); } catch (e) { path = ''; }
    var i;
    for (i = 0; i < ENTITY_ROUTES.length; i++) {
      if (ENTITY_ROUTES[i].re.test(path)) {
        return { entityType: ENTITY_ROUTES[i].entityType, listHref: ENTITY_ROUTES[i].list };
      }
    }
    for (i = 0; i < FILE_ENTITY.length; i++) {
      if (FILE_ENTITY[i].re.test(path)) {
        return { entityType: FILE_ENTITY[i].entityType, listHref: FILE_ENTITY[i].list };
      }
    }
    return null;
  }
  function getNavMode() {
    return detectContext() ? 'CONTEXT' : 'PRIMARY';
  }

  /* Resolver bottom-bar CONTEXT: item {key,label,icon,active} từ Registry.context.
   * Không có href — tap để chuyển panel (renderer tự wire), khác Primary (điều hướng). */
  function getContextNav(entityType) {
    var et = entityType;
    if (!et) { var c = detectContext(); et = c ? c.entityType : '_default'; }
    var tabs = getContextTabs(et).tabs || [];
    return tabs.map(function (t, i) {
      return { key: t.key, label: t.label, icon: t.icon, active: i === 0 };
    });
  }

  /* Route → Navigation Context (không phụ thuộc renderer). */
  function resolveNavigationContext() {
    var entity = detectContext();
    if (entity && entity.entityType) {
      return Object.freeze({
        kind: 'entity',
        entityType: entity.entityType,
        listHref: entity.listHref || ''
      });
    }
    if (isAccountProfileRoute()) {
      return Object.freeze({
        kind: 'account',
        ownProfile: isOwnProfileView()
      });
    }
    return Object.freeze({ kind: 'app' });
  }

  function modelIdForContext(ctx) {
    if (ctx.kind === 'entity') return 'context';
    if (ctx.kind === 'account') return 'accountProfile';
    return 'primary';
  }

  /* Registry + context → NavigationItem[] (immutable, renderer read-only). */
  function resolveNavigationItems(modelId, ctx) {
    ctx = ctx || resolveNavigationContext();
    var items = [];
    if (modelId === 'primary') {
      items = getPrimaryNav().map(function (it) {
        return freezeNavItem({
          key: it.key,
          label: it.label,
          href: it.href,
          active: it.active,
          icon: it.icon,
          tabId: ''
        });
      });
    } else if (modelId === 'context') {
      var et = ctx.entityType || '_default';
      items = getContextNav(et).map(function (it) {
        return freezeNavItem({
          key: it.key,
          label: it.label,
          href: '',
          active: it.active,
          icon: it.icon,
          tabId: ''
        });
      });
    } else if (modelId === 'accountProfile') {
      var reg = global.IfluxNavRegistry;
      var defs = (reg && reg.accountProfile) || [];
      var activeTab = resolveActiveAccountTabId();
      var own = ctx.kind === 'account' ? ctx.ownProfile : isOwnProfileView();
      var mobile = isAccountMobileNav();
      items = defs
        .filter(function (d) {
          if (!own && d.ownOnly) return false;
          if (d.mobileOnly && !mobile) return false;
          if (d.desktopOnly && mobile) return false;
          return true;
        })
        .map(function (d) {
          return freezeNavItem({
            key: d.key,
            label: d.label,
            href: '#',
            active: d.tabId === activeTab,
            icon: d.icon,
            tabId: d.tabId
          });
        });
    }
    return Object.freeze(items);
  }

  function currentNavigationModel() {
    var ctx = resolveNavigationContext();
    var modelId = modelIdForContext(ctx);
    return Object.freeze({
      modelId: modelId,
      context: ctx,
      items: resolveNavigationItems(modelId, ctx)
    });
  }

  /* Đích nút Back khi không dùng được history.back(): trang danh sách của entity. */
  function getBackHref() {
    var c = detectContext();
    return c ? c.listHref : hrefFor('home');
  }

  global.IfluxAppShell = {
    get navigationMode() { return getNavMode(); },
    isLoggedIn: isLoggedIn,
    currentUser: currentUser,
    membership: membership,
    activePage: activePage,
    currentEntity: function () { return _entity; },
    setEntity: function (e) { _entity = e; },
    detectContext: detectContext,
    getNavMode: getNavMode,
    getBackHref: getBackHref,
    notificationCount: notificationCount,
    unreadMessageCount: unreadMessageCount,
    hrefFor: hrefFor,
    getPrimaryNav: getPrimaryNav,
    getUserHub: getUserHub,
    getContextTabs: getContextTabs,
    getContextNav: getContextNav,
    resolveNavigationContext: resolveNavigationContext,
    currentNavigationModel: currentNavigationModel,
    resolveNavigationItems: resolveNavigationItems,
    syncAccountProfileTabUrl: syncAccountProfileTabUrl
  };
})(window);

/* ── Header primary-nav renderer — consumer thuần của IfluxAppShell ────── */
(function (global) {
  'use strict';
  if (global.IfluxAppShellHeader) return;

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function itemHtml(it) {
    var cls = 'ifx-topnav-link' + (it.exclusive ? ' ifx-topnav-link--exclusive' : '') + (it.active ? ' active' : '');
    var attrs = '';
    if (it.appOnly) attrs += ' data-ifx-app-only';
    if (it.onboard) attrs += ' data-ifx-onboard="' + esc(it.onboard) + '"';
    if (it.key === 'flow') attrs += ' data-ifx-flow-nav="1"';
    var href = esc(it.href);
    if (it.exclusive) {
      return '<a href="' + href + '" class="' + cls + '"' + attrs + '>' +
        '<i class="ti ' + esc(it.icon) + '"></i>' +
        '<span class="ifx-topnav-link__stack">' +
          '<span class="ifx-topnav-chip">' + esc(it.chip || 'Độc quyền') + '</span>' +
          '<span class="ifx-topnav-link__label">' + esc(it.label) + '</span>' +
        '</span></a>';
    }
    return '<a href="' + href + '" class="' + cls + '"' + attrs + '>' +
      '<i class="ti ' + esc(it.icon) + '"></i> ' + esc(it.label) + '</a>';
  }

  function findNav() {
    var header = document.querySelector('header.ifx-topnav') || document.querySelector('.ifx-topnav');
    if (!header) return null;
    return header.querySelector('.ifx-topnav-menu');
  }

  /* Chỉ đọc IfluxAppShell.getPrimaryNav() — không chạm Route/Auth. */
  function renderNav() {
    var nav = findNav();
    if (!nav) return;
    var shell = global.IfluxAppShell;
    if (!shell || !shell.getPrimaryNav) return;
    var items = shell.getPrimaryNav();
    var html = items.map(itemHtml).join('');
    if (nav.innerHTML !== html) nav.innerHTML = html;
    nav.setAttribute('data-ifx-guest-nav', '');

    var brand = document.querySelector('.ifx-topnav-brand');
    if (brand) brand.setAttribute('href', shell.hrefFor('community'));

    /* Cho header UI (mobile nav / onboard / active-height) gắn lại vào menu vừa dựng. */
    if (global.IfluxWebUI && IfluxWebUI.syncTopnav) {
      try { IfluxWebUI.syncTopnav(); } catch (e) { /* ignore */ }
    }
  }

  function render() { renderNav(); }

  global.IfluxAppShellHeader = {
    render: render,
    renderNav: renderNav
  };

  function boot() {
    /* Chờ Auth: platform-boot thực thi trước auth.js trong ensureParallel →
       paint sớm sẽ thiếu mục appOnly («Nhà của tôi»). Auth emit iflux-auth-changed. */
    if (!global.IfluxAuth) return;
    if (document.querySelector('.ifx-topnav')) render();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
  /* Cập nhật lại khi trạng thái đăng nhập / gói thay đổi (vd sau login, sau hydrate plans). */
  document.addEventListener('iflux-plans-updated', function () { render(); });
  document.addEventListener('iflux-auth-changed', function () { render(); });
})(window);
