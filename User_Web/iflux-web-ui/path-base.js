/* Gắn <base href> đúng thư mục vật lý khi dùng clean URL tiếng Việt */
(function (global) {
  'use strict';

  if (typeof document === 'undefined') return;
  if (document.querySelector('base[data-ifx-path-base]')) return;

  function normalizePath(p) {
    p = String(p || '/').split('?')[0].split('#')[0];
    if (p.length > 1 && p.charAt(p.length - 1) === '/') p = p.slice(0, -1);
    return p || '/';
  }

  function origin() {
    return global.location && global.location.origin && global.location.origin !== 'null'
      ? global.location.origin
      : '';
  }

  function loadSlugsSyncHint() {
    /* path-base inject trước các script khác — nhúng fallback map nếu chưa có IfluxPublicSlugs */
    return global.IfluxPublicSlugs || null;
  }

  var EXACT = {
    '/': '/User_Web/market/',
    '/thi-truong': '/User_Web/market/',
    '/market': '/User_Web/market/',
    '/guest': '/User_Web/market/',
    '/nha-cua-toi': '/User_Web/home/',
    '/home': '/User_Web/home/',
    '/dong-tien': '/User_Web/flow/',
    '/flow': '/User_Web/flow/',
    '/co-phieu': '/User_Web/stocks/',
    '/stocks': '/User_Web/stocks/',
    '/nganh': '/User_Web/sectors/',
    '/sectors': '/User_Web/sectors/',
    '/he-sinh-thai': '/User_Web/ecosystems/',
    '/ho-co-phieu': '/User_Web/ecosystems/',
    '/ecosystems': '/User_Web/ecosystems/',
    '/chu-de': '/User_Web/chu-de/',
    '/cong-dong': '/User_Web/community/',
    '/community': '/User_Web/community/',
    '/cong-dong/viet-bai': '/User_Web/community/',
    '/community/write': '/User_Web/community/',
    '/goi-cuoc': '/User_Web/pricing/',
    '/pricing': '/User_Web/pricing/',
    '/hoi-dap': '/User_Web/faq/',
    '/faq': '/User_Web/faq/',
    '/thanh-vien': '/User_Web/loyalty/',
    '/membership': '/User_Web/loyalty/',
    '/loyalty': '/User_Web/loyalty/',
    '/theo-doi': '/User_Web/watchlist/',
    '/watchlist': '/User_Web/watchlist/',
    '/tim-kiem': '/User_Web/search/',
    '/search': '/User_Web/search/',
    '/canh-bao': '/User_Web/alerts/',
    '/alerts': '/User_Web/alerts/',
    '/chia-se': '/User_Web/share/',
    '/share': '/User_Web/share/',
    '/tai-khoan': '/User_Web/account/',
    '/account': '/User_Web/account/',
    '/tin-nhan': '/User_Web/messages/',
    '/messages': '/User_Web/messages/',
    '/dang-nhap': '/User_Web/auth/',
    '/dang-ky': '/User_Web/auth/',
    '/quen-mat-khau': '/User_Web/auth/',
    '/xac-minh-otp': '/User_Web/auth/',
    '/auth/login': '/User_Web/auth/',
    '/auth/register': '/User_Web/auth/',
    '/auth/forgot': '/User_Web/auth/',
    '/auth/verify-otp': '/User_Web/auth/'
  };

  var ADMIN_DIR = {
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
    'yeu-cau': 'requests'
  };

  function adminDir(seg) {
    var s = String(seg || '').toLowerCase();
    return ADMIN_DIR[s] || s;
  }

  function detectPhysicalBase(path) {
    path = normalizePath(path);
    loadSlugsSyncHint();

    var uw = path.match(/^(\/User_Web\/(?:[^/]+\/)+)/);
    if (uw) return uw[1];

    if (/^\/Admin_Design_system\//.test(path)) {
      var rest = path.slice('/Admin_Design_system/'.length);
      if (!rest || rest.indexOf('/') < 0) return '/Admin_Design_system/';
      return '/Admin_Design_system/' + rest.replace(/\/[^/]+$/, '/');
    }

    if (path === '/admin' || path === '/admin/tong-quan' || path === '/admin/tong-quan') {
      return '/Admin_Design_system/app/dashboard/';
    }
    if (path === '/admin/dang-nhap' || path === '/admin/dang-nhap') {
      return '/Admin_Design_system/auth/';
    }
    var adm2 = path.match(/^\/admin\/([^/]+)\/([^/]+)$/);
    if (adm2) return '/Admin_Design_system/app/' + adminDir(adm2[1]) + '/';
    var adm1 = path.match(/^\/admin\/([^/]+)$/);
    if (adm1) {
      if (adm1[1] === 'dang-nhap' || adm1[1] === 'login') return '/Admin_Design_system/auth/';
      return '/Admin_Design_system/app/' + adminDir(adm1[1]) + '/';
    }

    if (EXACT[path]) return EXACT[path];

    if (/^\/tai-khoan\//i.test(path) || /^\/account\//i.test(path)) return '/User_Web/account/';
    if (/^\/tin-nhan/i.test(path) || /^\/messages/i.test(path)) return '/User_Web/messages/';

    if (/^\/co-phieu\//i.test(path) || /^\/stocks\//i.test(path)) return '/User_Web/stock/';
    if (/^\/nganh\//i.test(path) || /^\/sectors\//i.test(path)) return '/User_Web/sector/';
    if (/^\/he-sinh-thai\//i.test(path) || /^\/ho-co-phieu\//i.test(path) || /^\/ecosystems\//i.test(path)) return '/User_Web/family/';
    if (/^\/chu-de\//i.test(path) || /^\/stories\//i.test(path)) return '/User_Web/chu-de/';
    if (/^\/cong-dong\/bai-viet\//i.test(path) || /^\/community\/posts\//i.test(path)) return '/User_Web/community/';
    if (/^\/cong-dong\//i.test(path) || /^\/community\//i.test(path)) return '/User_Web/community/';

    return null;
  }

  function installBase(href) {
    if (!href) return;
    var b = document.createElement('base');
    b.setAttribute('data-ifx-path-base', '1');
    b.href = origin() + href;
    var head = document.head || document.getElementsByTagName('head')[0];
    if (head) head.insertBefore(b, head.firstChild);
  }

  var path = normalizePath(global.location && global.location.pathname);
  var phys = detectPhysicalBase(path);
  if (phys) installBase(phys);
})(window);
