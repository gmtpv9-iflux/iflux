/* Form viết bài — Article SoT (category 1 · chủ đề 1 · XOR entity · SEO) */
(function (global) {
  'use strict';

  function st() { return global.IfluxCommunityStore; }
  function auth() { return global.IfluxAuth; }

  var selectedChuDe = null;
  var categories = [];
  var entityMode = 'tickers';
  var suggestTimer = null;

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function slugify(s) {
    return String(s || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 160);
  }

  function parseCsv(val, max) {
    var out = [];
    String(val || '').split(/[,;\s]+/).forEach(function (x) {
      var v = x.trim();
      if (!v) return;
      if (out.indexOf(v) < 0) out.push(v);
    });
    return out.slice(0, max || 99);
  }

  function apiBase() {
    if (global.IfluxApi && IfluxApi.baseUrl) return String(IfluxApi.baseUrl).replace(/\/$/, '');
    return '/api';
  }

  function request(path, options) {
    options = options || {};
    var headers = { Accept: 'application/json', 'Content-Type': 'application/json' };
    var token = auth() && auth().getToken && auth().getToken();
    if (token) headers.Authorization = 'Bearer ' + token;
    return fetch(apiBase() + path, {
      method: options.method || 'GET',
      headers: headers,
      body: options.body != null ? JSON.stringify(options.body) : undefined
    }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (data) {
        if (!res.ok) {
          var err = data.error;
          var msg = (err && err.message) || data.message || ('HTTP ' + res.status);
          throw new Error(msg);
        }
        return (data && data.data) != null ? data.data : data;
      });
    });
  }

  function toast(msg, type) {
    if (global.ixToast) ixToast(msg, type || 'info');
    else window.alert(msg);
  }

  function setChuDe(item) {
    selectedChuDe = item || null;
    var box = document.querySelector('[data-ifx-com-chude-selected]');
    if (!box) return;
    if (!selectedChuDe) {
      box.innerHTML = '<span class="ifx-com-hint">Chưa chọn chủ đề</span>';
      var tickBox = document.querySelector('[data-ifx-com-ticker-suggest]');
      if (tickBox) tickBox.innerHTML = '';
      return;
    }
    box.innerHTML =
      '<span class="ix-chip ix-chip-primary">' + esc(selectedChuDe.name) +
      (selectedChuDe.post_count != null ? ' · ' + selectedChuDe.post_count + ' bài' : '') +
      '</span> <button type="button" class="ix-btn ix-btn-outline ix-btn-sm" data-ifx-com-chude-clear>Bỏ chọn</button>';
    var clearBtn = box.querySelector('[data-ifx-com-chude-clear]');
    if (clearBtn) clearBtn.addEventListener('click', function () { setChuDe(null); });
    loadTickerSuggest();
  }

  function renderSuggest(list, q) {
    var el = document.querySelector('[data-ifx-com-chude-suggest]');
    if (!el) return;
    q = String(q || '').trim();
    if (!list || !list.length) {
      el.innerHTML = q
        ? '<button type="button" class="ix-btn ix-btn-outline ix-btn-sm" data-ifx-com-chude-create><i class="ti ti-plus"></i> Tạo chủ đề: «' + esc(q) + '»</button>'
        : '<span class="ifx-com-hint">Gõ tiêu đề hoặc tìm chủ đề…</span>';
      var createBtn = el.querySelector('[data-ifx-com-chude-create]');
      if (createBtn) createBtn.addEventListener('click', function () { createChuDe(q); });
      return;
    }
    el.innerHTML = list.map(function (it, idx) {
      return '<button type="button" class="ix-btn ix-btn-outline ix-btn-sm" data-chude-idx="' + idx + '">' +
        esc(it.name) + (it.post_count != null ? ' <span class="ifx-com-hint">(' + it.post_count + ')</span>' : '') +
        '</button>';
    }).join(' ') +
      '<div class="ifx-com-hint" style="margin-top:8px"><button type="button" class="ix-btn ix-btn-outline ix-btn-sm" data-ifx-com-chude-create><i class="ti ti-plus"></i> Tạo chủ đề mới</button></div>';
    el.querySelectorAll('[data-chude-idx]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        setChuDe(list[Number(btn.getAttribute('data-chude-idx'))]);
      });
    });
    var createBtn2 = el.querySelector('[data-ifx-com-chude-create]');
    if (createBtn2) {
      createBtn2.addEventListener('click', function () {
        var name = (document.querySelector('[data-ifx-com-chude-q]') || {}).value ||
          (document.querySelector('[data-ifx-com-title]') || {}).value || '';
        createChuDe(String(name).trim());
      });
    }
  }

  function suggestChuDe(q) {
    return request('/community/chu-de/suggest?q=' + encodeURIComponent(q || '') + '&limit=8')
      .then(function (data) { renderSuggest(data.suggestions || [], q); })
      .catch(function () { renderSuggest([], q); });
  }

  function createChuDe(name) {
    if (!name) {
      toast('Nhập tên chủ đề', 'warning');
      return;
    }
    request('/community/chu-de', { method: 'POST', body: { name: name } })
      .then(function (data) {
        var item = data.chu_de || data;
        setChuDe({ id: item.id, slug: item.slug, name: item.name || item.label, post_count: item.post_count || 0 });
        toast(item.created === false ? 'Đã chọn chủ đề có sẵn' : 'Đã tạo chủ đề mới', 'success');
        var box = document.querySelector('[data-ifx-com-chude-suggest]');
        if (box) box.innerHTML = '';
      })
      .catch(function (err) {
        toast(err.message || 'Không tạo được chủ đề', 'warning');
      });
  }

  function loadTickerSuggest() {
    var box = document.querySelector('[data-ifx-com-ticker-suggest]');
    if (!box || !selectedChuDe) return;
    var ref = selectedChuDe.id || selectedChuDe.slug;
    request('/community/chu-de/' + encodeURIComponent(ref) + '/tickers?limit=10')
      .then(function (data) {
        var list = data.tickers || [];
        if (!list.length) {
          box.innerHTML = '<span class="ifx-com-hint">Chủ đề mới — hãy tự gắn mã cổ phiếu liên quan.</span>';
          return;
        }
        box.innerHTML = '<div class="ifx-com-hint">Mã thường gắn với chủ đề này:</div>' +
          list.map(function (t) {
            return '<button type="button" class="ix-btn ix-btn-outline ix-btn-sm" data-add-ticker="' + esc(t.ticker) + '">' +
              esc(t.ticker) + (t.mention_count ? ' (' + t.mention_count + ')' : '') + '</button>';
          }).join(' ');
        box.querySelectorAll('[data-add-ticker]').forEach(function (btn) {
          btn.addEventListener('click', function () { addTicker(btn.getAttribute('data-add-ticker')); });
        });
      })
      .catch(function () { box.innerHTML = ''; });
  }

  function addTicker(tk) {
    var el = document.querySelector('[data-ifx-com-tickers]');
    if (!el) return;
    var cur = parseCsv(el.value, 5);
    tk = String(tk || '').toUpperCase();
    if (cur.indexOf(tk) < 0) {
      if (cur.length >= 5) {
        toast('Tối đa 5 mã cổ phiếu', 'warning');
        return;
      }
      cur.push(tk);
    }
    el.value = cur.join(', ');
    setEntityMode('tickers');
  }

  function setEntityMode(mode) {
    entityMode = mode;
    ['tickers', 'sectors', 'ecosystems', 'exchange'].forEach(function (m) {
      var row = document.querySelector('[data-ifx-com-entity="' + m + '"]');
      if (row) row.hidden = m !== mode;
      var tab = document.querySelector('[data-ifx-com-entity-mode="' + m + '"]');
      if (tab) {
        tab.classList.toggle('ix-btn-primary', m === mode);
        tab.classList.toggle('ix-btn-outline', m !== mode);
      }
    });
  }

  function loadCategories() {
    return request('/community/categories').then(function (data) {
      categories = data.categories || [];
      var box = document.querySelector('[data-ifx-com-category]');
      if (!box) return;
      var roots = categories.filter(function (c) { return !c.parent_id; });
      box.innerHTML = '<option value="">— Chọn 1 danh mục —</option>' +
        roots.map(function (c) {
          return '<option value="' + esc(c.id) + '">' + esc(c.name) + '</option>';
        }).join('');
    });
  }

  function collectPayload(status) {
    var root = document.querySelector('[data-ifx-community-write]');
    var title = (root.querySelector('[data-ifx-com-title]') || {}).value || '';
    title = String(title).trim();
    var categoryId = (root.querySelector('[data-ifx-com-category]') || {}).value || '';
    if (!title) throw new Error('Tiêu đề là bắt buộc');
    if (!categoryId) throw new Error('Chọn đúng 1 danh mục');
    if (!selectedChuDe) throw new Error('Chọn hoặc tạo 1 chủ đề');

    var tickers = [];
    var sectors = [];
    var ecosystems = [];
    var exchange = null;
    if (entityMode === 'tickers') {
      tickers = parseCsv((root.querySelector('[data-ifx-com-tickers]') || {}).value, 5).map(function (t) {
        return t.toUpperCase();
      });
    }
    if (entityMode === 'sectors') sectors = parseCsv((root.querySelector('[data-ifx-com-sectors]') || {}).value, 3);
    if (entityMode === 'ecosystems') ecosystems = parseCsv((root.querySelector('[data-ifx-com-ecosystems]') || {}).value, 3);
    if (entityMode === 'exchange') exchange = ((root.querySelector('[data-ifx-com-exchange]') || {}).value || '').trim() || null;

    var excerpt = String((root.querySelector('[data-ifx-com-excerpt]') || {}).value || '').trim();
    var seoTitle = String((root.querySelector('[data-ifx-com-meta-title]') || {}).value || '').trim();
    var seoDesc = String((root.querySelector('[data-ifx-com-meta-desc]') || {}).value || '').trim();
    var user = auth() && auth().getUser && auth().getUser();

    return {
      title: title,
      slug: String((root.querySelector('[data-ifx-com-slug]') || {}).value || '').trim() || slugify(title),
      excerpt: excerpt,
      body_html: String((root.querySelector('[data-ifx-com-body]') || {}).value || '').trim(),
      category_id: categoryId,
      chu_de_id: selectedChuDe.id,
      chu_de_slug: selectedChuDe.slug,
      chu_de_name: selectedChuDe.name,
      tickers: tickers,
      sectors: sectors,
      ecosystems: ecosystems,
      exchange: exchange,
      cover: {
        url: String((root.querySelector('[data-ifx-com-cover-url]') || {}).value || '').trim(),
        alt: String((root.querySelector('[data-ifx-com-cover-alt]') || {}).value || '').trim()
      },
      seo: {
        title: seoTitle || title,
        description: seoDesc || excerpt,
        keywords: String((root.querySelector('[data-ifx-com-focus-kw]') || {}).value || '').trim(),
        canonical: String((root.querySelector('[data-ifx-com-canonical]') || {}).value || '').trim()
      },
      status: status,
      display: { featured: false, pin: false, comments: true, share: true },
      display_name: (user && (user.display_name || user.name || user.email)) || 'Thành viên'
    };
  }

  function submit(status) {
    var payload;
    try {
      payload = collectPayload(status);
    } catch (e) {
      toast(e.message, 'warning');
      return;
    }
    request('/community/posts', { method: 'POST', body: payload })
      .then(function (data) {
        var post = data.article || data.post || data;
        toast(status === 'draft' ? 'Đã lưu nháp' : 'Đã gửi bài (chờ duyệt)', 'success');
        var href = '/cong-dong';
        if (post && (post.slug || post.id)) {
          href = '/cong-dong/bai-viet/' + encodeURIComponent(post.slug || post.id);
        }
        location.href = href;
      })
      .catch(function (err) {
        toast(err.message || 'Không gửi được bài', 'warning');
      });
  }

  function render(root) {
    if (!root) return;

    var user = auth() && auth().getUser && auth().getUser();
    if (st() && st().canWrite && !st().canWrite(user)) {
      root.innerHTML =
        '<div class="ifx-com-empty">' +
          '<i class="ti ti-lock" style="font-size:32px;opacity:.5"></i>' +
          '<p>Chỉ thành viên <strong>Premium</strong>, Elite trở lên mới được viết bài.</p>' +
          '<button type="button" class="ix-btn ix-btn-primary ix-btn-sm" onclick="IfluxWebUI&&IfluxWebUI.openPricing({reason:\'premium_feature\'})">Xem gói đăng ký</button> ' +
          '<a href="/cong-dong" class="ix-btn ix-btn-outline ix-btn-sm">Quay lại Cộng đồng</a>' +
        '</div>';
      return;
    }

    root.innerHTML =
      '<nav class="ifx-com-breadcrumb"><a href="/cong-dong"><i class="ti ti-arrow-left"></i> Cộng đồng</a></nav>' +
      '<h1 class="ix-page-title" style="font-size:22px;margin-bottom:8px">Viết bài mới</h1>' +
      '<p class="ifx-com-intro">Theo SoT Article: tiêu đề → gợi ý chủ đề → gắn mã/ngành/HST/sàn → nội dung → SEO.</p>' +
      '<form class="ifx-com-write" data-ifx-com-write-form>' +

        '<section class="ifx-com-write__section">' +
          '<h2><i class="ti ti-file-text"></i> Tiêu đề &amp; nội dung</h2>' +
          '<div class="ix-form-group"><label class="ix-label">Tiêu đề *</label>' +
            '<input type="text" class="ix-input" data-ifx-com-title required maxlength="200" placeholder="VD: Đầu tư công sẽ bùng nổ trong nửa cuối năm" /></div>' +
          '<div class="ix-form-group"><label class="ix-label">Slug URL</label>' +
            '<input type="text" class="ix-input" data-ifx-com-slug placeholder="tự tạo từ tiêu đề" /></div>' +
          '<div class="ix-form-group"><label class="ix-label">Tóm tắt</label>' +
            '<textarea class="ix-input" rows="2" data-ifx-com-excerpt maxlength="300" placeholder="Lead ngắn cho feed &amp; SEO"></textarea></div>' +
          '<div class="ix-form-group"><label class="ix-label">Nội dung (HTML)</label>' +
            '<textarea class="ix-input ifx-com-write__body" rows="12" data-ifx-com-body placeholder="<p>Đoạn mở...</p>"></textarea></div>' +
        '</section>' +

        '<section class="ifx-com-write__section">' +
          '<h2><i class="ti ti-category"></i> Danh mục *</h2>' +
          '<div class="ix-form-group"><label class="ix-label">Chọn đúng 1 danh mục</label>' +
            '<select class="ix-input" data-ifx-com-category required></select></div>' +
        '</section>' +

        '<section class="ifx-com-write__section">' +
          '<h2><i class="ti ti-bookmark"></i> Chủ đề * <span class="ifx-com-hint">(đúng 1)</span></h2>' +
          '<div data-ifx-com-chude-selected class="ifx-com-hint" style="margin-bottom:12px">Chưa chọn chủ đề</div>' +
          '<div class="ix-form-group"><label class="ix-label">Tìm / tạo chủ đề</label>' +
            '<input type="text" class="ix-input" data-ifx-com-chude-q placeholder="Gõ để tìm hoặc tạo mới…" /></div>' +
          '<div data-ifx-com-chude-suggest></div>' +
          '<div data-ifx-com-ticker-suggest style="margin-top:12px"></div>' +
        '</section>' +

        '<section class="ifx-com-write__section">' +
          '<h2><i class="ti ti-link"></i> Gắn thị trường</h2>' +
          '<p class="ifx-com-hint">Chỉ một nhóm: 0–5 mã CP · hoặc 0–3 ngành · hoặc 0–3 HST · hoặc 0–1 sàn.</p>' +
          '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px">' +
            '<button type="button" class="ix-btn ix-btn-sm ix-btn-primary" data-ifx-com-entity-mode="tickers">Cổ phiếu</button>' +
            '<button type="button" class="ix-btn ix-btn-sm ix-btn-outline" data-ifx-com-entity-mode="sectors">Ngành</button>' +
            '<button type="button" class="ix-btn ix-btn-sm ix-btn-outline" data-ifx-com-entity-mode="ecosystems">Hệ sinh thái</button>' +
            '<button type="button" class="ix-btn ix-btn-sm ix-btn-outline" data-ifx-com-entity-mode="exchange">Sàn</button>' +
          '</div>' +
          '<div class="ix-form-group" data-ifx-com-entity="tickers"><label class="ix-label">Mã CP (tối đa 5)</label>' +
            '<input type="text" class="ix-input" data-ifx-com-tickers placeholder="VCG, HHV, C4G" /></div>' +
          '<div class="ix-form-group" data-ifx-com-entity="sectors" hidden><label class="ix-label">Ngành (tối đa 3)</label>' +
            '<input type="text" class="ix-input" data-ifx-com-sectors placeholder="ngan-hang, thep" /></div>' +
          '<div class="ix-form-group" data-ifx-com-entity="ecosystems" hidden><label class="ix-label">HST (tối đa 3)</label>' +
            '<input type="text" class="ix-input" data-ifx-com-ecosystems placeholder="vin, masan" /></div>' +
          '<div class="ix-form-group" data-ifx-com-entity="exchange" hidden><label class="ix-label">Sàn (0–1)</label>' +
            '<select class="ix-input" data-ifx-com-exchange"><option value="">— Không gắn —</option>' +
            '<option value="VNIndex">VNIndex</option><option value="HOSE">HOSE</option><option value="HNX">HNX</option><option value="UPCOM">UPCOM</option></select></div>' +
        '</section>' +

        '<section class="ifx-com-write__section">' +
          '<h2><i class="ti ti-photo"></i> Ảnh đại diện</h2>' +
          '<div class="ifx-com-write__grid2">' +
            '<div class="ix-form-group"><label class="ix-label">URL ảnh</label><input type="url" class="ix-input" data-ifx-com-cover-url /></div>' +
            '<div class="ix-form-group"><label class="ix-label">Alt</label><input type="text" class="ix-input" data-ifx-com-cover-alt /></div>' +
          '</div>' +
        '</section>' +

        '<section class="ifx-com-write__section">' +
          '<h2><i class="ti ti-seo"></i> SEO</h2>' +
          '<div class="ix-form-group"><label class="ix-label">Meta title</label>' +
            '<input type="text" class="ix-input" data-ifx-com-meta-title maxlength="70" /></div>' +
          '<div class="ix-form-group"><label class="ix-label">Meta description</label>' +
            '<textarea class="ix-input" rows="2" data-ifx-com-meta-desc maxlength="170"></textarea></div>' +
          '<div class="ifx-com-write__grid2">' +
            '<div class="ix-form-group"><label class="ix-label">Từ khóa</label><input type="text" class="ix-input" data-ifx-com-focus-kw /></div>' +
            '<div class="ix-form-group"><label class="ix-label">Canonical</label><input type="url" class="ix-input" data-ifx-com-canonical /></div>' +
          '</div>' +
        '</section>' +

        '<div class="ifx-com-write__actions">' +
          '<button type="button" class="ix-btn ix-btn-outline" data-ifx-com-draft>Lưu nháp</button>' +
          '<button type="submit" class="ix-btn ix-btn-primary"><i class="ti ti-send"></i> Gửi duyệt</button>' +
        '</div>' +
      '</form>';

    var titleEl = root.querySelector('[data-ifx-com-title]');
    var slugEl = root.querySelector('[data-ifx-com-slug]');
    if (titleEl) {
      titleEl.addEventListener('input', function () {
        if (slugEl && !slugEl.dataset.touched) slugEl.value = slugify(titleEl.value);
        clearTimeout(suggestTimer);
        suggestTimer = setTimeout(function () { suggestChuDe(titleEl.value); }, 280);
      });
    }
    if (slugEl) {
      slugEl.addEventListener('input', function () { slugEl.dataset.touched = '1'; });
    }
    var qEl = root.querySelector('[data-ifx-com-chude-q]');
    if (qEl) {
      qEl.addEventListener('input', function () {
        clearTimeout(suggestTimer);
        suggestTimer = setTimeout(function () { suggestChuDe(qEl.value); }, 220);
      });
    }
    root.querySelectorAll('[data-ifx-com-entity-mode]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        setEntityMode(btn.getAttribute('data-ifx-com-entity-mode'));
      });
    });
    root.querySelector('[data-ifx-com-write-form]').addEventListener('submit', function (e) {
      e.preventDefault();
      submit('pending');
    });
    root.querySelector('[data-ifx-com-draft]').addEventListener('click', function () {
      submit('draft');
    });

    setEntityMode('tickers');
    loadCategories().then(function () { suggestChuDe(''); }).catch(function (err) {
      toast(err.message || 'Không tải danh mục', 'warning');
    });
  }

  function init() {
    render(document.querySelector('[data-ifx-community-write]'));
  }

  global.IfluxCommunityWritePage = { init: init };
})(window);
