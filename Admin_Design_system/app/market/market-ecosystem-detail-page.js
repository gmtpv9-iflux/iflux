/* ADM-MKT-002 — Ecosystem Detail + preview Ig */
(function (global) {
  'use strict';

  var Store = global.IfluxMarketRegistryStore;

  var ecoId = null;
  var draftTickers = [];
  var previewed = false;
  var lastPreview = null;

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function toast(msg, type) {
    if (typeof global.ixToast === 'function') global.ixToast(msg, type || 'primary');
  }

  function queryId() {
    try {
      return new URLSearchParams(window.location.search).get('id');
    } catch (e) {
      return null;
    }
  }

  function invalidatePreview() {
    previewed = false;
    lastPreview = null;
    updateSaveButton();
    clearPreviewPanel();
  }

  function updateSaveButton() {
    var btn = document.getElementById('btn-adm-mkt-eco-detail-save');
    if (!btn) return;
    btn.disabled = !previewed;
    btn.title = previewed ? 'Lưu thay đổi thành viên' : 'Cần Preview trước khi lưu';
  }

  function clearPreviewPanel() {
    var ids = [
      'adm-mkt-eco-ig-before', 'adm-mkt-eco-ig-after',
      'adm-mkt-eco-divisor-new', 'adm-mkt-eco-change-pct'
    ];
    ids.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.textContent = '—';
    });
    var hint = document.getElementById('adm-mkt-eco-preview-hint');
    if (hint) hint.style.display = '';
  }

  function renderHeader(eco) {
    var title = document.getElementById('adm-mkt-eco-detail-title');
    var sub = document.getElementById('adm-mkt-eco-detail-sub');
    if (title) title.textContent = eco.name || 'Chi tiết họ CP';
    if (sub) {
      sub.innerHTML = 'Số thành viên (derived): <strong>' + Math.max(draftTickers.length, 1) + '</strong> · ' +
        draftTickers.length + ' mã';
    }
  }

  function renderMembers() {
    var list = document.getElementById('adm-mkt-eco-members');
    if (!list) return;

    if (!draftTickers.length) {
      list.innerHTML = '<div style="padding:16px;color:var(--ix-text-muted);font-size:13px">Chưa có thành viên. Thêm mã bên dưới.</div>';
      return;
    }

    list.innerHTML = draftTickers.map(function (ticker) {
      var stock = Store ? Store.getStock(ticker) : null;
      var name = stock ? stock.name : '';
      return '<div class="adm-mkt-eco-member" data-ticker="' + esc(ticker) + '" style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;border-bottom:1px solid var(--ix-border)">' +
        '<div><strong style="color:var(--ix-accent)">' + esc(ticker) + '</strong>' +
        (name ? '<div style="font-size:12px;color:var(--ix-text-muted)">' + esc(name) + '</div>' : '') +
        '</div>' +
        '<button type="button" class="ix-btn ix-btn-icon" data-adm-mkt-eco-remove="' + esc(ticker) + '" title="Xóa khỏi họ"><i class="ti ti-x" style="font-size:14px"></i></button>' +
      '</div>';
    }).join('');
  }

  function renderPreviewResult(result) {
    if (!result) return;
    var map = {
      'adm-mkt-eco-ig-before': result.igBefore != null ? Number(result.igBefore).toFixed(2) : '—',
      'adm-mkt-eco-ig-after': result.igAfter != null ? Number(result.igAfter).toFixed(2) : '—',
      'adm-mkt-eco-divisor-new': result.divisorNew != null ? String(result.divisorNew) : '—',
      'adm-mkt-eco-change-pct': result.changePct != null ? (result.changePct >= 0 ? '+' : '') + Number(result.changePct).toFixed(2) + '%' : '—'
    };
    Object.keys(map).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.textContent = map[id];
    });

    var changeEl = document.getElementById('adm-mkt-eco-change-pct');
    if (changeEl && result.changePct != null) {
      changeEl.style.color = result.changePct >= 0 ? 'var(--ix-success)' : 'var(--ix-danger)';
    }

    var hint = document.getElementById('adm-mkt-eco-preview-hint');
    if (hint) hint.style.display = 'none';
  }

  function addTicker(raw) {
    var ticker = String(raw || '').trim().toUpperCase();
    if (!ticker) return;
    if (!Store.getStock(ticker)) {
      toast('Mã ' + ticker + ' chưa có trong Stock Registry', 'danger');
      return;
    }
    if (draftTickers.indexOf(ticker) >= 0) {
      toast('Mã đã có trong họ', 'warning');
      return;
    }
    draftTickers.push(ticker);
    invalidatePreview();
    renderMembers();
    var eco = Store.getEcosystem(ecoId);
    if (eco) renderHeader(eco);
  }

  function removeTicker(ticker) {
    draftTickers = draftTickers.filter(function (t) { return t !== ticker; });
    invalidatePreview();
    renderMembers();
    var eco = Store.getEcosystem(ecoId);
    if (eco) renderHeader(eco);
  }

  function runPreview() {
    if (!Store || !ecoId) return;
    if (!draftTickers.length) {
      toast('Cần ít nhất một thành viên để preview', 'danger');
      return;
    }
    lastPreview = Store.previewEcosystemIg(ecoId, draftTickers.slice());
    previewed = true;
    renderPreviewResult(lastPreview);
    updateSaveButton();
    toast('Đã tính preview Ig — có thể lưu', 'success');
  }

  function saveMembers() {
    if (!Store || !ecoId || !previewed) {
      toast('Cần Preview trước khi lưu', 'warning');
      return;
    }
    var eco = Store.getEcosystem(ecoId);
    if (!eco) return;

    Store.upsertEcosystem({
      id: ecoId,
      name: eco.name,
      tickers: draftTickers.slice(),
      status: eco.status
    });

    previewed = false;
    lastPreview = null;
    updateSaveButton();

    eco = Store.getEcosystem(ecoId);
    draftTickers = (eco.tickers || []).slice();
    renderHeader(eco);
    renderMembers();
    toast('Đã lưu thành viên họ CP', 'success');
  }

  function bindEvents() {
    var addInput = document.getElementById('adm-mkt-eco-add-ticker');
    var addBtn = document.getElementById('btn-adm-mkt-eco-add-ticker');
    if (addBtn) {
      addBtn.addEventListener('click', function () {
        addTicker(addInput ? addInput.value : '');
        if (addInput) addInput.value = '';
      });
    }
    if (addInput) {
      addInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          addTicker(addInput.value);
          addInput.value = '';
        }
      });
    }

    var previewBtn = document.getElementById('btn-adm-mkt-eco-preview');
    if (previewBtn) previewBtn.addEventListener('click', runPreview);

    var saveBtn = document.getElementById('btn-adm-mkt-eco-detail-save');
    if (saveBtn) saveBtn.addEventListener('click', saveMembers);

    document.addEventListener('click', function (e) {
      var rm = e.target.closest('[data-adm-mkt-eco-remove]');
      if (!rm) return;
      e.preventDefault();
      removeTicker(rm.getAttribute('data-adm-mkt-eco-remove'));
    });
  }

  function init() {
    if (!Store) {
      toast('Thiếu IfluxMarketRegistryStore', 'danger');
      return;
    }

    ecoId = queryId();
    if (!ecoId) {
      toast('Thiếu tham số id trên URL', 'danger');
      return;
    }

    var eco = Store.getEcosystem(ecoId);
    if (!eco) {
      toast('Không tìm thấy họ CP #' + ecoId, 'danger');
      return;
    }

    draftTickers = (eco.tickers || []).slice();
    renderHeader(eco);
    renderMembers();
    updateSaveButton();
    bindEvents();
  }

  global.AdmMarketEcosystemDetail = {
    init: init,
    getDraftTickers: function () { return draftTickers.slice(); },
    isPreviewed: function () { return previewed; }
  };
})(window);
