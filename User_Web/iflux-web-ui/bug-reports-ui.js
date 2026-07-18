/* Báo lỗi — modal 2 tab + API backend */
(function (global) {
  'use strict';

  var API = '/api/bug-reports';
  var overlay = null;
  var activeTab = 'list';
  var turnstileId = null;
  var bound = false;

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function toast(msg, type) {
    if (typeof global.ixToast === 'function') global.ixToast(msg, type || 'primary');
  }

  function headers() {
    return global.IfluxVisitorId ? IfluxVisitorId.apiHeaders() : { 'Content-Type': 'application/json' };
  }

  function fetchJson(url, opts) {
    opts = opts || {};
    opts.headers = Object.assign({}, headers(), opts.headers || {});
    return fetch(url, opts).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (body) {
        if (!res.ok) throw new Error(body.error || body.message || ('HTTP ' + res.status));
        return body;
      });
    });
  }

  function statusChip(item) {
    var label = item.statusLabelWeb || item.status;
    var color = item.status === 'released' ? 'success' : item.status === 'developing' ? 'primary' : 'secondary';
    return '<span class="ix-chip ix-chip-' + color + ' ifx-feat-chip">' + esc(label) + '</span>';
  }

  function switchTab(key) {
    activeTab = key;
    if (!overlay) return;
    overlay.querySelectorAll('[data-ifx-bug-tab]').forEach(function (btn) {
      var on = btn.getAttribute('data-ifx-bug-tab') === key;
      btn.classList.toggle('active', on);
      btn.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    overlay.querySelectorAll('[data-ifx-bug-panel]').forEach(function (p) {
      p.classList.toggle('active', p.getAttribute('data-ifx-bug-panel') === key);
    });
    if (key === 'submit' && global.IfluxTurnstile) {
      var box = overlay.querySelector('[data-ifx-bug-turnstile]');
      if (box && turnstileId == null) {
        IfluxTurnstile.load().then(function () {
          turnstileId = IfluxTurnstile.render(box, 'bug');
        });
      }
    }
  }

  function renderList(items) {
    var listEl = overlay && overlay.querySelector('[data-ifx-bug-list]');
    if (!listEl) return;
    if (!items || !items.length) {
      listEl.innerHTML = '<p class="ifx-feat-empty">Chưa có báo lỗi nổi bật. Hãy gửi báo cáo đầu tiên!</p>';
      return;
    }
    listEl.innerHTML = items.map(function (item) {
      var agreed = !!item.agreed;
      var desc = [item.context, item.problemDescription].filter(Boolean).join(' — ');
      return (
        '<article class="ifx-feat-item" data-bug-id="' + esc(item.id) + '">' +
          '<div class="ifx-feat-item__main">' +
            '<div class="ifx-feat-item__head">' +
              '<h3 class="ifx-feat-item__title">' + esc(item.title) + '</h3>' +
              statusChip(item) +
            '</div>' +
            '<p class="ifx-feat-item__desc">' + esc(desc) + '</p>' +
            (item.userName ? '<div class="ifx-feat-item__meta">Gửi bởi ' + esc(item.userName) + '</div>' : '') +
          '</div>' +
          '<button type="button" class="ifx-feat-vote' + (agreed ? ' is-active' : '') + '" data-ifx-bug-agree="' + esc(item.id) + '" title="Đồng tình">' +
            '<i class="ti ti-check' + (agreed ? '' : '') + '"></i>' +
            '<span data-ifx-bug-agrees="' + esc(item.id) + '">' + (item.agreeCount || 0) + '</span>' +
          '</button>' +
        '</article>'
      );
    }).join('');
  }

  function loadList() {
    return fetchJson(API + '/public').then(function (data) {
      renderList(data.items || []);
    }).catch(function (err) {
      var listEl = overlay.querySelector('[data-ifx-bug-list]');
      if (listEl) listEl.innerHTML = '<p class="ifx-feat-empty">' + esc(err.message) + '</p>';
    });
  }

  function showError(msg) {
    var el = overlay && overlay.querySelector('[data-ifx-bug-error]');
    if (!el) return;
    if (!msg) { el.style.display = 'none'; el.textContent = ''; return; }
    el.style.display = 'flex';
    el.textContent = msg;
  }

  function open(opts) {
    opts = opts || {};
    buildModal();
    showError('');
    var form = overlay.querySelector('[data-ifx-bug-form]');
    if (form && form.context) {
      form.context.value = opts.context ? String(opts.context) : '';
    }
    overlay.classList.add('open');
    var tab = opts.tab || 'list';
    switchTab(tab);
    if (tab === 'list') loadList();
  }

  function close() {
    if (overlay) overlay.classList.remove('open');
  }

  function submitForm(e) {
    e.preventDefault();
    showError('');
    var form = overlay.querySelector('[data-ifx-bug-form]');
    var payload = {
      title: form.title.value.trim(),
      context: form.context.value.trim(),
      problem_description: form.problem_description.value.trim(),
      root_cause: form.root_cause.value.trim(),
      turnstile_token: global.IfluxTurnstile ? IfluxTurnstile.getToken(turnstileId) : ''
    };
    if (!payload.title) return showError('Vui lòng nhập tiêu đề.');
    if (!payload.context) return showError('Vui lòng nhập ngữ cảnh.');
    if (!payload.problem_description) return showError('Vui lòng mô tả vấn đề.');
    if (!payload.turnstile_token) return showError('Vui lòng hoàn tất xác minh chống spam.');

    var btn = form.querySelector('[type="submit"]');
    if (btn) btn.disabled = true;
    fetchJson(API, { method: 'POST', body: JSON.stringify(payload) })
      .then(function () {
        form.reset();
        if (global.IfluxTurnstile) IfluxTurnstile.reset(turnstileId);
        toast('Đã gửi báo lỗi — cảm ơn bạn!', 'success');
        switchTab('list');
        loadList();
      })
      .catch(function (err) {
        showError(err.message || 'Gửi thất bại');
        if (global.IfluxTurnstile) IfluxTurnstile.reset(turnstileId);
      })
      .finally(function () { if (btn) btn.disabled = false; });
  }

  function toggleAgree(id) {
    fetchJson(API + '/' + encodeURIComponent(id) + '/agree', { method: 'POST', body: '{}' })
      .then(function (data) {
        var item = data.item;
        var countEl = overlay.querySelector('[data-ifx-bug-agrees="' + id + '"]');
        var btn = overlay.querySelector('[data-ifx-bug-agree="' + id + '"]');
        if (countEl) countEl.textContent = String(item.agreeCount || 0);
        if (btn) btn.classList.toggle('is-active', !!item.agreed);
      })
      .catch(function (err) { toast(err.message || 'Không thể đồng tình', 'warning'); });
  }

  var modalFormBound = false;

  function ensureModalFormBound() {
    if (!overlay || modalFormBound) return;
    modalFormBound = true;
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) close();
    });
    var form = overlay.querySelector('[data-ifx-bug-form]');
    if (form) form.addEventListener('submit', submitForm);
  }

  function buildModal() {
    if (overlay) return overlay;
    overlay = document.getElementById('ifxBugReportModal');
    if (overlay) {
      ensureModalFormBound();
      return overlay;
    }
    overlay = document.createElement('div');
    overlay.className = 'ix-modal-overlay ifx-feat-modal';
    overlay.id = 'ifxBugReportModal';
    overlay.setAttribute('data-ifx-modal', '');
    overlay.innerHTML =
      '<div class="ix-modal-box">' +
        '<button type="button" class="ix-modal-close" data-ifx-bug-close><i class="ti ti-x"></i></button>' +
        '<div class="ix-modal-title">Báo lỗi</div>' +
        '<div class="ix-modal-sub">Đồng tình với lỗi phổ biến hoặc gửi báo cáo mới để đội ngũ iFlux xử lý.</div>' +
        '<div class="ix-tabs ifx-req-tabs" role="tablist" style="margin-top:var(--ifx-space-12)">' +
          '<button type="button" class="ix-tab active" role="tab" aria-selected="true" data-ifx-bug-tab="list"><i class="ti ti-flame"></i> Danh sách nổi bật</button>' +
          '<button type="button" class="ix-tab" role="tab" aria-selected="false" data-ifx-bug-tab="submit"><i class="ti ti-send"></i> Báo lỗi</button>' +
        '</div>' +
        '<div class="ifx-feat-modal__body">' +
          '<div class="ix-tab-content active" data-ifx-bug-panel="list">' +
            '<div class="ifx-feat-list" data-ifx-bug-list></div>' +
          '</div>' +
          '<div class="ix-tab-content" data-ifx-bug-panel="submit">' +
            '<form data-ifx-bug-form class="ifx-feat-form" style="margin-top:0;padding-top:0;border-top:none">' +
              '<div class="ix-form-group"><label class="ix-label">Tiêu đề <span style="color:var(--ix-danger)">*</span></label><input type="text" class="ix-input" name="title" placeholder="VD: Biểu đồ không tải trên Safari" maxlength="200" required /></div>' +
              '<div class="ix-form-group"><label class="ix-label">Ngữ cảnh <span style="color:var(--ix-danger)">*</span></label><textarea class="ix-input" name="context" rows="2" placeholder="Tái hiện lại ngữ cảnh xuất hiện lỗi (trang, thao tác, thiết bị…)" maxlength="2000" required></textarea></div>' +
              '<div class="ix-form-group"><label class="ix-label">Mô tả vấn đề <span style="color:var(--ix-danger)">*</span></label><textarea class="ix-input" name="problem_description" rows="3" placeholder="Mô tả chi tiết vấn đề gặp phải…" maxlength="2000" required></textarea></div>' +
              '<div class="ix-form-group"><label class="ix-label">Nguyên nhân cốt lõi</label><textarea class="ix-input" name="root_cause" rows="2" placeholder="Nếu bạn biết hoặc đoán nguyên nhân (không bắt buộc)…" maxlength="2000"></textarea></div>' +
              '<div class="ix-form-group"><div data-ifx-bug-turnstile></div></div>' +
              '<div data-ifx-bug-error class="ix-alert ix-alert-danger" style="margin-bottom:var(--ifx-space-12);display:none"></div>' +
              '<button type="submit" class="ix-btn ix-btn-primary"><i class="ti ti-send"></i> Gửi báo lỗi</button>' +
            '</form>' +
          '</div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);
    ensureModalFormBound();
    return overlay;
  }

  function bugButtonHtml() {
    return '<button type="button" class="ifx-widget-bug-btn" title="Báo lỗi" aria-label="Báo lỗi"><i class="ti ti-bug"></i></button>';
  }

  function bindEvents() {
    if (bound) return;
    bound = true;
    buildModal();

    document.addEventListener('click', function (e) {
      if (e.target.closest('[data-ifx-bug-open]')) {
        e.preventDefault();
        open();
        return;
      }
      if (e.target.closest('[data-ifx-bug-close]')) {
        e.preventDefault();
        close();
        return;
      }
      var agreeBtn = e.target.closest('[data-ifx-bug-agree]');
      if (agreeBtn) {
        e.preventDefault();
        toggleAgree(agreeBtn.getAttribute('data-ifx-bug-agree'));
        return;
      }
      var tabBtn = e.target.closest('[data-ifx-bug-tab]');
      if (tabBtn && overlay && overlay.contains(tabBtn)) {
        e.preventDefault();
        switchTab(tabBtn.getAttribute('data-ifx-bug-tab'));
      }
    });

  }

  function init() {
    bindEvents();
    if (global.IfluxInsightShare && IfluxInsightShare.patchAll) {
      IfluxInsightShare.patchAll(document);
    }
  }

  global.IfluxBugReportsUI = {
    init: init,
    open: open,
    close: close,
    refresh: loadList,
    bugButtonHtml: bugButtonHtml
  };
})(window);
