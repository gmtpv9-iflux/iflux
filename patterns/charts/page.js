/**
 * P6-W09 harness — IfxTabs + IfxChart + compare dataset.
 * Không sở hữu chart primitive.
 */
(function () {
  'use strict';

  window.addEventListener('message', function (e) {
    if (e.data && e.data.type === 'ifx-theme' && window.IfxTheme) window.IfxTheme.apply(e.data.theme);
  });

  function seed(s) {
    return function () {
      s = (s * 16807) % 2147483647;
      return (s - 1) / 2147483646;
    };
  }

  function makeSet(prefix, start) {
    var rnd = seed(start);
    var labels = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];
    var series = [];
    var i;
    for (i = 0; i < 10; i++) {
      var vals = [];
      var v = (rnd() - 0.4) * 6;
      var n;
      for (n = 0; n < 12; n++) {
        v += (rnd() - 0.46) * 2.2;
        vals.push(Math.round(v * 10) / 10);
      }
      series.push({ name: prefix + (i + 1), values: vals });
    }
    return { labels: labels, series: series };
  }

  var SETS = {
    g1: makeSet('N', 17),
    g2: makeSet('T', 41),
    g3: makeSet('C', 73)
  };

  var state = { set: 'g1', range: 5 };

  function sliceData() {
    var src = SETS[state.set];
    var n = state.range;
    return {
      labels: src.labels.slice(-n),
      series: src.series.map(function (s) {
        return { name: s.name, values: s.values.slice(-n) };
      })
    };
  }

  function paintCompare() {
    var el = document.getElementById('compareChart');
    if (!el || !window.IfxChart) return;
    var prev = el.querySelector('template[data-ifx-chart-data], script[type="application/json"]');
    if (prev) prev.parentNode.removeChild(prev);
    var sc = document.createElement('template');
    sc.setAttribute('data-ifx-chart-data', '');
    sc.innerHTML = JSON.stringify(sliceData());
    el.appendChild(sc);
    window.IfxChart.render(el);
  }

  function bindCompare() {
    var root = document.querySelector('[data-ifx-compare]');
    if (!root) return;
    function onGroup(bar, key, attr) {
      bar.addEventListener('click', function (e) {
        var btn = e.target.closest('.ifx-tab');
        if (!btn) return;
        bar.querySelectorAll('.ifx-tab').forEach(function (t) {
          t.classList.toggle('is-active', t === btn);
        });
        state[key] = attr === 'range' ? parseInt(btn.getAttribute('data-range'), 10) : btn.getAttribute('data-set');
        paintCompare();
      });
    }
    onGroup(root.querySelector('[data-ifx-compare-range]'), 'range', 'range');
    onGroup(root.querySelector('[data-ifx-compare-set]'), 'set', 'set');
  }

  if (window.IfxTabs) window.IfxTabs.initAll();
  bindCompare();
  if (window.IfxChart) window.IfxChart.init();
  paintCompare();
  requestAnimationFrame(function () {
    if (window.IfxChart) window.IfxChart.paint();
    paintCompare();
  });
  setTimeout(function () {
    if (window.IfxChart) window.IfxChart.paint();
    paintCompare();
  }, 80);
})();
