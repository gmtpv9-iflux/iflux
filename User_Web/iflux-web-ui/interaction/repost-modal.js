/* Repost Modal — nút "Đăng lại" trên trang Bài viết Tin tức (Owner yêu cầu 2026-10). Mở popup
 * cho phép user viết thêm góc nhìn + gắn thẻ Thực thể (Cổ phiếu/Ngành/Hệ sinh thái/Câu chuyện)
 * rồi đăng thành 1 Post Cộng đồng thật (post_type='share', source_type='news') — tái dùng ĐÚNG
 * API POST /api/community/posts đã có (Community Post model, SoT §4), không viết luồng đăng bài
 * riêng cho trang Tin tức. Modal dùng chung .ix-modal-* (DS) — không viết CSS modal riêng.
 */
(function (global) {
  'use strict';
  if (global.IfluxRepostModal) return;

  var ENTITY_TYPE_LABEL = { stock: 'Cổ phiếu', sector: 'Ngành', family: 'Hệ sinh thái', story: 'Câu chuyện' };
  var modalEl = null;
  var entityRefs = [];

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function apiBase() {
    try {
      var host = String((global.location && location.hostname) || '').toLowerCase();
      if (host === 'iflux.vn' || host === 'www.iflux.vn' || host.indexOf('staging.') === 0) return '/api';
    } catch (e) { /* ignore */ }
    return '/api';
  }

  function token() {
    try {
      if (global.IfluxAuth && IfluxAuth.getToken) return IfluxAuth.getToken();
    } catch (e) { /* ignore */ }
    return null;
  }

  function authHeaders() {
    var h = { Accept: 'application/json', 'Content-Type': 'application/json' };
    var t = token();
    if (t) h.Authorization = 'Bearer ' + t;
    return h;
  }

  function toast(msg, type) {
    if (global.IfxToast && IfxToast.show) IfxToast.show(msg, type || 'info');
  }

  function buildModal() {
    if (modalEl) return modalEl;
    modalEl = document.createElement('div');
    modalEl.className = 'ix-modal-overlay';
    modalEl.id = 'ifxRepostModal';
    modalEl.style.display = 'none';
    document.body.appendChild(modalEl);
    modalEl.addEventListener('click', function (e) {
      if (e.target === modalEl || e.target.closest('[data-ifx-modal-close]')) close();
    });
    return modalEl;
  }

  function close() {
    if (modalEl) modalEl.style.display = 'none';
    entityRefs = [];
  }

  function renderChips(root) {
    var box = root.querySelector('[data-ifx-repost-chips]');
    if (!box) return;
    box.innerHTML = entityRefs.map(function (r, i) {
      return '<span class="ix-chip ix-chip-secondary" style="margin:0 6px 6px 0;display:inline-flex;align-items:center;gap:4px">' +
        esc(ENTITY_TYPE_LABEL[r.type] || r.type) + ': ' + esc(r.label) +
        '<button type="button" data-remove-entity="' + i + '" style="background:none;border:0;cursor:pointer;color:inherit;padding:0;line-height:1"><i class="ti ti-x" style="font-size:12px"></i></button>' +
      '</span>';
    }).join('');
    box.querySelectorAll('[data-remove-entity]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        entityRefs.splice(Number(btn.getAttribute('data-remove-entity')), 1);
        renderChips(root);
      });
    });
  }

  /**
   * meta: { postId, title, coverUrl, sourceType }
   * sourceType (Owner 2026-10, VII.7) — 'news' (mặc định, bài Tin tức) | 'communitypost' (Share =
   * Repost 1 Post Cộng đồng khác, cùng cơ chế, không viết action riêng).
   */
  function open(meta) {
    meta = meta || {};
    if (!global.IfluxAuth || !global.IfluxAuth.getUser || !IfluxAuth.getUser()) {
      if (global.IfluxAuth && IfluxAuth.promptLogin) IfluxAuth.promptLogin();
      return;
    }
    entityRefs = [];
    buildModal();
    var previewHtml = meta.title
      ? '<div style="display:flex;gap:10px;align-items:center;padding:10px;border:1px solid var(--ix-border);border-radius:var(--ix-radius-lg);margin-bottom:var(--ifx-space-12)">' +
          (meta.coverUrl ? '<img src="' + esc(meta.coverUrl) + '" alt="" style="width:56px;height:56px;object-fit:cover;border-radius:var(--ix-radius)" />' : '') +
          '<div style="font-size:13px;font-weight:600;line-height:1.4">' + esc(meta.title) + '</div>' +
        '</div>'
      : '';
    modalEl.innerHTML =
      '<div class="ix-modal-box">' +
        '<button type="button" class="ix-modal-close" data-ifx-modal-close><i class="ti ti-x"></i></button>' +
        '<div class="ix-modal-title">Đăng lại</div>' +
        '<div class="ix-modal-sub">Chia sẻ bài viết này lên Cộng đồng, kèm góc nhìn của bạn nếu muốn.</div>' +
        previewHtml +
        '<form data-ifx-repost-form>' +
          '<div class="ix-form-group">' +
            '<textarea class="ix-input" name="content" rows="3" maxlength="6000" placeholder="Thêm bình luận của bạn (không bắt buộc)…"></textarea>' +
          '</div>' +
          '<div class="ix-form-group">' +
            '<label class="ix-label">Gắn thẻ thực thể (không bắt buộc)</label>' +
            '<div style="display:flex;gap:8px">' +
              '<select class="ix-input" data-ifx-repost-entity-type style="flex:0 0 140px">' +
                '<option value="stock">Cổ phiếu</option>' +
                '<option value="sector">Ngành</option>' +
                '<option value="family">Hệ sinh thái</option>' +
                '<option value="story">Câu chuyện</option>' +
              '</select>' +
              '<input type="text" class="ix-input" data-ifx-repost-entity-input placeholder="VD: HPG" />' +
              '<button type="button" class="ix-btn ix-btn-outline" data-ifx-repost-entity-add>Thêm</button>' +
            '</div>' +
            '<div data-ifx-repost-chips style="margin-top:8px"></div>' +
          '</div>' +
          '<div data-ifx-repost-error class="ix-alert ix-alert-danger" style="margin-bottom:var(--ifx-space-12);display:none"></div>' +
          '<button type="submit" class="ix-btn ix-btn-primary"><i class="ti ti-repeat"></i> Đăng lại</button>' +
        '</form>' +
      '</div>';
    modalEl.style.display = 'flex';

    var form = modalEl.querySelector('[data-ifx-repost-form]');
    modalEl.querySelector('[data-ifx-repost-entity-add]').addEventListener('click', function () {
      var typeSel = modalEl.querySelector('[data-ifx-repost-entity-type]');
      var input = modalEl.querySelector('[data-ifx-repost-entity-input]');
      var type = typeSel.value;
      var raw = String(input.value || '').trim();
      if (!raw) return;
      var id = type === 'stock' ? raw.toUpperCase() : raw;
      if (entityRefs.length >= 10) { toast('Tối đa 10 thẻ thực thể', 'warning'); return; }
      if (entityRefs.some(function (r) { return r.type === type && r.id === id; })) { input.value = ''; return; }
      entityRefs.push({ type: type, id: id, label: id });
      input.value = '';
      renderChips(form);
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var content = String(new FormData(form).get('content') || '').trim();
      var submitBtn = form.querySelector('button[type=submit]');
      submitBtn.disabled = true;
      fetch(apiBase() + '/community/posts', {
        method: 'POST',
        headers: authHeaders(),
        credentials: 'same-origin',
        body: JSON.stringify({
          content: content,
          post_type: 'share',
          source_type: meta.sourceType || 'news',
          source_id: String(meta.postId || ''),
          entity_refs: entityRefs
        })
      }).then(function (res) {
        return res.json().then(function (data) { return { res: res, data: data }; });
      }).then(function (out) {
        if (!out.res.ok || !out.data.success) {
          throw new Error((out.data.error && out.data.error.message) || 'Không đăng lại được');
        }
        close();
        toast('Đã đăng lại lên Cộng đồng', 'success');
      }).catch(function (err) {
        submitBtn.disabled = false;
        var errEl = modalEl.querySelector('[data-ifx-repost-error]');
        if (errEl) { errEl.textContent = err.message || 'Có lỗi xảy ra'; errEl.style.display = ''; }
      });
    });
  }

  global.IfluxRepostModal = { open: open, close: close };
})(window);
