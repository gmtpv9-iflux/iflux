/**
 * ADM-SYS-012 — Preview template = GIAO DIỆN THẬT của Design System + DỮ LIỆU DEMO.
 *
 * Nguyên tắc: template quy định sẵn giao diện, chỉ đợi TRUYỀN DỮ LIỆU vào là hiển thị.
 * Nên preview KHÔNG sao chép UI, KHÔNG tự chế CSS — mà GỌI đúng component / hàm dựng
 * của Design System (User Web) rồi bơm dữ liệu lấy từ cột "Đầu vào" (ô nhập demo).
 * Sửa ô demo → preview đổi theo ngay.
 *
 * Mỗi template có 1 "driver" theo khoá template.render. Driver nhận:
 *   host   : phần tử chứa preview
 *   c      : mảng chuỗi demo theo từng Đầu vào (index-aligned, ngăn giá trị bằng "|")
 *   tpl    : object template
 */
(function (global) {
  'use strict';

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function T() { return global.IfluxBlockTemplates; }

  /** Tách 1 ô demo thành mảng theo dấu "|" (giữ nguyên index, đã trim). */
  function cols(s) {
    return String(s == null ? '' : s).split('|').map(function (x) { return x.trim(); });
  }
  /** Chỉ lấy các giá trị không rỗng (dùng cho danh sách tên/mã). */
  function list(s) {
    return cols(s).filter(function (x) { return x !== ''; });
  }
  /** Số phần tử của 1 slot = số item ngăn bởi "|" sau khi bỏ các ô rỗng ở cuối. */
  function slotCount(s) {
    var arr = cols(s);
    while (arr.length && arr[arr.length - 1] === '') arr.pop();
    return arr.length;
  }
  /**
   * SoT: số phần tử suy ra từ dữ liệu ("|"), KHÔNG lưu slotCount. Các slot cùng một
   * nhóm phải cùng số phần tử. Nếu lệch VẪN render đủ theo số lớn nhất — vị trí
   * thiếu dữ liệu được khoanh viền lỗi (token --ix-danger), không chặn preview.
   * Trả { max, flags[] } — flags[i] = true nếu có slot thiếu phần tử thứ i.
   */
  function groupAlign(groupCols) {
    var counts = groupCols.map(slotCount);
    var used = counts.filter(function (n) { return n > 0; });
    var max = used.length ? Math.max.apply(null, used) : 0;
    var flags = [];
    for (var i = 0; i < max; i++) {
      flags.push(counts.some(function (n) { return n > 0 && n <= i; }));
    }
    return { max: max, flags: flags };
  }
  /** cols() nhưng pad đủ n phần tử (phần thiếu = chuỗi rỗng). */
  function colsN(s, n) {
    var arr = cols(s);
    while (arr.length < n) arr.push('');
    return arr;
  }
  /** Khoanh viền lỗi các phần tử thiếu dữ liệu (sau khi đã render). */
  function markMissing(host, selector, flags) {
    if (!flags || !flags.some(Boolean)) return;
    var items = host.querySelectorAll(selector);
    flags.forEach(function (miss, i) {
      if (miss && items[i]) {
        items[i].style.outline = '1px dashed var(--ix-danger)';
        items[i].style.outlineOffset = '-1px';
      }
    });
  }
  function num(v) {
    var n = parseFloat(String(v == null ? '' : v).replace(/[^0-9.\-]/g, ''));
    return isNaN(n) ? 0 : n;
  }
  function fmtPct(v) {
    if (v == null || isNaN(v)) return '—';
    return (v >= 0 ? '+' : '') + Number(v).toFixed(2) + '%';
  }
  function byScoreDesc(a, b) { return b.score - a.score; }

  var HEAD_N = (global.TemplatesCatalog && TemplatesCatalog.HEAD_INPUT_COUNT) || 2;

  /* Overrides từ working copy của trang Admin (Edit Mode) — chỉ tồn tại trong 1 lần render(). */
  var currentOverrides = null;

  function splitDemo(c) {
    c = c || [];
    return {
      head: {},
      data: c.slice(HEAD_N)
    };
  }

  /** Preview Template chỉ dựng phần thân; tiêu đề/mô tả thuộc Widget Definition. */
  function withWidgetHead(bodyHtml) {
    return '<div class="ifx-wgt-block">' + bodyHtml + '</div>';
  }

  function needDS(host, ok, msg) {
    if (ok) return true;
    host.innerHTML = '<div class="ifx-wl-empty">' + esc(msg) + '</div>';
    return false;
  }

  /* ---------- Chart helper: render khi container đã có bề rộng thực ---------- */
  function renderApexWhenVisible(el, chart, tries) {
    tries = tries || 0;
    if (!el.isConnected) return;
    var w = el.offsetWidth || (el.getBoundingClientRect && el.getBoundingClientRect().width) || 0;
    if (w > 0) { try { chart.render(); } catch (e) { /* ignore */ } return; }
    if (tries >= 40) return;
    (global.requestAnimationFrame || function (fn) { setTimeout(fn, 32); })(function () {
      renderApexWhenVisible(el, chart, tries + 1);
    });
  }

  /* ==================================================================== */
  /* DRIVERS — theo template.render                                       */
  /* ==================================================================== */
  var DRIVERS = {};

  /* Summary / Overview → block chỉ số thật (renderIndexGrid) */
  DRIVERS['kpi'] = function (host, c, tpl, head) {
    if (!needDS(host, T(), 'Thiếu block-templates.js')) return;
    var g = groupAlign([c[0], c[1], c[2]]);
    var nm = colsN(c[0], g.max), val = colsN(c[1], g.max), chg = colsN(c[2], g.max);
    var ex = [];
    for (var i = 0; i < g.max; i++) {
      ex.push({
        name: nm[i] || '—',
        value: val[i] !== '' ? num(val[i]) : null,
        change_pct: num(chg[i])
      });
    }
    host.innerHTML = withWidgetHead(
      '<section class="ifx-com-overview"><div class="ifx-com-overview__indices">' +
        T().renderIndexGrid(ex) + '</div></section>',
      head
    );
    markMissing(host, '.ifx-com-ex-card', g.flags);
  };

  /* Bảng xếp hạng theo chỉ số → thanh xếp hạng thật (renderRankBarList) */
  DRIVERS['rank-perf'] = function (host, c, tpl, head) {
    if (!needDS(host, T(), 'Thiếu block-templates.js')) return;
    var g = groupAlign([c[0], c[1]]);
    var nm = colsN(c[0], g.max), perf = colsN(c[1], g.max);
    var items = [];
    for (var i = 0; i < g.max; i++) {
      items.push({ name: nm[i] || '—', perf: num(perf[i]) });
    }
    host.innerHTML = withWidgetHead(
      T().renderRankBarList({
        items: items,
        headLabel: 'Đối tượng',
        headValue: 'Chỉ số',
        emptyMsg: 'Chưa có dữ liệu'
      }),
      head
    );
    markMissing(host, '.ifx-rank-bar__row', g.flags);
  };

  /* Đối chiếu xếp hạng hai chiều (Duo) → IfluxFlowScoreTop.mount (radar 2 cực + danh sách 2 cột) */
  DRIVERS['rank-duo'] = function (host, c, tpl, head) {
    if (!needDS(host, global.IfluxFlowScoreTop, 'Thiếu flow-score-top.js')) return;
    var inEnt = cols(c[0]), inS = cols(c[1]), outEnt = cols(c[2]), outS = cols(c[3]);
    var inItems = [], outItems = [];
    inEnt.forEach(function (name, i) {
      if (!name) return;
      var iv = num(inS[i]);
      if (iv > 0) inItems.push({ id: 'in-' + i, label: name, score: iv });
    });
    outEnt.forEach(function (name, i) {
      if (!name) return;
      var ov = num(outS[i]);
      if (ov > 0) outItems.push({ id: 'out-' + i, label: name, score: ov });
    });
    inItems.sort(byScoreDesc); outItems.sort(byScoreDesc);
    var duoTitle = 'Đối chiếu hai chiều vào / ra';
    var duoDesc = 'Radar hai cực · danh sách 2 cột — dữ liệu demo';
    var inBlock = { id: 'tpl-duo-in', title: '', polarity: 'positive', entityType: 'stock', items: inItems, duoTitle: duoTitle, duoDescription: duoDesc };
    var outBlock = { id: 'tpl-duo-out', title: '', polarity: 'negative', entityType: 'stock', items: outItems, duoTitle: duoTitle, duoDescription: duoDesc };
    host.innerHTML = withWidgetHead('<div data-tpl-duo-host></div>', head);
    global.IfluxFlowScoreTop.mount(host.querySelector('[data-tpl-duo-host]'), [outBlock, inBlock], { mergePairs: true });
  };

  /* Ranking · Dòng tiền thông minh (Signal) → IfluxFlowScoreTop.mount (radar + FOMO + Cơ hội/Rủi ro) */
  DRIVERS['rank-signal'] = function (host, c, tpl, head) {
    if (!needDS(host, global.IfluxFlowScoreTop, 'Thiếu flow-score-top.js')) return;
    var ent = cols(c[0]), sig = cols(c[1]), sc = cols(c[2]), fomo = cols(c[3]);
    var items = ent.map(function (name, i) {
      if (!name) return null;
      var neg = /ti[êe]u|r[ủu]i|âm|giảm|giam|bán|ban|^-/.test((sig[i] || '').toLowerCase());
      return {
        id: 'sig-' + i,
        label: name,
        score: num(sc[i]),
        riskScore: num(fomo[i]),
        recommendation: neg ? 'Rủi ro' : 'Cơ hội'
      };
    }).filter(Boolean);
    var block = {
      id: 'tpl-signal',
      title: '',
      polarity: 'positive',
      entityType: 'stock',
      items: items,
      showRecommendation: true,
      recommendationKind: 'insight',
      showRisk: true,
      riskLabel: 'Chỉ báo rủi ro',
      hideCompliance: true
    };
    host.innerHTML = withWidgetHead('<div data-tpl-sig-host></div>', head);
    global.IfluxFlowScoreTop.mount(host.querySelector('[data-tpl-sig-host]'), [block], { mergePairs: false });
  };

  /* Flow Summary → 4 thanh mua/bán theo chủ thể (đúng markup WGT-FLW-001) */
  DRIVERS['flow-summary'] = function (host, c, tpl, head) {
    var g = groupAlign([c[0], c[1], c[2]]);
    var subj = colsN(c[0], g.max), buy = colsN(c[1], g.max), net = colsN(c[2], g.max);
    var html = subj.map(function (s, i) {
      if (i >= g.max) return '';
      s = s || '—';
      var b = Math.max(0, Math.min(100, num(buy[i])));
      var nv = (net[i] || '').trim();
      var netUp = !/^-/.test(nv.replace(/\s/g, ''));
      return (
        '<div class="ifx-flow-panel">' +
          '<div class="ifx-flow-panel__head">' +
            '<span class="ifx-flow-panel__label">' + esc(s) + '</span>' +
            '<span class="ifx-flow-panel__net ' + (netUp ? 'is-up' : 'is-down') + '">' + esc(nv) + '</span>' +
          '</div>' +
          '<div class="ifx-flow-bar">' +
            '<div class="ifx-flow-bar__buy" style="width:' + b + '%"></div>' +
            '<div class="ifx-flow-bar__sell" style="width:' + (100 - b) + '%"></div>' +
          '</div>' +
        '</div>'
      );
    }).join('');
    host.innerHTML = withWidgetHead('<div class="ifx-flow-summary">' + html + '</div>', head);
    markMissing(host, '.ifx-flow-panel', g.flags);
  };

  /* Top N kèm tab thời gian → ix-tabs + list hạng · tên · chip điểm · metrics phụ (icon registry).
     Tab active = tab đầu tiên; Top N = số phần tử trong dữ liệu (suy ra, không cấu hình). */
  DRIVERS['community-story-top'] = function (host, c, tpl, head) {
    var g = groupAlign([c[0], c[1], c[2], c[3], c[4]]);
    var names = colsN(c[0], g.max);
    var scores = colsN(c[1], g.max);
    var views = colsN(c[2], g.max);
    var comments = colsN(c[3], g.max);
    var favorites = colsN(c[4], g.max);
    var periodTabs = list(c[5]);
    if (!periodTabs.length) periodTabs = ['Ngày', 'Tuần', 'Tháng'];
    var activeTab = periodTabs[0];
    var tabs = periodTabs.map(function (lb) {
      return '<button type="button" class="ix-tab' + (lb === activeTab ? ' active' : '') + '">' + esc(lb) + '</button>';
    }).join('');
    var rows = names.slice(0, g.max).map(function (name, i) {
      name = name || '—';
      var rank = i + 1;
      var metrics = [
        { type: 'view', value: views[i] },
        { type: 'comment', value: comments[i] },
        { type: 'like', value: favorites[i] }
      ].filter(function (m) { return m.value != null && String(m.value).trim() !== ''; })
        .map(function (m) {
          return '<span class="ifx-com-expert-row__members" title="' + esc(m.type) + '">' +
            metricIcon(m.type) + ' ' + esc(fmtMetric(m.value)) +
          '</span>';
        }).join('');
      return (
        '<div class="ix-list-item ifx-com-story-rank">' +
          '<div class="ifx-com-story-rank__num" aria-label="Top ' + rank + '">' + rank + '</div>' +
          '<div class="ifx-com-story-rank__body">' +
            '<div class="ifx-com-story-rank__title-row">' +
              '<span class="ifx-com-story-rank__title">' + esc(name) + '</span>' +
              '<span class="ifx-com-story-rank__title" style="margin-left:auto">' + esc(scores[i] || '—') + '</span>' +
            '</div>' +
            (metrics ? '<div class="ifx-com-story-rank__sub ifx-com-expert-row__line2">' + metrics + '</div>' : '') +
          '</div>' +
        '</div>'
      );
    }).join('');
    var body =
      '<div class="ix-tabs" role="tablist" aria-label="Khung thời gian">' + tabs + '</div>' +
      '<div class="ifx-com-story-rank-list">' +
        (rows || '<div class="ifx-com-trending-empty">Chưa có dữ liệu.</div>') +
      '</div>';
    host.innerHTML = withWidgetHead(body, head);
    markMissing(host, '.ifx-com-story-rank', g.flags);
  };

  /* ---------- Metric icon registry (SVG outline — tabler-icons-3.44.0) ----------
     Renderer chỉ loop metrics[] → tra icon theo type → render. KHÔNG if/else nghiệp vụ. */
  var METRIC_ICONS = {
    like: '<path d="M19.5 12.572l-7.5 7.428l-7.5 -7.428a5 5 0 1 1 7.5 -6.566a5 5 0 1 1 7.5 6.572" />',
    share: '<path d="M4 12v-3a3 3 0 0 1 3 -3h13m-3 -3l3 3l-3 3" /><path d="M20 12v3a3 3 0 0 1 -3 3h-13m3 3l-3 -3l3 -3" />',
    comment: '<path d="M8 9h8" /><path d="M8 13h6" /><path d="M18 4a3 3 0 0 1 3 3v8a3 3 0 0 1 -3 3h-5l-5 3v-3h-2a3 3 0 0 1 -3 -3v-8a3 3 0 0 1 3 -3h12" />',
    post: '<path d="M13 20l7 -7" /><path d="M13 20v-6a1 1 0 0 1 1 -1h6v-7a2 2 0 0 0 -2 -2h-12a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h7" />',
    view: '<path d="M10 12a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" /><path d="M21 12c-2.4 4 -5.4 6 -9 6c-3.6 0 -6.6 -2 -9 -6c2.4 -4 5.4 -6 9 -6c3.6 0 6.6 2 9 6" />',
    follower: '<path d="M5 7a4 4 0 1 0 8 0a4 4 0 1 0 -8 0" /><path d="M3 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /><path d="M21 21v-2a4 4 0 0 0 -3 -3.85" />',
    score: '<path d="M12 17.75l-6.172 3.245l1.179 -6.873l-5 -4.867l6.9 -1l3.086 -6.253l3.086 6.253l6.9 1l-5 4.867l1.179 6.873l-6.158 -3.245" />',
    rank: '<path d="M8 21l8 0" /><path d="M12 17l0 4" /><path d="M7 4l10 0" /><path d="M17 4v8a5 5 0 0 1 -10 0v-8" /><path d="M3 9a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" /><path d="M17 9a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />'
  };

  function metricIcon(type) {
    var body = METRIC_ICONS[type] || METRIC_ICONS.score;
    return '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" ' +
      'stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + body + '</svg>';
  }

  /** '1240' → '1.2K', '24000' → '24K', '92' → '92' */
  function fmtMetric(v) {
    var n = Number(String(v).replace(/[^\d.-]/g, ''));
    if (isNaN(n)) return String(v);
    if (Math.abs(n) >= 1e6) return (Math.round(n / 1e5) / 10) + 'M';
    if (Math.abs(n) >= 1e3) return (Math.round(n / 100) / 10) + 'K';
    return String(n);
  }

  /** 'like:1240, comment:320' → [{type,value,label?}] */
  function parseMetrics(cell) {
    return String(cell || '').split(',').map(function (p) {
      var seg = p.trim().split(':');
      if (!seg[0]) return null;
      return { type: seg[0].trim(), value: (seg[1] || '').trim(), label: (seg[2] || '').trim() };
    }).filter(Boolean);
  }

  /* Danh sách xếp hạng (generic) → row: rank · avatar (ảnh/chữ cái) · tên + phụ đề · metrics 0..N */
  DRIVERS['community-list'] = function (host, c, tpl, head) {
    var g = groupAlign([c[0], c[1], c[2], c[3]]);
    var nm = colsN(c[0], g.max).slice(0, g.max).map(function (x) { return x || '—'; });
    var sub = colsN(c[1], g.max), ava = colsN(c[2], g.max), met = colsN(c[3], g.max);
    function initials(name) {
      var parts = String(name || '').trim().split(/\s+/).filter(Boolean);
      if (parts.length >= 2) return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
      return String(name || 'E').trim().slice(0, 2).toUpperCase();
    }
    var rows = nm.map(function (name, i) {
      var avatarUrl = (ava[i] || '').trim();
      var avatar = avatarUrl
        ? '<span class="ix-avatar ifx-com-expert-row__avatar"><img src="' + esc(avatarUrl) + '" alt="" /></span>'
        : '<span class="ix-avatar ifx-com-expert-row__avatar">' + esc(initials(name)) + '</span>';
      var metrics = parseMetrics(met[i]).map(function (m) {
        return '<span class="ifx-com-expert-row__members" title="' + esc(m.label || m.type) + '">' +
          metricIcon(m.type) + ' ' + esc(fmtMetric(m.value)) +
          (m.label ? ' ' + esc(m.label) : '') +
        '</span>';
      }).join('');
      return (
        '<div class="ifx-com-expert-row">' +
          '<span class="ifx-com-expert-row__rank">#' + (i + 1) + '</span>' +
          '<a class="ifx-com-expert-row__user" href="#">' +
            avatar +
            '<span class="ifx-com-expert-row__meta">' +
              '<strong>' + esc(name) + '</strong>' +
              '<small>' + esc(sub[i] || '') + '</small>' +
            '</span>' +
          '</a>' +
          (metrics ? '<span class="ifx-com-expert-row__line2">' + metrics + '</span>' : '') +
        '</div>'
      );
    }).join('');
    host.innerHTML = withWidgetHead(
      '<section class="ifx-com-experts-leaders"><div class="ifx-com-expert-list">' + rows + '</div></section>',
      head
    );
    markMissing(host, '.ifx-com-expert-row', g.flags);
  };

  /* Danh sách theo dõi (generic) → row: mã · tên · giá trị · % thay đổi (renderStockRowWrap) */
  DRIVERS['collection'] = function (host, c, tpl, head) {
    if (!needDS(host, T(), 'Thiếu block-templates.js')) return;
    var g = groupAlign([c[0], c[1], c[2], c[3]]);
    var codes = colsN(c[0], g.max).slice(0, g.max), names = colsN(c[1], g.max), prices = colsN(c[2], g.max), chg = colsN(c[3], g.max);
    var rows = codes.map(function (code, i) {
      return T().renderStockRowWrap({
        ticker: code || '—',
        name: names[i] || '',
        price: (prices[i] != null && prices[i] !== '') ? prices[i] : null,
        change_pct: num(chg[i])
      }, { hideVol: true });
    }).join('');
    host.innerHTML = withWidgetHead(
      rows
        ? '<div class="ifx-wl-block">' + rows + '</div>'
        : '<div class="ifx-wl-empty">Chưa có đối tượng theo dõi</div>',
      head
    );
    markMissing(host, '.ifx-stock-row-wrap', g.flags);
  };

  /* Net-flow theo chủ thể → biểu đồ đối xứng mua/bán ròng thật (renderFlowSplitBlock/Body) */
  DRIVERS['net-subject'] = function (host, c, tpl, head) {
    if (!needDS(host, T(), 'Thiếu block-templates.js')) return;
    var subj = list(c[0]);
    var bTk = cols(c[1]), bKl = cols(c[2]).map(num), sTk = cols(c[3]), sKl = cols(c[4]).map(num);
    var maxBuy = Math.max.apply(null, bKl.concat([1]));
    var maxSell = Math.max.apply(null, sKl.concat([1]));
    var gL = groupAlign([c[1], c[2]]), gR = groupAlign([c[3], c[4]]);
    var n = Math.max(gL.max, gR.max);
    var buyers = [], sellers = [];
    for (var i = 0; i < n; i++) {
      buyers.push(bTk[i] ? { label: bTk[i], pct: Math.round((bKl[i] / maxBuy) * 100), value_label: String(bKl[i]), href: '#' } : null);
      sellers.push(sTk[i] ? { label: sTk[i], pct: Math.round((sKl[i] / maxSell) * 100), value_label: String(sKl[i]), href: '#' } : null);
    }
    var tabs = subj.map(function (s, idx) {
      return '<button type="button" class="ix-tab' + (idx === 0 ? ' active' : '') + '">' + esc(s) + '</button>';
    }).join('');
    var headers = (currentOverrides && currentOverrides.headers)
      ? currentOverrides.headers
      : ((global.TemplatesStore && TemplatesStore.getHeaders)
        ? TemplatesStore.getHeaders(tpl)
        : (tpl && tpl.headers) || {});
    var block = T().renderFlowSplitBlock({
      withHead: false,
      withSubjectTabs: false,
      tickBuy: 'Bên trái',
      tickSell: 'Bên phải',
      headerBuy: headers.left || 'Top bên trái',
      headerSell: headers.right || 'Top bên phải',
      bodyHtml: T().renderFlowSplitBody({ rows: n, buyers: buyers, sellers: sellers })
    });
    host.innerHTML = withWidgetHead(
      (tabs ? '<div class="ix-tabs ifx-flow-toolbar ifx-flow-toolbar--subjects">' + tabs + '</div>' : '') + block,
      head
    );
    var rowFlags = [];
    for (var ri = 0; ri < n; ri++) rowFlags.push(!!(gL.flags[ri] || gR.flags[ri]));
    markMissing(host, '.ifx-flow-split__row', rowFlags);
  };

  /* Heatmap → treemap thật (IfluxSquarifiedTreemap.layout + class heat của DS)
     Chỉ Top 10 theo GTGD (cột kích thước). */
  DRIVERS['heatmap'] = function (host, c, tpl, head) {
    if (!needDS(host, global.IfluxSquarifiedTreemap && T(), 'Thiếu squarified-treemap.js')) return;
    var nm = cols(c[0]), sz = cols(c[1]).map(num), pf = cols(c[2]).map(num);
    var items = [];
    nm.forEach(function (name, i) {
      if (!name) return;
      items.push({ id: 'h' + i, name: name, perf: pf[i] || 0, weight: Math.max(sz[i] || 1, 1) });
    });
    items.sort(function (a, b) { return (b.weight || 0) - (a.weight || 0); });
    items = items.slice(0, 10);
    host.innerHTML = withWidgetHead(
      '<div class="ifx-mkt-heatmap-wrap"><div class="ifx-mkt-heatmap" data-tpl-heat></div></div>',
      head
    );
    var canvas = host.querySelector('[data-tpl-heat]');

    function tierFor(w, h) {
      var area = w * h;
      if (area < 900 || w < 32 || h < 24) return 'tiny';
      if (w < 48 || h < 32) return 'small';
      if (area >= 8000) return 'large';
      if (area >= 2500) return 'medium';
      return 'small';
    }
    function paint() {
      if (!canvas.isConnected) return;
      var w = canvas.clientWidth, h = canvas.clientHeight;
      if (w < 40 || h < 40) { setTimeout(paint, 80); return; }
      canvas.innerHTML = '';
      global.IfluxSquarifiedTreemap.layout(items, w, h).forEach(function (r) {
        var it = r.item;
        var dir = T().perfDirection(it.perf);
        var tier = tierFor(r.width, r.height);
        var el = document.createElement('div');
        el.className = 'ifx-mkt-heat-tile ifx-mkt-heat-tile--' + tier;
        el.style.left = r.x + 'px';
        el.style.top = r.y + 'px';
        el.style.width = Math.max(0, r.width - 2) + 'px';
        el.style.height = Math.max(0, r.height - 2) + 'px';
        el.innerHTML =
          '<a class="ifx-mkt-heat-tile__link is-' + dir + '" href="#" title="' + esc(it.name) + '">' +
            (tier === 'tiny'
              ? '<span class="ifx-mkt-heat-tile__name">' + esc(String(it.name).split(' ')[0]) + '</span>'
              : '<span class="ifx-mkt-heat-tile__name">' + esc(it.name) + '</span>' +
                '<span class="ifx-mkt-heat-tile__perf">' + fmtPct(it.perf) + '</span>') +
          '</a>';
        canvas.appendChild(el);
      });
    }
    paint();
    if (typeof ResizeObserver !== 'undefined') {
      try { new ResizeObserver(paint).observe(canvas); } catch (e) { /* ignore */ }
    }
  };

  /* Độ rộng thị trường → TMP-BREADTH (tabs + 6-stat + ratio) */
  DRIVERS['breadth'] = function (host, c, tpl, head) {
    if (!needDS(host, T(), 'Thiếu block-templates.js')) return;
    var g = groupAlign([c[1], c[2]]);
    var tabLabels = list(c[0]);
    var labels = colsN(c[1], g.max);
    var values = colsN(c[2], g.max);
    var defaults = T().BREADTH_EXCHANGES || [];
    var defaultStats = T().BREADTH_STATS || [];

    function slug(s, fallback) {
      var out = String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      return out || fallback || 'x';
    }

    var exchanges = (tabLabels.length ? tabLabels : defaults.map(function (ex) { return ex.label; })).map(function (lb, i) {
      var def = defaults[i];
      var key = def && def.label === lb ? def.key : (def && !tabLabels.length ? def.key : slug(lb, 'ex-' + i));
      return { key: key, label: lb };
    });
    var active = exchanges[0] ? exchanges[0].key : 'vnindex';

    var stats = (labels.some(Boolean) ? labels : defaultStats.map(function (s) { return s.label; })).map(function (lb, i) {
      var def = defaultStats[i] || { key: 's' + i, cls: 'is-total' };
      return { key: def.key, label: lb || def.label || '—', cls: def.cls };
    });

    var data = {};
    stats.forEach(function (s, i) {
      if (values[i] != null && String(values[i]).trim() !== '') data[s.key] = Math.round(num(values[i]));
    });

    function paint(exchangeKey) {
      host.innerHTML = withWidgetHead(
        T().renderBreadth({
          exchange: exchangeKey || active,
          data: data,
          stats: stats,
          exchanges: exchanges
        }),
        head
      );
      markMissing(host, '.ifx-breadth-stat', g.flags);
    }

    paint(active);
    if (host._ifxBreadthPreviewBound) return;
    host._ifxBreadthPreviewBound = true;
    host.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-ifx-breadth-exchange]');
      if (!btn || !host.contains(btn)) return;
      paint(btn.getAttribute('data-ifx-breadth-exchange'));
    });
  };

  /* Biểu đồ cột hai chiều quanh trục 0 → TMP-DIVERGING-BARS (renderDivergingBars) */
  DRIVERS['diverging-bars'] = function (host, c, tpl, head) {
    if (!needDS(host, T() && T().renderDivergingBars, 'Thiếu block-templates.js')) return;
    var tabLabels = list(c[0]);
    var hint = (c[1] || '').trim();
    var g = groupAlign([c[2], c[3]]);
    var marks = colsN(c[2], g.max);
    var values = colsN(c[3], g.max);

    var points = [];
    for (var i = 0; i < g.max; i++) {
      points.push({
        value: values[i] !== '' ? num(values[i]) : 0,
        label: marks[i] || '—',
        title: (marks[i] || '—') + ': ' + (values[i] !== '' ? values[i] : '—')
      });
    }
    var tabs = tabLabels.map(function (lb, idx) {
      return { key: 't' + idx, label: lb };
    });
    var defaultKey = tabs[0] ? tabs[0].key : '';

    function tabByKey(key) {
      for (var i = 0; i < tabs.length; i++) if (tabs[i].key === key) return tabs[i];
      return tabs[0] || null;
    }

    /* Demo chỉ có 1 chuỗi giá trị — đổi tab cập nhật active + dòng chú thích (nhãn nhóm). */
    function hintFor(tabLabel) {
      if (!hint) return tabLabel || '';
      if (!tabLabel) return hint;
      var parts = hint.split(' · ');
      if (parts.length >= 3) {
        parts[1] = tabLabel;
        return parts.join(' · ');
      }
      return hint;
    }

    function paint(activeKey) {
      var tab = tabByKey(activeKey || defaultKey);
      var key = tab ? tab.key : defaultKey;
      host.innerHTML = withWidgetHead(
        T().renderDivergingBars({
          tabs: tabs,
          activeKey: key,
          hint: hintFor(tab ? tab.label : ''),
          points: points
        }),
        head
      );
      markMissing(host, '.ifx-stock-flow-chart__col', g.flags);
    }

    paint(defaultKey);
    if (host._ifxDivBarsPreviewBound) return;
    host._ifxDivBarsPreviewBound = true;
    host.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-ifx-flow-subject]');
      if (!btn || !host.contains(btn)) return;
      paint(btn.getAttribute('data-ifx-flow-subject'));
    });
  };

  /* Vị trí giữa hai vùng → TMP-ZONE-POSITION (renderZonePosition) */
  DRIVERS['zone-position'] = function (host, c, tpl, head) {
    if (!needDS(host, T() && T().renderZonePosition, 'Thiếu block-templates.js')) return;
    var g = groupAlign([c[0], c[1], c[2], c[3], c[4], c[5]]);
    var periods = colsN(c[0], g.max);
    var leftRanges = colsN(c[1], g.max);
    var rightRanges = colsN(c[2], g.max);
    var centers = colsN(c[3], g.max);
    var leftPcts = colsN(c[4], g.max);
    var rightPcts = colsN(c[5], g.max);
    var headers = (currentOverrides && currentOverrides.headers)
      ? currentOverrides.headers
      : ((global.TemplatesStore && TemplatesStore.getHeaders)
        ? TemplatesStore.getHeaders(tpl)
        : (tpl && tpl.headers) || {});
    var rows = [];
    for (var i = 0; i < g.max; i++) {
      rows.push({
        period: periods[i] || '—',
        leftRange: leftRanges[i],
        rightRange: rightRanges[i],
        center: centers[i],
        leftPct: leftPcts[i],
        rightPct: rightPcts[i]
      });
    }
    host.innerHTML = withWidgetHead(
      T().renderZonePosition({
        rows: rows,
        leftLabel: headers.left || 'Hỗ trợ',
        rightLabel: headers.right || 'Kháng cự',
        emptyMsg: 'Chưa có dữ liệu'
      }),
      head
    );
    markMissing(host, '.ifx-zone-pos__row', g.flags);
  };

  /* Trend / Area line → area 2 chuỗi thật (giống widget thanh khoản, token màu DS) */
  DRIVERS['trend'] = function (host, c, tpl, head) {
    if (!needDS(host, T() && typeof ApexCharts !== 'undefined', 'Thiếu ApexCharts / block-templates.js')) return;
    var xs = cols(c[0]);
    var cur = cols(c[1]).map(num);
    var past = cols(c[2]).map(num);
    var tabs = list(c[3]);
    var exs = list(c[4]);
    /* Tab / bộ lọc đang chọn = phần tử đầu tiên — trạng thái suy ra, không phải slot. */
    var activeEx = exs[0] || '';
    var activeTab = tabs[0] || '';

    var sessBtns = tabs.map(function (t) {
      return '<button type="button" class="ix-tab' + (t === activeTab ? ' active' : '') + '">' + esc(t) + '</button>';
    }).join('');
    var exOpts = exs.map(function (x) {
      return '<option' + (x === activeEx ? ' selected' : '') + '>' + esc(x) + '</option>';
    }).join('');

    host.innerHTML = withWidgetHead(
      '<div class="ifx-mkt-liq-block"><div class="ifx-mkt-liq-block__body">' +
        '<div class="ifx-mkt-liq-filters">' +
          '<div class="ix-tabs ifx-mkt-liq-sessions">' + sessBtns + '</div>' +
          '<select class="ix-input ifx-mkt-liq-exchange" aria-label="Bộ lọc">' + exOpts + '</select>' +
        '</div>' +
        '<div class="ifx-mkt-liq-chart" data-tpl-liq></div>' +
      '</div></div>',
      head
    );

    var el = host.querySelector('[data-tpl-liq]');
    var C = T().chartColors();
    var chart = new ApexCharts(el, {
      chart: {
        type: 'area', height: 240, background: 'transparent',
        toolbar: { show: false }, fontFamily: "'Be Vietnam Pro', sans-serif",
        animations: { enabled: false }, zoom: { enabled: false }
      },
      series: [
        { name: 'Chuỗi A', data: cur },
        { name: 'Chuỗi B', data: past }
      ],
      colors: [C.accent, C.info],
      stroke: { curve: 'straight', width: 2 },
      markers: { size: 0 },
      fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.35, opacityTo: 0.05, stops: [0, 90, 100] } },
      dataLabels: { enabled: false },
      grid: { borderColor: C.grid, strokeDashArray: 4 },
      theme: { mode: 'dark' },
      legend: { labels: { colors: C.label }, fontSize: '12px' },
      xaxis: {
        type: 'category', categories: xs, tickPlacement: 'on',
        labels: { style: { colors: C.text, fontSize: '10px' }, rotate: 0, hideOverlappingLabels: true },
        axisBorder: { show: false }, axisTicks: { show: false }
      },
      yaxis: { min: 0, labels: { style: { colors: C.text, fontSize: '11px' } } },
      tooltip: { theme: 'dark' }
    });
    el._ifxChart = chart;
    renderApexWhenVisible(el, chart);
  };

  /* ==================================================================== */
  function render(mount, template, demo, overrides) {
    if (!mount) return;
    var driverKey = template.render;
    var hasDriver = !!DRIVERS[driverKey];
    mount.innerHTML =
      '<div class="tpl-pv-head"><code>' + esc(template.id) + '</code>' +
        '<span>Giao diện thật · dữ liệu demo điều khiển</span></div>' +
      '<div class="tpl-pv-live" data-tpl-live></div>';
    var host = mount.querySelector('[data-tpl-live]');
    var raw = demo || (global.TemplatesStore ? TemplatesStore.getDemo(template) : []);
    var split = splitDemo(raw, template);
    if (!hasDriver) {
      host.innerHTML = '<div class="ifx-wl-empty">Template chưa có driver preview (render=' + esc(driverKey) + ').</div>';
      return;
    }
    currentOverrides = overrides || null;
    try {
      DRIVERS[driverKey](host, split.data, template, split.head);
    } catch (err) {
      host.innerHTML = '<div class="ifx-wl-empty">Không dựng được preview: ' + esc(err && err.message) + '</div>';
    }
    currentOverrides = null;
  }

  function empty(mount) {
    if (!mount) return;
    mount.innerHTML = '<p class="tpl-pv-hint"><i class="ti ti-eye"></i><br/>Bấm <strong>Xem</strong> để dựng giao diện thật (Design System) — sửa ô <strong>Đầu vào</strong> để điều khiển dữ liệu.</p>';
  }

  global.TemplatesPreview = { render: render, empty: empty };
})(window);
