/** TMP-EVENT-TIMELINE — một renderer cho preview và mọi runtime, không gọi API. */
(function (global) {
  'use strict';
  var T = global.IfxTemplates;
  var U = T.util;
  var LABELS = { announced: 'Đã công bố', planned: 'Dự kiến', in_progress: 'Đang diễn ra', reported_result: 'Đã báo cáo kết quả', completed: 'Đã hoàn tất', cancelled: 'Đã hủy', corrected: 'Đã đính chính' };
  function date(value) {
    if (!value) return '—';
    var d = new Date(value);
    return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
  }
  function source(e) {
    if (!/^https?:\/\//i.test(e.url || '')) return '';
    return '<li><a href="' + U.esc(e.url) + '" target="_blank" rel="noopener noreferrer">' + U.esc(e.label) + '</a>' +
      (e.quote ? '<blockquote>' + U.esc(e.quote) + '</blockquote>' : '') + '</li>';
  }
  T.define('TMP-EVENT-TIMELINE', {
    inputs: [
      { label: 'Tên mốc', demo: 'Báo cáo kết quả | Công bố kế hoạch' },
      { label: 'Ngày công bố', demo: '2026-09-20 | 2026-08-10' },
      { label: 'Diễn biến', demo: 'Đã công bố số thực hiện của cùng đợt. | Kế hoạch dự kiến, chưa xác nhận hoàn tất.' },
      { label: 'Trạng thái', demo: 'reported_result | planned' }
    ],
    render: function (input, ctx) {
      var cols = U.columns(input);
      // data=[] là dữ liệu thật rỗng; không lấy demo thay thế.
      var rows = ctx.data !== undefined ? ctx.data : cols[0].map(function (title, i) {
        return { title: title, announced_on: cols[1][i], summary: cols[2][i], status: cols[3][i], subject_name: 'Doanh nghiệp minh họa', evidence: [], metrics: [] };
      });
      if (!rows.length) return '<p>Chưa có mốc sự kiện đã được duyệt.</p>';
      return '<ol class="ifx-timeline ifx-event-timeline">' + rows.map(function (m) {
        var metrics = (m.metrics || []).map(function (v) {
          return '<li>' + U.esc(v.subject + ' · ' + v.indicator) + ': <strong>' + U.fmtNum(v.value) + '</strong> ' + U.esc(v.unit) +
            ' · ' + U.esc(v.period || '—') + ' · ' + (v.basis === 'planned' ? 'Dự kiến' : 'Thực tế') + '</li>';
        }).join('');
        return '<li class="ifx-timeline-item">' +
          '<span class="ifx-timeline-marker' + (m.status === 'planned' ? ' ifx-timeline-marker-muted' : ' is-filled') + '" aria-hidden="true"></span>' +
          '<div class="ifx-timeline-header"><strong class="ifx-timeline-title">' + U.esc(m.title) + '</strong>' +
          '<span class="ifx-timeline-meta">Công bố: ' + date(m.announced_on) + '</span></div>' +
          '<div class="ifx-timeline-body"><p class="ifx-event-subject">' + U.esc(m.subject_name || '') + '</p><p class="ifx-event-summary">' + U.esc(m.summary) + '</p>' +
          '<p><small>' + U.esc(LABELS[m.status] || m.status || '—') + ' · Hiệu lực/diễn ra: ' + date(m.effective_on) + '</small></p>' +
          (metrics ? '<ul>' + metrics + '</ul>' : '') +
          ((m.evidence || []).length ? '<details><summary>Nguồn và bằng chứng</summary><ul>' + m.evidence.map(source).join('') + '</ul></details>' : '') +
          '</div></li>';
      }).join('') + '</ol>';
    }
  });
})(typeof window !== 'undefined' ? window : globalThis);
