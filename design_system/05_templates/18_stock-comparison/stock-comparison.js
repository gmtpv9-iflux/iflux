/** TMP-STOCK-COMPARISON — snapshot đã kiểm tra; không fetch hoặc chọn chỉ tiêu. */
(function (global) {
  'use strict';
  var T = global.IfxTemplates, U = T.util;
  T.define('TMP-STOCK-COMPARISON', {
    inputs: [
      { label: 'Mã cổ phiếu', demo: 'AAA | BBB | CCC' },
      { label: 'Giá trị', demo: '12.5 | 9.8 | 15.2' }
    ],
    render: function (input, ctx) {
      var c = U.columns(input);
      var data = ctx.data !== undefined ? ctx.data : { chart: true, unit: 'lần', sector_name: 'Ngành minh họa', period_end: '2026-06-30', as_of: '2026-09-30', rows: c[0].map(function (ticker, i) { return { ticker: ticker, value: U.num(c[1][i]), source_label: 'Nguồn minh họa' }; }) };
      if (!data || !data.rows || !data.rows.length) return '<p>Chưa có đủ dữ liệu cùng kỳ để so sánh.</p>';
      var rows = data.rows, available = rows.filter(function (r) { return r.value !== null && Number.isFinite(r.value); });
      var plot = data.chart && available.length >= 2 ? T.get('TMP-DIVERGING-BARS').plot(available.map(function (r) { return r.ticker; }), available.map(function (r) { return r.value; })) : '';
      return '<p><small>' + U.esc(data.scope ? data.scope.name : data.sector_name) + ' · Kỳ: ' + U.esc(data.period_end || 'Giá trị hiện hành') + ' · Snapshot đọc lúc: ' + U.esc(data.as_of) + ' · Đơn vị: ' + U.esc(data.unit) + '</small></p>' + plot +
        '<div class="ifx-table-wrap"><table class="ifx-table"><thead><tr><th scope="col">Cổ phiếu</th><th scope="col">Giá trị</th><th scope="col">Nguồn / cập nhật</th></tr></thead><tbody>' + rows.map(function (r) {
          var source = /^https?:\/\//i.test(r.source_url || '') ? '<a href="' + U.esc(r.source_url) + '" target="_blank" rel="noopener noreferrer">' + U.esc(r.source_label) + '</a>' : U.esc(r.source_label || '—');
          return '<tr><th scope="row"><span data-ifx-role="entity-name" data-ifx-entity-kind="stock" data-ifx-entity-raw="' + U.esc(r.ticker) + '">' + U.esc(r.ticker) + '</span></th><td>' + U.fmtNum(r.value) + '</td><td>' + source + (r.source_updated_at ? '<br><small>' + U.esc(new Date(r.source_updated_at).toLocaleString('vi-VN')) + '</small>' : '') + '</td></tr>';
        }).join('') + '</tbody></table></div>';
    }
  });
})(typeof window !== 'undefined' ? window : globalThis);
