/**
 * iFlux Runtime — Bootstrap (ESM entry)
 * Boot tối thiểu: detect page → App Shell deps → resolve manifest → page-runtime.
 *
 * Nguồn manifest (Phase 4):
 *  - market / home: GET /api/pages/:pageKey (PagePublished) — KHÔNG page-composition, KHÔNG catalog.
 *  - Trang composite: flow, community, … tự fetch PagePublished trong page module.
 *  - home ↔ dashboard: Publish key = dashboard; runtime pageKey = home.
 *  - Nhà: sidebar từ PagePublished; Main = WGT-HOME-DASH (Dashboard Engine).
 */

import { bootPage } from './page-runtime.js?v=phase4Pub20260716b';
import { bootShell } from './shell-boot.js?v=bpPhaseD20260716b';

var VER = '?v=w2Host20260720';
var P4 = '?v=phase4Pub20260716b';

var MANIFEST_MAP = {
  market: function () { return import('../pages/market.manifest.js' + P4); },
  home: function () { return import('../pages/home.manifest.js' + P4); },
  flow: function () { return import('../pages/flow.manifest.js' + VER); },
  community: function () { return import('../pages/community.manifest.js?v=phase3Com20260716'); },
  pricing: function () { return import('../pages/pricing.manifest.js' + VER); },
  stocks: function () { return import('../pages/stocks.manifest.js' + VER); },
  sectors: function () { return import('../pages/sectors.manifest.js' + VER); },
  ecosystems: function () { return import('../pages/ecosystems.manifest.js' + VER); },
  chuDe: function () { return import('../pages/chu-de.manifest.js' + VER); },
  stock: function () { return import('../pages/stock.manifest.js' + VER); },
  sector: function () { return import('../pages/sector.manifest.js' + VER); },
  family: function () { return import('../pages/family.manifest.js' + VER); },
  chuDeDetail: function () { return import('../pages/chu-de-detail.manifest.js' + VER); },
  faq: function () { return import('../pages/faq.manifest.js' + VER); },
  loyalty: function () { return import('../pages/loyalty.manifest.js' + VER); },
  watchlist: function () { return import('../pages/watchlist.manifest.js' + VER); },
  search: function () { return import('../pages/search.manifest.js' + VER); },
  messages: function () { return import('../pages/messages.manifest.js?v=msgMobile20260716'); },
  communityPost: function () { return import('../pages/community-post.manifest.js' + VER); }
};

/** Runtime pageKey → PagePublished key. */
var PUBLISH_KEY_ALIAS = {
  home: 'dashboard'
};

/** Trang slot dùng PagePublished (mount path Phase 4). */
var PAGE_PUBLISHED = {
  market: true,
  home: true
};

function detectPageKey() {
  var path = (location.pathname || '/').toLowerCase();

  if (/\/(co-phieu|stocks?)\/[^/]+/.test(path) || /\/user_web\/stock(\/|$)/.test(path)) return 'stock';
  if (/\/(nganh|sectors?)\/[^/]+/.test(path) || /\/user_web\/sector(\/|$)/.test(path)) return 'sector';
  if (/\/(ho-co-phieu|ecosystems?)\/[^/]+/.test(path) || /\/user_web\/family(\/|$)/.test(path)) return 'family';
  if (/\/(chu-de|stories)\/[^/]+/.test(path) || /\/user_web\/chu-de\/chi-tiet/.test(path)) return 'chuDeDetail';
  if (/\/(cong-dong|community)\/(bai-viet|posts?|story)\b/.test(path) || /\/user_web\/community\/post/.test(path)) {
    return 'communityPost';
  }

  if (path.indexOf('/cong-dong') >= 0 || path.indexOf('/community') >= 0) return 'community';
  if (path.indexOf('/dong-tien') >= 0 || path.indexOf('/flow') >= 0) return 'flow';
  if (path.indexOf('/goi-cuoc') >= 0 || path.indexOf('/pricing') >= 0) return 'pricing';
  if (path.indexOf('/nha-cua-toi') >= 0 || path.indexOf('/home') >= 0) return 'home';
  if (path.indexOf('/thi-truong') >= 0 || path.indexOf('/market') >= 0) return 'market';
  if (path.indexOf('/hoi-dap') >= 0 || path.indexOf('/faq') >= 0) return 'faq';
  if (path.indexOf('/thanh-vien') >= 0 || path.indexOf('/loyalty') >= 0 || path.indexOf('/membership') >= 0) return 'loyalty';
  if (path.indexOf('/theo-doi') >= 0 || path.indexOf('/watchlist') >= 0) return 'watchlist';
  if (path.indexOf('/tim-kiem') >= 0 || path.indexOf('/search') >= 0) return 'search';
  if (path.indexOf('/tin-nhan') >= 0 || path.indexOf('/messages') >= 0) return 'messages';

  if (/\/(co-phieu|stocks)\/?$/.test(path) || /\/user_web\/stocks(\/|$)/.test(path)) return 'stocks';
  if (/\/(nganh|sectors)\/?$/.test(path) || /\/user_web\/sectors(\/|$)/.test(path)) return 'sectors';
  if (/\/(ho-co-phieu|ecosystems)\/?$/.test(path) || /\/user_web\/ecosystems(\/|$)/.test(path)) return 'ecosystems';
  if (/\/(chu-de|stories)\/?$/.test(path) || /\/user_web\/chu-de\/?$/.test(path) || /\/user_web\/chu-de\/index/.test(path)) return 'chuDe';

  if (path === '/' || path === '') return 'market';
  return null;
}

function apiBase() {
  if (window.IfluxApiConfig && window.IfluxApiConfig.getBaseUrl) {
    var b = window.IfluxApiConfig.getBaseUrl();
    if (b) return String(b).replace(/\/$/, '');
  }
  var origin = window.location ? window.location.origin : '';
  if (!origin || origin.indexOf('http') !== 0) return null;
  return origin + '/api';
}

async function loadStaticManifest(pageKey) {
  var loader = MANIFEST_MAP[pageKey];
  if (!loader) return null;
  var mod = await loader();
  return mod.default || mod.manifest || mod;
}

/**
 * PagePublished → thin manifest cho page-runtime.
 * Không fallback page-composition / catalog (một SoT Layout).
 */
async function resolvePagePublishedManifest(pageKey, staticManifest) {
  var base = apiBase();
  if (!base) {
    if (window.console && console.error) {
      console.error('[Runtime] Thiếu API base — không thể lấy PagePublished:', pageKey);
    }
    return null;
  }
  var publishKey = PUBLISH_KEY_ALIAS[pageKey] || pageKey;
  try {
    var res = await fetch(base + '/pages/' + encodeURIComponent(publishKey), {
      credentials: 'omit'
    });
    if (!res || !res.ok) {
      if (window.console && console.error) {
        console.error('[Runtime] PagePublished HTTP', res && res.status, publishKey);
      }
      return null;
    }
    var payload = await res.json();
    var page = payload && payload.data;
    if (!page || !Array.isArray(page.placements)) {
      if (window.console && console.error) {
        console.error('[Runtime] PagePublished thiếu placements:', publishKey);
      }
      return null;
    }

    var sections = (page.sections && page.sections.length)
      ? page.sections
      : (staticManifest && staticManifest.sections) || [];

    var man = {
      pageKey: pageKey,
      publishKey: publishKey,
      published: true,
      pagePayload: payload,
      path: page.path || (staticManifest && staticManifest.path) || '',
      title: page.title != null ? page.title : (staticManifest && staticManifest.title) || '',
      intro: page.intro != null ? page.intro : (staticManifest && staticManifest.intro) || '',
      documentTitle: page.documentTitle || (staticManifest && staticManifest.documentTitle) || '',
      sections: sections,
      widgets: []
    };

    if (pageKey === 'home') {
      /* Sidebar = PagePublished; Main = Dashboard Engine shell — không serialize canvas. */
      man.publishedSections = ['sidebar'];
      man.title = '';
      man.intro = '';
      var dash = (staticManifest.widgets || []).find(function (w) {
        return w && (w.id === 'WGT-HOME-DASH' || w.section === 'main');
      });
      if (dash) man.widgets = [Object.assign({}, dash)];
      /* Đảm bảo sections có sidebar + main từ static nếu Publish chỉ sidebar. */
      if (!sections.some(function (s) { return s && s.key === 'main'; })) {
        man.sections = (staticManifest.sections || []).slice();
      }
    }

    return man;
  } catch (e) {
    if (window.console && console.error) {
      console.error('[Runtime] PagePublished lỗi (không fallback composition):', e);
    }
    return null;
  }
}

async function resolveManifest(pageKey) {
  var staticManifest = await loadStaticManifest(pageKey);
  if (!staticManifest) return null;
  if (staticManifest.composite) return staticManifest;
  if (PAGE_PUBLISHED[pageKey]) {
    return resolvePagePublishedManifest(pageKey, staticManifest);
  }
  /* Trang slot khác (chưa Phase 4): giữ static — không gọi composition từ bootstrap. */
  return staticManifest;
}

export async function start(opts) {
  opts = opts || {};
  var pageKey = opts.pageKey || detectPageKey();
  if (!pageKey) {
    if (window.console && console.warn) console.warn('[Runtime] Không xác định được pageKey');
    return null;
  }

  var shell = await bootShell(pageKey);
  if (shell === null) return null;

  var mountEl = document.querySelector('[data-ifx-page-runtime]');
  if (!mountEl) {
    if (window.console && console.warn) console.warn('[Runtime] Thiếu [data-ifx-page-runtime]');
    return null;
  }

  var manifest = await resolveManifest(pageKey);
  if (!manifest) {
    if (window.console && console.warn) console.warn('[Runtime] Chưa có manifest/PagePublished cho:', pageKey);
    return null;
  }
  return bootPage(manifest, mountEl);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () {
    Promise.resolve(start()).catch(function (err) {
      if (window.console && console.error) console.error('[Runtime] start failed', err);
    });
  });
} else {
  Promise.resolve(start()).catch(function (err) {
    if (window.console && console.error) console.error('[Runtime] start failed', err);
  });
}
