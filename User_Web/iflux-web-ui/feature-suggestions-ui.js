/* Đề xuất tính năng — modal 2 tab + API backend */
(function (global) {
  'use strict';

  var API = '/api/feature-suggestions';
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
    overlay.querySelectorAll('[data-ifx-feat-tab]').forEach(function (btn) {
      var on = btn.getAttribute('data-ifx-feat-tab') === key;
      btn.classList.toggle('active', on);
      btn.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    overlay.querySelectorAll('[data-ifx-feat-panel]').forEach(function (p) {
      p.classList.toggle('active', p.getAttribute('data-ifx-feat-panel') === key);
    });
    if (key === 'submit' && global.IfluxTurnstile) {
      var box = overlay.querySelector('[data-ifx-feat-turnstile]');
      if (box && turnstileId == null) {
        IfluxTurnstile.load().then(function () {
          turnstileId = IfluxTurnstile.render(box, 'feat');
        });
      }
    }
  }

  function renderList(items) {
    var listEl = overlay && overlay.querySelector('[data-ifx-feat-list]');
    if (!listEl) return;
    if (!items || !items.length) {
      listEl.innerHTML = '<p class="ifx-feat-empty">Chưa có đề xuất nổi bật. Hãy gửi ý tưởng đầu tiên!</p>';
      return;
    }
    listEl.innerHTML = items.map(function (item) {
      var liked = !!item.liked;
      var desc = [item.ideaDescription, item.expectationDescription].filter(Boolean).join(' — ');
      return (
        '<article class="ifx-feat-item" data-feat-id="' + esc(item.id) + '">' +
          '<div class="ifx-feat-item__main">' +
            '<div class="ifx-feat-item__head">' +
              '<h3 class="ifx-feat-item__title">' + esc(item.title) + '</h3>' +
              statusChip(item) +
            '</div>' +
            '<p class="ifx-feat-item__desc">' + esc(desc) + '</p>' +
            (item.userName ? '<div class="ifx-feat-item__meta">Gửi bởi ' + esc(item.userName) + '</div>' : '') +
          '</div>' +
          '<button type="button" class="ifx-feat-vote' + (liked ? ' is-active' : '') + '" data-ifx-feat-like="' + esc(item.id) + '" title="Thích đề xuất">' +
            '<i class="ti ti-thumb-up' + (liked ? '-filled' : '') + '"></i>' +
            '<span data-ifx-feat-votes="' + esc(item.id) + '">' + (item.likeCount || 0) + '</span>' +
          '</button>' +
        '</article>'
      );
    }).join('');
  }

  function loadList() {
    return fetchJson(API + '/public').then(function (data) {
      renderList(data.items || []);
    }).catch(function (err) {
      var listEl = overlay.querySelector('[data-ifx-feat-list]');
      if (listEl) listEl.innerHTML = '<p class="ifx-feat-empty">' + esc(err.message) + '</p>';
    });
  }

  function showError(msg) {
    var el = overlay && overlay.querySelector('[data-ifx-feat-error]');
    if (!el) return;
    if (!msg) { el.style.display = 'none'; el.textContent = ''; return; }
    el.style.display = 'flex';
    el.textContent = msg;
  }

  function open() {
    if (!overlay) buildModal();
    showError('');
    overlay.classList.add('open');
    switchTab('list');
    loadList();
  }

  function close() {
    if (overlay) overlay.classList.remove('open');
  }

  function submitForm(e) {
    e.preventDefault();
    showError('');
    var form = overlay.querySelector('[data-ifx-feat-form]');
    var payload = {
      title: form.title.value.trim(),
      idea_description: form.idea_description.value.trim(),
      expectation_description: form.expectation_description.value.trim(),
      turnstile_token: global.IfluxTurnstile ? IfluxTurnstile.getToken(turnstileId) : ''
    };
    if (!payload.title) return showError('Vui lòng nhập tiêu đề.');
    if (!payload.idea_description) return showError('Vui lòng mô tả ý tưởng.');
    if (!payload.expectation_description) return showError('Vui lòng mô tả kỳ vọng.');
    if (!payload.turnstile_token) return showError('Vui lòng hoàn tất xác minh chống spam.');

    var btn = form.querySelector('[type="submit"]');
    if (btn) btn.disabled = true;
    fetchJson(API, { method: 'POST', body: JSON.stringify(payload) })
      .then(function () {
        form.reset();
        if (global.IfluxTurnstile) IfluxTurnstile.reset(turnstileId);
        toast('Đã gửi đề xuất — cảm ơn bạn!', 'success');
        switchTab('list');
        loadList();
      })
      .catch(function (err) {
        showError(err.message || 'Gửi thất bại');
        if (global.IfluxTurnstile) IfluxTurnstile.reset(turnstileId);
      })
      .finally(function () { if (btn) btn.disabled = false; });
  }

  function toggleLike(id) {
    fetchJson(API + '/' + encodeURIComponent(id) + '/like', { method: 'POST', body: '{}' })
      .then(function (data) {
        var item = data.item;
        var countEl = overlay.querySelector('[data-ifx-feat-votes="' + id + '"]');
        var btn = overlay.querySelector('[data-ifx-feat-like="' + id + '"]');
        if (countEl) countEl.textContent = String(item.likeCount || 0);
        if (btn) {
          btn.classList.toggle('is-active', !!item.liked);
          var icon = btn.querySelector('i');
          if (icon) icon.className = 'ti ti-thumb-up' + (item.liked ? '-filled' : '');
        }
      })
      .catch(function (err) { toast(err.message || 'Không thể thích', 'warning'); });
  }

  function buildModal() {
    if (overlay) return overlay;
    overlay = document.getElementById('ifxFeatureSuggestModal');
    if (overlay) return overlay;
    overlay = document.createElement('div');
    overlay.className = 'ix-modal-overlay ifx-feat-modal';
    overlay.id = 'ifxFeatureSuggestModal';
    overlay.setAttribute('data-ifx-modal', '');
    overlay.innerHTML =
      '<div class="ix-modal-box">' +
        '<button type="button" class="ix-modal-close" data-ifx-feat-close><i class="ti ti-x"></i></button>' +
        '<div class="ix-modal-title">Đề xuất tính năng</div>' +
        '<div class="ix-modal-sub">Bình chọn ý tưởng phổ biến hoặc gửi đề xuất mới để đội ngũ iFlux cân nhắc.</div>' +
        '<div class="ix-tabs ifx-req-tabs" role="tablist" style="margin-top:var(--ifx-space-12)">' +
          '<button type="button" class="ix-tab active" role="tab" aria-selected="true" data-ifx-feat-tab="list"><i class="ti ti-flame"></i> Đề xuất nổi bật</button>' +
          '<button type="button" class="ix-tab" role="tab" aria-selected="false" data-ifx-feat-tab="submit"><i class="ti ti-send"></i> Gửi đề xuất</button>' +
        '</div>' +
        '<div class="ifx-feat-modal__body">' +
          '<div class="ix-tab-content active" data-ifx-feat-panel="list">' +
            '<div class="ifx-feat-list" data-ifx-feat-list></div>' +
          '</div>' +
          '<div class="ix-tab-content" data-ifx-feat-panel="submit">' +
            '<form data-ifx-feat-form class="ifx-feat-form" style="margin-top:0;padding-top:0;border-top:none">' +
              '<div class="ix-form-group"><label class="ix-label">Tiêu đề <span style="color:var(--ix-danger)">*</span></label><input type="text" class="ix-input" name="title" placeholder="VD: Thêm cảnh báo giá theo email" maxlength="200" required /></div>' +
              '<div class="ix-form-group"><label class="ix-label">Mô tả ý tưởng <span style="color:var(--ix-danger)">*</span></label><textarea class="ix-input" name="idea_description" rows="3" placeholder="Bạn muốn iFlux có tính năng gì?" maxlength="2000" required></textarea></div>' +
              '<div class="ix-form-group"><label class="ix-label">Kỳ vọng <span style="color:var(--ix-danger)">*</span></label><textarea class="ix-input" name="expectation_description" rows="2" placeholder="Tính năng này giúp ích gì cho bạn?" maxlength="2000" required></textarea></div>' +
              '<div class="ix-form-group"><div data-ifx-feat-turnstile></div></div>' +
              '<div data-ifx-feat-error class="ix-alert ix-alert-danger" style="margin-bottom:var(--ifx-space-12);display:none"></div>' +
              '<button type="submit" class="ix-btn ix-btn-primary"><i class="ti ti-send"></i> Gửi đề xuất</button>' +
            '</form>' +
          '</div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);
    return overlay;
  }

  function bindEvents() {
    if (bound) return;
    bound = true;
    buildModal();

    document.addEventListener('click', function (e) {
      if (e.target.closest('[data-ifx-feat-open]')) {
        e.preventDefault();
        open();
        return;
      }
      if (e.target.closest('[data-ifx-feat-close]')) {
        e.preventDefault();
        close();
        return;
      }
      var likeBtn = e.target.closest('[data-ifx-feat-like]');
      if (likeBtn) {
        e.preventDefault();
        toggleLike(likeBtn.getAttribute('data-ifx-feat-like'));
        return;
      }
      var tabBtn = e.target.closest('[data-ifx-feat-tab]');
      if (tabBtn && overlay && overlay.contains(tabBtn)) {
        e.preventDefault();
        switchTab(tabBtn.getAttribute('data-ifx-feat-tab'));
      }
    });

    if (overlay) {
      overlay.addEventListener('click', function (e) {
        if (e.target === overlay) close();
      });
      var form = overlay.querySelector('[data-ifx-feat-form]');
      if (form) form.addEventListener('submit', submitForm);
    }
  }

  function init() {
    bindEvents();
  }

  global.IfluxFeatureSuggestionsUI = { init: init, open: open, close: close, refresh: loadList };
})(window);
