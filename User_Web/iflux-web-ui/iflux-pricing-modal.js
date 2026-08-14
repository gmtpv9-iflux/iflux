/* ===== IFX-AUDIT-BEGIN =====
AUDIT-ID: T5A-P2-010
Priority: P2
STATUS: Wrong-owner
OWNER (hiện tại): Pricing
Owner đích (map): Pricing
Usage audit: ✓ (symbol scan)
Dep động: Có thể
Migration ROI: 5
Khả năng bỏ load: Chưa
P1 Gate: N/A
Refs: docs/runtime-opt/task5/PhaseA-P1-Gate.json handoffP2
Note: Owner sai nếu Community load
===== IFX-AUDIT-END ===== */
/**
 * iFlux — Pricing entry point (User Web)
 * Trial-offer/trial-expired modal đã bị xoá theo quyết định Owner (2026-08-14):
 * số ngày dùng thử vẫn cấu hình được trong Admin (Gói Hội viên), nhưng không
 * áp dụng luồng tự động mời/nhắc dùng thử trên User Web. open() chỉ điều hướng
 * sang trang bảng giá — được các nút "Nâng cấp"/paywall (dashboard-engine.js,
 * iflux-web-ui.js) gọi.
 */
(function (global) {
  'use strict';

  function consumerNavigate(canonical) {
    /* P6-API-01 — internal nav chỉ Writer.navigate */
    var W = global.IfluxShellUrlWriter;
    if (W && W.navigate) {
      W.navigate(canonical);
      return;
    }
    global.location.href = canonical;
  }

  function pricingUrl(opts) {
    if (global.IfluxWebUI && IfluxWebUI.pricingPageUrl) {
      return IfluxWebUI.pricingPageUrl(opts || {});
    }
    return '../pricing/index.html';
  }

  function open(opts) {
    consumerNavigate(pricingUrl(opts || {}));
  }

  global.IfluxPricingModal = {
    open: open
  };
})(window);
