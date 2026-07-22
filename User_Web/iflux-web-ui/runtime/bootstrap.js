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

import { bootPage } from './page-runtime.js?v=phaseB220260721a';
import { applyDefinitionToDocument } from './page-definition.js?v=phaseB220260721a';
import { bootShell } from './shell-boot.js?v=phaseCW5gate20260721';

var VER = '?v=phaseCW5gate20260721';
var P4 = '?v=phaseCW5gate20260721';
var B2 = '?v=phaseB220260721a';

var MANIFEST_MAP = {
  market: function () { return import('../pages/market.manifest.js' + P4); },
  home: function () { return import('../pages/home.manifest.js' + P4); },
  flow: function () { return import('../pages/flow.manifest.js' + VER); },
  community: function () { return import('../pages/community.manifest.js' + VER); },
  pricing: function () { return import('../pages/pricing.manifest.js' + VER); },
  stocks: function () { return import('../pages/stocks.manifest.js' + VER); },
  sectors: function () { return import('../pages/sectors.manifest.js' + VER); },
  ecosystems: function () { return import('../pages/ecosystems.manifest.js' + VER); },
  chuDe: function () { return import('../pages/cau-chuyen.manifest.js' + VER); },
  cauChuyen: function () { return import('../pages/cau-chuyen.manifest.js' + VER); },
  stock: function () { return import('../pages/stock.manifest.js' + VER); },
  sector: function () { return import('../pages/sector.manifest.js' + VER); },
  family: function () { return import('../pages/family.manifest.js' + VER); },
  chuDeDetail: function () { return import('../pages/cau-chuyen-detail.manifest.js' + VER); },
  cauChuyenDetail: function () { return import('../pages/cau-chuyen-detail.manifest.js' + VER); },
  faq: function () { return import('../pages/faq.manifest.js' + VER); },
  loyalty: function () { return import('../pages/loyalty.manifest.js' + VER); },
  watchlist: function () { return import('../pages/watchlist.manifest.js' + VER); },
  search: function () { return import('../pages/search.manifest.js' + VER); },
  messages: function () { return import('../pages/messages.manifest.js' + VER); },
  communityPost: function () { return import('../pages/community-post.manifest.js' + VER); },
  account: function () { return import('../pages/account.manifest.js' + VER); },
  checkout: function () { return import('../pages/checkout.manifest.js' + VER); },
  communityWrite: function () { return import('../pages/community-write.manifest.js' + VER); },
  share: function () { return import('../pages/share.manifest.js' + VER); },
  stockComment: function () { return import('../pages/stock-comment.manifest.js' + VER); }
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

  /* Path cụ thể TRƯỚC nhánh rộng — học Phase A (viet-bai) + Ownership Proof (comment/checkout). */
  if (/\/user_web\/stock\/comment/.test(path) || /\/stock\/comment\.html/.test(path)) {
    return 'stockComment';
  }
  if (path.indexOf('/thanh-toan') >= 0 || /\/user_web\/account\/checkout/.test(path) || /\/account\/checkout/.test(path)) {
    return 'checkout';
  }
  /* Viết bài — TRƯỚC nhánh rộng /cong-dong (tránh nhận nhầm pageKey=community → mất AuthGate). */
  if (/\/cong-dong\/(viet|write)/.test(path) || /\/user_web\/community\/write/.test(path) || /\/community\/write/.test(path)) {
    return 'communityWrite';
  }
  if (/\/(cong-dong|community)\/(bai-viet|posts?|story)\b/.test(path) || /\/user_web\/community\/post/.test(path)) {
    return 'communityPost';
  }
  /* Collection Cộng đồng: chủ đề / tác giả / danh mục — cùng runtime community (filter theo path) */
  if (/\/cong-dong\/(chu-de|tac-gia|danh-muc)(\/|$)/.test(path)) return 'community';

  if (/\/(co-phieu|stocks?)\/[^/]+/.test(path) || /\/user_web\/stock(\/|$)/.test(path)) return 'stock';
  if (/\/(nganh|sectors?)\/[^/]+/.test(path) || /\/user_web\/sector(\/|$)/.test(path)) return 'sector';
  if (/\/(he-sinh-thai|ho-co-phieu|ecosystems?)\/[^/]+/.test(path) || /\/user_web\/family(\/|$)/.test(path)) return 'family';
  if (/\/(cau-chuyen|chu-de|stories)\/[^/]+/.test(path) || /\/user_web\/(cau-chuyen|chu-de)\/chi-tiet/.test(path)) return 'cauChuyenDetail';

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
  if (path.indexOf('/chia-se') >= 0 || path.indexOf('/share') >= 0 || /\/user_web\/share/.test(path)) {
    return 'share';
  }
  if (path.indexOf('/tai-khoan') >= 0 || path.indexOf('/account') >= 0 || /\/user_web\/account\/profile/.test(path)) {
    return 'account';
  }

  if (/\/(co-phieu|stocks)\/?$/.test(path) || /\/user_web\/stocks(\/|$)/.test(path)) return 'stocks';
  if (/\/(nganh|sectors)\/?$/.test(path) || /\/user_web\/sectors(\/|$)/.test(path)) return 'sectors';
  if (/\/(he-sinh-thai|ho-co-phieu|ecosystems)\/?$/.test(path) || /\/user_web\/ecosystems(\/|$)/.test(path)) return 'ecosystems';
  if (/\/(cau-chuyen|chu-de|stories)\/?$/.test(path) || /\/user_web\/(cau-chuyen|chu-de)\/?$/.test(path) || /\/user_web\/(cau-chuyen|chu-de)\/index/.test(path)) return 'cauChuyen';

  if (path === '/' || path === '') return 'community';
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
      /* Sidebar Placement (PagePublished) + Gói cước đặc thù (PRF-002) từ static.
         PRF-001 (Hồ sơ) không đặc thù — không inject. Main = Dashboard shell. */
      man.publishedSections = ['sidebar'];
      man.title = '';
      man.intro = '';
      man.widgets = (staticManifest.widgets || []).filter(function (w) {
        if (!w || w.enabled === false) return false;
        if (w.id === 'WGT-PRF-001') return false;
        return w.id === 'WGT-HOME-DASH' || w.id === 'WGT-PRF-002' || w.section === 'main';
      }).map(function (w) { return Object.assign({}, w); });
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
  var manifest = staticManifest;
  if (!staticManifest.composite && PAGE_PUBLISHED[pageKey]) {
    manifest = await resolvePagePublishedManifest(pageKey, staticManifest);
  }
  /* Phase B2: enrich entity (symbol → documentTitle) trước apply / mount. */
  if (manifest && window.IfluxEntityDefinition && IfluxEntityDefinition.enrichDefinitionWithEntity) {
    manifest = IfluxEntityDefinition.enrichDefinitionWithEntity(manifest, pageKey);
  }
  return manifest;
}

export async function start(opts) {
  opts = opts || {};
  var pageKey = opts.pageKey || detectPageKey();
  if (!pageKey) {
    if (window.console && console.warn) console.warn('[Runtime] Không xác định được pageKey');
    return null;
  }

  /* Phase B2: title entity sớm (nếu classic script chưa chạy — vd soft nav). */
  if (window.IfluxEntityDefinition && IfluxEntityDefinition.applyEarlyDocumentTitle) {
    IfluxEntityDefinition.applyEarlyDocumentTitle();
  }

  var shell = await bootShell(pageKey);
  if (shell === null) return null;

  var manifest = await resolveManifest(pageKey);
  if (!manifest) {
    if (window.console && console.warn) console.warn('[Runtime] Chưa có manifest/PagePublished cho:', pageKey);
    return null;
  }

  /* Shell-only pages (Feature tự boot sau) — dùng Definition nhưng không mount page-runtime. */
  var SHELL_ONLY = { account: 1, checkout: 1, communityWrite: 1, share: 1, stockComment: 1 };
  if (SHELL_ONLY[pageKey]) {
    applyDefinitionToDocument(manifest);
    window.__IFLUX_SHELL_READY = pageKey;
    window.dispatchEvent(new CustomEvent('iflux-shell-ready', { detail: { pageKey: pageKey } }));
    return { shell: shell, manifest: manifest };
  }

  var mountEl = document.querySelector('[data-ifx-page-runtime]');
  if (!mountEl) {
    if (window.console && console.warn) console.warn('[Runtime] Thiếu [data-ifx-page-runtime]');
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
