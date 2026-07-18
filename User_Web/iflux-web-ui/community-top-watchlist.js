/* Cộng đồng — Top Watchlist mạnh nhất (Elite); hub sidebar + community */
(function (global) {
  'use strict';

  var activePeriod = 'month';

  function store() { return global.IfluxCommunityTopWatchlistStore; }
  function wl() { return global.IfluxWatchlistStore; }

  /* Permission SoT = IfluxEntitlements (engine duy nhất). Widget KHÔNG tự đọc
     IfluxAuth.tier — chỉ hỏi engine. Engine vắng mặt => fail-closed. */
  function isElite() {
    return !!(global.IfluxEntitlements && global.IfluxEntitlements.isElite && global.IfluxEntitlements.isElite());
  }

  function fmtPct(n) {
    if (n == null || isNaN(n)) return '—';
    return (n >= 0 ? '+' : '') + n.toFixed(2) + '%';
  }

  function dirClass(n) {
    if (n == null || n === 0) return '';
    return n > 0 ? 'is-up' : 'is-down';
  }

  function periodTabsHtml() {
    var periods = store().PERIODS;
    return Object.keys(periods).map(function (key) {
      var active = key === activePeriod ? ' is-active' : '';
      return '<button type="button" class="ifx-com-topwl-tab' + active + '" data-ifx-topwl-period="' + key + '">' +
        periods[key].label + '</button>';
    }).join('');
  }

  function rowsHtml(rows, locked) {
    if (!rows.length) {
      return '<div class="ifx-com-side-empty">Chưa có dữ liệu xếp hạng.</div>';
    }
    return rows.slice(0, 5).map(function (row, idx) {
      var rank = idx + 1;
      var profileHref = global.IfluxProfileLinks && typeof IfluxProfileLinks.profileHref === 'function'
        ? IfluxProfileLinks.profileHref(row.userId, { base: '../account/' })
        : (global.IfluxProfileLinks && typeof IfluxProfileLinks.href === 'function'
          ? IfluxProfileLinks.href(row.userId, { base: '../account/' })
          : '../account/profile.html?user=' + encodeURIComponent(row.userId));
      var copyBtn = locked
        ? ''
        : '<button type="button" class="ix-btn ix-btn-outline ix-btn-sm ifx-com-topwl-copy" data-ifx-topwl-copy="' + row.userId + '">' +
            '<i class="ti ti-copy"></i> Chép danh mục</button>';
      return (
        '<div class="ifx-com-topwl-row' + (locked ? ' is-locked' : '') + '" data-ifx-topwl-user="' + row.userId + '">' +
          '<div class="ifx-com-topwl-row__main">' +
            '<span class="ifx-com-topwl-rank">#' + rank + '</span>' +
            '<a class="ifx-com-topwl-user" href="' + profileHref + '">' +
              '<span class="ix-avatar-sm ' + row.avatarCls + '">' + row.initials + '</span>' +
              '<span><strong>' + row.displayName + '</strong>' +
                '<small>' + row.stockCount + ' mã · ' + row.tickers.slice(0, 3).join(', ') +
                (row.tickers.length > 3 ? '…' : '') + '</small></span>' +
            '</a>' +
            '<span class="ifx-com-topwl-perf ' + dirClass(row.performance) + '">' + fmtPct(row.performance) + '</span>' +
          '</div>' +
          copyBtn +
        '</div>'
      );
    }).join('');
  }

  function lockedOverlayHtml() {
    return (
      '<div class="ifx-com-topwl-lock">' +
        '<div class="ifx-com-topwl-lock__inner">' +
          '<i class="ti ti-diamond"></i>' +
          '<strong>Chỉ dành cho Elite</strong>' +
          '<p>Xem Top Watchlist mạnh nhất và chép danh mục từ nhà đầu tư hàng đầu.</p>' +
          '<button type="button" class="ix-btn ix-btn-primary ix-btn-sm" data-ifx-topwl-upgrade>' +
            '<i class="ti ti-crown"></i> Nâng cấp Elite</button>' +
        '</div>' +
      '</div>'
    );
  }

  function headHtml(opts) {
    if (!opts.withHead) return '';
    var title = opts.title || 'Top Watchlist mạnh nhất';
    var description = opts.description || 'Hiệu suất TB các mã từ lúc thêm vào watchlist đến hiện tại.';
    var titleBlock = global.IfluxBlockTemplates && IfluxBlockTemplates.renderWgtHead
      ? IfluxBlockTemplates.renderWgtHead(title, description)
      : ('<div class="ifx-widget__header"><h3>' + title + '</h3>' +
        (description ? '<p class="ifx-widget__subtitle">' + description + '</p>' : '') +
        '</div>');
    /* Chèn chip Elite vào head SoT (cùng hàng với tiêu đề) */
    return titleBlock.replace(
      '</div>',
      '<span class="ix-chip ix-chip-warning ix-chip-sm">Elite</span></div>'
    );
  }

  function render(container, opts) {
    if (!container || !store()) return;
    opts = opts || {};
    var locked = opts.previewDemo ? false : !isElite();
    var rows = store().listRanked(activePeriod);

    container._topwlOpts = opts;
    container.innerHTML =
      '<section class="ifx-com-topwl' + (locked ? ' ifx-com-topwl--locked' : '') + '">' +
        headHtml(opts) +
        '<div class="ifx-com-topwl-tabs">' + periodTabsHtml() + '</div>' +
        '<div class="ifx-com-topwl-list">' + rowsHtml(rows, locked) + '</div>' +
        (locked ? lockedOverlayHtml() : '') +
      '</section>';

    bind(container);
  }

  function bind(container) {
    container.querySelectorAll('[data-ifx-topwl-period]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        activePeriod = btn.getAttribute('data-ifx-topwl-period');
        render(container, container._topwlOpts || {});
      });
    });

    var upgrade = container.querySelector('[data-ifx-topwl-upgrade]');
    if (upgrade) {
      upgrade.addEventListener('click', function () {
        if (global.IfluxWebUI && IfluxWebUI.openPricing) {
          IfluxWebUI.openPricing({ reason: 'elite_feature', message: 'Top Watchlist mạnh nhất — Elite' });
        }
      });
    }

    container.querySelectorAll('[data-ifx-topwl-copy]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var userId = btn.getAttribute('data-ifx-topwl-copy');
        copyPortfolio(userId);
      });
    });
  }

  function copyPortfolio(userId) {
    if (!isElite()) {
      if (global.ixToast) ixToast('Tính năng Elite — vui lòng nâng cấp gói', 'warning');
      return;
    }
    var entry = store().getEntry(userId);
    if (!entry || !wl()) return;
    try {
      var res = wl().copyPublicPortfolio(entry.displayName, store().getTickers(entry));
      if (global.ixToast) {
        ixToast('Đã chép ' + res.count + ' mã vào «' + res.folderName + '»', 'success');
      }
      document.dispatchEvent(new CustomEvent('iflux-watchlist-change'));
    } catch (e) {
      if (global.ixToast) ixToast(e.message || 'Không thể chép danh mục', 'danger');
    }
  }

  function mount(container, opts) {
    if (!container) return;
    render(container, opts || {});
  }

  global.IfluxCommunityTopWatchlist = { mount: mount, isElite: isElite };
})(window);
