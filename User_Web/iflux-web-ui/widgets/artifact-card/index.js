/**
 * TMP-ARTIFACT-CARD — Renderer generic chứng minh Platform (Phase 3).
 * Chỉ đọc Artifact content — không resolve SoT.
 */
export const meta = {
  id: 'TMP-ARTIFACT-CARD',
  title: 'Artifact Card'
};

export async function mount(el, ctx) {
  if (!el) return;
  ctx = ctx || {};
  var art = ctx.artifact || {};
  var content = art.content || {};
  var title = content.title || (ctx.slot && ctx.slot.id) || 'Widget';
  var desc = content.description || '';
  var id = art.id || (ctx.widgetId) || '';

  el.innerHTML =
    '<div class="ifx-wgt-block" data-ifx-artifact-card>' +
      '<div class="ifx-wgt-head">' +
        '<h3 class="ifx-wgt-title">' + esc(title) + '</h3>' +
        (id ? '<p class="ifx-wl-meta">' + esc(id) + '</p>' : '') +
      '</div>' +
      (desc
        ? '<div class="ifx-wgt-body"><p class="ifx-wl-empty">' + esc(desc) + '</p></div>'
        : '<div class="ifx-wgt-body"><p class="ifx-wl-empty">Nội dung từ Published Artifact</p></div>') +
    '</div>';

  return {
    unmount: function () {
      if (el) el.innerHTML = '';
    }
  };
}

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function unmount(el) {
  if (el) el.innerHTML = '';
}
