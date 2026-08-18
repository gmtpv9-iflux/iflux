/* Trang Danh sách câu chuyện (/cau-chuyen)
 * Knowledge entity: chỉ hiện chủ đề trạng thái Trưởng thành (mature).
 * KHÔNG tái dùng entity-list (tabs sàn / hàng cổ phiếu).
 */
(function (global) {
  'use strict';

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function normalizeStatus(raw, lifecycle) {
    var s = String(raw || '').toLowerCase();
    if (s === 'mature' || s === 'truong_thanh') return 'mature';
    if (s === 'new' || s === 'moi') return 'new';
    if (s === 'declining' || s === 'suy_yeu' || s === 'retired') return 'declining';
    if (s === 'archived' || s === 'merged') return 'archived';
    var lc = String(lifecycle || '').toLowerCase();
    if (lc === 'archived') return 'archived';
    if (lc === 'fading') return 'declining';
    if (lc === 'peak' || lc === 'trending') return 'mature';
    return 'new';
  }

  function storyHref(slug) {
    var c = (global.IfluxSeoUrl && IfluxSeoUrl.chuDeHref)
      ? IfluxSeoUrl.chuDeHref(slug)
      : '/cau-chuyen/' + encodeURIComponent(slug || '');
    return global.IfluxHref ? IfluxHref.forCanonical(c) : c;
  }

  function apiList() {
    if (global.IfluxApi && IfluxApi.listContentStories) {
      return IfluxApi.listContentStories({ limit: 200 }).then(function (data) {
        return (data && (data['chu-de'] || data.stories || data.items)) || [];
      });
    }
    return fetch('/api/content/chu-de?limit=200', { headers: { Accept: 'application/json' } })
      .then(function (r) { return r.json(); })
      .then(function (body) {
        var data = (body && body.data) || body || {};
        return data['chu-de'] || data.stories || [];
      });
  }

  function rowHtml(item, idx) {
    var slug = item.slug || item.id;
    var name = item.name || item.label || slug;
    var desc = item.description || (item.meta && item.meta.description) || '';
    var n = Number(item.mapping_count || item.stocksCount || (item.tickers && item.tickers.length) || 0);
    var href = storyHref(slug);
    return (
      '<a class="ix-list-item ifx-com-story-rank ifx-com-story-rank--link" href="' + esc(href) + '">' +
        '<div class="ifx-com-story-rank__num" aria-hidden="true">' + (idx + 1) + '</div>' +
        '<div class="ifx-com-story-rank__body">' +
          '<div class="ifx-com-story-rank__title-row">' +
            '<span class="ifx-com-story-rank__title">' + esc(name) + '</span>' +
            '<span class="ix-chip ix-chip-success">Trưởng thành</span>' +
          '</div>' +
          (desc
            ? '<div class="ifx-com-story-rank__sub">' + esc(desc) + '</div>'
            : '<div class="ifx-com-story-rank__sub">' + esc(n) + ' mã liên quan · ' + esc(slug) + '</div>') +
        '</div>' +
        '<i class="ti ti-chevron-right" aria-hidden="true"></i>' +
      '</a>'
    );
  }

  function render(mount, list) {
    if (!mount) return;
    if (!list.length) {
      mount.innerHTML =
        '<div class="ifx-com-empty">' +
          '<i class="ti ti-book-2" style="font-size:32px"></i>' +
          '<p>Chưa có câu chuyện ở trạng thái Trưởng thành.</p>' +
          '<a class="ix-btn ix-btn-outline ix-btn-sm" href="' + esc(global.IfluxHref ? IfluxHref.forCanonical('/cong-dong') : '/cong-dong') + '">Xem Cộng đồng</a>' +
        '</div>';
      return;
    }
    mount.innerHTML =
      '<div class="ifx-mkt-card">' +
        '<div class="ifx-mkt-card__body">' +
          '<div class="ifx-com-story-rank-list">' +
            list.map(rowHtml).join('') +
          '</div>' +
        '</div>' +
      '</div>';
  }

  function init() {
    var titleEl = document.querySelector('[data-elp-title]');
    var introEl = document.querySelector('[data-elp-intro]');
    var mount = document.querySelector('[data-cau-chuyen-list]');
    if (titleEl) titleEl.textContent = 'Danh sách câu chuyện';
    if (introEl) {
      introEl.textContent =
        'Các chủ đề thị trường đã trưởng thành — chọn một câu chuyện để xem mã liên quan và diễn biến.';
    }
    if (window.IfluxPageDefinition && IfluxPageDefinition.applyPatch) {
      IfluxPageDefinition.applyPatch({
        title: 'Danh sách câu chuyện'
        /* documentTitle từ Thiết lập SEO — cấm hardcode · iFlux */
      });
    }
    if (!mount) return;

    mount.innerHTML = '<div class="ifx-com-empty">Đang tải câu chuyện…</div>';

    function done(rows) {
      var list = (rows || []).filter(function (r) {
        return normalizeStatus(r.status, r.lifecycle) === 'mature';
      });
      render(mount, list);
    }

    /* Prefer taxonomy hydrate (đã có cache) + API để lọc mature */
    var tax = global.IfluxWatchlistTaxonomy;
    var p = apiList().catch(function () { return []; });
    if (tax && tax.hydrateChuDeFromApi) {
      p = tax.hydrateChuDeFromApi().then(function () {
        return apiList();
      }).catch(function () { return apiList(); });
    }
    p.then(done).catch(function (err) {
      mount.innerHTML =
        '<div class="ifx-com-empty" style="color:var(--ix-danger)">' +
          esc(err.message || 'Không tải được danh sách câu chuyện') +
        '</div>';
    });
  }

  global.IfluxCauChuyenListPage = { init: init };
})(window);
