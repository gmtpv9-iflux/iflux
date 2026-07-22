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
    if (global.EntitlementCatalog && typeof EntitlementCatalog.isPermissionScopedWidget === 'function') {
      return EntitlementCatalog.isPermissionScopedWidget(id);
    }
    var P = global.PlatformLayersWidgets;
    if (P && typeof P.widgetIds === 'function') {
      return P.widgetIds().indexOf(id) >= 0;
    }
    if (global.PageSettingsCatalog && typeof PageSettingsCatalog.allWidgetIds === 'function') {
      return PageSettingsCatalog.allWidgetIds().indexOf(id) >= 0;
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

    /* data-ifx-ent-block (BLK-* đặc thù / legacy): ngoài phạm vi ma trận Widget. */
    document.querySelectorAll('[data-ifx-ent-block]').forEach(function (el) {
      if (el.getAttribute('data-widget-id')) return;
      el.hidden = false;
      el.style.display = '';
      el.removeAttribute('aria-hidden');
      setHostState(el, true);
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
