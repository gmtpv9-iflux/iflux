/**
 * Mount Widget đã publish — một đường duy nhất cho mọi Widget.
 *
 * Widget không sở hữu UI: User Web hiển thị Template mà widget đã chọn
 * (artifact.display.renderSpec.templateId) tại host đã đặt, bằng hàm vẽ của Template trong
 * design_system/05_templates (IfxTemplates.mount). Tiêu đề/mô tả lấy từ widget; widget chưa có
 * dữ liệu → Template dùng dữ liệu mẫu của chính nó, nên host không bao giờ trống.
 */
import { loadScript } from './legacy-bridge.js?v=r20260928q';

var LOADER_SRC = '/design_system/05_templates/00_widget/loader.js?v=20260928';

function templateIdOf(art) {
  return (art && art.display && art.display.renderSpec && art.display.renderSpec.templateId) || null;
}

/* content.dataDefinition = outputs khai báo ở Kiến trúc 4 tầng ([{symbol,name,source,demo}, …]),
   đúng thứ tự input của Template. Rỗng/thiếu → Template dùng demo mặc định của chính nó. */
function inputOf(content) {
  var defs = content && Array.isArray(content.dataDefinition) ? content.dataDefinition : null;
  if (!defs || !defs.length) return undefined;
  return defs.map(function (d) { return (d && d.demo) || ''; });
}

/**
 * @param {Array<{widgetId, host, config, artifact}>} tree
 * @param {{ logPrefix?: string }=} opts
 */
export async function mountPublishedWidgets(tree, opts) {
  opts = opts || {};
  var prefix = opts.logPrefix || '[mountPublished]';
  if (!tree || !tree.length) return [];
  if (!window.IfxTemplateLoader) await loadScript(LOADER_SRC);

  var loaded = [];
  for (var i = 0; i < tree.length; i++) {
    var entry = tree[i];
    var el = entry.host;
    if (!el || el.getAttribute('data-ifx-ent-access') === 'hidden') {
      loaded.push({ id: entry.widgetId, host: el, skipped: true });
      continue;
    }
    var art = entry.artifact || {};
    var content = art.content || {};
    var templateId = templateIdOf(art);
    try {
      await window.IfxTemplateLoader.ensure(templateId);
      /* Template không có trong danh mục DS → IfxTemplates hiện trạng thái “Chưa có Template”. */
      var root = window.IfxTemplates.mount(el, templateId, {
        title: content.title || entry.widgetId,
        description: content.description || '',
        input: inputOf(content)
      });
      if (!templateId || !root) {
        if (window.console && console.warn) console.warn(prefix, entry.widgetId, 'Template không hợp lệ:', templateId);
      }
      loaded.push({ id: entry.widgetId, host: el, templateId: templateId });
    } catch (err) {
      if (window.console && console.error) console.error(prefix, entry.widgetId, err);
      loaded.push({ id: entry.widgetId, host: el, error: err });
    }
  }
  return loaded;
}
