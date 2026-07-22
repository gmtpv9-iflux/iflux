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
} from './app-shell.js?v=phaseB220260721a';
import { applyDefinitionToDocument } from './page-definition.js?v=phaseB220260721a';
import { loadWidget } from './widget-loader.js?v=bpPhaseD20260716';
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

  if (m.renderPageHead !== false) {
    renderPageHeader(mountEl, m);
  }
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

  /* Host trống → ẩn tiêu đề/mô tả page (App Shell chrome) đi kèm. */
  syncEmptyPageHead(mountEl);

  return { manifest: m, widgets: loaded };
}

/** Khi mọi [data-ifx-section] trống — không hiện title/intro page. */
function syncEmptyPageHead(root) {
  if (!root) return;
  var head = root.querySelector('.ifx-rt-page-head');
  if (!head) return;
  var hosts = root.querySelectorAll('[data-ifx-section]');
  var any = false;
  for (var i = 0; i < hosts.length; i++) {
    var h = hosts[i];
    if (h.querySelector('[data-widget-id], .ifx-rt-widget')) {
      any = true;
      break;
    }
    if (h.children && h.children.length) {
      any = true;
      break;
    }
  }
  head.hidden = !any;
}
