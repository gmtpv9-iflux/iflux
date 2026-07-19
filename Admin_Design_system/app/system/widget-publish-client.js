/**
 * Widget Publish Client — Admin → POST /api/admin/publish/*
 * Phase 3: đẩy WidgetPublished / PagePublished (không qua page-composition legacy).
 */
(function (global) {
  'use strict';

  function apiBase() {
    if (global.IfluxApiConfig && IfluxApiConfig.getBaseUrl) {
      var b = IfluxApiConfig.getBaseUrl();
      if (b) return String(b).replace(/\/$/, '');
    }
    return (global.location ? global.location.origin : '') + '/api';
  }

  function adminToken() {
    try {
      if (global.IfluxAdminAuth && IfluxAdminAuth.getSession) {
        var s = IfluxAdminAuth.getSession();
        if (s && s.token) return s.token;
      }
    } catch (e) { /* ignore */ }
    return '';
  }

  function authHeaders() {
    var h = { 'Content-Type': 'application/json', Accept: 'application/json' };
    var t = adminToken();
    if (t) h.Authorization = 'Bearer ' + t;
    return h;
  }

  function publishWidget(draft, placement) {
    return fetch(apiBase() + '/admin/publish/widget', {
      method: 'POST',
      headers: authHeaders(),
      credentials: 'include',
      body: JSON.stringify({ draft: draft, placement: placement || null })
    }).then(function (r) { return r.json(); });
  }

  function publishPage(draft, widgetDrafts) {
    return fetch(apiBase() + '/admin/publish/page', {
      method: 'POST',
      headers: authHeaders(),
      credentials: 'include',
      body: JSON.stringify({ draft: draft, widgetDrafts: widgetDrafts || {} })
    }).then(function (r) { return r.json(); });
  }

  /** Đọc PagePublished hiện hành — dùng cho Reload Admin từ Server SoT. */
  function getPage(pageKey) {
    return fetch(apiBase() + '/pages/' + encodeURIComponent(String(pageKey || '').toLowerCase()) + '?embed=false', {
      method: 'GET',
      headers: { Accept: 'application/json' },
      credentials: 'include',
      cache: 'no-store'
    }).then(function (r) {
      if (r.status === 404) return { ok: false, notFound: true };
      return r.json();
    }).catch(function (err) {
      return { ok: false, error: String(err && err.message ? err.message : err) };
    });
  }

  /** Templates Admin được chọn (SoT) — Pipeline resolve module. */
  var TEMPLATES = [
    { id: 'TMP-ARTIFACT-CARD', label: 'Artifact Card (Platform demo)' },
    { id: 'TMP-COM-STOCK-HEAT', label: 'Heatmap cổ phiếu cộng đồng' },
    { id: 'TMP-COM-STORY-TOP', label: 'Chủ đề tích cực hàng đầu' },
    { id: 'TMP-COM-ACTIVE', label: 'Thành viên tích cực' },
    { id: 'TMP-MARKET-HEATMAP', label: 'Heatmap thị trường / câu chuyện' }
  ];

  global.IfluxWidgetPublishClient = {
    apiBase: apiBase,
    templates: TEMPLATES,
    getPage: getPage,
    publishWidget: publishWidget,
    publishPage: publishPage
  };
})(window);
