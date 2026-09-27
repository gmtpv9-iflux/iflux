'use strict';

const TEMPLATE_ID_RE = /^TMP-[A-Z0-9][A-Z0-9-]{1,48}$/;

/**
 * Widget chỉ chọn Template — artifact chỉ lưu templateId.
 * UI của Template nằm ở design_system/05_templates; mỗi nền tảng tự hiển thị theo templateId.
 * Không bảng ánh xạ module, không gán mặc định: thiếu / sai templateId → báo lỗi.
 */
function resolveTemplate(draft) {
  const templateId = draft.template || draft.templateId || null;
  if (!templateId || !TEMPLATE_ID_RE.test(templateId)) {
    const e = new Error(
      'Widget ' + (draft.id || '') + ' chưa chọn Template hợp lệ (' + (templateId || 'trống') +
      '). Chọn Template trong Kiến trúc 4 tầng rồi publish lại.'
    );
    e.statusCode = 400;
    throw e;
  }
  return {
    templateId: templateId,
    display: {
      renderSpec: {
        templateId: templateId,
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

/** File giao diện do nền tảng nạp theo templateId — artifact không mang CSS/JS. */
function resolveDependency() {
  return { dependencies: [] };
}

module.exports = {
  TEMPLATE_ID_RE,
  resolveTemplate,
  resolveLayout,
  resolvePermission,
  resolveCapability,
  resolveDependency
};
