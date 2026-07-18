/* Danh sách cảnh báo — modal Watchlist + trang /alerts (redirect) */
(function (global) {
  'use strict';

  function renderInto(root) {
    if (!root) return;
    var st = global.IfluxAlertStore;
    if (!st) return;

    var alerts = st.getAlerts();
    if (!alerts.length) {
      root.innerHTML =
        '<div class="ifx-alert-empty">Chưa có cảnh báo nào.<br/>Bấm chuông trên từng mã CP trong Watchlist để đặt cảnh báo.</div>';
      return;
    }

    root.innerHTML =
      '<div class="ifx-alert-page-list">' +
      alerts.map(function (a) {
        var stateClass = a.state === 'TRIGGERED' ? ' is-triggered' : (a.state === 'PAUSED' ? ' is-paused' : '');
        var meta = st.stateLabel(a.state);
        if (st.isRankAlert(a)) {
          var rank = st.getCurrentRank(a);
          if (rank != null) meta += ' · hiện #' + rank;
        }
        if (st.isSrAlert(a)) {
          var srPct = st.getCurrentSrPct(a);
          if (srPct != null) meta += ' · hiện ' + st.fmtPct(srPct);
        }
        return (
          '<div class="ifx-alert-page-item' + stateClass + '" data-ifx-alert-page-item="' + a.id + '">' +
            '<div>' +
              '<div class="ifx-alert-page-item__ticker">' + a.ticker + '</div>' +
              '<div class="ifx-alert-page-item__cond">' + st.formatCondition(a) + '</div>' +
              '<div class="ifx-alert-page-item__meta">' + meta + '</div>' +
            '</div>' +
            '<div class="ifx-alert-item__actions">' +
              '<button type="button" class="ix-btn ix-btn-outline ix-btn-sm" data-ifx-alert-page-toggle="' + a.id + '">' +
                (a.state === 'PAUSED' ? 'Bật lại' : 'Tạm dừng') +
              '</button>' +
              '<button type="button" class="ix-btn ix-btn-outline ix-btn-sm" data-ifx-alert-page-delete="' + a.id + '">' +
                '<i class="ti ti-trash"></i>' +
              '</button>' +
            '</div>' +
          '</div>'
        );
      }).join('') +
      '</div>';

    root.querySelectorAll('[data-ifx-alert-page-toggle]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        st.togglePause(btn.getAttribute('data-ifx-alert-page-toggle'));
        if (global.IfluxAlertUI) IfluxAlertUI.refreshAlertButtons();
        renderInto(root);
        if (global.IfluxWatchlistBlock) IfluxWatchlistBlock.refreshAlertBadges();
      });
    });

    root.querySelectorAll('[data-ifx-alert-page-delete]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (!confirm('Xóa cảnh báo này?')) return;
        st.deleteAlert(btn.getAttribute('data-ifx-alert-page-delete'));
        if (global.IfluxAlertUI) IfluxAlertUI.refreshAlertButtons();
        renderInto(root);
        if (global.IfluxWatchlistBlock) IfluxWatchlistBlock.refreshAlertBadges();
      });
    });
  }

  function render() {
    renderInto(document.querySelector('[data-ifx-alert-page]'));
  }

  function ensureListModal() {
    var el = document.getElementById('ifxAlertsListModal');
    if (el) return el;
    el = document.createElement('div');
    el.className = 'ix-modal-overlay';
    el.id = 'ifxAlertsListModal';
    el.innerHTML =
      '<div class="ix-modal-box ifx-alerts-list-modal" style="max-width:560px;max-height:85vh;display:flex;flex-direction:column;padding:0">' +
        '<div style="padding:24px 24px 12px;flex-shrink:0">' +
          '<button type="button" class="ix-modal-close" data-ifx-alerts-list-close><i class="ti ti-x"></i></button>' +
          '<div class="ix-modal-title">Cảnh báo</div>' +
          '<div class="ix-modal-sub">Quản lý cảnh báo thứ hạng nhóm và Hỗ trợ/Kháng cự</div>' +
        '</div>' +
        '<div style="padding:0 24px 24px;overflow-y:auto;flex:1;min-height:0" data-ifx-alert-page></div>' +
      '</div>';
    document.body.appendChild(el);
    el.addEventListener('click', function (e) {
      if (e.target === el) closeListModal();
    });
    el.querySelector('[data-ifx-alerts-list-close]').addEventListener('click', closeListModal);
    return el;
  }

  function openListModal() {
    var el = ensureListModal();
    renderInto(el.querySelector('[data-ifx-alert-page]'));
    el.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeListModal() {
    var el = document.getElementById('ifxAlertsListModal');
    if (el) el.classList.remove('open');
    document.body.style.overflow = '';
  }

  function init() {
    document.addEventListener('iflux-alerts-change', function () {
      var modal = document.getElementById('ifxAlertsListModal');
      if (modal && modal.classList.contains('open')) {
        renderInto(modal.querySelector('[data-ifx-alert-page]'));
      }
      if (global.IfluxWatchlistBlock) IfluxWatchlistBlock.refreshAlertBadges();
    });
  }

  global.IfluxAlertPage = {
    init: init,
    render: render,
    renderInto: renderInto,
    openListModal: openListModal,
    closeListModal: closeListModal
  };
})(window);
