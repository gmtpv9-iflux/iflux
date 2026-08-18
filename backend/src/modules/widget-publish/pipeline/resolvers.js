'use strict';

const { legacyRuntimeFor, legacyDepsFor, legacyCssFor } = require('../seed/legacy-runtime-map');
const {
  resolveRuntimeImplementation,
  RUNTIME_WEB
} = require('../seed/runtime-implementations');

/**
 * Wave 3 — nguồn chuẩn: resolveRuntimeImplementation(template, runtime).
 * Legacy WGT-id + debt module vẫn giữ (Wave 4 soft — chưa cắt cứng).
 */
function resolveTemplate(draft, opts) {
  opts = opts || {};
  const runtime = String(opts.runtime || draft.runtime || RUNTIME_WEB).toLowerCase();
  const templateId = draft.template || draft.templateId || null;

  /* 1) Runtime Implementation Ready (chuẩn) */
  let rt = resolveRuntimeImplementation(templateId, runtime);

  /* 2) Legacy widgetId map (Wave 4 soft — giữ) */
  if (!rt) {
    const legacy = legacyRuntimeFor(draft.id);
    if (legacy) rt = { renderer: legacy.renderer, module: legacy.module, _legacy: true };
  }

  /*
   * 3) Technical Debt: draft.module / lazyModule (Wave 4 soft — giữ).
   */
  const debtModule =
    (draft.display && draft.display.module) ||
    draft.module ||
    draft.lazyModule ||
    null;
  const debtRenderer =
    (draft.display && draft.display.renderer) ||
    draft.renderer ||
    'generic';

  if (!rt && debtModule) {
    rt = { renderer: debtRenderer, module: debtModule, _debtModuleString: true };
  }

  if (!rt || !rt.module) {
    const e = new Error(
      'Runtime ' +
        runtime.toUpperCase() +
        ' chưa sẵn sàng cho Template ' +
        (templateId || '(không có)') +
        ' (id=' +
        (draft.id || '') +
        '). Cần Implementation Ready từ Developer/Build.'
    );
    e.statusCode = 400;
    throw e;
  }

  return {
    templateId: templateId || 'TMP-LEGACY',
    runtime: runtime,
    display: {
      renderer: rt.renderer || 'generic',
      module: rt.module,
      renderSpec: {
        templateId: templateId || 'TMP-LEGACY',
        runtime: runtime,
        variant: draft.renderVariant || 'default'
      }
    }
  };
}

function resolveLayout(draft, placement) {
  const span = (placement && placement.span) || draft.defaultSpan || 12;
  return {
    layout: {
      section: (placement && placement.section) || 'main',
      position: (placement && placement.position) != null ? placement.position : 0,
      span: span,
      regions: {
        header: !!draft.layoutHeader,
        toolbar: !!draft.layoutToolbar,
        body: true,
        footer: !!draft.layoutFooter
      }
    }
  };
}

function resolvePermission(draft) {
  const blocks = Array.isArray(draft.blocks) ? draft.blocks.slice() : [];
  return {
    permission: {
      accessPolicy: draft.accessPolicy || 'entitlement',
      blocks: blocks,
      minTier: draft.minTier || 'free',
      sharePolicy: draft.sharePolicy || { enabled: true }
    }
  };
}

function resolveCapability(draft) {
  return {
    capabilities: {
      share: draft.share !== false,
      insight: draft.insight !== false,
      export: Array.isArray(draft.exportFormats) ? draft.exportFormats.slice() : ['png']
    }
  };
}

function resolveDependency(resolvedDisplay, draft) {
  const renderer = resolvedDisplay && resolvedDisplay.renderer;
  const deps = legacyDepsFor(renderer);
  const cssList = [];
  if (draft && Array.isArray(draft.css)) cssList.push.apply(cssList, draft.css);
  if (draft && Array.isArray(draft.stylesheets)) cssList.push.apply(cssList, draft.stylesheets);
  if (!cssList.length && renderer) {
    cssList.push.apply(cssList, legacyCssFor(renderer));
  }
  cssList.forEach(function (href) {
    if (!href) return;
    if (deps.some(function (d) { return d.kind === 'stylesheet' && d.href === href; })) return;
    deps.push({ kind: 'stylesheet', href: href });
  });
  return { dependencies: deps };
}

module.exports = {
  resolveTemplate,
  resolveRuntimeImplementation,
  resolveLayout,
  resolvePermission,
  resolveCapability,
  resolveDependency
};
