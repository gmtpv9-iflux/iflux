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

import {
  ensureSections,
  applyMarketLayout,
  applyHubLayout
} from './app-shell.js?v=noPageHead20260722';
import { applyDefinitionToDocument } from './page-definition.js?v=noPageHead20260722';
import { loadWidget } from './widget-loader.js?v=entStrip20260724';
import { loadScript } from './legacy-bridge.js?v=phaseCW420260721';
import { mountPublishedWidgets } from './mount-published-widgets.js?v=phase4Pub20260716b';

var LAYOUT_ENGINE_SRC = '/User_Web/iflux-web-ui/runtime/page-layout-engine.js?v=phase4Pub20260716b';

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

  mountEl.innerHTML = '';
  mountEl.classList.add('ifx-rt-page');

  var sectionMap = ensureSections(mountEl, m);

  if (m.pageKey === 'market') {
    applyMarketLayout(mountEl);
  } else if (m.pageKey === 'home') {
    applyHubLayout(mountEl);
  }

  /* Definition (đã enrich) TRƯỚC mount — không applyCurrent lại cuối boot. */
  applyDefinitionToDocument(m);

  var loaded = [];

  /* Phase 4 mount path: PagePublished → Layout Engine → display.module */
  if (m.published) {
    await ensureLayoutEngine();
    var pubKey = m.publishKey || m.pageKey;
    if (m.pagePayload && IfluxPageLayoutEngine.prime) {
      IfluxPageLayoutEngine.prime(pubKey, m.pagePayload);
    }
    var filter = m.publishedSections || null;
    var tree = await IfluxPageLayoutEngine.buildHostTree(mountEl, pubKey, {
      sectionFilter: filter
    });
    var publishedLoaded = await mountPublishedWidgets(tree, {
      logPrefix: '[PageRuntime/' + pubKey + ']'
    });
    loaded = loaded.concat(publishedLoaded);
    /* Permission sau mount — Entity DOM đã có để Shell mask + overlay. */
    if (window.IfluxBlockGate && IfluxBlockGate.apply) {
      IfluxBlockGate.apply(m.pageKey === 'home' ? 'home' : m.pageKey);
    }
  }

  /* Slot còn lại (vd Home Main = WGT-HOME-DASH) — không thuộc PagePublished canvas. */
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
