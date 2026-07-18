/* ADM-COM-ENG-EDIT — Bổ sung chủ đề / entity cho tin Content Engine */
(function () {
  'use strict';

  var articleId = null;
  var selectedChuDe = null;
  var chuDeList = [];

  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function apiBase() {
    if (window.IfluxAdminAuth && IfluxAdminAuth.apiBase) return IfluxAdminAuth.apiBase();
    return '/api';
  }
  function authHeaders() {
    var h = { Accept: 'application/json', 'Content-Type': 'application/json' };
    var token = null;
    if (window.IfluxAdminAuth && IfluxAdminAuth.getSession) {
      var s = IfluxAdminAuth.getSession();
      if (s && s.token) token = s.token;
    }
    if (token) h.Authorization = 'Bearer ' + token;
    else h['X-Admin-Key'] = localStorage.getItem('iflux_admin_api_key') || 'iflux-admin-local-dev';
    return h;
  }
  function request(path, options) {
    options = options || {};
    return fetch(apiBase() + path, {
      method: options.method || 'GET',
      headers: authHeaders(),
      body: options.body != null ? JSON.stringify(options.body) : undefined
    }).then(function (res) {
      return res.json().then(function (data) {
        if (!res.ok) throw new Error((data.error && data.error.message) || data.message || ('HTTP ' + res.status));
        return (data && data.data) || data || {};
      });
    });
  }
  function toast(msg, type) {
    if (typeof window.ixToast === 'function') window.ixToast(msg, type || 'info');
    else window.alert(msg);
  }

  function setChuDe(item) {
    selectedChuDe = item || null;
    var box = $('eng-chude-selected');
    if (!box) return;
    if (!selectedChuDe) {
      box.innerHTML = '<span class="ix-caption">Chưa chọn — bắt buộc 01 chủ đề theo SoT Article</span>';
      return;
    }
    box.innerHTML = '<span class="ix-chip ix-chip-primary">' + esc(selectedChuDe.label || selectedChuDe.name) +
      '</span> <button type="button" class="ix-btn ix-btn-outline ix-btn-sm" id="eng-chude-clear">Bỏ chọn</button>';
    var clearBtn = $('eng-chude-clear');
    if (clearBtn) clearBtn.addEventListener('click', function () { setChuDe(null); });
  }

  function renderChuDeOptions(list) {
    chuDeList = list || [];
    var el = $('eng-chude-options');
    if (!el) return;
    if (!chuDeList.length) {
      el.innerHTML = '<span class="ix-caption">Chưa có chủ đề trong registry — nhập tên bên dưới để tạo mới.</span>';
      return;
    }
    el.innerHTML = chuDeList.map(function (it, idx) {
      return '<button type="button" class="ix-btn ix-btn-outline ix-btn-sm" data-idx="' + idx + '">' +
        esc(it.label || it.name) + '</button>';
    }).join(' ');
    el.querySelectorAll('[data-idx]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        setChuDe(chuDeList[Number(btn.getAttribute('data-idx'))]);
      });
    });
  }

  function loadChuDe(q) {
    var path = '/content/chu-de?limit=40';
    return request(path).then(function (data) {
      var list = data['chu-de'] || data.stories || [];
      if (q) {
        var qq = String(q).toLowerCase();
        list = list.filter(function (x) {
          return String(x.label || x.name || '').toLowerCase().indexOf(qq) >= 0;
        });
      }
      renderChuDeOptions(list.slice(0, 20));
    }).catch(function () {
      renderChuDeOptions([]);
    });
  }

  function fillForm(a) {
    $('eng-title').value = a.title || '';
    $('eng-excerpt').value = a.excerpt || '';
    $('eng-category').value = a.category_raw || '';
    $('eng-url').textContent = a.external_url || '';
    $('eng-url').href = a.external_url || '#';
    $('eng-source').textContent = a.source_code || a.source_name || '—';
    $('eng-publish').checked = !!a.published_to_feed;
    var stocks = (a.entities || []).filter(function (e) { return e.type === 'stock'; }).map(function (e) { return e.id; });
    $('eng-tickers').value = stocks.join(', ');
    var miss = document.getElementById('eng-missing');
    if (miss) {
      miss.textContent = a.needs_review
        ? ('Thiếu: ' + (a.missing_fields || []).join(', '))
        : 'Đủ điều kiện (không cần review)';
      miss.className = 'ix-chip ' + (a.needs_review ? 'ix-chip-warning' : 'ix-chip-success') + ' ix-chip-sm';
    }
    if (a.chu_de) setChuDe(a.chu_de);
    else if (a.chu_de_name) setChuDe({ id: a.chu_de_id, label: a.chu_de_name, slug: a.chu_de_slug });
    else setChuDe(null);
    var topicsHint = $('eng-topics-hint');
    if (topicsHint) {
      topicsHint.textContent = (a.topics || []).map(function (t) { return t.label; }).join(', ') || '—';
    }
  }

  function save() {
    if (!articleId) return;
    var tickers = String($('eng-tickers').value || '')
      .split(/[,;\s]+/)
      .map(function (x) { return x.trim().toUpperCase(); })
      .filter(Boolean)
      .slice(0, 5);
    var body = {
      title: $('eng-title').value.trim(),
      excerpt: $('eng-excerpt').value.trim(),
      category_raw: $('eng-category').value.trim(),
      publish_to_feed: !!$('eng-publish').checked,
      entities: tickers.map(function (t) {
        return { type: 'stock', id: t, label: t, confidence: 0.9 };
      })
    };
    if (selectedChuDe) {
      body.primary_chu_de_id = selectedChuDe.id || undefined;
      body.chu_de_slug = selectedChuDe.slug;
      body.chu_de_name = selectedChuDe.label || selectedChuDe.name;
    } else {
      var createName = ($('eng-chude-new') || {}).value || '';
      if (createName.trim()) body.chu_de_name = createName.trim();
    }
    if (!body.chu_de_name && !body.primary_chu_de_id && !body.chu_de_slug) {
      toast('Chọn hoặc tạo 01 chủ đề trước khi lưu', 'warning');
      return;
    }
    var btn = $('eng-save');
    if (btn) btn.disabled = true;
    request('/content/articles/' + encodeURIComponent(articleId), { method: 'PATCH', body: body })
      .then(function (data) {
        toast(data.article && data.article.needs_review ? 'Đã lưu (vẫn còn thiếu)' : 'Đã lưu & sẵn sàng', 'success');
        if (data.article) fillForm(data.article);
      })
      .catch(function (err) { toast(err.message, 'danger'); })
      .finally(function () { if (btn) btn.disabled = false; });
  }

  function boot() {
    articleId = new URLSearchParams(location.search).get('id');
    if (!articleId) {
      toast('Thiếu id bài', 'danger');
      return;
    }
    var q = $('eng-chude-q');
    if (q) q.addEventListener('input', function () {
      clearTimeout(q._t);
      q._t = setTimeout(function () { loadChuDe(q.value); }, 250);
    });
    var createBtn = $('eng-chude-create');
    if (createBtn) {
      createBtn.addEventListener('click', function () {
        var name = ($('eng-chude-new').value || $('eng-chude-q').value || '').trim();
        if (!name) { toast('Nhập tên chủ đề', 'warning'); return; }
        setChuDe({ label: name, name: name, slug: '' });
        toast('Sẽ tạo chủ đề «' + name + '» khi lưu', 'info');
      });
    }
    $('eng-save').addEventListener('click', save);
    Promise.all([
      request('/content/articles/' + encodeURIComponent(articleId)),
      loadChuDe('')
    ]).then(function (pair) {
      fillForm(pair[0].article || pair[0]);
    }).catch(function (err) {
      toast(err.message, 'danger');
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
