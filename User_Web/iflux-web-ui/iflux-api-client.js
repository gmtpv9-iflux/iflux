/* iFlux — thin fetch client for iflux-api (ApiDataProvider only) */
(function (global) {
  'use strict';

  function baseUrl() {
    return global.IfluxApiConfig ? IfluxApiConfig.getBaseUrl() : '';
  }

  function friendlyNetworkError(err) {
    var msg = (err && err.message) || '';
    if (msg === 'Failed to fetch' || (err && err.name === 'TypeError')) {
      if (global.IfluxData && !IfluxData.isApi()) {
        return new Error('Provider: ' + (IfluxData.getProvider().label || 'local') + ' — không dùng HTTP.');
      }
      return new Error(
        'Không kết nối được API (' + baseUrl() + '). Kiểm tra backend hoặc ?dataMode=sandbox.'
      );
    }
    return err;
  }

  function request(path, options) {
    if (!global.IfluxData || !IfluxData.isApi()) {
      return Promise.reject(new Error('HTTP client chỉ dùng khi dataMode=api.'));
    }
    options = options || {};
    var url = baseUrl() + path;
    var headers = Object.assign({ 'Content-Type': 'application/json' }, options.headers || {});
    return fetch(url, {
      method: options.method || 'GET',
      headers: headers,
      body: options.body != null ? JSON.stringify(options.body) : undefined
    }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (data) {
        if (!res.ok) {
          var msg = data.error || data.message || ('HTTP ' + res.status);
          if (msg === 'Invalid credentials') msg = 'Email hoặc mật khẩu không đúng.';
          if (msg === 'Email already registered') msg = 'Email đã được đăng ký.';
          if (msg === 'Phone already registered') msg = 'Số điện thoại này đã được liên kết với tài khoản khác.';
          throw new Error(msg);
        }
        return data;
      });
    }).catch(function (err) {
      throw friendlyNetworkError(err);
    });
  }

  global.IfluxApiClient = global.IfluxApiClient || {};
  global.IfluxApiClient.request = request;
})(window);
