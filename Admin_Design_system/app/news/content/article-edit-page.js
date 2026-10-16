/* ADM-COM-CNT-003 — Tạo / sửa bài viết (Article SoT) */
(function () {
  'use strict';

  var editingId = null;
  var eventCaseIds = [];
  var eventRequestId = null;
  var eventListGeneration = 0;
  var selectedComparison = null;
  var comparisonGeneration = 0;
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
    var need = id ? 'news.articles.edit' : 'news.articles.create';
    var loaded = !!(window.IfluxAdminRbac && IfluxAdminRbac.isLoaded && IfluxAdminRbac.isLoaded());
    var ok = loaded && canPerm(need);
    ['btn-save-draft', 'btn-save-content', 'btn-publish', 'btn-media-import', 'btn-event-save'].forEach(function (bid) {
      var el = $(bid);
      if (el) el.style.display = ok ? '' : 'none';
    });
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

  var PUBLIC_ORIGIN = 'https://iflux.vn';

  function syncSlugAndCanonicalFromTitle() {
    var title = ($('fld-title') && $('fld-title').value) || '';
    var isAlreadyPublished = editingId && $('fld-status') && $('fld-status').value === 'published';
    var slug = isAlreadyPublished && $('fld-slug') ? $('fld-slug').value : slugify(title);
    if ($('fld-slug')) $('fld-slug').value = slug;
    if ($('fld-seo-canonical')) {
      $('fld-seo-canonical').value = slug
        ? PUBLIC_ORIGIN + '/tin-tuc/bai-viet/' + encodeURIComponent(slug)
        : '';
    }
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

  /* Owner 2026-10 — "Chủ đề" cũ đổi thành gắn 1 Câu chuyện ĐÃ HÌNH THÀNH (Admin ánh xạ từ Topic ở
     Cộng đồng) — không còn tạo nhanh từ đây (content_chu_de đã dọn, xem migration 075). */
  function setChuDe(item) {
    selectedChuDe = item || null;
    loadEventCases();
    if ($('fld-comparison-scope-type') && $('fld-comparison-scope-type').value === 'story') loadComparisonScopes();
    var box = $('art-chude-selected');
    if (!box) return;
    if (!selectedChuDe) {
      box.innerHTML = '<span class="ix-caption">Chưa chọn câu chuyện</span>';
      return;
    }
    box.innerHTML =
      '<span class="ix-chip ix-chip-primary">' + esc(selectedChuDe.name) + '</span> ' +
      '<button type="button" class="ix-btn ix-btn-outline ix-btn-sm" id="art-chude-clear">Bỏ chọn</button>';
    var clearBtn = $('art-chude-clear');
    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        setChuDe(null);
      });
    }
  }

  function collectComparison() {
    var metric = $('fld-comparison-metric').value;
    if (!metric) return null;
    var tickers = parseCsv($('fld-comparison-tickers').value, 30).map(function (t) { return t.toUpperCase(); });
    var scopeId = $('fld-comparison-scope').value;
    var purpose = $('fld-comparison-purpose').value.trim();
    if (tickers.length < 2 || !scopeId || !purpose) throw new Error('Chọn một nhóm liên quan, ít nhất hai mã và mục đích so sánh.');
    return { metric: metric, scope: { type: $('fld-comparison-scope-type').value, id: scopeId }, tickers: tickers, purpose: purpose };
  }

  function loadComparisonScopes() {
    var select = $('fld-comparison-scope');
    if (!select) return;
    var gen = ++comparisonGeneration;
    var type = $('fld-comparison-scope-type').value;
    var task = type === 'story' ? Promise.resolve({ items: selectedChuDe ? [{ id: selectedChuDe.id, name: selectedChuDe.name }] : [] }) : request('/market/' + (type === 'sector' ? 'sectors' : 'ecosystems'));
    task.then(function (data) {
      if (gen !== comparisonGeneration) return;
      var list = data.items || data.sectors || data.ecosystems || [];
      select.innerHTML = '<option value="">Chọn nhóm liên quan</option>' + list.map(function (g) { return '<option value="' + esc(String(g.id)) + '">' + esc(g.name_vi || g.name || g.title) + '</option>'; }).join('');
      if (selectedComparison && selectedComparison.scope.type === type) select.value = selectedComparison.scope.id;
    }).catch(function () { if (gen === comparisonGeneration) $('comparison-message').textContent = 'Không tải được danh mục phạm vi so sánh.'; });
  }

  function loadComparisonMetrics() {
    request('/news/admin/comparison-metrics').then(function (data) {
      $('fld-comparison-metric').innerHTML = '<option value="">Không so sánh</option>' + (data.metrics || []).map(function (m) {
        return '<option value="' + esc(m.key) + '"' + (m.available ? '' : ' disabled') + '>' + esc(m.label + (m.available ? '' : ' · chưa có nguồn dữ liệu')) + '</option>';
      }).join('');
      if (selectedComparison) $('fld-comparison-metric').value = selectedComparison.metric;
    }).catch(function () { $('comparison-message').textContent = 'Không tải được danh mục chỉ tiêu so sánh.'; });
  }

  function loadEventCases() {
    var select = $('fld-event-cases'), target = $('event-target');
    if (!select || !target) return;
    var gen = ++eventListGeneration;
    var story = selectedChuDe && selectedChuDe.id;
    request('/news/admin/event-cases' + (story ? '?story_id=' + encodeURIComponent(story) : '')).then(function (data) {
      if (gen !== eventListGeneration) return;
      var cases = data.cases || [];
      select.innerHTML = cases.map(function (c) { return '<option value="' + esc(c.id) + '"' + (eventCaseIds.indexOf(c.id) >= 0 ? ' selected' : '') + '>' + esc(c.title + ' · ' + c.subject_name) + '</option>'; }).join('');
      target.innerHTML = '<option value="">Tạo hồ sơ mới</option>' + cases.map(function (c) { return '<option value="' + esc(c.id) + '">' + esc(c.title) + '</option>'; }).join('');
      $('event-case-message').textContent = cases.length ? '' : 'Chưa có hồ sơ. Có thể thêm mốc đã kiểm tra ở dưới.';
    }).catch(function (err) { if (gen === eventListGeneration) $('event-case-message').textContent = err.message || 'Không tải được hồ sơ'; });
  }

  function saveEventMilestone() {
    var btn = $('btn-event-save');
    var milestone = {
      title: $('event-title').value.trim(), summary: $('event-summary').value.trim(), status: $('event-status').value,
      announced_on: $('event-announced').value || null, effective_on: $('event-effective').value || null,
      evidence: [{ label: $('event-source-label').value.trim(), url: $('event-source-url').value.trim(), quote: $('event-evidence').value.trim() }], metrics: []
    };
    if (!milestone.title || !milestone.summary || !milestone.evidence[0].label || !milestone.evidence[0].quote || !/^https?:\/\//i.test(milestone.evidence[0].url)) {
      toast('Điền tên mốc, diễn biến, tên nguồn, URL HTTP(S) và trích đoạn bằng chứng.', 'warning'); return;
    }
    var target = $('event-target').value;
    var payload = milestone;
    if (!target) {
      if (!$('event-case-title').value.trim() || !$('event-subject').value.trim()) { toast('Điền tên sự việc và pháp nhân chủ thể.', 'warning'); return; }
      eventRequestId = eventRequestId || crypto.randomUUID();
      payload = { request_id: eventRequestId, title: $('event-case-title').value.trim(), subject_name: $('event-subject').value.trim(), event_group: Number($('event-group').value),
        tickers: parseCsv($('fld-tickers').value, 20).map(function (t) { return t.toUpperCase(); }), story_id: selectedChuDe ? selectedChuDe.id : null, milestone: milestone };
    }
    btn.disabled = true;
    request('/news/admin/event-cases' + (target ? '/' + encodeURIComponent(target) + '/milestones' : ''), { method: 'POST', body: payload }).then(function (out) {
      var id = target || out.case.id;
      if (eventCaseIds.indexOf(id) < 0) eventCaseIds.push(id);
      eventRequestId = null;
      toast('Đã lưu mốc. Lưu bài để gắn hồ sơ; chỉ bài chính thức hiển thị timeline.', 'success');
      loadEventCases();
    }).catch(function (err) { toast(err.message || 'Không lưu được mốc', 'danger'); }).finally(function () { btn.disabled = false; });
  }

  function renderSuggest(list) {
    var el = $('art-chude-suggest');
    if (!el) return;
    if (!list || !list.length) {
      el.innerHTML = '<span class="ix-caption">Không tìm thấy câu chuyện phù hợp.</span>';
      return;
    }
    el.innerHTML = list.map(function (it, idx) {
      return '<button type="button" class="ix-btn ix-btn-outline ix-btn-sm" data-chude-idx="' + idx + '">' +
        esc(it.name) + '</button>';
    }).join(' ');
    el.querySelectorAll('[data-chude-idx]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var i = Number(btn.getAttribute('data-chude-idx'));
        setChuDe(list[i]);
        el.innerHTML = '';
      });
    });
  }

  function suggestChuDe(q) {
    return request('/news/chu-de/suggest?q=' + encodeURIComponent(q || '') + '&limit=8')
      .then(function (data) {
        renderSuggest(data.suggestions || []);
      })
      .catch(function () {
        renderSuggest([]);
      });
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
    return request('/news/admin/categories').then(function (data) {
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
    var excerpt = ($('fld-excerpt').value || '').trim();

    return {
      title: title,
      excerpt: excerpt,
      body_html: bodyEditor
        ? bodyEditor.getBodyHtml()
        : (($('fld-body') && $('fld-body').value) || '').trim(),
      category_id: categoryId,
      story_id: selectedChuDe ? selectedChuDe.id : null,
      event_case_ids: eventCaseIds,
      comparison: collectComparison(),
      iflux_insight: $('fld-iflux-insight').value.trim() || null,
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
        description: excerpt,
        keywords: ($('fld-seo-keywords').value || '').trim(),
        og_image_alt: ($('fld-seo-og-alt') && $('fld-seo-og-alt').value || '').trim(),
        canonical: ''
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
    selectedComparison = item.comparison || null;
    $('fld-comparison-metric').value = selectedComparison ? selectedComparison.metric : '';
    $('fld-comparison-scope-type').value = selectedComparison ? selectedComparison.scope.type : 'sector';
    $('fld-comparison-tickers').value = selectedComparison ? selectedComparison.tickers.join(', ') : '';
    $('fld-comparison-purpose').value = selectedComparison ? selectedComparison.purpose : '';
    if (item.comparison_reason) $('comparison-message').textContent = item.comparison_reason;
    loadComparisonScopes();
    $('fld-iflux-insight').value = item.iflux_insight || '';
    eventCaseIds = item.event_case_ids || [];
    loadEventCases();
    $('cnt-bc-title').textContent = 'Sửa bài';
    $('cnt-page-title').textContent = 'Sửa bài viết';
    $('fld-title').value = item.title || '';
    $('fld-status').value = item.status || 'draft';
    syncSlugAndCanonicalFromTitle();
    /* URL giữ nguyên sau khi đã cấp, kể cả khi đổi tiêu đề. */
    if (item.slug && $('fld-slug')) {
      $('fld-slug').value = item.slug;
      if ($('fld-seo-canonical')) {
        $('fld-seo-canonical').value =
          PUBLIC_ORIGIN + '/tin-tuc/bai-viet/' + encodeURIComponent(item.slug);
      }
    }
    $('fld-excerpt').value = item.excerpt || '';
    if (bodyEditor) bodyEditor.setBodyHtml(item.body_html || '');
    else if ($('fld-body')) $('fld-body').value = item.body_html || '';
    if (item.category_id) $('fld-category').value = item.category_id;
    if (item.story_id) {
      request('/community/stories/' + encodeURIComponent(item.story_id))
        .then(function (data) {
          var s = data.story || data;
          setChuDe({ id: s.id, name: s.title });
        })
        .catch(function () {
          setChuDe({ id: item.story_id, name: '(Câu chuyện #' + item.story_id + ')' });
        });
    }
    var cover = item.cover || {};
    $('fld-cover-url').value = cover.url || '';
    $('fld-cover-alt').value = cover.alt || '';
    $('fld-cover-caption').value = cover.caption || '';
    $('fld-cover-credit').value = cover.credit || '';
    var seo = item.seo || {};
    $('fld-seo-title').value = seo.title || '';
    $('fld-seo-desc').value = item.excerpt || '';
    $('fld-seo-keywords').value = seo.keywords || '';
    if ($('fld-seo-og-alt')) {
      $('fld-seo-og-alt').value = seo.og_image_alt || seo.ogImageAlt || '';
      var autoAlt = (cover.alt || seo.title || item.title || '').trim();
      $('fld-seo-og-alt').placeholder = !$('fld-seo-og-alt').value && autoAlt
        ? autoAlt
        : 'Tuỳ chọn — để trống nếu title/alt đủ';
    }
    if ($('fld-seo-canonical') && item.slug) {
      $('fld-seo-canonical').value =
        PUBLIC_ORIGIN + '/tin-tuc/bai-viet/' + encodeURIComponent(item.slug);
    }
    var pubAt = item.scheduled_at || '';
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
        ? request('/news/admin/articles/' + encodeURIComponent(editingId), { method: 'PUT', body: payload })
        : request('/news/admin/articles', { method: 'POST', body: payload });
      return req.then(function (data) {
        var art = data.article || data;
        toast(editingId ? 'Đã cập nhật bài viết' : 'Đã tạo bài viết', 'success');
        if (!editingId && art && art.id) {
          if (window.IfluxAdminAppShell && IfluxAdminAppShell.navigate) IfluxAdminAppShell.navigate('edit.html?id=' + encodeURIComponent(art.id));
          else window.location.href = 'edit.html?id=' + encodeURIComponent(art.id);
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
    var canEdit = canPerm('news.articles.edit');
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

    request('/news/admin/articles/' + encodeURIComponent(editingId), { method: 'PUT', body: payload })
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
        return request('/news/admin/articles/' + encodeURIComponent(editingId)).then(function (data) {
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
        syncSlugAndCanonicalFromTitle();
        clearTimeout(suggestTimer);
        suggestTimer = setTimeout(function () {
          suggestChuDe(titleEl.value);
        }, 280);
      });
    }
    var excerptEl = $('fld-excerpt');
    if (excerptEl) excerptEl.addEventListener('input', function () {
      if ($('fld-seo-desc')) $('fld-seo-desc').value = excerptEl.value;
    });
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
    loadComparisonMetrics();
    loadComparisonScopes();
    if ($('fld-comparison-scope-type')) $('fld-comparison-scope-type').addEventListener('change', loadComparisonScopes);
    if ($('fld-event-cases')) $('fld-event-cases').addEventListener('change', function () { eventCaseIds = Array.from(this.selectedOptions).map(function (o) { return o.value; }); });
    if ($('btn-event-save')) $('btn-event-save').addEventListener('click', saveEventMilestone);
    loadEventCases();
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
        return request('/news/admin/articles/' + encodeURIComponent(id)).then(function (data) {
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
