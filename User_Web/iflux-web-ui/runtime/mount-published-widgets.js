/**
 * Mount Widget đã publish — một đường duy nhất cho mọi Widget.
 *
 * Widget không sở hữu UI: User Web hiển thị Template mà widget đã chọn
 * (artifact.display.renderSpec.templateId) tại host đã đặt, bằng hàm vẽ của Template trong
 * design_system/05_templates (IfxTemplates.mount). Tiêu đề/mô tả lấy từ widget; widget chưa có
 * dữ liệu → Template dùng dữ liệu mẫu của chính nó, nên host không bao giờ trống.
 */
import { loadScript } from './legacy-bridge.js?v=r20261002communityfix';

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

  /* Tải SONG SONG (không await tuần tự từng widget) — mỗi widget host collapse về 0px rồi
     "nở" tức thì khi dựng xong (không có skeleton), tải tuần tự kéo dài thời gian trang còn
     nhảy chiều cao ra nhiều nhịp rời rạc, làm Sidebar sticky giật nhiều lần liên tiếp. Song
     song dồn các lần nhảy đó lại gần nhau nhất có thể — không fetch chồng chéo dữ liệu nhau
     (mỗi widget độc lập, chỉ còn phụ thuộc latency riêng của script template từng loại). */
  var loaded = await Promise.all(tree.map(async function (entry) {
    var el = entry.host;
    if (!el || el.getAttribute('data-ifx-ent-access') === 'hidden') {
      return { id: entry.widgetId, host: el, skipped: true };
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
      return { id: entry.widgetId, host: el, templateId: templateId };
    } catch (err) {
      if (window.console && console.error) console.error(prefix, entry.widgetId, err);
      return { id: entry.widgetId, host: el, error: err };
    }
  }));
  return loaded;
}
