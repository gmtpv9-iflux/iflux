/**
 * Staging 2 — Admin API transport (M00)
 *
 * Transport duy nhất của Admin. Base URL lấy từ Platform, không tự suy ra.
 * Token chỉ lấy từ IfluxAdminSession. Bearer only.
 */
(function (global) {
  'use strict';

  function authHeaders() {
    var headers = { 'Content-Type': 'application/json' };
    var Session = global.IfluxAdminSession;
    var token = Session && Session.getToken();
    if (token) headers.Authorization = 'Bearer ' + token;
    return headers;
  }

  function request(method, path, body) {
    var opts = { method: method, headers: authHeaders() };
    if (body !== undefined) opts.body = JSON.stringify(body);
    return fetch(global.IfluxAdminPlatform.apiBase() + path, opts).then(function (res) {
      return res.json().then(function (data) {
        return { ok: res.ok, status: res.status, data: data };
      }).catch(function () {
        return { ok: res.ok, status: res.status, data: null };
      });
    });
  }

  /** Đường tải tệp: giữ nguyên Bearer nên không dùng <a download> trực tiếp được. */
  function download(path, filename) {
    var headers = authHeaders();
    delete headers['Content-Type'];
    return fetch(global.IfluxAdminPlatform.apiBase() + path, { headers: headers })
      .then(function (res) {
        if (!res.ok) return { ok: false, status: res.status };
        return res.blob().then(function (blob) {
          var url = URL.createObjectURL(blob);
          var a = document.createElement('a');
          a.href = url;
          a.download = filename;
          a.click();
          URL.revokeObjectURL(url);
          return { ok: true, status: res.status };
        });
      });
  }

  global.IfluxAdminApi = {
    request: request,
    download: download
  };
})(typeof window !== 'undefined' ? window : globalThis);
