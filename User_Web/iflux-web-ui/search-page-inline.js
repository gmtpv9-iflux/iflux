/* Extracted from search/index.html — Blueprint Phase D */
(function (global) {
  'use strict';
  function run() {


var TYPE_ORDER = ['ticker', 'sector', 'family', 'story'];
var TYPE_LABEL = { ticker: 'Cổ phiếu', sector: 'Ngành', family: 'Họ CP', story: 'Chủ đề' };

function entityHref(e) {
  if (IfluxHeaderSearch) return IfluxHeaderSearch.entityUrl(e);
  if (IfluxStockMentions) return IfluxStockMentions.entityHref(e);
  return '#';
}

function renderSearch(q) {
  var el = document.getElementById('ifx-search-results');
  var hits = IfluxStockMentions.matchEntity(q);
  if (q && q.length > 1) {
    var more = IfluxStockMentions.buildIndex().filter(function (e) {
      var nq = String(q).toLowerCase();
      return e.tokens.some(function (t) {
        t = String(t || '').toLowerCase();
        return t.indexOf(nq) >= 0;
      });
    });
    var seen = {};
    hits = hits.concat(more).filter(function (e) {
      var k = e.type + ':' + e.id;
      if (seen[k]) return false;
      seen[k] = true;
      return true;
    }).slice(0, 24);
  } else if (!q) {
    hits = IfluxStockMentions.buildIndex().slice(0, 24);
  }

  if (!hits.length) {
    el.innerHTML = '<div class="ifx-wl-empty">Không có kết quả</div>';
    return;
  }

  var groups = {};
  hits.forEach(function (e) {
    if (!groups[e.type]) groups[e.type] = [];
    groups[e.type].push(e);
  });

  el.innerHTML = TYPE_ORDER.filter(function (t) { return groups[t]; }).map(function (type) {
    return '<div class="ix-card ix-mb-24"><div class="ix-card-header"><h2 class="ix-card-title">' + TYPE_LABEL[type] + '</h2></div><div class="ix-card-body" style="padding-top:0">' +
      groups[type].map(function (e) {
        var href = entityHref(e);
        if (type === 'ticker') {
          var snap = IfluxMockMarket.getSnapshot();
          var s = snap.entities.stocks[e.id];
          return s ? IfluxWatchlistUI.stockRowHtml(s, { href: href }) : '';
        }
        return '<a href="' + href + '" class="ifx-follow-card" style="text-decoration:none;margin-bottom:8px">' +
          '<div class="ifx-follow-card__main"><div class="ifx-follow-card__name">' + e.label + '</div>' +
          '<div class="ifx-follow-card__sub">' + TYPE_LABEL[type] + '</div></div>' +
          '<i class="ti ti-chevron-right" style="color:var(--ix-text-muted)"></i></a>';
      }).join('') +
    '</div></div>';
  }).join('');

  IfluxWatchlistUI.refreshHearts();
  if (window.IfluxAlertUI) IfluxAlertUI.refreshAlertButtons();
}

document.getElementById('search-input').addEventListener('input', function () {
  renderSearch(this.value.trim());
});
IfluxWatchlistUI.bindHearts(document);
renderSearch('');
  }
  global.IfluxSearchPageInline = { init: run };
})(window);
