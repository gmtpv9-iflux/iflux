/* ===== IFX-AUDIT-BEGIN =====
AUDIT-ID: T5A-IGNORE-010
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
 * Mount path helper — Host Tree → import(display.module) → mount(host, ctx).
 * Ctx chỉ: host (el), artifact, view model (config/slot) — không pageKey/route/section/layout.
 */
import { loadStyles } from './legacy-bridge.js?v=cssPin20260808';

function stylesheetHrefs(widgetArt) {
  var deps = (widgetArt && widgetArt.dependencies) || [];
  var out = [];
  for (var i = 0; i < deps.length; i++) {
    var d = deps[i];
    if (d && d.kind === 'stylesheet' && d.href) out.push(d.href);
  }
  return out;
}

/**
 * @param {Array<{widgetId, host, config, artifact}>} tree
 * @param {{ logPrefix?: string }=} opts
 */
export async function mountPublishedWidgets(tree, opts) {
  opts = opts || {};
  var prefix = opts.logPrefix || '[mountPublished]';
  if (!tree || !tree.length) return [];

  var loaded = [];
  for (var i = 0; i < tree.length; i++) {
    var entry = tree[i];
    var el = entry.host;
    if (!el || el.getAttribute('data-ifx-ent-access') === 'hidden') {
      loaded.push({ id: entry.widgetId, host: el, skipped: true });
      continue;
    }
    var art = entry.artifact;
    var moduleUrl = art && art.display && art.display.module;
    if (!moduleUrl) {
      el.innerHTML = '<div class="ifx-wl-empty">Widget ' + entry.widgetId + ' thiếu display.module</div>';
      loaded.push({ id: entry.widgetId, host: el, error: 'missing display.module' });
      continue;
    }
    try {
      var css = stylesheetHrefs(art);
      if (css.length) await loadStyles(css);
      var mod = await import(moduleUrl);
      if (!mod || typeof mod.mount !== 'function') throw new Error('missing mount()');
      var instance = await mod.mount(el, {
        slot: { id: entry.widgetId, config: entry.config || {} },
        config: entry.config || {},
        widgetId: entry.widgetId,
        artifact: art
      });
      loaded.push({ id: entry.widgetId, host: el, module: mod, instance: instance });
    } catch (err) {
      el.innerHTML = '<div class="ifx-wl-empty">Không tải được Widget ' + entry.widgetId + '</div>';
      if (window.console && console.error) console.error(prefix, entry.widgetId, err);
      loaded.push({ id: entry.widgetId, host: el, error: err });
    }
  }
  return loaded;
}
