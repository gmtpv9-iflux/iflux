/* ===== IFX-AUDIT-BEGIN =====
AUDIT-ID: T5A-IGNORE-003
Priority: IGNORE
STATUS: IGNORE
OWNER: Runtime
Candidate Owner: Runtime
Usage audit: N/A
Dep động: N/A
Migration ROI: 1
Khả năng bỏ load: Không
P1 Gate: N/A
Refs: Task5 PhaseA — không audit / không tối ưu
===== IFX-AUDIT-END ===== */
/**
 * iFlux Runtime — Page Runtime (ESM)
 * Slot path: Page Manifest → sections → Widget Loader.
 * Published path (Phase 4): PagePublished → Layout Engine → mount(display.module).
 */

import { buildPageFrame } from './app-shell.js?v=7b8f128322';
import { applyDefinitionToDocument } from './page-definition.js?v=432eed525b';
import { loadWidget } from './widget-loader.js?v=44321f3f09';
import { loadScript, loadStyles } from './legacy-bridge.js?v=dec30759da';
import { mountPageWidgets } from './page-widgets.js?v=b515a6101c';

var LAYOUT_ENGINE_SRC = '/User_Web/iflux-web-ui/runtime/page-layout-engine.js?v=a6f64093c8';

async function ensureLayoutEngine() {
  if (window.IfluxPageLayoutEngine && IfluxPageLayoutEngine.buildHostTree) return;
  await loadScript(LAYOUT_ENGINE_SRC);
}

export async function bootPage(m, mountEl) {
  if (!m || !mountEl) return { manifest: null, widgets: [] };

  /* Phase B2: đảm bảo Definition đã có entity title trước apply. */
  if (window.IfluxEntityDefinition && IfluxEntityDefinition.enrichDefinitionWithEntity) {
    m = IfluxEntityDefinition.enrichDefinitionWithEntity(m, m.pageKey);
  }

  /* Class <main> + CSS riêng của trang — manifest trang khai báo (tải đầy đủ lẫn điều hướng mềm dùng chung).
     Nạp CSS trước khi dựng nội dung → không nháy giao diện chưa có style. */
  var mainEl = mountEl.closest('main');
  if (mainEl) {
    Array.prototype.slice.call(mainEl.classList).forEach(function (c) {
      if (c.indexOf('ifx-main--') === 0) mainEl.classList.remove(c);
    });
    String(m.mainClass || '').split(/\s+/).filter(Boolean).forEach(function (c) { mainEl.classList.add(c); });
  }
  if (m.css && m.css.length) await loadStyles(m.css);

  mountEl.innerHTML = '';
  /* Soft-nav: innerHTML không gỡ class layout trên mount root.
   * ifx-mkt-layout / ifx-hub-grid + CSS còn từ trang trước → 1 section community
   * bị nhét cột sidebar (~1fr) — chỉ còn sidebar. Flow/pricing không add class nên OK. */
  mountEl.classList.remove('ifx-mkt-layout', 'ifx-hub-grid', 'ifx-shell-layout', 'is-no-sidebar');
  mountEl.classList.add('ifx-rt-page');

  /* Khung chung: host widget (Placement) + vùng nội dung đặc thù (slot tĩnh của trang).
     Trang composite (module trang) tự dựng khung qua buildPageFrame — runtime chỉ cấp chỗ mount. */
  var sectionMap;
  if (m.composite) {
    sectionMap = { main: mountEl };
  } else {
    var frame = buildPageFrame(mountEl);
    sectionMap = { sidebar: frame.sidebarContent, main: frame.mainContent };
  }

  /* Definition (đã enrich) TRƯỚC mount — không applyCurrent lại cuối boot. */
  applyDefinitionToDocument(m);

  var loaded = [];

  /* Widget Placement (PagePublished) → host của khung → Template mà widget chọn. */
  if (m.published) {
    await ensureLayoutEngine();
    var pubKey = m.publishKey || m.pageKey;
    if (m.pagePayload && IfluxPageLayoutEngine.prime) {
      IfluxPageLayoutEngine.prime(pubKey, m.pagePayload);
    }
    loaded = loaded.concat(await mountPageWidgets(mountEl, pubKey, {
      sectionFilter: m.publishedSections || null,
      gateKey: m.pageKey === 'home' ? 'home' : m.pageKey
    }));
  }

  /* Nội dung đặc thù của trang (vd Home: Gói cước, Dashboard cá nhân) — không phải Widget Placement. */
  var slots = (m.widgets || [])
    .filter(function (w) { return w && w.enabled !== false; })
    .sort(function (a, b) { return (a.position || 0) - (b.position || 0); });

  for (var i = 0; i < slots.length; i++) {
    var slot = slots[i];
    var sectionEl = sectionMap[slot.section];
    if (!sectionEl) {
      if (window.console && console.warn) {
        console.warn('[PageRuntime] Section không tồn tại:', slot.section, slot.id);
      }
      continue;
    }
    /* Không truyền pageKey/route vào mount — chỉ slot + config. */
    var entry = await loadWidget(slot, sectionEl, { manifest: m, pageDefinition: m });
    loaded.push(entry);
  }

  return { manifest: m, widgets: loaded };
}
