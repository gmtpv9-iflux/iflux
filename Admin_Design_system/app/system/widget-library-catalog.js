/**
 * WidgetLibraryCatalog — SHIM tương thích.
 * SoT DUY NHẤT = Core 4 tầng · Tầng 4 (PlatformLayersWidgets).
 * File này chỉ giữ tên toàn cục cũ để không phá các trang còn `<script src=widget-library-catalog.js>`.
 * Nạp `platform-layers-widgets.js` TRƯỚC file này.
 */
(function (global) {
  'use strict';

  var P = global.PlatformLayersWidgets;
  if (!P || typeof P.installLibraryFacade !== 'function') {
    if (global.console && console.error) {
      console.error('[WidgetLibraryCatalog] Thiếu PlatformLayersWidgets — nạp platform-layers-widgets.js trước.');
    }
    return;
  }

  /* Cài / làm mới facade (Tầng 4 tự cài khi load; refresh khi script này chạy sau). */
  P.installLibraryFacade();

  if (global.console && console.info) {
    console.info('[WidgetLibraryCatalog] shim → Tầng 4 · ' +
      (global.WidgetLibraryCatalog && WidgetLibraryCatalog.allWidgetIdsInLibrary
        ? WidgetLibraryCatalog.allWidgetIdsInLibrary().length
        : 0) + ' widget');
  }
})(window);
