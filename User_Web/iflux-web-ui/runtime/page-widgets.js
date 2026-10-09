/**
 * Widget Placement của một trang — dựng host tree từ PagePublished rồi hiển thị Template mà mỗi widget chọn.
 * Mọi trang (runtime chung hoặc module trang) dùng hàm này; trang chỉ cần có khung buildPageFrame.
 */
import { loadScript } from './legacy-bridge.js?v=dec30759da';
import { mountPublishedWidgets } from './mount-published-widgets.js?v=0e48240b6b';

var ENGINE_SRC = '/User_Web/iflux-web-ui/runtime/page-layout-engine.js?v=a6f64093c8';

/**
 * @param {Element} root — phần tử chứa khung trang
 * @param {string} publishKey — khoá trang trong Cài đặt trang (vd flow, news-topic, stock-detail)
 * @param {{ sectionFilter?: string[], gateKey?: string }=} opts
 */
export async function mountPageWidgets(root, publishKey, opts) {
  opts = opts || {};
  if (!root || !publishKey) return [];
  if (!window.IfluxPageLayoutEngine) await loadScript(ENGINE_SRC);
  var tree = await window.IfluxPageLayoutEngine.buildHostTree(root, publishKey, { sectionFilter: opts.sectionFilter || null });
  var loaded = tree && tree.length ? await mountPublishedWidgets(tree, { logPrefix: '[' + publishKey + ']' }) : [];
  /* Phân quyền sau khi mount — overlay / che tên đối tượng theo gói của người xem. */
  if (window.IfluxBlockGate && IfluxBlockGate.apply) IfluxBlockGate.apply(opts.gateKey || publishKey);
  return loaded;
}
