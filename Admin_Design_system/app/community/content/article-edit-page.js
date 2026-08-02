/* ADM-COM-CNT-003 — Tạo / sửa bài viết (Article SoT) */
(function () {
  'use strict';

  var editingId = null;
  var categories = [];
  var selectedChuDe = null;
  var entityMode = 'tickers'; /* tickers | sectors | ecosystems | exchange */
  var suggestTimer = null;
  var bodyEditor = null;
  var mediaImportBusy = false;
  var lastMediaCheck = { ok: true, external: [], missing_alt: [] };

  function canPerm(key) {
    return !!(window.IfluxAdminRbac && IfluxAdminRbac.hasPermission && IfluxAdminRbac.hasPermission(key));
  }

  function gateArticleMutateUi() {
    var id = qs('id');
    var need = id ? 'community.articles.edit' : 'community.articles.create';
    var loaded = !!(window.IfluxAdminRbac && IfluxAdminRbac.isLoaded && IfluxAdminRbac.isLoaded());
    var ok = loaded && canPerm(need);
    ['btn-save-draft', 'btn-save-content', 'btn-publish', 'btn-media-import'].forEach(function (bid) {
      var el = $(bid);
      if (el) el.style.display = ok ? '' : 'none';
    });
    var chuDeCreate = $('art-chude-create');
    if (chuDeCreate) chuDeCreate.style.display = (loaded && canPerm('stories.registry.create')) ? '' : 'none';
    if (loaded && !ok) {
      toast(id ? 'Bạn không có quyền sửa bài viết.' : 'Bạn không có quyền tạo bài viết.', 'danger');
    }
  }

  function whenRbacReady(fn) {
    if (window.IfluxAdminRbac && IfluxAdminRbac.refresh) {
      if (IfluxAdminRbac.isLoaded && IfluxAdminRbac.isLoaded()) {
        fn();
      } else {
        IfluxAdminRbac.refresh().then(fn).catch(fn);
      }
      return;
    }
    fn();
  }

  function $(id) { return document.getElementById(id); }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function toast(msg, type) {
    if (typeof window.ixToast === 'function') window.ixToast(msg, type || 'info');
    else window.alert(msg);
  }

  function apiBase() {
    if (window.IfluxAdminAuth && IfluxAdminAuth.apiBase) return IfluxAdminAuth.apiBase();
    return '/api';
  }

  function adminToken() {
    if (window.IfluxAdminAuth && IfluxAdminAuth.getSession) {
      var s = IfluxAdminAuth.getSession();
      if (s && s.token) return s.token;
    }
    try {
      var raw = localStorage.getItem('iflux_admin_session') || sessionStorage.getItem('iflux_admin_session');
      if (raw) {
        var obj = JSON.parse(raw);
        if (obj && obj.token) return obj.token;
      }
    } catch (e) { /* ignore */ }
    return null;
  }

  function authHeaders() {
    var h = { 'Content-Type': 'application/json', Accept: 'application/json' };
    var token = adminToken();
    if (token) {
      h.Authorization = 'Bearer ' + token;
      return h;
    }
    var key = 'iflux-admin-local-dev';
    try {
      var stored = localStorage.getItem('iflux_admin_api_key');
      if (stored) key = stored;
    } catch (e) { /* ignore */ }
    h['X-Admin-Key'] = key;
    return h;
  }

  function unwrap(data) {
    if (data && data.data) return data.data;
    return data || {};
  }

  function request(path, options) {
    options = options || {};
    return fetch(apiBase() + path, {
      method: options.method || 'GET',
      headers: Object.assign(authHeaders(), options.headers || {}),
      body: options.body != null ? JSON.stringify(options.body) : undefined
    }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (data) {
        if (!res.ok) {
          var err = data.error;
          var msg =
            (typeof err === 'string' && err) ||
            (err && err.message) ||
            data.message ||
            ('HTTP ' + res.status);
          throw new Error(msg);
        }
        return unwrap(data);
      });
    });
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

  function qs(name) {
    return new URLSearchParams(window.location.search).get(name);
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

  function setChuDe(item) {
    selectedChuDe = item || null;
    var box = $('art-chude-selected');
    if (!box) return;
    if (!selectedChuDe) {
      box.innerHTML = '<span class="ix-caption">Chưa chọn chủ đề</span>';
      $('art-ticker-suggest').innerHTML = '';
      return;
    }
    box.innerHTML =
      '<span class="ix-chip ix-chip-primary">' + esc(selectedChuDe.name) +
      (selectedChuDe.post_count != null ? ' · ' + selectedChuDe.post_count + ' bài' : '') +
      '</span> <button type="button" class="ix-btn ix-btn-outline ix-btn-sm" id="art-chude-clear">Bỏ chọn</button>';
    var clearBtn = $('art-chude-clear');
    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        setChuDe(null);
      });
    }
    loadTickerSuggest();
  }

  function renderSuggest(list) {
    var el = $('art-chude-suggest');
    if (!el) return;
    if (!list || !list.length) {
      var q = ($('art-chude-q') || {}).value || ($('fld-title') || {}).value || '';
      el.innerHTML = q
        ? '<button type="button" class="ix-btn ix-btn-outline ix-btn-sm" id="art-chude-create"><i class="ti ti-plus"></i> Tạo chủ đề mới: «' + esc(q.trim()) + '»</button>'
        : '<span class="ix-caption">Nhập tiêu đề hoặc tìm chủ đề…</span>';
      var createBtn = $('art-chude-create');
      if (createBtn) {
        createBtn.addEventListener('click', function () {
          createChuDe(String(q).trim());
        });
      }
      return;
    }
    el.innerHTML = list.map(function (it, idx) {
      return '<button type="button" class="ix-btn ix-btn-outline ix-btn-sm" data-chude-idx="' + idx + '">' +
        esc(it.name) + (it.post_count != null ? ' <span class="ix-caption">(' + it.post_count + ')</span>' : '') +
        '</button>';
    }).join(' ') +
      '<div class="ix-mt-8"><button type="button" class="ix-btn ix-btn-outline ix-btn-sm" id="art-chude-create"><i class="ti ti-plus"></i> Tạo chủ đề mới</button></div>';
    el.querySelectorAll('[data-chude-idx]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var i = Number(btn.getAttribute('data-chude-idx'));
        setChuDe(list[i]);
      });
    });
    var createBtn2 = $('art-chude-create');
    if (createBtn2) {
      createBtn2.addEventListener('click', function () {
        var name = ($('art-chude-q').value || $('fld-title').value || '').trim();
        createChuDe(name);
      });
    }
  }

  function suggestChuDe(q) {
    return request('/community/chu-de/suggest?q=' + encodeURIComponent(q || '') + '&limit=8')
      .then(function (data) {
        renderSuggest(data.suggestions || []);
      })
      .catch(function () {
        renderSuggest([]);
      });
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
        $('art-chude-suggest').innerHTML = '';
      })
      .catch(function (err) {
        toast(err.message || 'Không tạo được chủ đề', 'danger');
      });
  }

  function loadTickerSuggest() {
    var box = $('art-ticker-suggest');
    if (!box || !selectedChuDe) return;
    var ref = selectedChuDe.id || selectedChuDe.slug;
    request('/community/chu-de/' + encodeURIComponent(ref) + '/tickers?limit=10')
      .then(function (data) {
        var list = data.tickers || [];
        if (!list.length) {
          box.innerHTML = '<span class="ix-caption">Chủ đề mới — hãy tự gắn mã cổ phiếu liên quan.</span>';
          return;
        }
        box.innerHTML = '<div class="ix-caption ix-mb-8">Mã thường gắn với chủ đề này:</div>' +
          list.map(function (t) {
            return '<button type="button" class="ix-btn ix-btn-outline ix-btn-sm" data-add-ticker="' + esc(t.ticker) + '">' +
              esc(t.ticker) + (t.mention_count ? ' (' + t.mention_count + ')' : '') + '</button>';
          }).join(' ');
        box.querySelectorAll('[data-add-ticker]').forEach(function (btn) {
          btn.addEventListener('click', function () {
            addTicker(btn.getAttribute('data-add-ticker'));
          });
        });
      })
      .catch(function () {
        box.innerHTML = '';
      });
  }

  function addTicker(tk) {
    var el = $('fld-tickers');
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
      var row = $('art-entity-' + m);
      if (row) row.hidden = m !== mode;
      var tab = document.querySelector('[data-entity-mode="' + m + '"]');
      if (tab) {
        tab.classList.toggle('ix-btn-primary', m === mode);
        tab.classList.toggle('ix-btn-outline', m !== mode);
      }
    });
  }

  function loadCategories() {
    return request('/community/admin/categories').then(function (data) {
      categories = data.categories || [];
      var box = $('fld-category');
      if (!box) return;
      var roots = categories.filter(function (c) { return !c.parent_id; });
      box.innerHTML = '<option value="">— Chọn 1 danh mục —</option>' +
        roots.map(function (c) {
          return '<option value="' + esc(c.id) + '">' + esc(c.name) + '</option>';
        }).join('');
    });
  }

  function collectPayload(statusOverride) {
    var title = ($('fld-title').value || '').trim();
    var categoryId = $('fld-category').value;
    if (!title) throw new Error('Tiêu đề là bắt buộc');
    if (!categoryId) throw new Error('Chọn đúng 1 danh mục');

    var tickers = [];
    var sectors = [];
    var ecosystems = [];
    var exchange = null;
    if (entityMode === 'tickers') tickers = parseCsv($('fld-tickers').value, 5).map(function (t) { return t.toUpperCase(); });
    if (entityMode === 'sectors') sectors = parseCsv($('fld-sectors').value, 3);
    if (entityMode === 'ecosystems') ecosystems = parseCsv($('fld-ecosystems').value, 3);
    if (entityMode === 'exchange') exchange = ($('fld-exchange').value || '').trim() || null;

    var status = statusOverride || $('fld-status').value || 'draft';
    var seoTitle = ($('fld-seo-title').value || '').trim();
    var seoDesc = ($('fld-seo-desc').value || '').trim();
    var excerpt = ($('fld-excerpt').value || '').trim();

    return {
      title: title,
      slug: ($('fld-slug').value || '').trim() || slugify(title),
      excerpt: excerpt,
      body_html: bodyEditor
        ? bodyEditor.getBodyHtml()
        : (($('fld-body') && $('fld-body').value) || '').trim(),
      category_id: categoryId,
      chu_de_id: selectedChuDe ? selectedChuDe.id : null,
      chu_de_slug: selectedChuDe ? (selectedChuDe.slug || '') : '',
      chu_de_name: selectedChuDe ? (selectedChuDe.name || '') : '',
      tickers: tickers,
      sectors: sectors,
      ecosystems: ecosystems,
      exchange: exchange,
      cover: {
        url: ($('fld-cover-url').value || '').trim(),
        alt: ($('fld-cover-alt').value || '').trim(),
        caption: ($('fld-cover-caption').value || '').trim(),
        credit: ($('fld-cover-credit').value || '').trim()
      },
      seo: {
        title: seoTitle || title,
        description: seoDesc || excerpt,
        keywords: ($('fld-seo-keywords').value || '').trim(),
        canonical: ($('fld-seo-canonical').value || '').trim()
      },
      status: status,
      display: {
        featured: !!($('fld-d-featured') || {}).checked,
        pin: !!($('fld-d-pin') || {}).checked,
        comments: ($('fld-d-comments') || { checked: true }).checked !== false,
        share: ($('fld-d-share') || { checked: true }).checked !== false
      },
      scheduled_at: status === 'scheduled' ? (($('fld-publish-at') || {}).value || null) : null,
      created_by_name: 'Admin'
    };
  }

  function fillForm(item) {
    if (!item) return;
    editingId = item.id;
    $('cnt-bc-title').textContent = 'Sửa bài';
    $('cnt-page-title').textContent = 'Sửa bài viết';
    $('fld-title').value = item.title || '';
    $('fld-slug').value = item.slug || '';
    $('fld-excerpt').value = item.excerpt || '';
    if (bodyEditor) bodyEditor.setBodyHtml(item.body_html || '');
    else if ($('fld-body')) $('fld-body').value = item.body_html || '';
    if (item.category_id) $('fld-category').value = item.category_id;
    if (item.chu_de || item.chu_de_id) {
      setChuDe({
        id: item.chu_de_id || (item.chu_de && item.chu_de.id),
        slug: item.chu_de_slug || (item.chu_de && item.chu_de.slug),
        name: item.chu_de_name || (item.chu_de && (item.chu_de.name || item.chu_de.label))
      });
    }
    var cover = item.cover || {};
    $('fld-cover-url').value = cover.url || '';
    $('fld-cover-alt').value = cover.alt || '';
    $('fld-cover-caption').value = cover.caption || '';
    $('fld-cover-credit').value = cover.credit || '';
    var seo = item.seo || {};
    $('fld-seo-title').value = seo.title || '';
    $('fld-seo-desc').value = seo.description || '';
    $('fld-seo-keywords').value = seo.keywords || '';
    $('fld-seo-canonical').value = seo.canonical || '';
    $('fld-status').value = item.status || 'draft';
    var pubAt = item.scheduled_at || item.published_at || '';
    if ($('fld-publish-at') && pubAt) {
      try {
        var dPub = new Date(pubAt);
        if (!isNaN(dPub.getTime())) {
          var pad = function (n) { return n < 10 ? '0' + n : String(n); };
          $('fld-publish-at').value = dPub.getFullYear() + '-' + pad(dPub.getMonth() + 1) + '-' + pad(dPub.getDate()) +
            'T' + pad(dPub.getHours()) + ':' + pad(dPub.getMinutes());
        }
      } catch (ePub) { /* ignore */ }
    }
    var d = item.display || {};
    $('fld-d-featured').checked = !!d.featured;
    $('fld-d-pin').checked = !!(d.pin || d.sticky);
    $('fld-d-comments').checked = d.comments !== false;
    $('fld-d-share').checked = d.share !== false;
    if ((item.tickers || []).length) {
      setEntityMode('tickers');
      $('fld-tickers').value = (item.tickers || []).join(', ');
    } else if ((item.sectors || []).length) {
      setEntityMode('sectors');
      $('fld-sectors').value = (item.sectors || []).join(', ');
    } else if ((item.ecosystems || []).length) {
      setEntityMode('ecosystems');
      $('fld-ecosystems').value = (item.ecosystems || []).join(', ');
    } else if (item.exchange) {
      setEntityMode('exchange');
      $('fld-exchange').value = item.exchange;
    }
  }

  function save(statusOverride) {
    var isPublish = statusOverride === 'published' || statusOverride === 'published_rss';
    var payload;
    try {
      payload = collectPayload(statusOverride);
    } catch (e) {
      toast(e.message, 'warning');
      return;
    }

    function doSave() {
      var req = editingId
        ? request('/community/admin/articles/' + encodeURIComponent(editingId), { method: 'PUT', body: payload })
        : request('/community/admin/articles', { method: 'POST', body: payload });
      return req.then(function (data) {
        var art = data.article || data;
        toast(editingId ? 'Đã cập nhật bài viết' : 'Đã tạo bài viết', 'success');
        if (!editingId && art && art.id) {
          window.location.href = 'edit.html?id=' + encodeURIComponent(art.id);
        } else if (art) {
          fillForm(art);
          return refreshMediaStatus();
        }
      });
    }

    if (isPublish) {
      runPublishCheck(payload).then(function (check) {
        applyMediaUi(check);
        if (!check.ok) {
          var n = (check.external || []).length;
          var m = (check.missing_alt || []).length;
          if (n) toast('Không xuất bản được: còn ' + n + ' ảnh ngoài. Hãy «Nhập vào Thư viện».', 'danger');
          else if (m) toast('Không xuất bản được: còn ' + m + ' ảnh thiếu Alt.', 'danger');
          else toast('Không xuất bản được: kiểm tra ảnh chưa đạt.', 'danger');
          return;
        }
        return doSave();
      }).catch(function (err) {
        toast(err.message || 'Kiểm tra ảnh thất bại', 'danger');
      });
      return;
    }

    doSave().catch(function (err) {
      toast(err.message || 'Lưu thất bại', 'danger');
    });
  }

  function isMediaUrl(url) {
    var u = String(url || '').trim();
    if (!u) return false;
    if (/^\/media\//i.test(u)) return true;
    try {
      var p = new URL(u, window.location.origin);
      return p.pathname.indexOf('/media/') === 0;
    } catch (e) {
      return false;
    }
  }

  function collectLocalExternal(payload) {
    var items = [];
    var seen = Object.create(null);
    function add(url, loc) {
      var u = String(url || '').trim();
      if (!u || isMediaUrl(u)) return;
      if (!/^https?:\/\//i.test(u) && u.charAt(0) !== '/') return;
      if (seen[u]) return;
      seen[u] = true;
      items.push({ url: u, locations: [loc] });
    }
    var html = (payload && payload.body_html) || '';
    var re = /<img\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/gi;
    var m;
    while ((m = re.exec(html))) add(m[1], 'body');
    if (payload && payload.cover) add(payload.cover.url, 'cover');
    if (payload && payload.seo) add(payload.seo.og_image, 'seo');
    return items;
  }

  function applyMediaUi(check) {
    lastMediaCheck = check || { ok: true, external: [], missing_alt: [] };
    var external = lastMediaCheck.external || [];
    var missing = lastMediaCheck.missing_alt || [];
    var banner = $('media-external-banner');
    var title = $('media-external-banner-title');
    var text = $('media-external-banner-text');
    var chip = $('media-status-chip');
    var retry = $('btn-media-retry');
    var progress = $('media-import-progress');

    if (chip) {
      chip.hidden = false;
      chip.className = 'ix-chip';
      if (mediaImportBusy) {
        chip.className = 'ix-chip ix-chip-info';
        chip.textContent = '⏳ Ảnh · Đang nhập…';
      } else if (external.length) {
        chip.className = 'ix-chip ix-chip-warning';
        chip.textContent = '⚠ Ảnh · ' + external.length + ' ảnh ngoài';
      } else if (missing.length) {
        chip.className = 'ix-chip ix-chip-warning';
        chip.textContent = '⚠ Ảnh · ' + missing.length + ' thiếu Alt';
      } else {
        chip.className = 'ix-chip ix-chip-success';
        chip.textContent = '✓ Ảnh · Đã nội địa hóa';
      }
    }

    if (banner) {
      if (external.length || (lastMediaCheck._partial && lastMediaCheck._failed)) {
        banner.hidden = false;
        banner.className = 'ix-alert ix-alert-warning ix-mb-24';
        if (title) {
          title.textContent = external.length
            ? ('Có ' + external.length + ' hình ảnh ngoài · Chưa thuộc Thư viện media')
            : 'Một số ảnh nhập lỗi';
        }
        if (text) {
          text.textContent = external.length
            ? 'Bấm «Nhập vào Thư viện» để tải ảnh về và cập nhật bài viết.'
            : 'Có thể thử lại ảnh lỗi.';
        }
      } else {
        banner.hidden = true;
      }
    }
    if (retry) retry.hidden = !(lastMediaCheck._failed > 0);
    if (progress && !mediaImportBusy) progress.hidden = true;
  }

  function runPublishCheck(payload) {
    var body = payload
      ? {
          article_id: editingId || undefined,
          body_html: payload.body_html,
          cover: payload.cover,
          seo: payload.seo
        }
      : { article_id: editingId };
    return request('/admin/media/publish-check', { method: 'POST', body: body }).then(function (data) {
      return {
        ok: !!(data && data.ok),
        external: (data && data.external) || [],
        missing_alt: (data && data.missing_alt) || []
      };
    });
  }

  function refreshMediaStatus() {
    var payload;
    try {
      payload = collectPayload($('fld-status') ? $('fld-status').value : 'draft');
    } catch (e) {
      var local = collectLocalExternal({
        body_html: bodyEditor ? bodyEditor.getBodyHtml() : '',
        cover: {
          url: ($('fld-cover-url') && $('fld-cover-url').value) || ''
        }
      });
      applyMediaUi({ ok: !local.length, external: local, missing_alt: [] });
      return Promise.resolve();
    }
    return runPublishCheck(payload)
      .then(function (check) {
        applyMediaUi(check);
      })
      .catch(function () {
        var local = collectLocalExternal(payload);
        applyMediaUi({ ok: !local.length, external: local, missing_alt: [] });
      });
  }

  function setImportProgress(msg) {
    var el = $('media-import-progress');
    if (!el) return;
    if (!msg) {
      el.hidden = true;
      el.textContent = '';
      return;
    }
    el.hidden = false;
    el.textContent = msg;
  }

  function runMediaImport() {
    if (mediaImportBusy) return;
    if (!editingId) {
      toast('Hãy lưu bài viết trước khi nhập ảnh vào Thư viện.', 'warning');
      return;
    }
    var canEdit = canPerm('community.articles.edit');
    if (window.IfluxAdminRbac && IfluxAdminRbac.isLoaded && IfluxAdminRbac.isLoaded() && !canEdit) {
      toast('Bạn không có quyền sửa bài viết.', 'danger');
      return;
    }

    var payload;
    try {
      payload = collectPayload($('fld-status') ? $('fld-status').value : 'draft');
    } catch (e) {
      toast(e.message, 'warning');
      return;
    }

    mediaImportBusy = true;
    applyMediaUi(lastMediaCheck);
    setImportProgress('Đang lưu bài rồi nhập vào Thư viện…');
    var importBtn = $('btn-media-import');
    if (importBtn) importBtn.disabled = true;

    request('/community/admin/articles/' + encodeURIComponent(editingId), { method: 'PUT', body: payload })
      .then(function () {
        setImportProgress('Đang nhập vào Thư viện…');
        return request('/admin/media/import', {
          method: 'POST',
          body: { article_id: editingId }
        });
      })
      .then(function (result) {
        var found = (result && result.found) || 0;
        var succeeded = (result && result.succeeded) || 0;
        var reused = (result && result.reused) || 0;
        var failed = (result && result.failed) || 0;
        var status = (result && result.status) || '';
        if (status === 'noop' || found === 0) {
          toast('Không còn ảnh ngoài cần nhập.', 'success');
        } else if (failed > 0) {
          toast(
            'Đã xử lý ' + (succeeded + reused) + ' / ' + found + ' ảnh (' +
              succeeded + ' mới · ' + reused + ' tái sử dụng · ' + failed + ' lỗi)',
            'warning'
          );
        } else {
          toast(
            'Đã xử lý ' + found + ' ảnh (' + succeeded + ' mới · ' + reused + ' tái sử dụng)',
            'success'
          );
        }
        lastMediaCheck._failed = failed;
        lastMediaCheck._partial = status === 'partial';
        return request('/community/admin/articles/' + encodeURIComponent(editingId)).then(function (data) {
          fillForm(data.article || data);
          return refreshMediaStatus();
        });
      })
      .catch(function (err) {
        toast(err.message || 'Nhập vào Thư viện thất bại', 'danger');
      })
      .then(function () {
        mediaImportBusy = false;
        if (importBtn) importBtn.disabled = false;
        setImportProgress('');
        applyMediaUi(lastMediaCheck);
      });
  }

  function bind() {
    var titleEl = $('fld-title');
    if (titleEl) {
      titleEl.addEventListener('input', function () {
        if (!$('fld-slug').dataset.touched) {
          $('fld-slug').value = slugify(titleEl.value);
        }
        clearTimeout(suggestTimer);
        suggestTimer = setTimeout(function () {
          suggestChuDe(titleEl.value);
        }, 280);
      });
    }
    var slugEl = $('fld-slug');
    if (slugEl) {
      slugEl.addEventListener('input', function () {
        slugEl.dataset.touched = '1';
      });
    }
    var qEl = $('art-chude-q');
    if (qEl) {
      qEl.addEventListener('input', function () {
        clearTimeout(suggestTimer);
        suggestTimer = setTimeout(function () {
          suggestChuDe(qEl.value);
        }, 220);
      });
    }
    document.querySelectorAll('[data-entity-mode]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        setEntityMode(btn.getAttribute('data-entity-mode'));
      });
    });
    var draftBtn = $('btn-save-draft');
    if (draftBtn) draftBtn.addEventListener('click', function () { save('draft'); });
    var saveBtn = $('btn-save-content');
    if (saveBtn) saveBtn.addEventListener('click', function () { save(); });
    var pubBtn = $('btn-publish');
    if (pubBtn) pubBtn.addEventListener('click', function () { save('published'); });
    var importBtn = $('btn-media-import');
    if (importBtn) importBtn.addEventListener('click', runMediaImport);
    var retryBtn = $('btn-media-retry');
    if (retryBtn) retryBtn.addEventListener('click', runMediaImport);
  }

  function mountBodyEditor() {
    var root = $('article-body-editor-root');
    if (!root || !window.IfluxArticleBodyEditor) {
      toast('Không khởi tạo được trình soạn thảo', 'danger');
      return;
    }
    try {
      bodyEditor = IfluxArticleBodyEditor.mount(root);
    } catch (err) {
      console.error(err);
      toast(err.message || 'Lỗi TipTap / DOMPurify', 'danger');
    }
  }

  function boot() {
    bind();
    setEntityMode('tickers');
    mountBodyEditor();
    function start() {
      gateArticleMutateUi();
      loadCategories().then(function () {
        var id = qs('id');
        if (!id) {
          suggestChuDe('');
          return;
        }
        return request('/community/admin/articles/' + encodeURIComponent(id)).then(function (data) {
          fillForm(data.article || data);
          return refreshMediaStatus();
        });
      }).catch(function (err) {
        toast(err.message || 'Không tải được dữ liệu', 'danger');
      });
    }
    whenRbacReady(start);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
