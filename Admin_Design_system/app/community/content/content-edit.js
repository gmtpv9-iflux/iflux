/* ADM-COM-CNT-003 — Thêm / sửa nội dung */
(function (global) {
  'use strict';

  var post = null;

  function $(id) { return document.getElementById(id); }

  function qs(name) {
    return new URLSearchParams(window.location.search).get(name);
  }

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function parseList(val) {
    return String(val || '').split(/[,;]/).map(function (s) { return s.trim(); }).filter(Boolean);
  }

  function joinList(arr) {
    return (arr || []).join(', ');
  }

  function toLocalDatetime(iso) {
    if (!iso) return '';
    try {
      var d = new Date(iso);
      var off = d.getTimezoneOffset();
      var local = new Date(d.getTime() - off * 60000);
      return local.toISOString().slice(0, 16);
    } catch (e) { return ''; }
  }

  function fromLocalDatetime(val) {
    if (!val) return '';
    return new Date(val).toISOString();
  }

  function fillSelect(el, map, selected) {
    if (!el) return;
    el.innerHTML = Object.keys(map).map(function (k) {
      return '<option value="' + k + '"' + (k === selected ? ' selected' : '') + '>' + map[k] + '</option>';
    }).join('');
  }

  function renderCategoryChecks(categories, selected) {
    var box = $('cnt-categories');
    if (!box) return;
    var html = '';
    categories.forEach(function (c) {
      html += '<label style="display:flex;align-items:center;gap:8px;font-size:13px;margin-bottom:8px;cursor:pointer">' +
        '<input type="checkbox" class="ix-checkbox" data-cat="' + c.id + '"' + (selected.indexOf(c.id) >= 0 ? ' checked' : '') + ' /> ' + esc(c.name) + '</label>';
      (c.children || []).forEach(function (ch) {
        html += '<label style="display:flex;align-items:center;gap:8px;font-size:13px;margin:0 0 8px 20px;cursor:pointer">' +
          '<input type="checkbox" class="ix-checkbox" data-cat="' + ch.id + '"' + (selected.indexOf(ch.id) >= 0 ? ' checked' : '') + ' /> ' + esc(ch.name) + '</label>';
      });
    });
    box.innerHTML = html;
  }

  function renderTagChecks(tags, selected) {
    var box = $('cnt-tags');
    if (!box) return;
    box.innerHTML = tags.map(function (t) {
      return '<label style="display:inline-flex;align-items:center;gap:6px;font-size:13px;margin:0 12px 8px 0;cursor:pointer">' +
        '<input type="checkbox" class="ix-checkbox" data-tag="' + esc(t) + '"' + (selected.indexOf(t) >= 0 ? ' checked' : '') + ' /> ' + esc(t) + '</label>';
    }).join('');
  }

  function getChecked(attr) {
    var out = [];
    document.querySelectorAll('[' + attr + ']:checked').forEach(function (el) {
      out.push(el.getAttribute(attr));
    });
    return out;
  }

  function toggleSourceFields() {
    var src = ($('fld-source') || {}).value;
    var wrap = $('cnt-source-extra');
    if (wrap) wrap.style.display = (src === 'media' || src === 'press' || src === 'company' || src === 'other') ? '' : 'none';
  }

  function loadForm() {
    var S = global.IfluxContentStore;
    var id = qs('id');
    post = id ? S.getById(id) : S.emptyPost();
    if (id && !post) {
      alert('Không tìm thấy bài viết');
      window.location.href = 'index.html';
      return;
    }

    var isNew = !id;
    $('cnt-page-title').textContent = isNew ? 'Thêm nội dung' : 'Sửa nội dung';
    $('cnt-bc-title').textContent = isNew ? 'Thêm mới' : post.title;
    document.title = (isNew ? 'Thêm' : 'Sửa') + ' nội dung · iFlux Admin';

    $('fld-title').value = post.title || '';
    $('fld-subtitle').value = post.subtitle || '';
    $('fld-slug').value = post.slug || '';
    $('fld-excerpt').value = post.excerpt || '';
    $('fld-body').value = (post.body || '').replace(/<[^>]+>/g, ' ');
    $('fld-thumb-alt').value = post.thumbnailAlt || '';

    fillSelect($('fld-type'), S.CONTENT_TYPES, post.contentType);
    fillSelect($('fld-source'), S.SOURCES, post.source);
    fillSelect($('fld-status'), S.STATUS, post.status);

    $('fld-source-name').value = post.sourceName || '';
    $('fld-source-url').value = post.sourceUrl || '';
    $('fld-source-author').value = post.sourceAuthor || '';
    $('fld-source-fetched').value = post.sourceFetchedAt ? toLocalDatetime(post.sourceFetchedAt).slice(0, 10) : '';

    renderCategoryChecks(S.CATEGORIES, post.categories || []);
    renderTagChecks(S.TAGS, post.tags || []);

    $('fld-stocks').value = joinList(post.stocks);
    $('fld-sectors').value = joinList(post.sectors);
    $('fld-families').value = joinList(post.families);
    $('fld-stories').value = joinList(post.stories);
    $('fld-markets').value = joinList(post.markets);
    $('fld-companies').value = joinList(post.companies);

    $('fld-ai-summary').value = (post.ai && post.ai.summary) || '';
    $('fld-ai-keywords').value = joinList(post.ai && post.ai.keywords);
    $('fld-ai-topics').value = joinList(post.ai && post.ai.topics);
    $('fld-ai-sentiment').value = (post.ai && post.ai.sentiment) || '';
    $('fld-ai-stocks').value = joinList(post.ai && post.ai.stocksDetected);
    $('fld-ai-stories').value = joinList(post.ai && post.ai.storiesDetected);

    var d = post.display || {};
    $('fld-d-home').checked = !!d.home;
    $('fld-d-app').checked = d.app !== false;
    $('fld-d-web').checked = d.web !== false;
    $('fld-d-api').checked = !!d.api;
    $('fld-d-sticky').checked = !!d.sticky;
    $('fld-d-featured').checked = !!d.featured;
    $('fld-d-breaking').checked = !!d.breaking;
    $('fld-d-comments').checked = d.allowComments !== false;
    $('fld-d-share').checked = d.allowShare !== false;
    $('fld-d-push').checked = !!d.pushNotify;

    $('fld-publish-at').value = toLocalDatetime(post.schedule && post.schedule.publishAt);
    $('fld-expire-at').value = toLocalDatetime(post.schedule && post.schedule.expireAt);

    var seo = post.seo || {};
    $('fld-seo-title').value = seo.title || '';
    $('fld-seo-desc').value = seo.description || '';
    $('fld-seo-canonical').value = seo.canonical || '';
    $('fld-seo-index').checked = seo.indexable !== false;
    $('fld-related-mode').value = post.relatedMode || 'auto';
    $('fld-related').value = joinList(post.related);

    $('fld-author').value = post.author || '';
    $('fld-reviewer').value = post.reviewer || '';

    toggleSourceFields();
    renderVersions();
    renderAudit();
    renderStats();
    renderWorkflow();
  }

  function collectPost() {
    var S = global.IfluxContentStore;
    var title = $('fld-title').value.trim();
    return {
      id: post.id,
      title: title,
      subtitle: $('fld-subtitle').value.trim(),
      slug: $('fld-slug').value.trim() || S.slugify(title),
      excerpt: $('fld-excerpt').value.trim(),
      body: '<p>' + esc($('fld-body').value.trim()).replace(/\n/g, '</p><p>') + '</p>',
      thumbnail: post.thumbnail || '',
      thumbnailAlt: $('fld-thumb-alt').value.trim(),
      contentType: $('fld-type').value,
      categories: getChecked('data-cat'),
      tags: getChecked('data-tag'),
      source: $('fld-source').value,
      sourceName: $('fld-source-name').value.trim(),
      sourceUrl: $('fld-source-url').value.trim(),
      sourceAuthor: $('fld-source-author').value.trim(),
      sourceFetchedAt: $('fld-source-fetched').value ? new Date($('fld-source-fetched').value).toISOString() : '',
      author: $('fld-author').value.trim() || 'Quản trị viên',
      reviewer: $('fld-reviewer').value.trim(),
      status: $('fld-status').value,
      stocks: parseList($('fld-stocks').value),
      sectors: parseList($('fld-sectors').value),
      families: parseList($('fld-families').value),
      stories: parseList($('fld-stories').value),
      markets: parseList($('fld-markets').value),
      companies: parseList($('fld-companies').value),
      ai: {
        summary: $('fld-ai-summary').value.trim(),
        keywords: parseList($('fld-ai-keywords').value),
        topics: parseList($('fld-ai-topics').value),
        sentiment: $('fld-ai-sentiment').value.trim(),
        stocksDetected: parseList($('fld-ai-stocks').value),
        storiesDetected: parseList($('fld-ai-stories').value)
      },
      display: {
        home: $('fld-d-home').checked,
        app: $('fld-d-app').checked,
        web: $('fld-d-web').checked,
        api: $('fld-d-api').checked,
        sticky: $('fld-d-sticky').checked,
        featured: $('fld-d-featured').checked,
        breaking: $('fld-d-breaking').checked,
        allowComments: $('fld-d-comments').checked,
        allowShare: $('fld-d-share').checked,
        pushNotify: $('fld-d-push').checked
      },
      schedule: {
        publishAt: fromLocalDatetime($('fld-publish-at').value),
        expireAt: fromLocalDatetime($('fld-expire-at').value)
      },
      seo: {
        title: $('fld-seo-title').value.trim(),
        description: $('fld-seo-desc').value.trim(),
        canonical: $('fld-seo-canonical').value.trim(),
        ogImage: (post.seo && post.seo.ogImage) || '',
        indexable: $('fld-seo-index').checked
      },
      related: parseList($('fld-related').value),
      relatedMode: $('fld-related-mode').value,
      hasImage: !!(post.thumbnail || $('fld-thumb-alt').value),
      hasVideo: post.hasVideo || false,
      hasAttachment: post.hasAttachment || false,
      hasAiSummary: !!$('fld-ai-summary').value.trim(),
      stats: post.stats || { views: 0, avgReadSec: 0, likes: 0, shares: 0, saves: 0, comments: 0, readThrough: 0 },
      versions: post.versions || [],
      audit: post.audit || [],
      publishedAt: post.publishedAt || ''
    };
  }

  function renderVersions() {
    var el = $('cnt-versions');
    if (!el) return;
    var vers = post.versions || [];
    if (!vers.length) { el.innerHTML = '<div class="ix-caption">Chưa có phiên bản</div>'; return; }
    el.innerHTML = vers.map(function (v, i) {
      var arrow = i < vers.length - 1 ? '<div style="text-align:center;color:var(--ix-text-muted);font-size:12px">↓</div>' : '';
      return '<div class="ix-card" style="margin-bottom:8px"><div class="ix-card-body" style="padding:12px 16px">' +
        '<div style="font-weight:600;font-size:13px">Phiên bản ' + v.v + '</div>' +
        '<div class="ix-caption">' + IfluxContentStore.fmtDate(v.at) + ' · ' + esc(v.by) + '</div>' +
        '<div style="font-size:12px;color:var(--ix-text-secondary);margin-top:4px">' + esc(v.note) + '</div>' +
        '<div style="margin-top:8px;display:flex;gap:8px"><button type="button" class="ix-btn ix-btn-outline ix-btn-sm" disabled>Xem</button><button type="button" class="ix-btn ix-btn-outline ix-btn-sm" disabled>So sánh</button><button type="button" class="ix-btn ix-btn-outline ix-btn-sm" disabled>Khôi phục</button></div>' +
        '</div></div>' + arrow;
    }).join('');
  }

  function renderAudit() {
    var el = $('cnt-audit');
    if (!el) return;
    var logs = (post.audit || []).slice().reverse();
    if (!logs.length) { el.innerHTML = '<div class="ix-caption">Chưa có nhật ký</div>'; return; }
    el.innerHTML = logs.map(function (l) {
      var time = IfluxContentStore.fmtDate(l.at).split(' ').pop();
      return '<div style="display:flex;gap:12px;padding:10px 0;border-bottom:1px solid var(--ix-border)">' +
        '<span style="font-family:ui-monospace,monospace;font-size:12px;color:var(--ix-text-muted);min-width:48px">' + esc(time) + '</span>' +
        '<span style="font-size:13px;color:var(--ix-text-secondary)"><strong style="color:var(--ix-text-primary)">' + esc(l.who) + '</strong> ' + esc(l.action) + '</span></div>';
    }).join('');
  }

  function renderStats() {
    var s = post.stats || {};
    var el = $('cnt-stats');
    if (!el) return;
    var rows = [
      ['Lượt xem', s.views], ['Thời gian đọc TB (giây)', s.avgReadSec], ['Lượt thích', s.likes],
      ['Lượt chia sẻ', s.shares], ['Lượt lưu', s.saves], ['Bình luận', s.comments],
      ['Tỷ lệ đọc hết bài', Math.round((s.readThrough || 0) * 100) + '%']
    ];
    el.innerHTML = rows.map(function (r) {
      return '<div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px"><span style="color:var(--ix-text-secondary)">' + r[0] + '</span><strong>' + (r[1] != null ? r[1].toLocaleString('vi-VN') : '—') + '</strong></div>';
    }).join('');
  }

  function renderWorkflow() {
    var el = $('cnt-workflow');
    if (!el) return;
    var steps = ['Người viết', 'Biên tập viên', 'Trưởng ban biên tập', 'Xuất bản', 'Lưu trữ'];
    var statusMap = { draft: 0, pending: 1, reviewing: 1, approved: 2, scheduled: 3, published: 3, hidden: 3, archived: 4 };
    var cur = statusMap[post.status] != null ? statusMap[post.status] : 0;
    el.innerHTML = steps.map(function (s, i) {
      var active = i <= cur;
      return '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">' +
        '<span class="ix-chip ix-chip-sm ' + (active ? 'ix-chip-success' : 'ix-chip-muted') + '">' + (i + 1) + '</span>' +
        '<span style="font-size:13px;color:' + (active ? 'var(--ix-text-primary)' : 'var(--ix-text-muted)') + '">' + s + '</span>' +
        (i < steps.length - 1 ? '<i class="ti ti-chevron-down" style="margin-left:auto;color:var(--ix-text-muted);font-size:12px"></i>' : '') +
        '</div>';
    }).join('');
  }

  function bindEvents() {
    var src = $('fld-source');
    if (src) src.addEventListener('change', toggleSourceFields);
    var title = $('fld-title');
    if (title) {
      title.addEventListener('blur', function () {
        var slug = $('fld-slug');
        if (slug && !slug.value.trim() && title.value.trim()) {
          slug.value = IfluxContentStore.slugify(title.value);
        }
      });
    }
    var saveDraft = $('btn-save-draft');
    if (saveDraft) {
      saveDraft.addEventListener('click', function () {
        var p = collectPost();
        p.status = 'draft';
        IfluxContentStore.save(p);
        window.location.href = 'edit.html?id=' + encodeURIComponent(p.id);
      });
    }
    var saveBtn = $('btn-save-content');
    if (saveBtn) {
      saveBtn.addEventListener('click', function () {
        var p = collectPost();
        if (!p.title) { alert('Vui lòng nhập tiêu đề'); return; }
        var saved = IfluxContentStore.save(p);
        alert('Đã lưu bài viết');
        if (!qs('id')) window.location.href = 'edit.html?id=' + encodeURIComponent(saved.id);
        else { post = saved; renderVersions(); renderAudit(); }
      });
    }
  }

  function init() {
    if (!global.IfluxContentStore) return;
    loadForm();
    bindEvents();
  }

  global.ContentEdit = { init: init };
})(window);
