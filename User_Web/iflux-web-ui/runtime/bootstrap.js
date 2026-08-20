/* ===== IFX-AUDIT-BEGIN =====
AUDIT-ID: T5A-IGNORE-001
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
 * iFlux Runtime — Bootstrap (ESM entry)
 * Boot tối thiểu: detect page → App Shell deps → resolve manifest → page-runtime.
 *
 * Nguồn manifest (Phase 4):
 *  - market / home: GET /api/pages/:pageKey (PagePublished) — KHÔNG page-composition, KHÔNG catalog.
 *  - Trang composite: flow, community, … tự fetch PagePublished trong page module.
 *  - home ↔ dashboard: Publish key = dashboard; runtime pageKey = home.
 *  - Nhà: sidebar từ PagePublished; Main = WGT-HOME-DASH (Dashboard Engine).
 */

import { bootPage } from './page-runtime.js?v=stickyRefactor20260811';
import { applyDefinitionToDocument } from './page-definition.js?v=seoFnd20260729';
import { bootShell } from './shell-boot.js?v=softNavP1_20260810';
import { installSoftNavigation } from './soft-navigation.js?v=stickyRefactor20260811';

var VER = '?v=phaseCW5gate20260721';
var P4 = '?v=stickyRefactor20260811';
var B2 = '?v=phaseB220260721a';

var MANIFEST_MAP = {
  market: function () { return import('../pages/market.manifest.js' + P4); },
  home: function () { return import('../pages/home.manifest.js' + P4); },
  flow: function () { return import('../pages/flow.manifest.js?v=sidebarVR01_20260811'); },
  community: function () { return import('../pages/community.manifest.js?v=stickyRefactor20260811'); },
  pricing: function () { return import('../pages/pricing.manifest.js' + VER); },
  stocks: function () { return import('../pages/stocks.manifest.js?v=sidebarVR03_20260811'); },
  sectors: function () { return import('../pages/sectors.manifest.js?v=sidebarVR03_20260811'); },
  ecosystems: function () { return import('../pages/ecosystems.manifest.js?v=sidebarVR03_20260811'); },
  chuDe: function () { return import('../pages/cau-chuyen.manifest.js?v=sidebarVR03_20260811'); },
  cauChuyen: function () { return import('../pages/cau-chuyen.manifest.js?v=sidebarVR03_20260811'); },
  stock: function () { return import('../pages/stock.manifest.js?v=sidebarVR04_20260811'); },
  sector: function () { return import('../pages/sector.manifest.js?v=sidebarVR04_20260811'); },
  family: function () { return import('../pages/family.manifest.js?v=sidebarVR04_20260811'); },
  chuDeDetail: function () { return import('../pages/cau-chuyen-detail.manifest.js?v=sidebarVR04_20260811'); },
  cauChuyenDetail: function () { return import('../pages/cau-chuyen-detail.manifest.js?v=sidebarVR04_20260811'); },
  faq: function () { return import('../pages/faq.manifest.js' + VER); },
  loyalty: function () { return import('../pages/loyalty.manifest.js' + VER); },
  watchlist: function () { return import('../pages/watchlist.manifest.js' + VER); },
  search: function () { return import('../pages/search.manifest.js' + VER); },
  messages: function () { return import('../pages/messages.manifest.js' + VER); },
  communityPost: function () { return import('../pages/community-post.manifest.js?v=scrollWave4early_20260811'); },
  account: function () { return import('../pages/account.manifest.js' + VER); },
  checkout: function () { return import('../pages/checkout.manifest.js' + VER); },
  communityWrite: function () { return import('../pages/community-write.manifest.js' + VER); },
  share: function () { return import('../pages/share.manifest.js' + VER); },
  stockComment: function () { return import('../pages/stock-comment.manifest.js' + VER); },
  comments: function () { return import('../pages/comments.manifest.js?v=ixShellSlim20260724'); }
};

/** Runtime pageKey → PagePublished key. */
var PUBLISH_KEY_ALIAS = {
  home: 'dashboard'
};

/** Runtime pageKey → Site SEO page_key (catalog). */
var SEO_KEY_ALIAS = {
  home: 'dashboard',
  cauChuyen: 'cau-chuyen',
  chuDe: 'cau-chuyen',
  cauChuyenDetail: 'cau-chuyen-detail',
  chuDeDetail: 'cau-chuyen-detail',
  stock: 'stock-detail',
  sector: 'sector-detail',
  family: 'eco-detail',
  loyalty: 'membership',
  comAuthor: 'com-author',
  comCat: 'com-cat'
};

/** Path-specific SEO catalog key (author/category detail under community runtime). */
function seoCatalogKey(pageKey) {
  var path = '';
  try {
    path = String((window.IfluxNormalizePath && IfluxNormalizePath(location.pathname)) || location.pathname || '').toLowerCase();
  } catch (e) {
    path = String(location.pathname || '').toLowerCase();
  }
  if (/\/(?:tin-tuc|cong-dong)\/tac-gia\/[^/]+/.test(path)) return 'com-author';
  if (/\/(?:tin-tuc|cong-dong)\/danh-muc\/[^/]+/.test(path)) return 'com-cat';
  return SEO_KEY_ALIAS[pageKey] || PUBLISH_KEY_ALIAS[pageKey] || pageKey;
}

/** Trang slot dùng PagePublished (mount path Phase 4). */
var PAGE_PUBLISHED = {
  market: true,
  home: true
};

function detectPageKey() {
  var raw = location.pathname || '/';
  var path = raw;
  if (window.IfluxNormalizePath) {
    path = window.IfluxNormalizePath(raw);
  }
  path = String(path || '/').toLowerCase();

  /* Path cụ thể TRƯỚC nhánh rộng — học Phase A (viet-bai) + Ownership Proof (comment/checkout). */
  if (/\/binh-luan(\/|$)/.test(path) || /\/user_web\/comments(\/|$)/.test(path) || /\/comments\/index\.html/.test(path)) {
    return 'comments';
  }
  if (/\/user_web\/stock\/comment/.test(path) || /\/stock\/comment\.html/.test(path)) {
    return 'stockComment';
  }
  if (path.indexOf('/thanh-toan') >= 0 || /\/user_web\/account\/checkout/.test(path) || /\/account\/checkout/.test(path)) {
    return 'checkout';
  }
  /* Viết bài — TRƯỚC nhánh rộng /cong-dong (tránh nhận nhầm pageKey=community → mất AuthGate). */
  if (/\/(?:tin-tuc|cong-dong)\/(viet|write)/.test(path) || /\/user_web\/community\/write/.test(path) || /\/community\/write/.test(path)) {
    return 'communityWrite';
  }
  if (/\/(tin-tuc|cong-dong|community)\/(bai-viet|posts?|story)\b/.test(path) || /\/user_web\/community\/post/.test(path)) {
    return 'communityPost';
  }
  /* Collection Cộng đồng: chủ đề / tác giả / danh mục — cùng runtime community (filter theo path) */
  if (/\/(?:tin-tuc|cong-dong)\/(chu-de|tac-gia|danh-muc)(\/|$)/.test(path)) return 'community';

  if (/\/(co-phieu|stocks?)\/[^/]+/.test(path) || /\/user_web\/stock(\/|$)/.test(path)) return 'stock';
  if (/\/(nganh|sectors?)\/[^/]+/.test(path) || /\/user_web\/sector(\/|$)/.test(path)) return 'sector';
  if (/\/(he-sinh-thai|ho-co-phieu|ecosystems?)\/[^/]+/.test(path) || /\/user_web\/family(\/|$)/.test(path)) return 'family';
  if (/\/(cau-chuyen|chu-de|stories)\/[^/]+/.test(path) || /\/user_web\/(cau-chuyen|chu-de)\/chi-tiet/.test(path)) return 'cauChuyenDetail';

  if (path.indexOf('/tin-tuc') >= 0 || path.indexOf('/cong-dong') >= 0 || path.indexOf('/community') >= 0) return 'community';
  if (path.indexOf('/dong-tien') >= 0 || path.indexOf('/flow') >= 0) return 'flow';
  if (path.indexOf('/goi-cuoc') >= 0 || path.indexOf('/pricing') >= 0) return 'pricing';
  if (path.indexOf('/trang-chu') >= 0 || path.indexOf('/nha-cua-toi') >= 0 || path.indexOf('/home') >= 0) return 'home';
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

  if (path === '/' || path === '') return 'home';
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

async function resolveManifest(pageKey, opts) {
  opts = opts || {};
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
  if (manifest) {
    manifest = await enrichManifestWithSiteSeo(manifest, pageKey, opts.seo || null);
  }
  return manifest;
}

/**
 * PL-07: consume public effective SEO. Hardcode title/favicon chỉ còn khi API trống (fallback tạm).
 * Logo rebind mọi lần nav (hard + soft) — Owner-approved 20260811: logo phải fresh
 * trong 1 session dài nếu Admin đổi logo_url; logo_url là GLOBAL nên rebind không gây churn theo trang.
 */
async function enrichManifestWithSiteSeo(manifest, pageKey, seoOpts) {
  seoOpts = seoOpts || {};
  var bindLogo = seoOpts.bindLogo !== false;
  var base = apiBase();
  if (!base || !manifest) return manifest;
  var seoKey = seoCatalogKey(pageKey);
  try {
    var res = await fetch(base + '/seo/effective?pageKey=' + encodeURIComponent(seoKey), {
      credentials: 'omit'
    });
    if (!res || !res.ok) return manifest;
    var payload = await res.json();
    var data = payload && payload.data ? payload.data : payload;
    var eff = (data && data.effective) || {};
    var siteName = String(eff.site_name || '').trim() || 'iFlux';
    var title = String(eff.title || '').trim();
    var description = String(eff.description || '').trim();
    var titleTemplate = String(eff.title_template || '').trim();
    var descriptionTemplate = String(eff.description_template || '').trim();
    /* Unresolved placeholder must never become document.title */
    if (/\{[^}]+\}/.test(title)) title = '';
    if (/\{[^}]+\}/.test(description)) description = '';
    var ogImage = String(eff.og_image || '').trim();
    var socialImage = String(eff.social_image || '').trim() || ogImage;
    var favicon = String(eff.favicon_url || '').trim();
    var logoUrl = String(eff.logo_url || '').trim();

    var documentTitle = manifest.documentTitle || '';
    if (title) {
      documentTitle = title;
    }

    var seo = Object.assign({}, manifest.seo || {});
    if (description) seo.description = description;
    if (title) {
      seo['og:title'] = title;
      seo['twitter:title'] = title;
    }
    if (description) {
      seo['og:description'] = description;
      seo['twitter:description'] = description;
    }
    if (ogImage) {
      seo['og:image'] = ogImage;
      seo['twitter:card'] = 'summary_large_image';
    }
    if (socialImage) seo['twitter:image'] = socialImage;
    if (siteName) seo['og:site_name'] = siteName;
    if (favicon) seo.favicon = favicon;

    /* Clean Public URL cho canonical + og:url (BR-45.5, L5-TC-12) — để human-DOM khớp bot-pipeline.
     * Ưu tiên eff.canonical_path (server trả, dùng chung PAGE_KEY_TO_PATH với bot pipeline — đúng cả
     * alias route như "/" → "/cong-dong"); fallback IfluxNormalizePath(location) cho path không có
     * trong bảng tĩnh. Không override nếu page entity/article đã tự set seo.canonical riêng. */
    if (!seo.canonical && window.location) {
      var canonicalPath = String(eff.canonical_path || '').trim();
      if (!canonicalPath && window.IfluxNormalizePath) {
        canonicalPath = window.IfluxNormalizePath(window.location.pathname);
      }
      if (canonicalPath) {
        var cleanUrl = window.location.origin + canonicalPath;
        seo.canonical = cleanUrl;
        seo['og:url'] = cleanUrl;
      }
    }

    /* Keep templates for entity-ready resolve (IfluxSeoTitle). */
    eff = Object.assign({}, eff, {
      title_template: titleTemplate || null,
      description_template: descriptionTemplate || null
    });

    manifest = Object.assign({}, manifest, {
      documentTitle: documentTitle || manifest.documentTitle,
      seo: seo,
      siteSeo: eff,
      seoPageKey: seoKey
    });

    /* Header logo — sole owner = Foundation /seo/effective logo_url. No text brand.
     * Rebind mọi lần nav (hard + soft) — xem comment enrichManifestWithSiteSeo. */
    if (bindLogo) {
      var logoEl =
        document.querySelector('.ifx-topnav-brand [data-ifx-seo-logo]') ||
        document.querySelector('.ifx-topnav-brand img.ix-brand-logo');
      if (logoEl) {
        if (logoUrl) {
          logoEl.setAttribute('src', logoUrl);
          logoEl.removeAttribute('hidden');
        } else {
          logoEl.removeAttribute('src');
          logoEl.setAttribute('hidden', '');
        }
      }
    }
  } catch (e) {
    /* fallback tạm — giữ manifest hardcode */
  }
  return manifest;
}

export async function start(opts) {
  opts = opts || {};
  var soft = !!opts.soft;
  var pageKey = opts.pageKey || detectPageKey();
  if (!pageKey) {
    if (window.console && console.warn) console.warn('[Runtime] Không xác định được pageKey');
    return null;
  }

  /* Phase B2: title entity sớm (nếu classic script chưa chạy — vd soft nav). */
  if (window.IfluxEntityDefinition && IfluxEntityDefinition.applyEarlyDocumentTitle) {
    IfluxEntityDefinition.applyEarlyDocumentTitle();
  }

  var shell = await bootShell(pageKey, { soft: soft });
  if (shell === null) return null;

  var manifest = await resolveManifest(pageKey);
  if (!manifest) {
    if (window.console && console.warn) console.warn('[Runtime] Chưa có manifest/PagePublished cho:', pageKey);
    return null;
  }

  /* Shell-only pages (Feature tự boot sau) — dùng Definition nhưng không mount page-runtime. */
  var SHELL_ONLY = { account: 1, checkout: 1, communityWrite: 1, share: 1, stockComment: 1, comments: 1 };
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

  var page = await bootPage(manifest, mountEl);
  window.__ifxPageRuntime = {
    pageKey: pageKey,
    widgets: (page && page.widgets) || []
  };
  return page;
}

installSoftNavigation({
  startSoft: function (softOpts) {
    return start(Object.assign({}, softOpts || {}, { soft: true }));
  }
});

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
