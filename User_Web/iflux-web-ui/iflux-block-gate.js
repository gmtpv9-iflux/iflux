/**
 * Permission Gate — chỉ khóa Widget thuộc Tầng 4 (SoT Phân quyền sử dụng).
 * Ngoài danh sách Tầng 4 (Page Composite WGT-*-PAGE, nội dung đặc thù, …)
 * → không áp dụng lớp khoá (.uw-locked). Vùng không phải widget (tab, khung trang) không bao giờ bị khoá.
 * Gate chỉ QUYẾT ĐỊNH khoá; lớp phủ + che tên đối tượng = platform/web/lock (nạp khi có vùng bị khoá).
 */
(function (global) {
  'use strict';

  /** Chỉ WGT-* có trong Kiến trúc 4 tầng mới thuộc phạm vi Permission. */
  function isPermissionScopedWidget(id) {
    id = String(id || '');
    if (!id || id.indexOf('WGT-') !== 0) return false;
    var L4 = global.L4RuntimeReader;
    if (L4 && typeof L4.widgetIds === 'function') {
      return L4.widgetIds().indexOf(id) >= 0;
    }
    return false;
  }

  /* Lớp phủ khoá (platform/web/lock) — chỉ nạp khi trên trang thật sự có vùng bị khoá. */
  var LOCK_VER = 'r20260928n';
  var lockLoading = null;
  function ensureLockUi() {
    if (global.IfluxWidgetLock) return Promise.resolve();
    if (lockLoading) return lockLoading;
    var css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = '/platform/web/lock/widget-lock.css?v=' + LOCK_VER;
    document.head.appendChild(css);
    lockLoading = new Promise(function (resolve) {
      var s = document.createElement('script');
      s.src = '/platform/web/lock/widget-lock.js?v=' + LOCK_VER;
      s.onload = s.onerror = function () { resolve(); };
      document.head.appendChild(s);
    });
    return lockLoading;
  }

  function setHostState(el, allowed) {
    el.classList.toggle('uw-locked', !allowed);
    el.setAttribute('data-ifx-ent-access', allowed ? 'full' : 'teaser');
  }

  /* Vẽ / gỡ lớp phủ theo trạng thái vừa gắn. Chưa từng khoá và chưa nạp module → không tải gì. */
  function syncLockUi() {
    if (document.querySelector('.uw-locked')) {
      ensureLockUi().then(function () { if (global.IfluxWidgetLock) IfluxWidgetLock.sync(); });
    } else if (global.IfluxWidgetLock) {
      IfluxWidgetLock.sync();
    }
  }

  function apply(pageKey) {
    pageKey = String(pageKey || '').toLowerCase();
    var ent = global.IfluxEntitlements;
    if (!ent) return;

    document.querySelectorAll('[data-widget-id]').forEach(function (el) {
      var wid = el.getAttribute('data-widget-id');
      if (!wid) return;
      el.hidden = false;
      el.style.display = '';
      el.removeAttribute('aria-hidden');
      /* Ngoài Tầng 4 → không cấu hình Permission → luôn mở. */
      if (!isPermissionScopedWidget(wid)) {
        setHostState(el, true);
        return;
      }
      setHostState(el, !!ent.hasBlock(wid));
    });

    syncLockUi();
  }

  global.IfluxBlockGate = {
    apply: apply,
    isPermissionScopedWidget: isPermissionScopedWidget
  };
})(window);
