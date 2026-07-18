/**
 * iFlux Runtime — Page Runtime (ESM)
 * Slot path: Page Manifest → sections → Widget Loader.
 * Published path (Phase 4): PagePublished → Layout Engine → mount(display.module).
 */

import {
  ensureSections,
  applyMarketLayout,
  applyHubLayout,
  renderPageHeader
} from './app-shell.js?v=phase4Pub20260716b';
import { loadWidget } from './widget-loader.js?v=bpPhaseD20260716';
import { loadScript } from './legacy-bridge.js?v=lazyAll20260713k';
import { mountPublishedWidgets } from './mount-published-widgets.js?v=phase4Pub20260716b';

var LAYOUT_ENGINE_SRC = '/User_Web/iflux-web-ui/runtime/page-layout-engine.js?v=phase4Pub20260716b';

async function ensureLayoutEngine() {
  if (window.IfluxPageLayoutEngine && IfluxPageLayoutEngine.buildHostTree) return;
  await loadScript(LAYOUT_ENGINE_SRC);
}

export async function bootPage(m, mountEl) {
  if (!m || !mountEl) return { manifest: null, widgets: [] };

  mountEl.innerHTML = '';
  mountEl.classList.add('ifx-rt-page');

  renderPageHeader(mountEl, m);
  var sectionMap = ensureSections(mountEl, m);

  if (m.pageKey === 'market') {
    applyMarketLayout(mountEl);
  } else if (m.pageKey === 'home') {
    applyHubLayout(mountEl);
  }

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
    if (window.IfluxBlockGate && IfluxBlockGate.apply) {
      IfluxBlockGate.apply(m.pageKey === 'home' ? 'home' : m.pageKey);
    }
    var publishedLoaded = await mountPublishedWidgets(tree, {
      logPrefix: '[PageRuntime/' + pubKey + ']'
    });
    loaded = loaded.concat(publishedLoaded);
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
    var entry = await loadWidget(slot, sectionEl, {});
    loaded.push(entry);
  }

  if (m.documentTitle) {
    document.title = m.documentTitle;
  }

  return { manifest: m, widgets: loaded };
}
