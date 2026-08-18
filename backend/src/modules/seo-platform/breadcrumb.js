'use strict';

/**
 * SOL-BC — one breadcrumb hierarchy for Visible UI + BreadcrumbList JSON-LD.
 * Source: route / entity identity (SoT §15 · Solution §23). Clean Public URLs only.
 */

var PUBLIC_ORIGIN = 'https://iflux.vn';

/** Clean Homepage identity (D-SEO-12) — not a second `/` SEO identity. */
var HOME = { name: 'Trang chủ', path: '/cong-dong' };

var HUB = {
  market: { name: 'Thị trường', path: '/thi-truong' },
  community: { name: 'Cộng đồng', path: '/cong-dong' },
  flow: { name: 'Dòng tiền', path: '/dong-tien' },
  membership: { name: 'Thành viên', path: '/thanh-vien' },
  faq: { name: 'Hỏi đáp', path: '/hoi-dap' },
  pricing: { name: 'Gói cước', path: '/goi-cuoc' },
  stocks: { name: 'Cổ phiếu', path: '/co-phieu' },
  sectors: { name: 'Ngành', path: '/nganh' },
  ecosystems: { name: 'Hệ sinh thái', path: '/he-sinh-thai' },
  'cau-chuyen': { name: 'Câu chuyện', path: '/cau-chuyen' }
};

function absUrl(origin, path) {
  var base = String(origin || PUBLIC_ORIGIN).replace(/\/$/, '');
  var p = path || '/';
  if (p.charAt(0) !== '/') p = '/' + p;
  return base + p;
}

function crumb(name, path, origin) {
  return {
    name: String(name || '').trim(),
    path: path,
    url: absUrl(origin, path)
  };
}

function pushUnique(items, item) {
  if (!item || !item.name) return;
  var last = items.length ? items[items.length - 1] : null;
  if (last && last.path === item.path) return;
  items.push(item);
}

/**
 * @param {object} input
 * @param {string} [input.pageKey]
 * @param {string} [input.entityType]
 * @param {string} [input.path] — clean path
 * @param {string} [input.title] — leaf label
 * @param {object} [input.hints] — ticker|stockName|sectorName|ecoName|storyName|authorName|categoryName|topicName
 * @param {string} [input.origin]
 * @returns {{ items: Array<{name,path,url}>, jsonLd: object|null }}
 */
function resolveBreadcrumb(input) {
  input = input || {};
  var origin = input.origin || PUBLIC_ORIGIN;
  var pageKey = String(input.pageKey || '').trim();
  var entityType = String(input.entityType || '').trim();
  var path = String(input.path || '').trim() || HOME.path;
  if (path === '/' || path === '') path = HOME.path;
  var title = String(input.title || '').trim();
  var hints = input.hints && typeof input.hints === 'object' ? input.hints : {};
  var items = [];

  pushUnique(items, crumb(HOME.name, HOME.path, origin));

  function addHub(key) {
    var h = HUB[key];
    if (h) pushUnique(items, crumb(h.name, h.path, origin));
  }

  if (entityType === 'article' || /^\/cong-dong\/bai-viet\//i.test(path)) {
    /* Homepage Clean = /cong-dong — không nhân đôi Trang chủ + Cộng đồng cùng URL */
    pushUnique(items, crumb(title || 'Bài viết', path, origin));
  } else if (pageKey === 'stock-detail' || /^\/co-phieu\/[^/]+/i.test(path)) {
    addHub('market');
    addHub('stocks');
    pushUnique(
      items,
      crumb(hints.ticker || hints.stockName || title || path.split('/').pop(), path, origin)
    );
  } else if (pageKey === 'sector-detail' || /^\/nganh\/[^/]+/i.test(path)) {
    addHub('market');
    addHub('sectors');
    pushUnique(items, crumb(hints.sectorName || title || path.split('/').pop(), path, origin));
  } else if (pageKey === 'eco-detail' || /^\/he-sinh-thai\/[^/]+/i.test(path)) {
    addHub('market');
    addHub('ecosystems');
    pushUnique(items, crumb(hints.ecoName || title || path.split('/').pop(), path, origin));
  } else if (pageKey === 'cau-chuyen-detail' || /^\/cau-chuyen\/[^/]+/i.test(path) || /^\/chu-de\/[^/]+/i.test(path)) {
    addHub('cau-chuyen');
    pushUnique(items, crumb(hints.storyName || title || path.split('/').pop(), path, origin));
  } else if (pageKey === 'com-author' || /^\/cong-dong\/tac-gia\//i.test(path)) {
    pushUnique(items, crumb(hints.authorName || title || 'Tác giả', path, origin));
  } else if (pageKey === 'com-cat' || /^\/cong-dong\/danh-muc\//i.test(path)) {
    pushUnique(items, crumb(hints.categoryName || title || 'Danh mục', path, origin));
  } else if (pageKey === 'com-topic' || /^\/cong-dong\/chu-de\//i.test(path)) {
    pushUnique(items, crumb(hints.topicName || title || 'Chủ đề', path, origin));
  } else if (pageKey === 'stocks') {
    addHub('market');
    addHub('stocks');
  } else if (pageKey === 'sectors') {
    addHub('market');
    addHub('sectors');
  } else if (pageKey === 'ecosystems') {
    addHub('market');
    addHub('ecosystems');
  } else if (HUB[pageKey]) {
    addHub(pageKey);
  } else if (path && path !== HOME.path) {
    pushUnique(items, crumb(title || path, path, origin));
  }

  /* Home hub alone: single crumb Trang chủ (Clean /cong-dong). */
  var jsonLd = null;
  if (items.length) {
    jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items.map(function (it, i) {
        return {
          '@type': 'ListItem',
          position: i + 1,
          name: it.name,
          item: it.url
        };
      })
    };
  }

  return { items: items, jsonLd: jsonLd };
}

module.exports = {
  HOME: HOME,
  HUB: HUB,
  resolveBreadcrumb: resolveBreadcrumb,
  PUBLIC_ORIGIN: PUBLIC_ORIGIN
};
