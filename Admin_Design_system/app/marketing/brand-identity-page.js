/* ADM-MAR-001 — Nhận diện thương hiệu: Logo & Favicon */
(function (global) {
  'use strict';

  var FIELDS = ['siteName', 'logoUrl', 'logoLightUrl', 'logoMarkUrl', 'faviconUrl', 'appleTouchUrl'];
  var ASSET_FIELDS = ['logoUrl', 'logoLightUrl', 'logoMarkUrl', 'faviconUrl', 'appleTouchUrl'];

  function store() { return global.IfluxBrandIdentityStore; }

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function toast(msg, type) {
    if (global.ixToast) ixToast(msg, type || 'success');
  }

  function applyPreview(cfg) {
    var logoPrev = document.getElementById('bi-preview-logo');
    var favPrev = document.getElementById('bi-preview-favicon');
    var tabPrev = document.getElementById('bi-preview-tab-title');
    var updated = document.getElementById('bi-updated-at');
    if (tabPrev) tabPrev.textContent = (cfg.siteName || 'iFlux') + ' · Admin';
    if (logoPrev) {
      if (cfg.logoUrl) {
        logoPrev.innerHTML = '<img src="' + esc(cfg.logoUrl) + '" alt="Logo" style="max-height:28px;max-width:140px;object-fit:contain" />';
      } else {
        logoPrev.innerHTML = '<span style="font-weight:700;font-size:15px">' + esc(cfg.siteName || 'iFlux') + '</span>';
      }
    }
    if (favPrev) {
      if (cfg.faviconUrl) {
        favPrev.innerHTML = '<img src="' + esc(cfg.faviconUrl) + '" alt="" width="16" height="16" style="border-radius:3px" />';
      } else {
        favPrev.innerHTML = '<span style="width:16px;height:16px;border-radius:3px;background:var(--ix-accent);display:inline-block"></span>';
      }
    }
    if (updated) {
      updated.textContent = cfg.updatedAt
        ? 'Cập nhật lần cuối: ' + new Date(cfg.updatedAt).toLocaleString('vi-VN')
        : 'Chưa lưu cấu hình.';
    }
    ASSET_FIELDS.forEach(updateAssetPreview);
  }

  function updateAssetPreview(key) {
    var box = document.getElementById('bi-asset-' + key);
    var input = document.getElementById('bi-field-' + key);
    if (!box || !input) return;
    var val = input.value.trim();
    if (!val) {
      box.innerHTML = '<span style="font-size:12px;color:var(--ix-text-muted)">Chưa có ' + key.replace('Url', '') + '</span>';
      return;
    }
    var maxH = key === 'faviconUrl' ? 32 : 48;
    box.innerHTML = '<img src="' + esc(val) + '" alt="" style="max-height:' + maxH + 'px;max-width:100%;object-fit:contain" />';
  }

  function bindForm(cfg) {
    FIELDS.forEach(function (key) {
      var el = document.getElementById('bi-field-' + key);
      if (el) el.value = cfg[key] || '';
    });
    FIELDS.forEach(function (key) {
      var el = document.getElementById('bi-field-' + key);
      if (!el) return;
      el.addEventListener('input', function () {
        var next = store().read();
        next[key] = el.value.trim();
        applyPreview(next);
      });
    });
  }

  function bindUploads() {
    document.querySelectorAll('[data-bi-upload]').forEach(function (input) {
      input.addEventListener('change', function () {
        var file = input.files && input.files[0];
        if (!file) return;
        if (file.size > 512000) {
          toast('File quá lớn (tối đa 500KB trong sandbox)', 'warning');
          input.value = '';
          return;
        }
        var key = input.getAttribute('data-bi-upload');
        var reader = new FileReader();
        reader.onload = function () {
          var field = document.getElementById('bi-field-' + key);
          if (field) {
            field.value = reader.result;
            field.dispatchEvent(new Event('input'));
          }
          input.value = '';
        };
        reader.readAsDataURL(file);
      });
    });
  }

  function collect() {
    var out = {};
    FIELDS.forEach(function (key) {
      var el = document.getElementById('bi-field-' + key);
      out[key] = el ? el.value.trim() : '';
    });
    return out;
  }

  function init() {
    if (!store()) return;
    var cfg = store().read();
    bindForm(cfg);
    bindUploads();
    applyPreview(cfg);

    document.getElementById('bi-btn-save').addEventListener('click', function () {
      var saved = store().save(collect());
      applyPreview(saved);
      toast('Đã lưu nhận diện thương hiệu');
    });

    document.getElementById('bi-btn-reset').addEventListener('click', function () {
      if (!confirm('Khôi phục mặc định (xóa URL logo/favicon)?')) return;
      var cfg = store().reset();
      bindForm(cfg);
      applyPreview(cfg);
      toast('Đã khôi phục mặc định', 'info');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(window);
