'use strict';

const { legacyRuntimeFor, legacyDepsFor, legacyCssFor } = require('../seed/legacy-runtime-map');
const { templateRuntimeFor } = require('../seed/template-runtime-map');

function resolveTemplate(draft) {
  const templateId = draft.template || draft.templateId || null;

  /* 1) Template SoT (chuẩn) */
  let rt = templateRuntimeFor(templateId);

  /* 2) Legacy widgetId map (widget cũ) */
  if (!rt) rt = legacyRuntimeFor(draft.id);

  /*
   * 3) Technical Debt (Post-MVP): draft.module / lazyModule string.
   * Admin dài hạn không nhập URL — chỉ Template. Giữ tạm cho MVP.
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
      'Publish thiếu display.module — chọn Template hợp lệ (hoặc Temporary Debt: draft.module). template=' +
        (templateId || '') +
        ' id=' +
        (draft.id || '')
    );
    e.statusCode = 400;
    throw e;
  }

  return {
    templateId: templateId || 'TMP-LEGACY',
    display: {
      renderer: rt.renderer || 'generic',
      module: rt.module,
      renderSpec: {
        templateId: templateId || 'TMP-LEGACY',
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
  resolveLayout,
  resolvePermission,
  resolveCapability,
  resolveDependency
};
