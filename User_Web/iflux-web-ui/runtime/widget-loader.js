/**
 * iFlux Runtime — Widget Loader (ESM)
 * Nạp widget theo Lazy Page Runtime SoT:
 *   slot → inject CSS của widget → import(lazyModule) → mount(el, ctx)
 * Mỗi widget được bọc Error Boundary: 1 widget lỗi KHÔNG làm sập page.
 *
 * Contract widget module:
 *   export async function mount(el, ctx)  // bắt buộc
 *   export function unmount()             // tuỳ chọn (hoặc mount trả { unmount })
 *   export const meta = { id, title }     // tuỳ chọn
 */

import { loadStyles } from './legacy-bridge.js?v=lazyAll20260713k';

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** Fallback dùng class DS có sẵn (.ifx-mkt-empty) — không tạo CSS mới. */
function renderError(host, slot, err) {
  var title = (slot && (slot.title || slot.id)) || 'Widget';
  host.innerHTML =
    '<div class="ifx-mkt-empty" role="alert">' +
      'Không tải được widget “' + esc(title) + '”. Vui lòng thử lại.' +
    '</div>';
  if (window.console && console.error) {
    console.error('[WidgetLoader] Lỗi widget ' + (slot && slot.id), err);
  }
}

function applySpan(host, slot) {
  // Grid 12-col (SoT): span áp cho section main dạng grid; sidebar để full.
  var span = slot && slot.span ? Number(slot.span) : 0;
  if (span >= 1 && span <= 12) {
    host.style.gridColumn = 'span ' + span;
  }
}

/**
 * Nạp + mount 1 widget vào sectionEl.
 * @returns {Promise<{id, host, module?, instance?, error?}>}
 */
export async function loadWidget(slot, sectionEl, ctx) {
  var host = document.createElement('div');
  host.className = 'ifx-rt-widget';
  host.setAttribute('data-widget-id', slot.id || '');
  applySpan(host, slot);
  sectionEl.appendChild(host);

  try {
    if (slot.css && slot.css.length) {
      await loadStyles(slot.css);
    }
    if (!slot.lazyModule) {
      if (window.console && console.warn) {
        console.warn('[WidgetLoader] Widget chưa có lazyModule — bỏ qua:', slot.id);
      }
      return { id: slot.id, host: null, skipped: true };
    }
    var mod = await import(slot.lazyModule);
    if (!mod || typeof mod.mount !== 'function') {
      throw new Error('widget module thiếu export mount()');
    }
    var instance = await mod.mount(host, Object.assign({ slot: slot }, ctx || {}));
    return { id: slot.id, host: host, module: mod, instance: instance };
  } catch (err) {
    renderError(host, slot, err);
    return { id: slot.id, host: host, error: err };
  }
}

/** Gỡ widget (gọi unmount nếu có) — dùng khi điều hướng SPA nội bộ sau này. */
export function unloadWidget(entry) {
  if (!entry) return;
  try {
    if (entry.instance && typeof entry.instance.unmount === 'function') {
      entry.instance.unmount();
    } else if (entry.module && typeof entry.module.unmount === 'function') {
      entry.module.unmount();
    }
  } catch (e) { /* boundary: bỏ qua lỗi unmount */ }
  if (entry.host && entry.host.parentNode) {
    entry.host.parentNode.removeChild(entry.host);
  }
}
