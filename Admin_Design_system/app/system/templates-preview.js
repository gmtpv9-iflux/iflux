/**
 * ADM-SYS-012 — Preview Template = hàm vẽ của Design System + dữ liệu demo.
 *
 * Preview và User Web cùng gọi IfxTemplates.mount (design_system/05_templates) — không bản sao UI.
 * Sửa ô "Đầu vào" → preview đổi theo ngay. Hai ô đầu là tiêu đề / mô tả của widget.
 */
(function (global) {
  'use strict';

  var HEAD_N = (global.TemplatesCatalog && TemplatesCatalog.HEAD_INPUT_COUNT) || 2;

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function render(mount, template, demo, overrides) {
    if (!mount) return;
    mount.innerHTML =
      '<div class="tpl-pv-head"><code>' + esc(template.id) + '</code>' +
        '<span>Giao diện thật · dữ liệu demo điều khiển</span></div>' +
      '<div class="tpl-pv-live" data-tpl-live></div>';
    var host = mount.querySelector('[data-tpl-live]');
    var raw = demo || (global.TemplatesStore ? TemplatesStore.getDemo(template) : []);
    var hdr = (overrides && overrides.headers) ||
      (global.TemplatesStore && TemplatesStore.getHeaders ? TemplatesStore.getHeaders(template) : null) ||
      template.headers || {};
    try {
      IfxTemplates.mount(host, template.id, { title: raw[0], description: raw[1], input: raw.slice(HEAD_N), headers: hdr });
    } catch (err) {
      host.innerHTML = '<p class="tpl-pv-hint">Không dựng được preview: ' + esc(err && err.message) + '</p>';
    }
  }

  function empty(mount) {
    if (!mount) return;
    mount.innerHTML = '<p class="tpl-pv-hint"><i class="ti ti-eye"></i><br/>Bấm <strong>Xem</strong> để dựng giao diện thật (Design System) — sửa ô <strong>Đầu vào</strong> để điều khiển dữ liệu.</p>';
  }

  global.TemplatesPreview = { render: render, empty: empty };
})(window);
