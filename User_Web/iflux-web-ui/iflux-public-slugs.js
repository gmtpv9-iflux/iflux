/**
 * SoT slug URL công khai — tiếng Việt (không dấu).
 * Path English chỉ còn alias 301 / nhận diện legacy.
 */
(function (global) {
  'use strict';

  /** public canonical → thư mục vật lý User_Web */
  var USER_PUBLIC = {
    '/': '/User_Web/market/',
    '/thi-truong': '/User_Web/market/',
    '/nha-cua-toi': '/User_Web/home/',
    '/dong-tien': '/User_Web/flow/',
    '/co-phieu': '/User_Web/stocks/',
    '/nganh': '/User_Web/sectors/',
    '/he-sinh-thai': '/User_Web/ecosystems/',
    '/ho-co-phieu': '/User_Web/ecosystems/',
    '/chu-de': '/User_Web/chu-de/',
    '/cong-dong': '/User_Web/community/',
    '/cong-dong/viet-bai': '/User_Web/community/',
    '/goi-cuoc': '/User_Web/pricing/',
    '/hoi-dap': '/User_Web/faq/',
    '/thanh-vien': '/User_Web/loyalty/',
    '/theo-doi': '/User_Web/watchlist/',
    '/tim-kiem': '/User_Web/search/',
    '/canh-bao': '/User_Web/alerts/',
    '/chia-se': '/User_Web/share/',
    '/tai-khoan': '/User_Web/account/',
    '/tin-nhan': '/User_Web/messages/',
    '/dang-nhap': '/User_Web/auth/',
    '/dang-ky': '/User_Web/auth/',
    '/quen-mat-khau': '/User_Web/auth/',
    '/xac-minh-otp': '/User_Web/auth/'
  };

  /** English / alias cũ → canonical tiếng Việt */
  var USER_LEGACY_TO_CANON = {
    '/guest': '/',
    '/market': '/thi-truong',
    '/home': '/nha-cua-toi',
    '/flow': '/dong-tien',
    '/stocks': '/co-phieu',
    '/sectors': '/nganh',
    '/ecosystems': '/he-sinh-thai',
    '/ho-co-phieu': '/he-sinh-thai',
    '/stories': '/chu-de',
    '/community': '/cong-dong',
    '/community/write': '/cong-dong/viet-bai',
    '/pricing': '/goi-cuoc',
    '/faq': '/hoi-dap',
    '/membership': '/thanh-vien',
    '/loyalty': '/thanh-vien',
    '/watchlist': '/theo-doi',
    '/search': '/tim-kiem',
    '/alerts': '/canh-bao',
    '/share': '/chia-se',
    '/account': '/tai-khoan',
    '/messages': '/tin-nhan',
    '/auth/login': '/dang-nhap',
    '/auth/register': '/dang-ky',
    '/auth/forgot': '/quen-mat-khau',
    '/auth/verify-otp': '/xac-minh-otp'
  };

  /** Entity detail prefix: public VI → physical */
  var USER_ENTITY_PREFIX = [
    { re: /^\/co-phieu\//i, base: '/User_Web/stock/', legacyRe: /^\/stocks\//i },
    { re: /^\/nganh\//i, base: '/User_Web/sector/', legacyRe: /^\/sectors\//i },
    { re: /^\/he-sinh-thai\//i, base: '/User_Web/family/', legacyRe: /^\/(?:ho-co-phieu|ecosystems)\//i },
    { re: /^\/chu-de\//i, base: '/User_Web/chu-de/', legacyRe: /^\/stories\//i },
    { re: /^\/cong-dong\/bai-viet\//i, base: '/User_Web/community/', legacyRe: /^\/community\/posts\//i }
  ];

  /** Admin: slug module VI → thư mục app/ */
  var ADMIN_MOD = {
    'tong-quan': 'dashboard',
    'dang-nhap': 'login',
    'khach-hang': 'users',
    'quyen-han': 'access',
    'thi-truong': 'market',
    'van-hanh-du-lieu': 'market-ops',
    'du-lieu': 'data',
    'goi-cuoc': 'subscription',
    'thong-bao': 'notifications',
    'tham-so': 'metadata',
    'tiep-thi': 'marketing',
    'he-thong': 'system',
    'cong-dong': 'community',
    'chu-de': 'chu-de',
    'trung-tam-ai': 'ai',
    'phan-tich': 'analytics',
    'yeu-cau': 'requests',
    dashboard: 'dashboard',
    login: 'login',
    users: 'users',
    access: 'access',
    market: 'market',
    'market-ops': 'market-ops',
    data: 'data',
    subscription: 'subscription',
    notifications: 'notifications',
    metadata: 'metadata',
    marketing: 'marketing',
    system: 'system',
    community: 'community',
    story: 'chu-de',
    ai: 'ai',
    analytics: 'analytics',
    requests: 'requests'
  };

  var ADMIN_MOD_TO_VI = {
    dashboard: 'tong-quan',
    users: 'khach-hang',
    access: 'quyen-han',
    market: 'thi-truong',
    'market-ops': 'van-hanh-du-lieu',
    data: 'du-lieu',
    subscription: 'goi-cuoc',
    notifications: 'thong-bao',
    metadata: 'tham-so',
    marketing: 'tiep-thi',
    system: 'he-thong',
    community: 'cong-dong',
    chuDe: 'chu-de',
    'chu-de': 'chu-de',
    story: 'chu-de',
    ai: 'trung-tam-ai',
    analytics: 'phan-tich',
    requests: 'yeu-cau'
  };

  function normalizePath(p) {
    p = String(p || '/').split('?')[0].split('#')[0];
    if (p.length > 1 && p.charAt(p.length - 1) === '/') p = p.slice(0, -1);
    return p || '/';
  }

  function userCanon(path) {
    path = normalizePath(path);
    if (USER_LEGACY_TO_CANON[path]) return USER_LEGACY_TO_CANON[path];
    /* entity legacy */
    var m;
    m = path.match(/^\/stocks\/([^/]+)$/i);
    if (m) return '/co-phieu/' + m[1];
    m = path.match(/^\/sectors\/([^/]+)$/i);
    if (m) return '/nganh/' + m[1];
    m = path.match(/^\/ecosystems\/([^/]+)$/i);
    if (m) return '/he-sinh-thai/' + m[1];
    m = path.match(/^\/ho-co-phieu\/([^/]+)$/i);
    if (m) return '/he-sinh-thai/' + m[1];
    m = path.match(/^\/stories\/([^/]+)$/i);
    if (m) return '/chu-de/' + m[1];
    m = path.match(/^\/community\/posts\/([^/]+)$/i);
    if (m) return '/cong-dong/bai-viet/' + m[1];
    m = path.match(/^\/account\/(.+)$/i);
    if (m) return '/tai-khoan/' + m[1];
    m = path.match(/^\/messages\/(.+)$/i);
    if (m) return '/tin-nhan/' + m[1];
    return path;
  }

  function adminModDir(seg) {
    return ADMIN_MOD[String(seg || '').toLowerCase()] || String(seg || '');
  }

  function adminModPublic(enOrVi) {
    var s = String(enOrVi || '').toLowerCase();
    if (ADMIN_MOD_TO_VI[s]) return ADMIN_MOD_TO_VI[s];
    if (ADMIN_MOD[s] && ADMIN_MOD_TO_VI[ADMIN_MOD[s]]) return ADMIN_MOD_TO_VI[ADMIN_MOD[s]];
    return s;
  }

  global.IfluxPublicSlugs = {
    USER_PUBLIC: USER_PUBLIC,
    USER_LEGACY_TO_CANON: USER_LEGACY_TO_CANON,
    USER_ENTITY_PREFIX: USER_ENTITY_PREFIX,
    ADMIN_MOD: ADMIN_MOD,
    ADMIN_MOD_TO_VI: ADMIN_MOD_TO_VI,
    normalizePath: normalizePath,
    userCanon: userCanon,
    adminModDir: adminModDir,
    adminModPublic: adminModPublic
  };
})(window);
