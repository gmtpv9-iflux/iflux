/* Cảnh báo UI — modal thứ hạng nhóm + Hỗ trợ/KC, badge trên stock row */
(function (global) {
  'use strict';

  function ast() { return global.IfluxAlertStore; }
  function tax() { return global.IfluxWatchlistTaxonomy; }

  function alertIconSvg(active) {
    if (active) {
      return (
        '<svg class="ifx-alert-icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">' +
          '<path fill="currentColor" d="M10 5a2 2 0 1 1 4 0a7 7 0 0 1 4 6v3a2 2 0 0 0 1 1.73l.5.29a1 1 0 0 1 .5.86v.12a1 1 0 0 1-1 1h-12a1 1 0 0 1-1-1v-.12a1 1 0 0 1 .5-.86l.5-.29a2 2 0 0 0 1-1.73v-3a7 7 0 0 1 4-6"/>' +
          '<path fill="currentColor" d="M10.5 18.75a1.5 1.5 0 0 0 3 0"/>' +
        '</svg>'
      );
    }
    return (
      '<svg class="ifx-alert-icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">' +
        '<path fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" d="M14.5 18.75a2.25 2.25 0 0 1-5 0"/>' +
        '<path fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" d="M10 5a2 2 0 1 1 4 0a7 7 0 0 1 4 6v3a2 2 0 0 0 1 1.73l.5.29a1 1 0 0 1 .5.86v.12a1 1 0 0 1-1 1h-12a1 1 0 0 1-1-1v-.12a1 1 0 0 1 .5-.86l.5-.29a2 2 0 0 0 1-1.73v-3a7 7 0 0 1 4-6"/>' +
      '</svg>'
    );
  }

  function alertBadgesHtml(ticker) {
    var st = ast();
    if (!st) return '';
    var items = st.getBadgeItemsForTicker(ticker);
    if (!items.length) return '';
    return items.map(function (b) {
      var chipCls = b.triggered ? 'ix-badge ix-badge-success' : 'ix-chip ix-chip-outline';
      var label;
      var title;
      if (b.kind === 'sr') {
        label = b.levelLabel + ' | ' + b.sessions + ' phiên | ' + b.pctDisplay;
        title = b.levelLabel + ' ' + b.sessions + ' phiên · ngưỡng ' + b.pctDisplay;
      } else {
        label = b.groupName + ' | #' + b.rank;
        title = 'Top ' + b.topN + ' · hiện #' + b.rank;
      }
      return '<span class="' + chipCls + '" title="' + title + '">' + label + '</span>';
    }).join('');
  }

  function rankBadgesHtml(ticker) {
    return alertBadgesHtml(ticker);
  }

  function alertButtonHtml(ticker) {
    var st = ast();
    var active = st && st.hasActiveAlert(ticker);
    var count = st ? st.countForTicker(ticker) : 0;
    var title = active
      ? 'Cảnh báo ' + ticker + ' (' + count + ')'
      : 'Đặt cảnh báo cho ' + ticker;
    return (
      '<button type="button" class="ifx-stock-row__alert' + (active ? ' is-active' : '') + '" ' +
        'data-ifx-stock-alert="' + ticker + '" title="' + title + '" aria-label="Cảnh báo">' +
        alertIconSvg(active) +
      '</button>'
    );
  }

  function modalVersionOk(el) {
    return el &&
      el.querySelector('[data-ifx-alert-panel="sr"]') &&
      el.querySelector('[data-ifx-alert-rank-form]') &&
      !el.querySelector('[data-ifx-alert-tab="price"]') &&
      !el.querySelector('[data-ifx-alert-close-btn]');
  }

  function ensureModal() {
    var el = document.getElementById('ifxAlertModal');
    if (el && !modalVersionOk(el)) {
      el.remove();
      el = null;
    }
    if (el) return el;
    el = document.createElement('div');
    el.className = 'ix-modal-overlay ifx-alert-overlay';
    el.id = 'ifxAlertModal';
    el.innerHTML =
      '<div class="ix-modal-box ifx-alert-modal">' +
        '<button type="button" class="ix-modal-close" data-ifx-alert-close><i class="ti ti-x"></i></button>' +
        '<div class="ifx-alert-modal__head">' +
          '<div class="ix-modal-title">Cảnh báo</div>' +
          '<div class="ix-modal-sub ifx-alert-modal__sub" data-ifx-alert-sub>Mã —</div>' +
          '<div class="ix-tabs ifx-alert-tabs" data-ifx-alert-tabs>' +
            '<button type="button" class="ix-tab active" data-ifx-alert-tab="rank">Thứ hạng nhóm</button>' +
            '<button type="button" class="ix-tab" data-ifx-alert-tab="sr">Hỗ trợ / KC</button>' +
          '</div>' +
        '</div>' +
        '<div class="ifx-alert-modal__body">' +
          '<div class="ifx-alert-panel" data-ifx-alert-panel="rank">' +
            '<p class="ifx-alert-rank-hint">Báo khi nhóm liên quan CP đạt <strong>Top N</strong> hiệu suất (sandbox).</p>' +
            '<div class="ifx-alert-rank-form" data-ifx-alert-rank-form>' +
              '<div class="ifx-alert-form__row">' +
                '<div class="ix-form-group"><label class="ix-label">Loại nhóm</label>' +
                  '<select class="ix-input" data-ifx-alert-rank-source></select></div>' +
                '<div class="ix-form-group"><label class="ix-label">Điều kiện kích hoạt</label>' +
                  '<select class="ix-input" data-ifx-alert-rank-top></select></div>' +
              '</div>' +
              '<div class="ifx-alert-rank-preview" data-ifx-alert-rank-preview></div>' +
            '</div>' +
            '<div class="ifx-alert-modal__actions ifx-alert-modal__actions--inline">' +
              '<button type="button" class="ix-btn ix-btn-primary" data-ifx-alert-rank-save>Thêm cảnh báo</button>' +
            '</div>' +
          '</div>' +
          '<div class="ifx-alert-panel" data-ifx-alert-panel="sr" hidden>' +
            '<p class="ifx-alert-rank-hint">Báo khi giá CP về vùng <strong>Hỗ trợ</strong> hoặc <strong>Kháng cự</strong> N phiên (sandbox).</p>' +
            '<div class="ifx-alert-sr-form">' +
              '<div class="ifx-alert-form__row">' +
                '<div class="ix-form-group"><label class="ix-label">Loại</label>' +
                  '<select class="ix-input" data-ifx-alert-sr-type>' +
                    '<option value="support">Hỗ trợ</option>' +
                    '<option value="resistance">Kháng cự</option>' +
                  '</select></div>' +
                '<div class="ix-form-group"><label class="ix-label">Số phiên</label>' +
                  '<select class="ix-input" data-ifx-alert-sr-sessions>' +
                    '<option value="5">5 phiên</option>' +
                    '<option value="10">10 phiên</option>' +
                    '<option value="20" selected>20 phiên</option>' +
                    '<option value="50">50 phiên</option>' +
                  '</select></div>' +
              '</div>' +
              '<div class="ix-form-group"><label class="ix-label" data-ifx-alert-sr-pct-label>Ngưỡng % so với Hỗ trợ</label>' +
                '<input type="number" class="ix-input" step="0.1" value="-3" placeholder="VD: -3" data-ifx-alert-sr-pct /></div>' +
              '<div class="ifx-alert-sr-preview" data-ifx-alert-sr-preview></div>' +
            '</div>' +
            '<div class="ifx-alert-modal__actions ifx-alert-modal__actions--inline">' +
              '<button type="button" class="ix-btn ix-btn-primary" data-ifx-alert-sr-save>Thêm cảnh báo</button>' +
            '</div>' +
          '</div>' +
          '<div class="ifx-alert-existing" data-ifx-alert-list></div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(el);

    el.addEventListener('click', function (e) {
      if (e.target === el) closeModal();
    });
    el.querySelectorAll('[data-ifx-alert-close]').forEach(function (btn) {
      btn.addEventListener('click', closeModal);
    });
    el.querySelector('[data-ifx-alert-list]').addEventListener('click', onListAction);
    el.querySelectorAll('[data-ifx-alert-tab]').forEach(function (tab) {
      tab.addEventListener('click', function () {
        switchTab(tab.getAttribute('data-ifx-alert-tab'));
      });
    });
    el.querySelector('[data-ifx-alert-rank-save]').addEventListener('click', onSaveRank);
    el.querySelector('[data-ifx-alert-rank-source]').addEventListener('change', syncRankPreview);
    el.querySelector('[data-ifx-alert-rank-top]').addEventListener('change', syncRankPreview);
    el.querySelector('[data-ifx-alert-sr-save]').addEventListener('click', onSaveSr);
    el.querySelector('[data-ifx-alert-sr-type]').addEventListener('change', syncSrForm);
    el.querySelector('[data-ifx-alert-sr-sessions]').addEventListener('change', syncSrPreview);
    el.querySelector('[data-ifx-alert-sr-pct]').addEventListener('input', syncSrPreview);

    return el;
  }

  var modalTicker = null;

  function switchTab(name) {
    var modal = ensureModal();
    modal.querySelectorAll('[data-ifx-alert-tab]').forEach(function (t) {
      t.classList.toggle('active', t.getAttribute('data-ifx-alert-tab') === name);
    });
    modal.querySelectorAll('[data-ifx-alert-panel]').forEach(function (p) {
      p.hidden = p.getAttribute('data-ifx-alert-panel') !== name;
    });
    if (name === 'sr') renderSrPanel();
    if (name === 'rank') renderRankPanel();
  }

  function syncSrForm() {
    var modal = ensureModal();
    var type = modal.querySelector('[data-ifx-alert-sr-type]').value;
    var label = modal.querySelector('[data-ifx-alert-sr-pct-label]');
    var pct = modal.querySelector('[data-ifx-alert-sr-pct]');
    if (type === 'resistance') {
      label.textContent = 'Ngưỡng % so với Kháng cự';
      if (parseFloat(pct.value) <= 0) pct.value = '3';
    } else {
      label.textContent = 'Ngưỡng % so với Hỗ trợ';
      if (parseFloat(pct.value) >= 0) pct.value = '-3';
    }
    syncSrPreview();
  }

  function syncSrPreview() {
    var modal = ensureModal();
    var preview = modal.querySelector('[data-ifx-alert-sr-preview]');
    var mk = global.IfluxMockMarket;
    var st = ast();
    if (!preview || !mk || !st || !modalTicker) return;

    var levelType = modal.querySelector('[data-ifx-alert-sr-type]').value;
    var sessions = parseInt(modal.querySelector('[data-ifx-alert-sr-sessions]').value, 10);
    var levels = mk.getSrLevels(modalTicker, sessions);
    var pct = mk.getPriceVsSrPct(modalTicker, levelType, sessions);
    var levelLabel = levelType === 'support' ? 'Hỗ trợ' : 'Kháng cự';
    var levelVal = levels ? (levelType === 'support' ? levels.support : levels.resistance) : '—';
    var hasDup = st.getSrAlertsForTicker(modalTicker).some(function (a) {
      return a.levelType === levelType && a.sessions === sessions;
    });

    preview.innerHTML =
      '<div class="ifx-alert-sr-preview__line">Mức ' + levelLabel + ' ' + sessions + ' phiên: <strong>' + levelVal + '</strong></div>' +
      '<div class="ifx-alert-sr-preview__line">Chênh lệch hiện tại: <strong>' +
        (pct != null ? st.fmtPct(pct) : '—') + '</strong></div>' +
      (hasDup ? '<div class="ifx-alert-sr-preview__warn">Đã có cảnh báo cho loại + số phiên này</div>' : '');
  }

  function renderSrPanel() {
    syncSrForm();
  }

  function topOptionsHtml(selected) {
    selected = selected || 3;
    var html = '';
    for (var n = 1; n <= 10; n++) {
      html += '<option value="' + n + '"' + (n === selected ? ' selected' : '') + '>Top ' + n + '</option>';
    }
    return html;
  }

  function syncRankPreview() {
    var modal = ensureModal();
    var preview = modal.querySelector('[data-ifx-alert-rank-preview]');
    var st = ast();
    var t = tax();
    if (!preview || !st || !t || !modalTicker) return;

    var sourceSel = modal.querySelector('[data-ifx-alert-rank-source]');
    var source = sourceSel ? sourceSel.value : '';
    var memberships = t.getTickerMemberships(modalTicker);
    var group = memberships[source];
    if (!group) {
      preview.innerHTML = '<div class="ifx-alert-rank-preview__warn">CP không thuộc nhóm này</div>';
      return;
    }
    var rank = t.getGroupRank(source, group.id);
    var hasDup = st.getRankAlertsForTicker(modalTicker).some(function (a) {
      return a.groupSource === source;
    });
    preview.innerHTML =
      '<div class="ifx-alert-sr-preview__line">Nhóm: <strong>' + group.name + '</strong></div>' +
      '<div class="ifx-alert-sr-preview__line">Thứ hạng hiện tại: <strong>#' + rank + '</strong></div>' +
      (hasDup ? '<div class="ifx-alert-rank-preview__warn">Đã có cảnh báo cho loại nhóm này</div>' : '');
  }

  function renderRankPanel() {
    var modal = ensureModal();
    var sourceSel = modal.querySelector('[data-ifx-alert-rank-source]');
    var topSel = modal.querySelector('[data-ifx-alert-rank-top]');
    var saveBtn = modal.querySelector('[data-ifx-alert-rank-save]');
    var st = ast();
    var t = tax();
    if (!sourceSel || !topSel || !st || !t || !modalTicker) return;

    var memberships = t.getTickerMemberships(modalTicker);
    var existing = st.getRankAlertsForTicker(modalTicker);
    var sources = [
      { key: 'sector', label: 'Ngành' },
      { key: 'family', label: 'Họ CP' },
      { key: 'story', label: 'Chủ đề' }
    ];

    var prevSource = sourceSel.value;
    var options = sources.map(function (src) {
      var group = memberships[src.key];
      if (!group) return '';
      var hasAlert = existing.some(function (a) { return a.groupSource === src.key; });
      var selected = prevSource === src.key;
      return (
        '<option value="' + src.key + '"' + (selected ? ' selected' : '') + (hasAlert ? ' disabled' : '') + '>' +
          src.label + ' · ' + group.name + (hasAlert ? ' (đã có)' : '') +
        '</option>'
      );
    }).filter(Boolean).join('');

    if (!options) {
      sourceSel.innerHTML = '<option value="">— Không thuộc nhóm nào —</option>';
      topSel.innerHTML = topOptionsHtml(3);
      if (saveBtn) saveBtn.disabled = true;
      modal.querySelector('[data-ifx-alert-rank-preview]').innerHTML =
        '<div class="ifx-alert-rank-preview__warn">Mã không thuộc Ngành / Họ CP / Chủ đề nào</div>';
      return;
    }

    sourceSel.innerHTML = options;
    if (sourceSel.querySelector('option[disabled][selected]')) {
      var first = sourceSel.querySelector('option:not([disabled])');
      if (first) first.selected = true;
    }
    topSel.innerHTML = topOptionsHtml(parseInt(topSel.value, 10) || 3);
    if (saveBtn) saveBtn.disabled = false;
    syncRankPreview();
  }

  function renderExistingList() {
    var modal = ensureModal();
    var list = modal.querySelector('[data-ifx-alert-list]');
    var st = ast();
    if (!st || !modalTicker) return;

    var items = st.getAlertsForTicker(modalTicker);
    if (!items.length) {
      list.innerHTML = '';
      return;
    }

    list.innerHTML =
      '<h3 class="ifx-alert-existing__title">Cảnh báo đang có</h3>' +
      '<div class="ifx-alert-existing__list">' +
      items.map(function (a) {
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
          '<div class="ifx-alert-item' + stateClass + '" data-ifx-alert-item="' + a.id + '">' +
            '<div class="ifx-alert-item__main">' +
              '<span class="ifx-alert-item__cond">' + st.formatCondition(a) + '</span>' +
              '<span class="ifx-alert-item__state">' + meta + '</span>' +
            '</div>' +
            '<div class="ifx-alert-item__actions">' +
              '<button type="button" class="ix-btn ix-btn-outline ix-btn-sm" data-ifx-alert-toggle="' + a.id + '">' +
                (a.state === 'PAUSED' ? 'Bật lại' : 'Tạm dừng') +
              '</button>' +
              '<button type="button" class="ix-btn ix-btn-outline ix-btn-sm" data-ifx-alert-delete="' + a.id + '" title="Xóa">' +
                '<i class="ti ti-trash"></i>' +
              '</button>' +
            '</div>' +
          '</div>'
        );
      }).join('') +
      '</div>';
  }

  function openModal(ticker) {
    var st = ast();
    if (!st) return;
    modalTicker = ticker;
    var modal = ensureModal();
    var snap = global.IfluxMockMarket && IfluxMockMarket.getSnapshot();
    var sub = ticker;
    if (snap && snap.entities && snap.entities.stocks && snap.entities.stocks[ticker]) {
      var s = snap.entities.stocks[ticker];
      sub = ticker + ' · ' + (s.name || '') + ' · Giá: ' + (s.price != null ? s.price : '—');
    }
    modal.querySelector('[data-ifx-alert-sub]').textContent = sub;
    switchTab('rank');
    renderRankPanel();
    renderSrPanel();
    renderExistingList();
    modal.classList.add('open');
    modal.scrollTop = 0;
  }

  function closeModal() {
    var modal = document.getElementById('ifxAlertModal');
    if (modal) modal.classList.remove('open');
    modalTicker = null;
  }

  function dispatchChange() {
    document.dispatchEvent(new CustomEvent('iflux-alerts-change'));
  }

  function onSaveSr() {
    var st = ast();
    var modal = ensureModal();
    if (!modalTicker || !st) return;
    try {
      st.createSrAlert({
        ticker: modalTicker,
        levelType: modal.querySelector('[data-ifx-alert-sr-type]').value,
        sessions: modal.querySelector('[data-ifx-alert-sr-sessions]').value,
        pctThreshold: modal.querySelector('[data-ifx-alert-sr-pct]').value
      });
      renderSrPanel();
      renderExistingList();
      refreshAll();
      if (global.ixToast) ixToast('Đã thêm cảnh báo Hỗ trợ/Kháng cự', 'success');
    } catch (err) {
      if (global.ixToast) ixToast(err.message, 'warning');
    }
  }

  function onSaveRank() {
    var st = ast();
    var modal = ensureModal();
    if (!modalTicker || !st) return;
    try {
      st.createRankAlert({
        ticker: modalTicker,
        groupSource: modal.querySelector('[data-ifx-alert-rank-source]').value,
        topN: modal.querySelector('[data-ifx-alert-rank-top]').value
      });
      renderRankPanel();
      renderExistingList();
      refreshAll();
      if (global.ixToast) ixToast('Đã thêm cảnh báo thứ hạng', 'success');
    } catch (err) {
      if (global.ixToast) ixToast(err.message, 'warning');
    }
  }

  function onListAction(e) {
    var st = ast();
    if (!st) return;
    var toggle = e.target.closest('[data-ifx-alert-toggle]');
    var del = e.target.closest('[data-ifx-alert-delete]');
    try {
      if (toggle) {
        st.togglePause(toggle.getAttribute('data-ifx-alert-toggle'));
        renderExistingList();
        renderRankPanel();
        renderSrPanel();
        refreshAll();
      }
      if (del) {
        var id = del.getAttribute('data-ifx-alert-delete');
        if (!confirm('Xóa cảnh báo này?')) return;
        st.deleteAlert(id);
        renderExistingList();
        renderRankPanel();
        renderSrPanel();
        refreshAll();
        if (global.ixToast) ixToast('Đã xóa cảnh báo', 'info');
      }
    } catch (err) {
      if (global.ixToast) ixToast(err.message, 'warning');
    }
  }

  function updateAlertButton(btn) {
    var st = ast();
    if (!st) return;
    var ticker = btn.getAttribute('data-ifx-stock-alert');
    var active = st.hasActiveAlert(ticker);
    btn.classList.toggle('is-active', active);
    btn.innerHTML = alertIconSvg(active);
    var count = st.countForTicker(ticker);
    btn.title = active
      ? 'Cảnh báo ' + ticker + ' (' + count + ')'
      : 'Đặt cảnh báo cho ' + ticker;
  }

  function refreshRankBadges() {
    document.querySelectorAll('[data-ifx-stock-badges]').forEach(function (el) {
      var wrap = el.closest('[data-ticker]');
      var ticker = wrap ? wrap.getAttribute('data-ticker') : null;
      if (ticker) el.innerHTML = rankBadgesHtml(ticker);
    });
  }

  function refreshAlertButtons() {
    document.querySelectorAll('[data-ifx-stock-alert]').forEach(updateAlertButton);
    refreshRankBadges();
  }

  function refreshAll() {
    refreshAlertButtons();
    dispatchChange();
  }

  function onAlertClick(e) {
    var btn = e.target.closest('[data-ifx-stock-alert]');
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
    openModal(btn.getAttribute('data-ifx-stock-alert'));
  }

  function bindAlerts(root) {
    var scope = root || document;
    if (!scope._ifxAlertBound) {
      scope.addEventListener('click', onAlertClick);
      scope._ifxAlertBound = true;
    }
    refreshAlertButtons();
  }

  global.IfluxAlertUI = {
    alertButtonHtml: alertButtonHtml,
    alertBadgesHtml: alertBadgesHtml,
    rankBadgesHtml: rankBadgesHtml,
    alertIconSvg: alertIconSvg,
    openModal: openModal,
    closeModal: closeModal,
    refreshAlertButtons: refreshAlertButtons,
    refreshRankBadges: refreshRankBadges,
    bindAlerts: bindAlerts,
    dispatchChange: dispatchChange
  };
})(window);
