/**
 * Permission Gate — chỉ khóa Widget thuộc Tầng 4 (SoT Phân quyền sử dụng).
 * Ngoài danh sách Tầng 4 (Page Composite WGT-*-PAGE, nội dung đặc thù, …)
 * → không áp dụng badge / ifx-widget-locked.
 * Overlay = Widget Shell · mask tên Entity = Entity Renderer (Template).
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

  function setHostState(el, allowed) {
    var shell = global.IfluxWidgetShell;
    if (shell && shell.setLocked) {
      shell.setLocked(el, !allowed);
      return;
    }
    el.classList.toggle('ifx-widget-locked', !allowed);
    el.setAttribute('data-ifx-ent-access', allowed ? 'full' : 'teaser');
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

    /* data-ifx-ent-block (BLK-*): tôn trọng plan.blocks qua hasBlock (STATIC + legacy). */
    document.querySelectorAll('[data-ifx-ent-block]').forEach(function (el) {
      if (el.getAttribute('data-widget-id')) return;
      var bid = el.getAttribute('data-ifx-ent-block');
      el.hidden = false;
      el.style.display = '';
      el.removeAttribute('aria-hidden');
      if (!bid) {
        setHostState(el, true);
        return;
      }
      setHostState(el, !!ent.hasBlock(bid));
    });

    document.querySelectorAll('[data-ifx-ent-block-section]').forEach(function (section) {
      section.hidden = false;
      section.style.display = '';
    });
  }

  global.IfluxBlockGate = {
    apply: apply,
    isPermissionScopedWidget: isPermissionScopedWidget
  };
})(window);
